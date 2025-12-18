import { GoogleGenAI, Type, Schema, Chat, Part, Modality, GenerateContentResponse } from "@google/genai";
import {
  StorybookData, MemeData, SocialCampaign, SocialSettings, PromptAnalysis,
  DailyTip, HelpfulList, PodcastScript, QuizData, RiddleData, AffirmationPlan,
  BrandIdentity, UGCScript, WealthAnalysis, CommercialAnalysis, BabyName,
  LearnerBrief, AI360Response, CarouselData, DreamAnalysis, PetProfile,
  EmojiPuzzle, WordPuzzle, TwoTruthsPuzzle, RiddlePuzzle, BabyDebateScript,
  BabyDebateParticipant
} from '../types';

export const getApiKey = () => process.env.API_KEY;

export const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const withRetry = async <T>(fn: () => Promise<T>, retries = 5, baseDelay = 3000): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const status = error.status || 
                     error.response?.status || 
                     error?.error?.code || 
                     (error?.message?.includes('429') ? 429 : null);
                     
      const message = (error.message || JSON.stringify(error) || "").toLowerCase();
      
      const isHardExhaustion = message.includes('quota') || message.includes('billing') || message.includes('plan');
      const isOverloaded = status === 503 || message.includes('overloaded') || message.includes('503') || message.includes('unavailable');
      const isRateLimit = status === 429 || message.includes('429') || message.includes('resource_exhausted') || message.includes('too many requests');
      
      if (isHardExhaustion && isRateLimit) throw error;
      if (!isOverloaded && !isRateLimit) throw error;
      if (attempt === retries - 1) break;
      
      const multiplier = isRateLimit ? 5 : 2;
      const backoff = baseDelay * Math.pow(multiplier, attempt); 
      const jitter = Math.random() * 1000;
      
      console.warn(`Gemini API Busy/Limited (Attempt ${attempt + 1}/${retries}). Waiting ${Math.round((backoff + jitter)/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    }
  }
  throw lastError;
};

export const handleGeminiError = (error: any) => {
  console.error("Gemini API Error Detail:", error);
  
  let rawMsg = "";
  if (typeof error === 'string') rawMsg = error;
  else if (error?.message) rawMsg = error.message;
  else {
    try { rawMsg = JSON.stringify(error); } 
    catch (e) { rawMsg = String(error); }
  }
  
  const msg = rawMsg.toLowerCase();
  
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted')) {
     if (msg.includes('billing') || msg.includes('plan')) {
        throw new Error("Billing Issue: Your Google Cloud project has no active billing or has reached its budget. Enable billing at console.cloud.google.com to continue.");
     }
     throw new Error("API Quota Exceeded. To fix this: 1) Ensure your API key is from a project with billing enabled at ai.google.dev. 2) Check your usage and limits at ai.google.dev/usage. 3) Wait for your daily reset if on the Free tier.");
  }
  
  if (msg.includes('503') || msg.includes('overloaded')) {
     throw new Error("The AI server is currently under heavy load. Please try again in 10-20 seconds.");
  }
  
  if (msg.includes('requested entity was not found')) {
     throw new Error("API Connection Error: The requested model or key was not found. Please re-select your API key in the App Settings.");
  }
  
  throw new Error(rawMsg || "An unexpected error occurred during the AI request.");
};

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

/**
 * Enhanced Image Generation with Strict Spelling Protocol
 */
export const generateImageWithGemini = async (prompt: string, aspectRatio: string = '1:1', referenceImage?: string): Promise<string> => {
  const ai = getAiClient();
  
  // SPELLING INTEGRITY DIRECTIVE
  const finalPrompt = `${prompt}. SPELLING PROTOCOL: Any and all visible text, signs, or labels MUST be spelled with 100% accuracy. Cross-reference every character for typos before rendering.`;

  const attemptGeneration = async (includeRefImage: boolean): Promise<string | null> => {
    try {
      const parts: any[] = [];
      if (includeRefImage && referenceImage) {
        const base64Data = referenceImage.split(',')[1];
        const mimeType = referenceImage.split(';')[0].split(':')[1];
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
      parts.push({ text: finalPrompt });
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
      }), 3, 4000);
      
      const imgData = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData)?.inlineData?.data;
      return imgData ? `data:image/png;base64,${imgData}` : null;
    } catch (e) { return null; }
  };
  
  const result = await attemptGeneration(!!referenceImage) || await attemptGeneration(false);
  if (!result) throw new Error("Image generation failed. This could be due to quota limits or safety filters.");
  return result;
};

export const generateProImageWithGemini = async (prompt: string, size: string = '1K'): Promise<string> => {
  const ai = getAiClient();
  
  // SPELLING INTEGRITY DIRECTIVE (PRO)
  const finalPrompt = `${prompt}. TEXT ACCURACY PROTOCOL: Prioritize perfect typographic rendering. Verify character-by-character spelling of all legible words to ensure zero typos.`;

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: finalPrompt }] },
      config: { imageConfig: { imageSize: size as any } }
    }));
    const imagePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    if (!imagePart) throw new Error("No image returned.");
    return `data:image/png;base64,${imagePart.inlineData.data}`;
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
    const imgData = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData)?.inlineData?.data;
    return imgData ? `data:image/png;base64,${imgData}` : "";
  } catch (error) { handleGeminiError(error); return ""; }
};

export const generateBatchImages = async (prompt: string, count: number): Promise<string[]> => {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const img = await generateImageWithGemini(prompt);
    if (img) results.push(img);
    await new Promise(r => setTimeout(r, 200));
  }
  return results;
};

export const generateViralThumbnails = async (topic: string): Promise<string[]> => {
  const styles = ["Reaction", "Gaming", "Vlog", "Versus", "Trending"];
  const results: string[] = [];
  for (const style of styles) {
    const img = await generateImageWithGemini(`${topic}. Style: ${style}`, '16:9');
    if (img) results.push(img);
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
};

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
  return analyzeImageWithGemini(image, `Describe this image and create a detailed AI generation prompt for ${platform}.`);
};

export const createChatSession = (systemInstruction?: string): Chat => {
  return getAiClient().chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction } });
};

export const createThinkingChatSession = (): Chat => {
  return getAiClient().chats.create({ model: 'gemini-3-pro-preview', config: { thinkingConfig: { thinkingBudget: 1024 } } });
};

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

export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string | string[]): Promise<string> => {
  const ai = getAiClient();
  const startOp = async () => {
    const isMultiImage = Array.isArray(imageBase64) && imageBase64.length > 0;
    const config: any = { numberOfVideos: 1, resolution: '720p', aspectRatio: (isMultiImage ? '16:9' : aspectRatio) as any };
    if (imageBase64) {
      if (Array.isArray(imageBase64)) {
        config.referenceImages = imageBase64.slice(0, 3).map(img => ({
          image: { imageBytes: img.split(',')[1], mimeType: img.split(';')[0].split(':')[1] },
          referenceType: 'ASSET'
        }));
        return await ai.models.generateVideos({ model: 'veo-3.1-generate-preview', prompt, config });
      } else {
        return await ai.models.generateVideos({ 
          model: 'veo-3.1-fast-generate-preview', prompt, 
          image: { imageBytes: imageBase64.split(',')[1], mimeType: imageBase64.split(';')[0].split(':')[1] }, 
          config 
        });
      }
    }
    return await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config });
  };

  try {
    let operation = await withRetry(() => startOp(), 5, 6000);
    
    if (!operation || typeof operation !== 'object' || !operation.name) {
      throw new Error("Video initialization failed.");
    }

    while (!operation.done) {
      await new Promise(r => setTimeout(r, 12000));
      if (!operation || !operation.name) break;
      const polledOp = await ai.operations.getVideosOperation({ operation });
      if (!polledOp) throw new Error("Video tracker lost.");
      operation = polledOp;
    }
    
    if (operation.error) throw new Error(operation.error.message);
    
    const generatedVideos = operation.response?.generatedVideos;
    if (!generatedVideos || generatedVideos.length === 0) {
      throw new Error("Safety Block: The generated content was filtered. This usually happens with real-world names or sensitive prompts. Try generic character names.");
    }

    const link = generatedVideos[0]?.video?.uri;
    if (!link) throw new Error("No video link returned.");
    return `${link}&key=${getApiKey()}`;
  } catch (error) { handleGeminiError(error); return ""; }
};

export const generateBackgroundMusic = async (title: string, style: string): Promise<string> => {
  return generateVideoWithGemini(`Atmospheric background music for "${title}". Style: ${style}. Visual: Abstract.`, '16:9');
};

const generateStructuredContent = async <T>(prompt: string, schema: Schema, model = 'gemini-3-flash-preview', image?: string): Promise<T> => {
  const ai = getAiClient();
  try {
    let contents: any = prompt;
    if (image) contents = { parts: [{ inlineData: { mimeType: 'image/png', data: image.split(',')[1] } }, { text: prompt }] };
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model, contents, config: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 }
    }), 5, 1000); 
    return JSON.parse(response.text || "{}") as T;
  } catch (error) { 
    handleGeminiError(error);
    return {} as T; 
  }
};

export const generateStoryScript = async (topic: string, style: string, charDesc?: string): Promise<StorybookData> => {
  const prompt = `Story about: ${topic}. Style: ${style}. Character: ${charDesc || 'new'}.`;
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, style: { type: Type.STRING }, characterName: { type: Type.STRING }, characterDescription: { type: Type.STRING }, author: { type: Type.STRING }, dedication: { type: Type.STRING }, authorBio: { type: Type.STRING }, backCoverBlurb: { type: Type.STRING }, pages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { pageNumber: { type: Type.INTEGER }, text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } } } };
  return generateStructuredContent<StorybookData>(prompt, schema);
};

export const generateComicScriptFromImages = async (images: string[], topic: string): Promise<StorybookData> => {
  const parts: any[] = images.map(img => ({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
  parts.push({ text: `Comic script about ${topic}.` });
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
  return generateStructuredContent<PromptAnalysis>(`Analyze prompt for ${platform}: "${userPrompt}"`, schema);
};

export const generateDailyTip = async (dayIndex: number): Promise<DailyTip> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING }, category: { type: Type.STRING } } };
  return generateStructuredContent<DailyTip>(`AI tip for day ${dayIndex}`, schema);
};

export const generateHelpfulList = async (topic: string): Promise<HelpfulList> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } }, imagePrompt: { type: Type.STRING } } };
  return generateStructuredContent<HelpfulList>(`Checklist for ${topic}`, schema);
};

export const generatePodcastScript = async (topic: string, h: string, g: string): Promise<PodcastScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, script: { type: Type.STRING }, visualPrompt: { type: Type.STRING } } };
  return generateStructuredContent<PodcastScript>(`Podcast script for ${topic}`, schema);
};

export const generateQuiz = async (t: string, c: number, d: string): Promise<QuizData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, explanation: { type: Type.STRING } } } } } };
  return generateStructuredContent<QuizData>(`Quiz about ${t}`, schema);
};

export const generateRiddleContent = async (t: string): Promise<RiddleData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { riddle: { type: Type.STRING }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } } };
  return generateStructuredContent<RiddleData>(`Riddle about ${t}`, schema);
};

export const generateUiCode = async (p: string, d: string, s: string, i?: string): Promise<string> => {
  const prompt = `Code for ${d} UI: ${p}. Style: ${s}. Match the attached reference.`;
  const response = await withRetry<GenerateContentResponse>(() => getAiClient().models.generateContent({ model: 'gemini-3-pro-preview', contents: { parts: [{ text: prompt }, ...(i ? [{ inlineData: { mimeType: 'image/png', data: i.split(',')[1] } }] : [])] } }));
  return response.text?.replace(/```html/g, '').replace(/```/g, '') || "";
};

export const generateAffirmationPlan = async (t: string, tone: string): Promise<AffirmationPlan> => {
  const schema: Schema = { type: Type.OBJECT, properties: { weeklyMantra: { type: Type.STRING }, dailyAffirmations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.STRING }, text: { type: Type.STRING } } } } } };
  return generateStructuredContent<AffirmationPlan>(`${tone} affirmations for ${t}`, schema);
};

export const generateHiddenMessage = async (s: string, c: string): Promise<string> => {
  const response = await withRetry<GenerateContentResponse>(() => getAiClient().models.generateContent({ model: 'gemini-3-pro-preview', contents: `Hide "${s}" in a paragraph about "${c}" using {{word}} markers.` }));
  return response.text || "";
};

export const generateBrandIdentity = async (n: string, i: string, v: string, p: string, c: string, f: string): Promise<BrandIdentity> => {
  const schema: Schema = { type: Type.OBJECT, properties: { companyName: { type: Type.STRING }, slogan: { type: Type.STRING }, missionStatement: { type: Type.STRING }, colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } }, fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } }, logoPrompt: { type: Type.STRING }, brandVoice: { type: Type.STRING }, stationaryPrompt: { type: Type.STRING }, pptTemplatePrompt: { type: Type.STRING }, calendarPrompt: { type: Type.STRING } } };
  return generateStructuredContent<BrandIdentity>(`Brand kit for ${n}`, schema);
};

export const regenerateBrandPalette = (curr: any) => generateStructuredContent<BrandIdentity>(`Palette for ${curr.companyName}`, { type: Type.OBJECT, properties: { colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } } } });
export const regenerateBrandTypography = (curr: any) => generateStructuredContent<BrandIdentity>(`Fonts for ${curr.companyName}`, { type: Type.OBJECT, properties: { fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } } } });

export const generateUGCScript = async (p: string, a: string, pa: string): Promise<UGCScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, targetAudience: { type: Type.STRING }, totalDuration: { type: Type.STRING }, sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { section: { type: Type.STRING }, visual: { type: Type.STRING }, audio: { type: Type.STRING }, duration: { type: Type.STRING } } } } } };
  return generateStructuredContent<UGCScript>(`UGC script for ${p}`, schema);
};

export const generatePoem = (t: string, s: string) => generateTextWithGemini(`Poem about ${t} in ${s} style.`);
export const generateDailyJoke = (d: number) => generateTextWithGemini(`Joke for day ${d}.`);
export const generateQuote = (c: string) => generateTextWithGemini(`Quote about ${c}.`);
export const generateConnectionFact = (p: string) => generateTextWithGemini(`Connection fact about ${p}.`);

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
  return generateStructuredContent<BabyName[]>(`${g} names, ${s} style, ${o} origin`, schema);
};

export const generate3DOrchestration = async (i: string, img?: string): Promise<AI360Response> => {
  const schema: Schema = { type: Type.OBJECT, properties: { status: { type: Type.STRING }, reason: { type: Type.STRING }, safety_categories: { type: Type.ARRAY, items: { type: Type.STRING } }, generation_prompt: { type: Type.STRING } } };
  return generateStructuredContent<AI360Response>(`3D orchestration for: ${i}`, schema, 'gemini-3-flash-preview', img);
};

export const generateCarouselContent = async (t: string, c: number, h: string): Promise<CarouselData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, slides: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING }, type: { type: Type.STRING } } } } } };
  return generateStructuredContent<CarouselData>(`Carousel for ${t}`, schema);
};

export const analyzeDream = async (t: string): Promise<DreamAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, visualPrompt: { type: Type.STRING } } };
  return generateStructuredContent<DreamAnalysis>(`Interpret: ${t}`, schema);
};

export const analyzePetProfile = async (i: string): Promise<PetProfile> => {
  const schema: Schema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, personality: { type: Type.STRING }, jobTitle: { type: Type.STRING }, quote: { type: Type.STRING }, visualPrompt: { type: Type.STRING } } };
  return generateStructuredContent<PetProfile>(`Pet persona`, schema, 'gemini-3-flash-preview', i);
};

export const generateCalendarThemeImage = (m: string, y: number, s: string) => generateImageWithGemini(`Calendar art ${m} ${y} ${s}`, '16:9');

export const generateEmojiPuzzle = () => generateStructuredContent<EmojiPuzzle>(`Emoji puzzle`, { type: Type.OBJECT, properties: { emojis: { type: Type.STRING }, answer: { type: Type.STRING }, category: { type: Type.STRING } } });
export const generateWordPuzzle = () => generateStructuredContent<WordPuzzle>(`Word puzzle`, { type: Type.OBJECT, properties: { word: { type: Type.STRING }, definition: { type: Type.STRING }, distractors: { type: Type.ARRAY, items: { type: Type.STRING } } } });
export const generateTwoTruthsPuzzle = () => generateStructuredContent<TwoTruthsPuzzle>(`2 truths 1 lie`, { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, statements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, isTruth: { type: Type.BOOLEAN } } } }, explanation: { type: Type.STRING } } });
export const generateRiddlePuzzle = () => generateStructuredContent<RiddlePuzzle>(`Riddle`, { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING }, hint: { type: Type.STRING }, difficulty: { type: Type.STRING } } });

export const analyzeVideoCharacters = async (f: string): Promise<string> => {
  const res: any = await generateStructuredContent<any>(`Identify characters.`, { type: Type.OBJECT, properties: { characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING } } } } } }, 'gemini-3-flash-preview', f);
  return JSON.stringify(res);
};

export const generateBabyTransformation = (f: string, a: string) => generateVideoWithGemini(`Toddler version. ${a}.`, '9:16', f);

export const generateBabyDebateScript = async (topic: string, participants: BabyDebateParticipant[]): Promise<BabyDebateScript> => {
  const prompt = `Generate a funny, VERY SHORT toddler debate script about: ${topic}. 
  CRITICAL: Keep dialogue to MAXIMUM 2 lines per character. Total script length under 40 words.
  Characters: ${participants.map(p => `${p.name} (Tone: ${p.tone})`).join(', ')}.
  Include a scene description and EXTREMELY DISTINCT high-contrast visual archetypes for each participant (e.g., unique clothing colors, distinct accessories like a flat cap or a specific patterned sweater, unique hair colors).`;
  
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
      visualContext: { type: Type.STRING }, 
      safeCharacterDescriptions: { 
        type: Type.ARRAY, 
        items: { 
          type: Type.OBJECT, 
          properties: { 
            name: { type: Type.STRING }, 
            description: { type: Type.STRING } 
          } 
        } 
      } 
    } 
  };
  const data = await generateStructuredContent<BabyDebateScript>(prompt, schema);
  data.participants = participants;
  return data;
};

export const generateTalkingBabyVideo = async (script: BabyDebateScript, style: string, musicStyle: string, showCaptions: boolean, ratio: string): Promise<string> => {
  // Format script into discrete, timed units for the video model
  const dialogueActs = script.scriptLines.map((l, i) => `ACT ${i + 1} - SPEAKER: ${l.speaker} - LINE: "${l.text}"`).join('\n');
  const characterDescriptions = script.safeCharacterDescriptions 
    ? script.safeCharacterDescriptions.map(d => `${d.name}: ${d.description}`).join('; ') 
    : script.participants.map(p => p.name).join(' and ');

  const prompt = `High-end 3D toddler animation. Visual Style: ${style}. ${script.visualContext}. 
  SCENE CAST:
  ${characterDescriptions}.
  
  CHRONOLOGICAL PRODUCTION TIMELINE:
  This video is 10 SECONDS LONG. You MUST divide the time proportionally to speak the entire script below in EXACT SEQUENCE. 
  The video MUST NOT end before the final word of the final ACT is spoken.
  
  TRANSCRIPT TO ANIMATE (STRICT SEQUENCE):
  ${dialogueActs}
  
  EXCLUSIVE SPEAKER PROTOCOL:
  - Each ACT corresponds to one character speaking while the others are PHYSICALLY FROZEN in a "Static Listening State".
  - During ACT X, ONLY the character specified in that ACT is allowed to move their mouth, lips, or tongue.
  - While one character is speaking, the other character MUST remain silent with their MOUTH COMPLETELY CLOSED AND STATIC. No accidental mouth movement for the listener.
  - Mouth animations must start EXACTLY when the audio for their line begins and stop IMMEDIATELY when it ends.
  
  ${showCaptions ? 'BURNED-IN SUBTITLES: You MUST overlay clear, synchronized hard-coded text subtitles at the bottom center of the video frame. These subtitles must match the spoken words exactly and remain visible for the duration of the line.' : 'No text overlays.'}
  
  Action: Expression-filled toddler discussion. Back-and-forth debate. 
  Music: ${musicStyle}. 
  Ensure the animation cadence is natural and the full 10-second duration is utilized.`;

  const images = script.participants.map(p => p.image).filter(Boolean) as string[];
  return generateVideoWithGemini(prompt, ratio, images.length > 0 ? images : undefined);
};