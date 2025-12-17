
import { GoogleGenAI, Type, Schema, Chat, Part, Modality, GenerateContentResponse } from "@google/genai";
import {
  StorybookData,
  MemeData,
  SocialCampaign,
  SocialSettings,
  PromptAnalysis,
  DailyTip,
  HelpfulList,
  PodcastScript,
  QuizData,
  RiddleData,
  AffirmationPlan,
  BrandIdentity,
  UGCScript,
  WealthAnalysis,
  CommercialAnalysis,
  BabyName,
  LearnerBrief,
  AI360Response,
  CarouselData,
  DreamAnalysis,
  PetProfile,
  EmojiPuzzle,
  WordPuzzle,
  TwoTruthsPuzzle,
  RiddlePuzzle,
  BabyDebateScript,
  BabyDebateParticipant
} from '../types';

export const getApiKey = () => process.env.API_KEY;

export const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Optimized retry logic for web responsiveness.
 */
export const withRetry = async <T>(fn: () => Promise<T>, retries = 5, baseDelay = 500): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error.status || error.response?.status || error?.error?.code;
      const message = (error.message || JSON.stringify(error)).toLowerCase();
      const isOverloaded = status === 503 || message.includes('overloaded') || message.includes('503') || message.includes('unavailable');
      const isRateLimit = status === 429 || message.includes('429') || message.includes('quota') || message.includes('too many requests');
      if (!isOverloaded && !isRateLimit) throw error;
      if (attempt === retries - 1) break;
      const backoff = baseDelay * Math.pow(2, attempt); 
      const jitter = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    }
  }
  throw lastError;
};

export const handleGeminiError = (error: any) => {
  const msg = (error.message || JSON.stringify(error)).toLowerCase();
  console.error("Gemini API Error Detail:", error);
  if (msg.includes('503') || msg.includes('overloaded')) {
     throw new Error("Server busy. Please try again in a few seconds.");
  }
  if (msg.includes('requested entity was not found')) {
     throw new Error("Requested entity was not found. This usually means the API key or project state is invalid. Please re-select your paid API key in the settings.");
  }
  if (msg.includes('internal error') || msg.includes('500')) {
     throw new Error("Video generation failed due to a transient internal server issue. This often happens with complex prompts or image counts. Try reducing participants or using fewer likeness uploads.");
  }
  throw new Error(error.message || "An unexpected error occurred.");
};

// --- Text Generation ---

export const generateTextWithGemini = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction, temperature: 0.5 }
    }));
    return response.text || "";
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

// --- Image Generation & Editing ---

export const generateImageWithGemini = async (prompt: string, aspectRatio: string = '1:1', referenceImage?: string): Promise<string> => {
  const ai = getAiClient();
  const attemptGeneration = async (includeRefImage: boolean): Promise<string | null> => {
    try {
      const parts: any[] = [];
      if (includeRefImage && referenceImage) {
        const base64Data = referenceImage.split(',')[1];
        const mimeType = referenceImage.split(';')[0].split(':')[1];
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
      parts.push({ text: prompt });
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
      }), 5, 2000);
      return `data:image/png;base64,${response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData)?.inlineData?.data}`;
    } catch (e) { return null; }
  };
  const result = await attemptGeneration(!!referenceImage) || await attemptGeneration(false);
  if (!result) throw new Error("Image generation failed.");
  return result;
};

export const generateProImageWithGemini = async (prompt: string, size: string = '1K'): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { imageSize: size as any } }
    }));
    return `data:image/png;base64,${response.candidates?.[0]?.content?.[0]?.parts?.find((p: any) => p.inlineData)?.inlineData?.data}`;
  } catch (error) { handleGeminiError(error); return ""; }
};

export const editImageWithGemini = async (image: string, prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { data: base64Data, mimeType }}, { text: prompt }] },
    }));
    return `data:image/png;base64,${response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData)?.inlineData?.data}`;
  } catch (error) { handleGeminiError(error); return ""; }
};

export const generateBatchImages = async (prompt: string, count: number): Promise<string[]> => {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const img = await generateImageWithGemini(prompt);
    if (img) results.push(img);
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
};

export const generateViralThumbnails = async (topic: string): Promise<string[]> => {
  const styles = ["Shocked, red arrow", "Dark background", "Comparison view", "Detailed emotion", "Action motion blur"];
  const results: string[] = [];
  for (const style of styles) {
    const img = await generateImageWithGemini(`${topic}. Style: ${style}`, '16:9');
    if (img) results.push(img);
  }
  return results;
};

