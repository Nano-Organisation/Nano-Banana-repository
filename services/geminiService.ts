
import { GoogleGenAI, Type, Schema, Chat, Modality, GenerateContentResponse, VideoGenerationReferenceType } from "@google/genai";
import {
  StorybookData, MemeData, SocialCampaign, SocialSettings, PromptAnalysis,
  DailyTip, HelpfulList, PodcastScript, QuizData, RiddleData, AffirmationPlan,
  BrandIdentity, UGCScript, WealthAnalysis, CommercialAnalysis, BabyName,
  LearnerBrief, AI360Response, CarouselData, DreamAnalysis, PetProfile,
  EmojiPuzzle, WordPuzzle, TwoTruthsPuzzle, RiddlePuzzle, BabyDebateScript,
  BabyDebateParticipant, RhymeData
} from '../types';

export const getApiKey = () => process.env.API_KEY;

export const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

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

const videoQueue = new TaskQueue(1);
const standardQueue = new TaskQueue(3);

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
      const status = error.status || error.response?.status || error?.error?.code || (error?.message?.includes('429') ? 429 : null);
      const message = (error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || "").toLowerCase();
      
      // Critical: Do not retry billing or plan errors
      const isHardError = message.includes('billing') || message.includes('plan') || message.includes('project has no active billing');
      if (isHardError) throw error;

      const isOverloaded = status === 503 || message.includes('overloaded') || message.includes('503') || message.includes('unavailable');
      const isRateLimit = status === 429 || message.includes('429') || message.includes('resource_exhausted') || message.includes('too many requests');
      
      if (!isOverloaded && !isRateLimit && status !== 500) throw error; 
      
      if (attempt === retries - 1) break;
      const multiplier = isRateLimit ? 5 : 2;
      const backoff = baseDelay * Math.pow(multiplier, attempt); 
      const jitter = Math.random() * 1000;
      const totalWait = Math.round((backoff + jitter)/1000);
      if (onRetry) onRetry(`Model is busy, retrying (attempt ${attempt + 1}/${retries}) in ${totalWait}s...`);
      await new Promise(resolve => setTimeout(resolve, backoff + jitter));
    }
  }
  throw lastError;
};

export const handleGeminiError = (error: any) => {
  let rawMsg = "";
  if (typeof error === 'string') rawMsg = error;
  else if (error?.message && typeof error.message === 'string') rawMsg = error.message;
  else { try { rawMsg = JSON.stringify(error); } catch (e) { rawMsg = String(error); } }
  const msg = rawMsg.toLowerCase();
  
  if (msg.includes('billing') || msg.includes('plan') || msg.includes('no active billing')) {
     throw new Error("BILLING_ERROR: Your Google Cloud project has no active billing. Please select a project with billing enabled.");
  }
  if (msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('exceeded your current quota')) {
     throw new Error("QUOTA_ERROR: You have exceeded your Gemini API quota.");
  }
  if (msg.includes('503') || msg.includes('overloaded')) {
     throw new Error("SERVER_OVERLOAD: The AI server is under heavy load.");
  }
  if (msg.includes('requested entity was not found')) {
     throw new Error("CONNECTION_ERROR: API model or key not found.");
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
    } catch (error) { handleGeminiError(error); return ""; }
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
      } catch (e) { const msg = (e?.message || "").toLowerCase(); if (msg.includes('429') || msg.includes('quota')) throw e; return null; }
    };
    try {
      const result = await attemptGeneration(!!referenceImage) || await attemptGeneration(false);
      if (!result) throw new Error("Image generation failed.");
      return result;
    } catch (error) { handleGeminiError(error); return ""; }
  });
};

export const generateProImageWithGemini = async (
  prompt: string, 
  aspectRatio: string = '1:1', 
  size: string = '1K', 
  referenceImage?: string,
  onRetry?: (msg: string) => void
): Promise<string> => {
  return videoQueue.run(async () => {
    const ai = getAiClient();
    try {
      const parts: any[] = [];
      if (referenceImage) {
        const base64Data = referenceImage.split(',')[1];
        const mimeType = referenceImage.split(';')[0].split(':')[1];
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
      parts.push({ text: prompt });

      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: { 
          imageConfig: { 
            imageSize: size as any, 
            aspectRatio: aspectRatio as any 
          },
          temperature: 0.4 
        }
      }), 5, 5000, onRetry);

      const imagePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
      if (!imagePart) throw new Error("No image returned from Pro model.");
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    } catch (error) { handleGeminiError(error); return ""; }
  });
};

