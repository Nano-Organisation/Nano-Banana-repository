import { GoogleGenAI, Type, Schema, Chat, Part, Modality, GenerateContentResponse } from "@google/genai";
import {
  StorybookData, MemeData, SocialCampaign, SocialSettings, PromptAnalysis,
  DailyTip, HelpfulList, PodcastScript, QuizData, RiddleData, AffirmationPlan,
  BrandIdentity, UGCScript, WealthAnalysis, CommercialAnalysis, BabyName,
  LearnerBrief, AI360Response, CarouselData, DreamAnalysis, PetProfile,
  EmojiPuzzle, WordPuzzle, TwoTruthsPuzzle, RiddlePuzzle, BabyDebateScript,
  BabyDebateParticipant, RhymeData
} from '../types';

export const getApiKey = () => process.env.API_KEY;

/* Fix: Always create a fresh instance of GoogleGenAI before each request to ensure up-to-date API keys. */
export const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Concurrency & Queueing Logic ---

class TaskQueue {
  private queue: (() => Promise<void>)[] = [];
  private activeCount = 0;
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        this.activeCount++;
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeCount--;
          this.next();
        }
      };

      this.queue.push(wrappedTask);
      this.next();
    });
  }

  private next() {
    if (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) task();
    }
  }

  get queueSize() {
    return this.queue.length;
  }
}

// Separate queues for high-compute vs standard tasks
const videoQueue = new TaskQueue(1); // Veo/Pro-Image: Strictly sequential
const standardQueue = new TaskQueue(3); // Text/Flash-Image: Some concurrency allowed

// --- Enhanced Retry with Granular Reporting ---

export const withRetry = async <T>(
  fn: () => Promise<T>, 
  retries = 5, 
  baseDelay = 3000,
  onRetry?: (msg: string) => void
): Promise<T> => {
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
                     
      const message = (error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || "").toLowerCase();
      
      const isHardExhaustion = message.includes('quota') || message.includes('billing') || message.includes('plan');
      const isOverloaded = status === 503 || message.includes('overloaded') || message.includes('503') || message.includes('unavailable');
      const isRateLimit = status === 429 || message.includes('429') || message.includes('resource_exhausted') || message.includes('too many requests');
      
      // Stop retrying if it's a permanent billing/plan block
      if (isHardExhaustion && isRateLimit) throw error;
      
      // Stop if it's an invalid request or safety block (not retryable)
      if (!isOverloaded && !isRateLimit) throw error;
      
      if (attempt === retries - 1) break;
      
      const multiplier = isRateLimit ? 5 : 2;
      const backoff = baseDelay * Math.pow(multiplier, attempt); 
      const jitter = Math.random() * 1000;
      const totalWait = Math.round((backoff + jitter)/1000);
      
      const statusMsg = `Model is busy, retrying (attempt ${attempt + 1}/${retries}) in ${totalWait}s...`;
      console.warn(statusMsg);
      if (onRetry) onRetry(statusMsg);

      await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    }
  }
  throw lastError;
};

export const handleGeminiError = (error: any) => {
  console.debug("Gemini API Error Detail:", error);
  
  let rawMsg = "";
  if (typeof error === 'string') rawMsg = error;
  else if (error?.message && typeof error.message === 'string') rawMsg = error.message;
  else {
    try { rawMsg = JSON.stringify(error); } 
    catch (e) { rawMsg = String(error); }
  }
  
  const msg = rawMsg.toLowerCase();
  
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('exceeded your current quota')) {
     if (msg.includes('billing') || msg.includes('plan')) {
        throw new Error("BILLING_ERROR: Your Google Cloud project has no active billing or has reached its budget. Please check console.cloud.google.com/billing.");
     }
     throw new Error("QUOTA_ERROR: You have exceeded your Gemini API quota. If you are on the Free tier, wait for the daily reset. If on Pay-As-You-Go, check your billing limits at ai.google.dev/usage.");
  }
  
  if (msg.includes('503') || msg.includes('overloaded')) {
     throw new Error("SERVER_OVERLOAD: The AI server is under heavy load. Please try again in 15 seconds.");
  }
  
  if (msg.includes('requested entity was not found')) {
     throw new Error("CONNECTION_ERROR: API model or key not found. Please re-select your API key in the App Settings.");
  }
  
  throw new Error(rawMsg || "An unexpected error occurred during the AI request.");
};