// --- Vision Analysis ---

export const analyzeImageWithGemini = async (image: string, prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { data: base64Data, mimeType }}, { text: prompt }] },
    }));
    return response.text || "";
  } catch (error) { handleGeminiError(error); return ""; }
};

export const generateImagePrompt = async (image: string, platform: string): Promise<string> => {
  return analyzeImageWithGemini(image, `Analyze and write a detailed prompt for ${platform}.`);
};

// --- Chat ---

export const createChatSession = (systemInstruction?: string): Chat => {
  return getAiClient().chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction } });
};

export const createThinkingChatSession = (): Chat => {
  return getAiClient().chats.create({ model: 'gemini-3-pro-preview', config: { thinkingConfig: { thinkingBudget: 1024 } } });
};

// --- Audio / Speech ---

export const generateSpeechWithGemini = async (text: string, voice: string, speed = 1.0, pitch = 0, speakers?: any[]): Promise<string> => {
  const ai = getAiClient();
  try {
    const speechConfig = speakers ? { multiSpeakerVoiceConfig: { speakerVoiceConfigs: speakers.map(s => ({ speaker: s.speaker, voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice }} })) } } : { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } };
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: { responseModalities: [Modality.AUDIO], speechConfig }
    }));
    return `data:audio/mp3;base64,${response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data}`;
  } catch (error) { handleGeminiError(error); return ""; }
};

export const transcribeMediaWithGemini = async (mediaData: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType, data: mediaData.split(',')[1] } }, { text: "Transcribe verbatim." }] }
    }));
    return response.text || "";
  } catch (error) { handleGeminiError(error); return ""; }
};

// --- Video ---

export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string | string[]): Promise<string> => {
  const ai = getAiClient();
  
  const startOp = async (useAssets: boolean) => {
    // Model Constraints: Multi-reference (veo-3.1-generate-preview) MUST be 16:9 and 720p
    const isMultiImage = Array.isArray(imageBase64) && imageBase64.length > 0;
    const finalRatio = isMultiImage ? '16:9' : aspectRatio;
    const config: any = { numberOfVideos: 1, resolution: '720p', aspectRatio: finalRatio as any };
    
    if (useAssets && imageBase64) {
      if (Array.isArray(imageBase64)) {
        // Limit to max 3 reference images for veo-3.1-generate-preview
        config.referenceImages = imageBase64.slice(0, 3).map(img => ({
          image: { imageBytes: img.split(',')[1], mimeType: img.split(';')[0].split(':')[1] },
          referenceType: 'ASSET'
        }));
        return await ai.models.generateVideos({ model: 'veo-3.1-generate-preview', prompt, config });
      } else {
        return await ai.models.generateVideos({ 
          model: 'veo-3.1-fast-generate-preview', 
          prompt, 
          image: { imageBytes: imageBase64.split(',')[1], mimeType: imageBase64.split(';')[0].split(':')[1] }, 
          config 
        });
      }
    }
    return await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config });
  };

  try {
    let operation = await withRetry(() => startOp(!!imageBase64), 5, 2000);
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 8000));
      operation = await ai.operations.getVideosOperation({ operation });
    }
    if (operation.error) {
       console.error("Video Operation Error Object:", operation.error);
       throw new Error(operation.error.message || "Unknown model generation error.");
    }
    
    const link = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!link) {
      console.error("Video Operation result missing link despite success:", operation);
      throw new Error("Video generation completed but did not return a valid download link. This could be due to post-generation safety filtering.");
    }
    return `${link}&key=${getApiKey()}`;
  } catch (error) { handleGeminiError(error); return ""; }
};

export const generateBackgroundMusic = async (title: string, style: string): Promise<string> => {
  return generateVideoWithGemini(`Atmospheric background music for "${title}". Style: ${style}. Visual: Abstract visualization.`, '16:9');
};

// --- Structured Content Generation (JSON) ---

const generateStructuredContent = async <T>(prompt: string, schema: Schema, model = 'gemini-3-flash-preview', image?: string): Promise<T> => {
  const ai = getAiClient();
  try {
    let contents: any = prompt;
    if (image) {
       contents = { parts: [{ inlineData: { mimeType: 'image/png', data: image.split(',')[1] } }, { text: prompt }] };
    }
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.2
      }
    }), 3, 500); 
    return JSON.parse(response.text || "{}") as T;
  } catch (error) {
    console.error("Structured Gen Error:", error);
    return {} as T;
  }
};