// Original simple generation (kept for compatibility)
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
            referenceType: VideoGenerationReferenceType.ASSET
          }));
          return await ai.models.generateVideos({ model: 'veo-3.1-generate-preview', prompt, config });
        } else {
          return await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, image: { imageBytes: imageBase64.split(',')[1], mimeType: imageBase64.split(';')[0].split(':')[1] }, config });
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
      if (!generatedVideos || generatedVideos.length === 0) throw new Error("Safety Block: Content filtered.");
      const link = generatedVideos[0]?.video?.uri;
      return `${link}&key=${getApiKey()}`;
    } catch (error) { handleGeminiError(error); return ""; }
  });
};

// New: Advanced generation that returns the full video object for extension
export const generateAdvancedVideo = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string, onRetry?: (msg: string) => void): Promise<{ uri: string, video: any }> => {
  return videoQueue.run(async () => {
    const ai = getAiClient();
    const startOp = async () => {
      const config: any = { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as any };
      if (imageBase64) {
          return await ai.models.generateVideos({ 
            model: 'veo-3.1-fast-generate-preview', 
            prompt, 
            image: { imageBytes: imageBase64.split(',')[1], mimeType: imageBase64.split(';')[0].split(':')[1] }, 
            config 
          });
      }
      return await ai.models.generateVideos({ model: 'veo-3.1-fast-generate-preview', prompt, config });
    };

    try {
      let operation: any = await withRetry(() => startOp(), 5, 8000, onRetry);
      
      while (!(operation as any).done) {
        await new Promise(r => setTimeout(r, 10000));
        if (!operation || !(operation as any).name) break;
        const polledOp = await ai.operations.getVideosOperation({ operation: operation as any });
        if (!polledOp) throw new Error("Video tracker lost.");
        operation = polledOp;
      }
      
      if ((operation as any).error) throw new Error((operation as any).error.message);
      const generatedVideos = (operation as any).response?.generatedVideos;
      if (!generatedVideos || generatedVideos.length === 0) throw new Error("Safety Block: Content filtered.");
      
      const video = generatedVideos[0]?.video;
      const link = video?.uri;
      return { uri: `${link}&key=${getApiKey()}`, video };
    } catch (error) { handleGeminiError(error); return { uri: "", video: null }; }
  });
};

// New: Extension functionality
export const extendVideo = async (prompt: string, previousVideo: any, onRetry?: (msg: string) => void): Promise<{ uri: string, video: any }> => {
  return videoQueue.run(async () => {
    const ai = getAiClient();
    const startOp = async () => {
      return await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        video: previousVideo,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: previousVideo.aspectRatio || '16:9'
        }
      });
    };

    try {
      let operation: any = await withRetry(() => startOp(), 5, 8000, onRetry);
      
      while (!(operation as any).done) {
        await new Promise(r => setTimeout(r, 10000));
        if (!operation || !(operation as any).name) break;
        const polledOp = await ai.operations.getVideosOperation({ operation: operation as any });
        if (!polledOp) throw new Error("Video tracker lost.");
        operation = polledOp;
      }
      
      if ((operation as any).error) throw new Error((operation as any).error.message);
      const generatedVideos = (operation as any).response?.generatedVideos;
      if (!generatedVideos || generatedVideos.length === 0) throw new Error("Safety Block: Content filtered.");
      
      const video = generatedVideos[0]?.video;
      const link = video?.uri;
      return { uri: `${link}&key=${getApiKey()}`, video };
    } catch (error) { handleGeminiError(error); return { uri: "", video: null }; }
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
      const writeString = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
      writeString(0, 'RIFF'); view.setUint32(4, 36 + pcmLength, true); writeString(8, 'WAVE'); writeString(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); view.setUint16(32, numChannels * (bitsPerSample / 8), true); view.setUint16(34, bitsPerSample, true); writeString(36, 'data'); view.setUint32(40, pcmLength, true);
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