export const generateTextWithGemini = async (prompt: string, systemInstruction?: string, onRetry?: (msg: string) => void): Promise<string> => {
  return standardQueue.run(async () => {
    const ai = getAiClient();
    try {
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction, temperature: 0.5 }
      }), 5, 3000, onRetry);
      return response.text || "";
    } catch (error) {
      handleGeminiError(error);
      return "";
    }
  });
};

export const generateImageWithGemini = async (prompt: string, aspectRatio: string = '1:1', referenceImage?: string, onRetry?: (msg: string) => void): Promise<string> => {
  return standardQueue.run(async () => {
    const ai = getAiClient();
    const finalPrompt = `${prompt}. SPELLING PROTOCOL: Any and all visible text, signs, or labels MUST be spelled with 100% accuracy.`;

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
        }), 3, 4000, onRetry);
        
        const imgData = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData)?.inlineData?.data;
        return imgData ? `data:image/png;base64,${imgData}` : null;
      } catch (e) { 
        const msg = (e?.message || "").toLowerCase();
        if (msg.includes('429') || msg.includes('quota')) throw e;
        return null; 
      }
    };
    
    try {
      const result = await attemptGeneration(!!referenceImage) || await attemptGeneration(false);
      if (!result) throw new Error("Image generation failed due to safety filters or model unavailability.");
      return result;
    } catch (error) {
      handleGeminiError(error);
      return "";
    }
  });
};

export const generateProImageWithGemini = async (prompt: string, size: string = '1K', onRetry?: (msg: string) => void): Promise<string> => {
  return videoQueue.run(async () => {
    const ai = getAiClient();
    try {
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { imageSize: size as any } }
      }), 5, 5000, onRetry);
      const imagePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
      if (!imagePart) throw new Error("No image returned.");
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    } catch (error) { handleGeminiError(error); return ""; }
  });
};

export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string | string[], onRetry?: (msg: string) => void): Promise<string> => {
  return videoQueue.run(async () => {
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
      let operation: any = await withRetry(() => startOp(), 5, 8000, onRetry);
      
      while (!(operation as any).done) {
        await new Promise(r => setTimeout(r, 12000));
        if (!operation || !(operation as any).name) break;
        const polledOp = await ai.operations.getVideosOperation({ operation: operation as any });
        if (!polledOp) throw new Error("Video tracker lost.");
        operation = polledOp;
      }
      
      if ((operation as any).error) throw new Error((operation as any).error.message);
      
      const generatedVideos = (operation as any).response?.generatedVideos;
      if (!generatedVideos || generatedVideos.length === 0) {
        throw new Error("Safety Block: Content filtered.");
      }

      const link = generatedVideos[0]?.video?.uri;
      return `${link}&key=${getApiKey()}`;
    } catch (error) { handleGeminiError(error); return ""; }
  });
};

export const editImageWithGemini = async (image: string, prompt: string): Promise<string> => {
  return standardQueue.run(async () => {
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
  });
};

export const generateBatchImages = async (prompt: string, count: number): Promise<string[]> => {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    const img = await generateImageWithGemini(prompt);
    if (img) results.push(img);
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
};

export const generateViralThumbnails = async (topic: string, onRetry?: (msg: string) => void): Promise<string[]> => {
  const styles = ["Reaction", "Gaming", "Vlog", "Versus", "Trending"];
  const results: string[] = [];
  for (const style of styles) {
    const img = await generateImageWithGemini(`${topic}. Style: ${style}`, '16:9', undefined, onRetry);
    if (img) results.push(img);
    await new Promise(r => setTimeout(r, 1000));
  }
  return results;
};