export const generateStoryScript = async (topic: string, style: string, charDesc?: string): Promise<StorybookData> => {
  const prompt = `Rhyming story about: ${topic}. Style: ${style}. Characters: ${charDesc || 'new'}.`;
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, style: { type: Type.STRING }, characterName: { type: Type.STRING }, characterDescription: { type: Type.STRING }, author: { type: Type.STRING }, dedication: { type: Type.STRING }, authorBio: { type: Type.STRING }, backCoverBlurb: { type: Type.STRING }, pages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { pageNumber: { type: Type.INTEGER }, text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } } } };
  return generateStructuredContent<StorybookData>(prompt, schema);
};

export const generateComicScriptFromImages = async (images: string[], topic: string): Promise<StorybookData> => {
  const parts: any[] = images.map(img => ({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  parts.push({ text: `Write a 4-panel comic script about ${topic}.` });
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, characterDescription: { type: Type.STRING }, pages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { pageNumber: { type: Type.INTEGER }, text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } } } };
  const response = await withRetry<GenerateContentResponse>(() => getAiClient().models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts }, config: { responseMimeType: 'application/json', responseSchema: schema } }));
  return JSON.parse(response.text || "{}");
};

export const generateMemeConcept = async (topic: string): Promise<MemeData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topText: { type: Type.STRING }, bottomText: { type: Type.STRING }, visualPrompt: { type: Type.STRING } } };
  return generateStructuredContent<MemeData>(`Meme about ${topic}`, schema);
};

export const generateSocialCampaign = async (topic: string, settings: SocialSettings): Promise<SocialCampaign> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, linkedin: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } } };
  return generateStructuredContent<SocialCampaign>(`Campaign for ${topic}`, schema);
};

export const analyzePrompt = async (userPrompt: string, platform: string): Promise<PromptAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, weakness: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestion: { type: Type.STRING }, reasoning: { type: Type.STRING } } };
  return generateStructuredContent<PromptAnalysis>(`Analyze prompt: ${userPrompt} for ${platform}`, schema);
};

export const generateDailyTip = async (dayIndex: number): Promise<DailyTip> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING }, category: { type: Type.STRING } } };
  return generateStructuredContent<DailyTip>(`AI tip for Day ${dayIndex}`, schema);
};

export const generateHelpfulList = async (topic: string): Promise<HelpfulList> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } }, imagePrompt: { type: Type.STRING } } };
  return generateStructuredContent<HelpfulList>(`Checklist for ${topic}`, schema);
};

export const generatePodcastScript = async (topic: string, h: string, g: string): Promise<PodcastScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, script: { type: Type.STRING }, visualPrompt: { type: Type.STRING } } };
  return generateStructuredContent<PodcastScript>(`Podcast about ${topic} with ${h} and ${g}`, schema);
};

export const generateQuiz = async (t: string, c: number, d: string): Promise<QuizData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, explanation: { type: Type.STRING } } } } } };
  return generateStructuredContent<QuizData>(`${c} question ${d} quiz about ${t}`, schema);
};

export const generateRiddleContent = async (t: string): Promise<RiddleData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { riddle: { type: Type.STRING }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } } };
  return generateStructuredContent<RiddleData>(`Riddle about ${t}`, schema);
};

export const generateUiCode = async (p: string, d: string, s: string, i?: string): Promise<string> => {
  const prompt = `Code ${d} UI: ${p}. Style: ${s}. MATCH IMAGE ATTACHED.`;
  const response = await withRetry<GenerateContentResponse>(() => getAiClient().models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [{ text: prompt }, ...(i ? [{ inlineData: { mimeType: 'image/png', data: i.split(',')[1] } }] : [])] } }));
  return response.text?.replace(/```html/g, '').replace(/```/g, '') || "";
};

export const generateAffirmationPlan = async (t: string, tone: string): Promise<AffirmationPlan> => {
  const schema: Schema = { type: Type.OBJECT, properties: { weeklyMantra: { type: Type.STRING }, dailyAffirmations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.STRING }, text: { type: Type.STRING } } } } } };
  return generateStructuredContent<AffirmationPlan>(`${tone} affirmations for ${t}`, schema);
};