const generateStructuredContent = async <T>(prompt: string, schema: Schema, model = 'gemini-3-flash-preview', images?: string | string[]): Promise<T> => {
  return standardQueue.run(async () => {
    const ai = getAiClient();
    try {
      const parts: any[] = [];
      if (images) {
        const imageList = Array.isArray(images) ? images : [images];
        imageList.forEach(img => {
          parts.push({ inlineData: { mimeType: 'image/png', data: img.split(',')[1] } });
        });
      }
      parts.push({ text: prompt });
      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model, contents: { parts }, config: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 }
      }), 5, 2000); 
      return JSON.parse(response.text || "{}") as T;
    } catch (error) { handleGeminiError(error); return {} as T; }
  });
};

export const generateStoryScript = async (topic: string, style: string, charDesc?: string): Promise<StorybookData> => {
  return standardQueue.run(async () => {
      const ai = getAiClient();
      
      const systemInstruction = `You are a professional children's book author and art director. Write a creative, engaging story script.
      You MUST return ONLY a valid JSON object. Do not wrap in markdown code blocks.
      
      Required JSON Structure:
      {
        "title": "string",
        "style": "string",
        "characterName": "string",
        "characterDescription": "string",
        "author": "string",
        "dedication": "string",
        "authorBio": "string",
        "backCoverBlurb": "string",
        "propManifest": [{"id": "string", "description": "string"}],
        "castingSheet": [{"id": "Name", "description": "DETAILED VISUAL SPEC (e.g. 'A translucent white sheet ghost with glowing eyes, NO LEGS, NO HUMAN BODY')."}],
        "pages": [
          { 
            "pageNumber": 1, 
            "text": "story prose", 
            "imagePrompt": "Action description only (e.g. 'Pouring tea')", 
            "locationId": "UNIQUE_ID_FOR_ROOM (e.g. 'library', 'kitchen', 'garden')", 
            "environmentDescription": "STATIC DESCRIPTION OF ROOM (e.g. 'High-arched gothic window, stone floor, cobwebs').", 
            "stageDirections": "Details",
            "charactersPresent": ["Name1", "Name2"]
          }
        ]
      }
      
      CRITICAL VISUAL CONSISTENCY PROTOCOL:
      1. LOCATION DNA: You must use 'locationId' to track settings. The 'environmentDescription' for a given 'locationId' MUST BE IDENTICAL on every page it appears. It must define the static physical architecture (walls, windows, floor) to prevent hallucination.
      2. CHARACTER SPECS: In 'castingSheet', describe characters precisely. If a character is a ghost, specify "Translucent sheet ghost, NO LEGS, NO HUMAN BODY".
      3. ACTION SPLIT: 'imagePrompt' is ONLY for the active movement (e.g., "Arthur pouring tea"). 'environmentDescription' is for the background context.
      4. PROSE: 'text' field must contain ONLY prose.
      `;

      const prompt = `Story about: ${topic}. Style: ${style}. Character: ${charDesc || 'new'}.
      Generate a 10-page story script following the JSON structure and CONSISTENCY PROTOCOLS.`;

      try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: prompt }] },
            config: { 
                systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.7 
            }
        }), 3, 5000);

        let raw = response.text || "{}";
        if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '');
        if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '');
        
        return JSON.parse(raw) as StorybookData;
      } catch (error) { 
          handleGeminiError(error); 
          return {} as StorybookData; 
      }
  });
};

export const generateEmojiPuzzle = async (): Promise<EmojiPuzzle> => {
  const schema: Schema = { type: Type.OBJECT, properties: { emojis: { type: Type.STRING }, answer: { type: Type.STRING }, category: { type: Type.STRING } }, required: ['emojis', 'answer', 'category'] };
  return generateStructuredContent<EmojiPuzzle>("Generate a new emoji-based puzzle.", schema);
};

export const generateWordPuzzle = async (): Promise<WordPuzzle> => {
  const schema: Schema = { type: Type.OBJECT, properties: { word: { type: Type.STRING }, definition: { type: Type.STRING }, distractors: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['word', 'definition', 'distractors'] };
  return generateStructuredContent<WordPuzzle>("Generate a new spelling/vocabulary puzzle.", schema);
};

export const generateTwoTruthsPuzzle = async (): Promise<TwoTruthsPuzzle> => {
  const schema: Schema = { type: Type.OBJECT, properties: { statements: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, isTruth: { type: Type.BOOLEAN } } } }, topic: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ['statements', 'topic', 'explanation'] };
  return generateStructuredContent<TwoTruthsPuzzle>("Generate a Two Truths and a Lie puzzle.", schema);
};