export const analyzeImageWithGemini = async (image: string, prompt: string): Promise<string> => {
  return standardQueue.run(async () => {
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
  });
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
  return standardQueue.run(async () => {
    const ai = getAiClient();
    try {
      const speechConfig = speakers ? { multiSpeakerVoiceConfig: { speakerVoiceConfigs: speakers.map(s => ({ speaker: s.speaker, voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice }} })) } } : { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } };
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: { responseModalities: [Modality.AUDIO], speechConfig }
      }));
      const base64Pcm = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Pcm) return "";

      const pcmBinary = atob(base64Pcm);
      const pcmLength = pcmBinary.length;
      const sampleRate = 24000;
      const numChannels = 1;
      const bitsPerSample = 16;

      const header = new ArrayBuffer(44);
      const view = new DataView(header);

      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + pcmLength, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
      view.setUint16(32, numChannels * (bitsPerSample / 8), true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, pcmLength, true);

      const headerBinary = String.fromCharCode(...new Uint8Array(header));
      return `data:audio/wav;base64,${btoa(headerBinary + pcmBinary)}`;
    } catch (error) { handleGeminiError(error); return ""; }
  });
};

export const transcribeMediaWithGemini = async (mediaData: string, mimeType: string): Promise<string> => {
  return standardQueue.run(async () => {
    const ai = getAiClient();
    try {
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType, data: mediaData.split(',')[1] } }, { text: "Transcribe verbatim." }] }
      }));
      return response.text || "";
    } catch (error) { handleGeminiError(error); return ""; }
  });
};

export const generateBackgroundMusic = async (title: string, style: string): Promise<string> => {
  return generateVideoWithGemini(`Atmospheric background music for "${title}". Style: ${style}. Visual: Abstract.`, '16:9');
};

const generateStructuredContent = async <T>(prompt: string, schema: Schema, model = 'gemini-3-flash-preview', image?: string): Promise<T> => {
  return standardQueue.run(async () => {
    const ai = getAiClient();
    try {
      let contents: any = prompt;
      if (image) contents = { parts: [{ inlineData: { mimeType: 'image/png', data: image.split(',')[1] } }, { text: prompt }] };
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model, contents, config: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 }
      }), 5, 2000); 
      return JSON.parse(response.text || "{}") as T;
    } catch (error) { 
      handleGeminiError(error);
      return {} as T; 
    }
  });
};

export const generateStoryScript = async (topic: string, style: string, charDesc?: string): Promise<StorybookData> => {
  const prompt = `Story about: ${topic}. Style: ${style}. Character: ${charDesc || 'new'}.
  
  CRITICAL CHARACTER CONSISTENCY PROTOCOL:
  Describe each character as a "Visual Identity Block" using strictly limited shape and color terms.
  
  Do NOT use ambiguous prose for physical features. Use atomic geometric labels.`;

  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, style: { type: Type.STRING }, characterName: { type: Type.STRING }, characterDescription: { type: Type.STRING }, author: { type: Type.STRING }, dedication: { type: Type.STRING }, authorBio: { type: Type.STRING }, backCoverBlurb: { type: Type.STRING }, pages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { pageNumber: { type: Type.INTEGER }, text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } } } };
  return generateStructuredContent<StorybookData>(prompt, schema);
};

export const generateNurseryRhymeStoryboard = async (rhyme: string): Promise<RhymeData> => {
  const prompt = `Create a 4-panel visual storyboard for: "${rhyme}".`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      panels: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { lyrics: { type: Type.STRING }, imagePrompt: { type: Type.STRING } }, required: ['lyrics', 'imagePrompt'] } }
    },
    required: ['title', 'panels']
  };
  return generateStructuredContent<RhymeData>(prompt, schema);
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

export const generateHiddenMessage = async (s: string, i: string): Promise<string> => {
  const response = await withRetry<GenerateContentResponse>(() => getAiClient().models.generateContent({ model: 'gemini-3-pro-preview', contents: `Hide "${s}" in a paragraph about "${i}" using {{word}} markers.` }));
  return response.text || "";
};

export const generateBrandIdentity = async (n: string, i: string, v: string, p: string, c: string, f: string): Promise<BrandIdentity> => {
  const schema: Schema = { type: Type.OBJECT, properties: { companyName: { type: Type.STRING }, slogan: { type: Type.STRING }, missionStatement: { type: Type.STRING }, colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } }, fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } }, logoPrompt: { type: Type.STRING }, brandVoice: { type: Type.STRING }, stationaryPrompt: { type: Type.STRING }, pptTemplatePrompt: { type: Type.STRING }, calendarPrompt: { type: Type.STRING } } };
  return generateStructuredContent<BrandIdentity>(`Brand kit for ${n}`, schema);
};