export const generateHiddenMessage = async (s: string, c: string): Promise<string> => {
  const response = await withRetry<GenerateContentResponse>(() => getAiClient().models.generateContent({ model: 'gemini-3-pro-preview', contents: `Hide "${s}" in text about "${c}". Use {{word}} formatting.` }));
  return response.text || "";
};

export const generateBrandIdentity = async (n: string, i: string, v: string, p: string, c: string, f: string): Promise<BrandIdentity> => {
  const schema: Schema = { type: Type.OBJECT, properties: { companyName: { type: Type.STRING }, slogan: { type: Type.STRING }, missionStatement: { type: Type.STRING }, colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } }, fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } }, logoPrompt: { type: Type.STRING }, brandVoice: { type: Type.STRING }, stationaryPrompt: { type: Type.STRING }, pptTemplatePrompt: { type: Type.STRING }, calendarPrompt: { type: Type.STRING } } };
  return generateStructuredContent<BrandIdentity>(`Brand for ${n} in ${i}. Vibe: ${v}. Style: ${p}.`, schema);
};

export const regenerateBrandPalette = (curr: any) => generateStructuredContent<BrandIdentity>(`New palette for ${curr.companyName}`, { type: Type.OBJECT, properties: { colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } } } });
export const regenerateBrandTypography = (curr: any) => generateStructuredContent<BrandIdentity>(`New fonts for ${curr.companyName}`, { type: Type.OBJECT, properties: { fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } } } });

export const generateUGCScript = async (p: string, a: string, pa: string): Promise<UGCScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, targetAudience: { type: Type.STRING }, totalDuration: { type: Type.STRING }, sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { section: { type: Type.STRING }, visual: { type: Type.STRING }, audio: { type: Type.STRING }, duration: { type: Type.STRING } } } } } };
  return generateStructuredContent<UGCScript>(`TikTok ad for ${p} targeting ${a}. Pain: ${pa}.`, schema);
};

export const generatePoem = (t: string, s: string) => generateTextWithGemini(`Poem about ${t} in ${s} style.`);
export const generateDailyJoke = (d: number) => generateTextWithGemini(`Joke for day ${d}.`);
export const generateQuote = (c: string) => generateTextWithGemini(`Inspiring ${c} quote.`);
export const generateConnectionFact = (p: string) => generateTextWithGemini(`Connection about ${p}.`);

export const analyzeWealthPath = async (n: string): Promise<WealthAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { personName: { type: Type.STRING }, estimatedNetWorth: { type: Type.STRING }, originStart: { type: Type.STRING }, privilegeAnalysis: { type: Type.STRING }, keySuccessFactors: { type: Type.ARRAY, items: { type: Type.STRING } }, actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, realityCheck: { type: Type.STRING } } };
  return generateStructuredContent<WealthAnalysis>(`Wealth path of ${n}`, schema);
};

export const generateLearnerBrief = async (t: string): Promise<LearnerBrief> => {
  const schema: Schema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, podcastScript: { type: Type.STRING } } };
  return generateStructuredContent<LearnerBrief>(`Summarize: ${t}`, schema);
};

export const analyzePaperCommercial = async (t: string): Promise<CommercialAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, marketPotential: { type: Type.STRING }, monetizationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } }, targetIndustries: { type: Type.ARRAY, items: { type: Type.STRING } }, commercialHurdles: { type: Type.ARRAY, items: { type: Type.STRING } }, elevatorPitch: { type: Type.STRING } } };
  return generateStructuredContent<CommercialAnalysis>(`Viability of: ${t}`, schema);
};

export const generateBabyNames = async (g: string, s: string, o: string, i: boolean): Promise<BabyName[]> => {
  const schema: Schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, meaning: { type: Type.STRING }, origin: { type: Type.STRING }, reason: { type: Type.STRING } } } };
  return generateStructuredContent<BabyName[]>(`${g} ${s} names from ${o}. Inventive: ${i}`, schema);
};

export const generate3DOrchestration = async (i: string, img?: string): Promise<AI360Response> => {
  const schema: Schema = { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING }, safety_categories: { type: Type.ARRAY, items: { type: Type.STRING } }, generation_prompt: { type: Type.STRING } } };
  return generateStructuredContent<AI360Response>(`3D gen for ${i}`, schema, 'gemini-3-flash-preview', img);
};

export const generateCarouselContent = async (t: string, c: number, h: string): Promise<CarouselData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, slides: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING }, type: { type: Type.STRING } } } } } };
  return generateStructuredContent<CarouselData>(`${c} slide carousel about ${t}`, schema);
};