export const generateRiddlePuzzle = async (): Promise<RiddlePuzzle> => {
  const schema: Schema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, answer: { type: Type.STRING }, hint: { type: Type.STRING }, difficulty: { type: Type.STRING } }, required: ['question', 'answer', 'hint', 'difficulty'] };
  return generateStructuredContent<RiddlePuzzle>("Generate a clever riddle.", schema);
};

export const generateMemeConcept = async (topic: string): Promise<MemeData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topText: { type: Type.STRING }, bottomText: { type: Type.STRING }, visualPrompt: { type: Type.STRING } }, required: ['topText', 'bottomText', 'visualPrompt'] };
  return generateStructuredContent<MemeData>(`Generate a meme concept for: ${topic}`, schema);
};

export const generateSocialCampaign = async (topic: string, settings: SocialSettings): Promise<SocialCampaign> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, linkedin: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } }, twitter: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } }, required: ['topic'] };
  return generateStructuredContent<SocialCampaign>(`Generate a social campaign for: ${topic}. Tone: ${settings.tone}`, schema);
};

export const analyzePrompt = async (input: string, platform: string): Promise<PromptAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestion: { type: Type.STRING }, reasoning: { type: Type.STRING }, platformAdvice: { type: Type.STRING }, isOptimal: { type: Type.BOOLEAN } }, required: ['score', 'suggestion'] };
  return generateStructuredContent<PromptAnalysis>(`Analyze this prompt for ${platform}: ${input}`, schema);
};

export const generateDailyTip = async (day: number): Promise<DailyTip> => {
  const schema: Schema = { type: Type.OBJECT, properties: { dayIndex: { type: Type.INTEGER }, title: { type: Type.STRING }, content: { type: Type.STRING }, category: { type: Type.STRING }, example: { type: Type.STRING } }, required: ['dayIndex', 'title', 'content'] };
  return generateStructuredContent<DailyTip>(`Generate daily AI tip for day ${day}`, schema);
};

export const generateHelpfulList = async (topic: string): Promise<HelpfulList> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } }, imagePrompt: { type: Type.STRING } }, required: ['title', 'items'] };
  return generateStructuredContent<HelpfulList>(`Generate a helpful list for: ${topic}`, schema);
};

export const generatePodcastScript = async (topic: string, host: string, guest: string): Promise<PodcastScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, script: { type: Type.STRING }, visualPrompt: { type: Type.STRING } }, required: ['title', 'script'] };
  return generateStructuredContent<PodcastScript>(`Generate a podcast script between ${host} and ${guest} about: ${topic}`, schema);
};

export const generateQuiz = async (topic: string, count: number, difficulty: string): Promise<QuizData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, difficulty: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, explanation: { type: Type.STRING } } } } }, required: ['topic', 'questions'] };
  return generateStructuredContent<QuizData>(`Generate a ${count}-question ${difficulty} quiz about: ${topic}`, schema);
};

export const generateRiddleContent = async (topic: string): Promise<RiddleData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { riddle: { type: Type.STRING }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ['riddle', 'answer'] };
  return generateStructuredContent<RiddleData>(`Generate a riddle about: ${topic}`, schema);
};

export const generateUiCode = async (prompt: string, device: string, style: string, image?: string): Promise<string> => {
  return generateTextWithGemini(`Generate functional React/Tailwind code for a ${device} ${style} UI based on: ${prompt}.`, undefined);
};

export const generateAffirmationPlan = async (topic: string, tone: string): Promise<AffirmationPlan> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, weeklyMantra: { type: Type.STRING }, dailyAffirmations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.STRING }, text: { type: Type.STRING } } } } }, required: ['topic', 'weeklyMantra', 'dailyAffirmations'] };
  return generateStructuredContent<AffirmationPlan>(`Generate a ${tone} affirmation plan for: ${topic}`, schema);
};

export const generateHiddenMessage = async (secret: string, cover: string): Promise<string> => {
  return generateTextWithGemini(`Hide the secret "${secret}" inside a text about "${cover}". Use {{word}} markers for the secret words.`, undefined);
};