export const regenerateBrandPalette = (curr: any) => generateStructuredContent<BrandIdentity>(`Palette for ${curr.companyName}`, { type: Type.OBJECT, properties: { colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } } } });
export const regenerateBrandTypography = (curr: any) => generateStructuredContent<BrandIdentity>(`Fonts for ${curr.companyName}`, { type: Type.OBJECT, properties: { fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } } } });

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
  const schema: Schema = { type: Type.OBJECT, properties: { characters: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING } } } } } };
  const res: any = await generateStructuredContent<any>(`Identify characters.`, schema, 'gemini-3-flash-preview', f);
  return JSON.stringify(res);
};

export const generateBabyTransformation = (f: string, a: string) => generateVideoWithGemini(`Toddler version. ${a}.`, '9:16', f);

export const generateBabyDebateScript = async (topic: string, participants: BabyDebateParticipant[]): Promise<BabyDebateScript> => {
  const prompt = `Generate a toddler debate script about: ${topic}.`;
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, scriptLines: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { speaker: { type: Type.STRING }, text: { type: Type.STRING } } } }, visualContext: { type: Type.STRING }, safeCharacterDescriptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } } } };
  const data = await generateStructuredContent<BabyDebateScript>(prompt, schema);
  data.participants = participants;
  return data;
};

export const generateTalkingBabyVideo = async (script: BabyDebateScript, style: string, musicStyle: string, showCaptions: boolean, ratio: string): Promise<string> => {
  const prompt = `High-end 3D toddler animation. Visual Style: ${style}. ${script.visualContext}. Action: Expression-filled toddler discussion.`;
  const images = script.participants.map(p => p.image).filter(Boolean) as string[];
  return generateVideoWithGemini(prompt, ratio, images.length > 0 ? images : undefined);
};

export const analyzeSlideshow = async (images: string[]): Promise<string> => {
  return standardQueue.run(async () => {
    const ai = getAiClient();
    const parts: any[] = images.map(img => ({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } }));
    parts.push({ text: "Analyze this sequence. Write a director's note." });
    try {
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts } }));
      return response.text || "";
    } catch (e) { return "Ready."; }
  });
};

export const generateUGCScript = async (product: string, audience: string, painPoint: string): Promise<UGCScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, targetAudience: { type: Type.STRING }, totalDuration: { type: Type.STRING }, sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { section: { type: Type.STRING }, visual: { type: Type.STRING }, audio: { type: Type.STRING }, duration: { type: Type.STRING } }, required: ['section', 'visual', 'audio', 'duration'] } } }, required: ['title', 'targetAudience', 'totalDuration', 'sections'] };
  return generateStructuredContent<UGCScript>(`UGC script for ${product}`, schema);
};

export const generatePoem = async (topic: string, style: string): Promise<string> => {
  return generateTextWithGemini(`Write a poem about ${topic} in the style of ${style}.`);
};

export const generateDailyJoke = async (dayIndex: number): Promise<string> => {
  return generateTextWithGemini(`Write a unique funny joke. Day: ${dayIndex}.`);
};

export const generateQuote = async (category: string): Promise<string> => {
  return generateTextWithGemini(`Provide a famous quote about ${category}.`);
};

export const generateConnectionFact = async (person?: string): Promise<string> => {
  const prompt = person ? `Tell me a surprising connection between ${person} and another figure.` : `Tell me a random connection fact.`;
  return generateTextWithGemini(prompt);
};

export const analyzeWealthPath = async (personName: string): Promise<WealthAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { personName: { type: Type.STRING }, estimatedNetWorth: { type: Type.STRING }, originStart: { type: Type.STRING }, privilegeAnalysis: { type: Type.STRING }, keySuccessFactors: { type: Type.ARRAY, items: { type: Type.STRING } }, actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, realityCheck: { type: Type.STRING } }, required: ['personName', 'estimatedNetWorth', 'originStart', 'privilegeAnalysis', 'keySuccessFactors', 'actionableSteps', 'realityCheck'] };
  return generateStructuredContent<WealthAnalysis>(`Wealth analysis for ${personName}`, schema);
};