export const analyzeDream = async (t: string): Promise<DreamAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, visualPrompt: { type: Type.STRING } } };
  return generateStructuredContent<DreamAnalysis>(`Interpret: ${t}`, schema);
};

export const analyzePetProfile = async (i: string): Promise<PetProfile> => {
  const schema: Schema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, personality: { type: Type.STRING }, jobTitle: { type: Type.STRING }, quote: { type: Type.STRING }, visualPrompt: { type: Type.STRING } } };
  return generateStructuredContent<PetProfile>(`Pet profile`, schema, 'gemini-3-flash-preview', i);
};

export const generateCalendarThemeImage = (m: string, y: number, s: string) => generateImageWithGemini(`Calendar art ${m} ${y} ${s}`, '16:9');

export const generateEmojiPuzzle = () => generateStructuredContent<EmojiPuzzle>(`Emoji puzzle`, { type: Type.OBJECT, properties: { emojis: { type: Type.STRING }, answer: { type: Type.STRING }, category: { type: Type.STRING } } });
export const generateWordPuzzle = () => generateStructuredContent<WordPuzzle>(`Word puzzle`, { type: Type.OBJECT, properties: { word: { type: Type.STRING }, definition: { type: Type.STRING }, distractors: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const generateTwoTruthsPuzzle = () => generateStructuredContent<TwoTruthsPuzzle>(`2 truths 1 lie`, { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, statements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, isTruth: { type: Type.BOOLEAN } } } }, explanation: { type: Type.STRING } } });
export const generateRiddlePuzzle = () => generateStructuredContent<RiddlePuzzle>(`Riddle`, { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING }, hint: { type: Type.STRING }, difficulty: { type: Type.STRING } } });

export const analyzeVideoCharacters = async (f: string): Promise<string> => {
  const res: any = await generateStructuredContent<any>(`Identify entities. Non-human terminology only.`, { type: Type.OBJECT, properties: { characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, attire: { type: Type.STRING } } } } } }, 'gemini-3-flash-preview', f);
  return JSON.stringify(res);
};

export const generateBabyTransformation = (f: string, a: string) => generateVideoWithGemini(`3D baby figurines. ${a}. ABSTRACT_STYLE_B_01`, '9:16', f);

// --- AI Baby Debates Logic ---

export const generateBabyDebateScript = async (topic: string, participants: BabyDebateParticipant[]): Promise<BabyDebateScript> => {
  const participantsStr = participants.map(p => `${p.name} (Tone: ${p.tone})`).join(', ');
  const prompt = `Script for funny baby debate. Topic: ${topic}. Subjects: ${participantsStr}. 
  Max 6 lines total. Ensure each speaker maintains their assigned tone throughout. 
  The babies are in a high-end nursery with toys. Return valid JSON.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      scriptLines: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING },
            text: { type: Type.STRING }
          }
        }
      },
      visualContext: { type: Type.STRING }
    }
  };

  const data = await generateStructuredContent<BabyDebateScript>(prompt, schema);
  data.participants = participants;
  return data;
};

export const generateTalkingBabyVideo = async (script: BabyDebateScript, style: string, musicStyle: string, showCaptions: boolean, ratio: string): Promise<string> => {
  const dialogueText = script.scriptLines.map(l => `${l.speaker}: "${l.text}"`).join(' ');
  
  // Refined prompt for character-line alignment
  const prompt = `High-end 3D debate animation of adorable baby versions of famous people. 
  Subject Likenesses: ${script.participants.map(p => p.name).join(', ')}. 
  Visual Style: ${style}. ${script.visualContext}. 
  Background Music: ${musicStyle}.
  Captions: ${showCaptions ? "Include burnt-in cinematic subtitles matching audio." : "No text on screen."}
  
  CINEMATIC PACING & LIP-SYNC:
  Dialogue Script: [${dialogueText}]. 
  Ensure each line is spoken by the correct baby character matching their name and likeness. 
  Characters must alternate speaking naturally with expressive facial animations.
  Technical Visual ID: ABSTRACT_STYLE_B_01`;

  // If participants have custom images, use the asset-grounding pipeline.
  // We limit to 3 reference images as per veo-3.1-generate-preview constraints.
  const images = script.participants.map(p => p.image).filter(Boolean) as string[];
  
  return generateVideoWithGemini(prompt, ratio, images.length > 0 ? images : undefined);
};