export const generateBrandIdentity = async (name: string, industry: string, vibe: string, personality: string, colors?: string, fonts?: string): Promise<BrandIdentity> => {
  const schema: Schema = { type: Type.OBJECT, properties: { companyName: { type: Type.STRING }, slogan: { type: Type.STRING }, missionStatement: { type: Type.STRING }, colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } }, fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } }, logoPrompt: { type: Type.STRING }, brandVoice: { type: Type.STRING }, stationaryPrompt: { type: Type.STRING }, pptTemplatePrompt: { type: Type.STRING }, calendarPrompt: { type: Type.STRING } }, required: ['companyName', 'slogan', 'colorPalette'] };
  return generateStructuredContent<BrandIdentity>(`Generate brand identity for ${name} in ${industry}. Personality: ${personality}`, schema);
};

export const regenerateBrandPalette = async (identity: BrandIdentity): Promise<BrandIdentity> => {
  return generateBrandIdentity(identity.companyName, "same", "same", "same");
};

export const regenerateBrandTypography = async (identity: BrandIdentity): Promise<BrandIdentity> => {
  return generateBrandIdentity(identity.companyName, "same", "same", "same");
};

export const generateUGCScript = async (product: string, audience: string, pain: string): Promise<UGCScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, targetAudience: { type: Type.STRING }, totalDuration: { type: Type.STRING }, sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { section: { type: Type.STRING }, visual: { type: Type.STRING }, audio: { type: Type.STRING }, duration: { type: Type.STRING } } } } }, required: ['title', 'sections'] };
  return generateStructuredContent<UGCScript>(`Generate UGC script for ${product} targeting ${audience}. Pain point: ${pain}`, schema);
};

export const generatePoem = async (topic: string, style: string): Promise<string> => {
  return generateTextWithGemini(`Write a ${style} poem about: ${topic}`, undefined);
};

export const generateDailyJoke = async (day: number): Promise<string> => {
  return generateTextWithGemini(`Write a joke of the day for day ${day}`, undefined);
};

export const generateQuote = async (cat: string): Promise<string> => {
  return generateTextWithGemini(`Provide a famous or inspiring quote in category: ${cat}`, undefined);
};

export const generateConnectionFact = async (person?: string): Promise<string> => {
  return generateTextWithGemini(`Tell a surprising historical connection fact ${person ? `about ${person}` : ''}`, undefined);
};

export const analyzeWealthPath = async (name: string): Promise<WealthAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { personName: { type: Type.STRING }, estimatedNetWorth: { type: Type.STRING }, originStart: { type: Type.STRING }, privilegeAnalysis: { type: Type.STRING }, keySuccessFactors: { type: Type.ARRAY, items: { type: Type.STRING } }, actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } }, realityCheck: { type: Type.STRING } }, required: ['personName'] };
  return generateStructuredContent<WealthAnalysis>(`Analyze wealth path of ${name}`, schema);
};

export const generateLearnerBrief = async (text: string): Promise<LearnerBrief> => {
  const schema: Schema = { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, podcastScript: { type: Type.STRING } }, required: ['summary', 'podcastScript'] };
  return generateStructuredContent<LearnerBrief>(`Summarize this and write a podcast script: ${text}`, schema);
};

export const analyzePaperCommercial = async (text: string): Promise<CommercialAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, marketPotential: { type: Type.STRING }, monetizationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } }, targetIndustries: { type: Type.ARRAY, items: { type: Type.STRING } }, commercialHurdles: { type: Type.ARRAY, items: { type: Type.STRING } }, elevatorPitch: { type: Type.STRING } }, required: ['title', 'marketPotential'] };
  return generateStructuredContent<CommercialAnalysis>(`Analyze commercial potential of: ${text}`, schema);
};

export const generateBabyNames = async (gender: string, style: string, origin: string, invent: boolean): Promise<BabyName[]> => {
  const schema: Schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, meaning: { type: Type.STRING }, origin: { type: Type.STRING }, reason: { type: Type.STRING }, gender: { type: Type.STRING }, lineage: { type: Type.STRING } }, required: ['name', 'meaning'] } };
  return generateStructuredContent<BabyName[]>(`Suggest 5 ${style} baby names for ${gender} with ${origin} origin. ${invent ? 'Invent unique ones.' : ''}`, schema);
};

export const generate3DOrchestration = async (input: string, image?: string): Promise<AI360Response> => {
  const schema: Schema = { type: Type.OBJECT, properties: { status: { type: Type.STRING, enum: ['accepted', 'rejected', 'needs_clarification'] }, reason: { type: Type.STRING }, safety_categories: { type: Type.ARRAY, items: { type: Type.STRING } }, generation_prompt: { type: Type.STRING }, clarification_question: { type: Type.STRING } }, required: ['status', 'reason'] };
  return generateStructuredContent<AI360Response>(`Orchestrate 3D generation for: ${input}`, schema, 'gemini-3-flash-preview', image);
};

export const generateCarouselContent = async (topic: string, count: number, handle: string): Promise<CarouselData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, authorHandle: { type: Type.STRING }, slides: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING }, type: { type: Type.STRING, enum: ['intro', 'content', 'outro'] } } } } }, required: ['topic', 'slides'] };
  return generateStructuredContent<CarouselData>(`Generate ${count} slides for a carousel about: ${topic}. Handle: ${handle}`, schema);
};

export const generateCalendarThemeImage = async (month: string, year: number, style: string): Promise<string> => {
  return generateImageWithGemini(`Calendar theme image for ${month} ${year}. Style: ${style}`, '16:9');
};

export const analyzeDream = async (text: string): Promise<DreamAnalysis> => {
  const schema: Schema = { type: Type.OBJECT, properties: { interpretation: { type: Type.STRING }, symbols: { type: Type.ARRAY, items: { type: Type.STRING } }, visualPrompt: { type: Type.STRING } }, required: ['interpretation', 'visualPrompt'] };
  return generateStructuredContent<DreamAnalysis>(`Analyze this dream: ${text}`, schema);
};

export const analyzePetProfile = async (image: string): Promise<PetProfile> => {
  const schema: Schema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, personality: { type: Type.STRING }, jobTitle: { type: Type.STRING }, quote: { type: Type.STRING }, visualPrompt: { type: Type.STRING } }, required: ['name', 'personality', 'jobTitle', 'quote'] };
  return generateStructuredContent<PetProfile>("Analyze this pet's appearance and assign a human-like persona.", schema, 'gemini-3-flash-preview', image);
};

export const generateComicScriptFromImages = async (images: string[], topic: string): Promise<StorybookData> => {
  const schema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, pages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING }, charactersPresent: { type: Type.ARRAY, items: { type: Type.STRING } } } } }, castingSheet: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, description: { type: Type.STRING } } } } }, required: ['title', 'pages'] };
  return generateStructuredContent<StorybookData>(`Create a 4-panel comic script about ${topic} based on these images.`, schema, 'gemini-3-flash-preview', images);
};

export const analyzeVideoCharacters = async (frame: string): Promise<any> => {
  return generateStructuredContent("Analyze the characters and their attire in this frame.", { type: Type.OBJECT, properties: { descriptions: { type: Type.ARRAY, items: { type: Type.STRING } } } }, 'gemini-3-flash-preview', frame);
};

export const generateBabyTransformation = async (frame: string, analysis: any): Promise<string> => {
  return generateVideoWithGemini(`Transform the characters in this image into baby versions of themselves. Analysis context: ${JSON.stringify(analysis)}`, '9:16', frame);
};

export const generateBabyDebateScript = async (topic: string, participants: BabyDebateParticipant[]): Promise<BabyDebateScript> => {
  const schema: Schema = { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, scriptLines: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { speaker: { type: Type.STRING }, text: { type: Type.STRING } } } }, visualContext: { type: Type.STRING }, safeCharacterDescriptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } } }, required: ['topic', 'scriptLines'] };
  return generateStructuredContent<BabyDebateScript>(`Generate a baby debate script about: ${topic}. Participants: ${participants.map(p => p.name).join(', ')}`, schema);
};

export const generateTalkingBabyVideo = async (script: BabyDebateScript, style: string, music: string, captions: boolean, ratio: string): Promise<string> => {
  return generateVideoWithGemini(`Talking baby video debate. Style: ${style}. Music: ${music}. Topic: ${script.topic}. Captions: ${captions}`, ratio as any);
};

export const analyzeSlideshow = async (images: string[]): Promise<string> => {
  const prompt = "Provide director's notes on the visual flow and mood of this image sequence for a movie slideshow.";
  return analyzeImageWithGemini(images[0], prompt);
};
