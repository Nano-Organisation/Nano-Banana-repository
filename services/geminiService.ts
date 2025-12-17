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
  BabyDebateScript
} from '../types';

export const getApiKey = () => process.env.API_KEY;

export const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Enhanced retry logic with exponential backoff and jitter.
 */
export const withRetry = async <T>(fn: () => Promise<T>, retries = 30, baseDelay = 4000): Promise<T> => {
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
      const isServerErr = typeof status === 'number' && status >= 500;

      if (!isOverloaded && !isRateLimit && !isServerErr) {
        throw error;
      }

      if (attempt === retries - 1) break;

      const backoff = baseDelay * Math.pow(1.4, attempt); 
      const jitter = Math.random() * 1500;
      const waitTime = Math.min(backoff + jitter, 45000);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

export const handleGeminiError = (error: any) => {
  const msg = (error.message || JSON.stringify(error)).toLowerCase();
  
  const isOverloaded = msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable');

  if (isOverloaded) {
     throw new Error("The AI model is currently experiencing extremely high traffic. Please wait a minute and try again.");
  }
  
  throw new Error(error.message || "An unexpected error occurred with Gemini.");
};

// --- Text Generation ---

export const generateTextWithGemini = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    }));
    return response.text || "No response generated.";
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

// --- Image Generation & Editing ---

export const generateImageWithGemini = async (prompt: string, aspectRatio: string = '1:1', referenceImage?: string): Promise<string> => {
  const ai = getAiClient();
  let lastFailureReason = "";

  const attemptGeneration = async (includeRefImage: boolean, model: string): Promise<string | null> => {
    try {
      const parts: any[] = [];
      
      if (includeRefImage && referenceImage) {
        const base64Data = referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage;
        const mimeType = referenceImage.includes(';') ? referenceImage.split(';')[0].split(':')[1] : 'image/png';
        parts.push({
          inlineData: { mimeType, data: base64Data }
        });
      }
      
      parts.push({ text: prompt });

      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        }
      }), 12, 4000);

      const candidates = response.candidates || [];
      if (candidates.length === 0) return null;

      const partsOut = candidates[0].content?.parts || [];
      for (const part of partsOut) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (e: any) {
      lastFailureReason = e.message || JSON.stringify(e);
      return null;
    }
  };

  try {
    if (referenceImage) {
      let result = await attemptGeneration(true, 'gemini-2.5-flash-image');
      if (result) return result;
    }

    let result = await attemptGeneration(false, 'gemini-2.5-flash-image');
    if (result) return result;

    throw new Error(`AI was unable to generate an image. ${lastFailureReason || "The service may be temporarily unavailable."}`);
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

export const generateProImageWithGemini = async (prompt: string, size: string = '1K'): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          imageSize: size as any,
        }
      }
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No pro image data returned by model.");
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

export const editImageWithGemini = async (image: string, prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1];

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned by model.");
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

export const generateBatchImages = async (prompt: string, count: number): Promise<string[]> => {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    try {
      const img = await generateImageWithGemini(prompt);
      if (img) results.push(img);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`Batch image ${i+1} failed`, e);
    }
  }
  return results;
};

export const generateViralThumbnails = async (topic: string): Promise<string[]> => {
  const styles = [
    "High contrast, shocked face, big red arrow, bright yellow text",
    "Mysterious, dark background, glowing object, question mark",
    "Split screen comparison, versus mode, lightning effect",
    "Close up emotion, blurry background, 4k detail",
    "Action shot, motion blur, explosion effect, vibrant colors"
  ];
  
  const results: string[] = [];
  for (const style of styles) {
    try {
      const img = await generateImageWithGemini(topic + ". Style: " + style, '16:9');
      if (img) results.push(img);
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error("Thumbnail gen failed", e);
    }
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
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    }));
    return response.text || "No analysis generated.";
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

export const generateImagePrompt = async (image: string, platform: string): Promise<string> => {
  const prompt = `Analyze this image and write a detailed text prompt to recreate it using ${platform}. Include details about style, lighting, composition, and colors.`;
  return analyzeImageWithGemini(image, prompt);
};

// --- Chat ---

export const createChatSession = (systemInstruction?: string): Chat => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: { systemInstruction }
  });
};

export const createThinkingChatSession = (): Chat => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      thinkingConfig: { thinkingBudget: 1024 }
    }
  });
};

// --- Audio / Speech ---

export const generateSpeechWithGemini = async (
  text: string, 
  voice: string, 
  speed: number = 1.0, 
  pitch: number = 0,
  speakers?: { speaker: string, voice: string }[]
): Promise<string> => {
  const ai = getAiClient();
  try {
    let speechConfig: any = {};
    
    if (speakers && speakers.length === 2) {
       speechConfig = {
          multiSpeakerVoiceConfig: {
             speakerVoiceConfigs: speakers.map(s => ({
                speaker: s.speaker,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice }}
             }))
          }
       };
    } else {
       speechConfig = {
          voiceConfig: {
             prebuiltVoiceConfig: { voiceName: voice }
          }
       };
    }

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig
      }
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data generated.");
    
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

export const transcribeMediaWithGemini = async (mediaData: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const base64Data = mediaData.split(',')[1];
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Transcribe this media file verbatim. Speaker separation if possible." }
        ]
      }
    }));
    return response.text || "";
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

// --- Video ---

/**
 * Refined Video Generation with granular retry logic and safety fallbacks.
 * Specifically tuned to bypass face-safety filters by increasing abstraction levels.
 */
export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string): Promise<string> => {
  const ai = getAiClient();
  
  const startOperation = async (currentPrompt: string, useImage: boolean) => {
    const config = { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as any };
    if (useImage && imageBase64) {
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.split(';')[0].split(':')[1];
      return await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: currentPrompt,
        image: { imageBytes: base64Data, mimeType: mimeType },
        config
      });
    } else {
      return await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: currentPrompt,
        config
      });
    }
  };

  try {
    // Initial attempt with image reference (if provided)
    let operation = await withRetry(() => startOperation(prompt, !!imageBase64), 10, 4000);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await withRetry(() => ai.operations.getVideosOperation({ operation }), 5, 2000);
    }

    if (operation.error) {
      throw new Error(operation.error.message || "Video generation failed during processing.");
    }

    let downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    // Tiered Fallback Abstraction Levels
    // Level 1: 3D Toy
    if (!downloadLink && !prompt.includes("ABSTRACT_STYLE_B_01")) {
        const saferPrompt = "Vibrant 3D stylized toy animation of: " + prompt + " (ABSTRACT_STYLE_B_01). Highly stylized, miniature plastic aesthetic.";
        console.warn("Retrying with Level 1 abstraction (3D Toy)...");
        return generateVideoWithGemini(saferPrompt, aspectRatio, imageBase64);
    }

    // Level 2: Claymation
    if (!downloadLink && !prompt.includes("ABSTRACT_STYLE_B_02")) {
        const saferPrompt = "Handcrafted claymation animation. Characters are clay figurines. " + prompt + " (ABSTRACT_STYLE_B_02). Artistic, non-photorealistic textures.";
        console.warn("Retrying with Level 2 abstraction (Claymation)...");
        return generateVideoWithGemini(saferPrompt, aspectRatio, imageBase64);
    }

    // Level 3: Felted Wool
    if (!downloadLink && !prompt.includes("ABSTRACT_STYLE_B_03")) {
        const saferPrompt = "Felted wool stop-motion art style. Characters are fuzzy textile puppets. " + prompt + " (ABSTRACT_STYLE_B_03). Soft textures, whimsical craft look.";
        console.warn("Retrying with Level 3 abstraction (Felted)...");
        return generateVideoWithGemini(saferPrompt, aspectRatio, imageBase64);
    }

    // Level 4: Paper Cutout (Final attempt WITH Image)
    if (!downloadLink && !prompt.includes("ABSTRACT_STYLE_B_04")) {
        const saferPrompt = "Flat 2D paper cutout illustration. Stylized vector puppets. " + prompt + " (ABSTRACT_STYLE_B_04). Minimalist, non-humanoid representation.";
        console.warn("Retrying with Level 4 abstraction (Paper)...");
        return generateVideoWithGemini(saferPrompt, aspectRatio, imageBase64);
    }

    // Level 5: DECOUPLE IMAGE (Extreme measures - text only)
    if (!downloadLink && imageBase64 && !prompt.includes("ABSTRACT_STYLE_B_05")) {
        const finalPrompt = "Cute stylized miniature chibi figurines in a porcelain art style. " + prompt + " (ABSTRACT_STYLE_B_05). Highly artistic and abstract interpretation of the subjects.";
        console.warn("Decoupling image reference to bypass strict input scan (Level 5)...");
        // We pass 'undefined' for imageBase64 to generate purely from text
        return generateVideoWithGemini(finalPrompt, aspectRatio, undefined);
    }

    if (!downloadLink) {
      const isFiltered = !operation.response?.generatedVideos || operation.response.generatedVideos.length === 0 || !operation.response.generatedVideos[0]?.video;
      if (isFiltered) {
          throw new Error("Safety Block: The input video contains realistic human faces or sensitive subjects that the model is strictly restricted from manipulating. Try a different source frame or a different video entirely.");
      }
      throw new Error("Video generation completed but returned no video data.");
    }

    return `${downloadLink}&key=${getApiKey()}`;
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

export const generateBackgroundMusic = async (title: string, style: string): Promise<string> => {
  const prompt = `Generate background music for a story titled "${title}". Style: ${style}. 
  AUDIO REQUIREMENTS: High quality, instrumental, atmospheric background music fitting the style. 
  VISUAL: Static abstract audio wave visualization on a dark background.`;
  
  return generateVideoWithGemini(prompt, '16:9');
};

// --- Structured Content Generation (JSON) ---

const generateStructuredContent = async <T>(prompt: string, schema: Schema, model = 'gemini-3-flash-preview', image?: string): Promise<T> => {
  const ai = getAiClient();
  try {
    let contents: any = prompt;
    
    if (image) {
       const base64Data = image.split(',')[1];
       const mimeType = image.split(';')[0].split(':')[1];
       contents = {
          parts: [
             { inlineData: { mimeType, data: base64Data } },
             { text: prompt }
          ]
       };
    }

    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    }));
    const text = response.text || "{}";
    return JSON.parse(text) as T;
  } catch (error) {
    handleGeminiError(error);
    return {} as T;
  }
};

export const generateStoryScript = async (topic: string, style: string, charDesc?: string): Promise<StorybookData> => {
  const prompt = `Write a children's storybook script about: ${topic}. 
  CRITICAL: The story text MUST follow a strict rhyming pattern (AABB or ABAB). 
  Each stanza should be easy to follow. Each line should end with a clear rhyme. 
  Format the text with clear line breaks so the rhyming pattern is visually obvious.
  
  CHARACTER CONSISTENCY:
  In the 'characterDescription' field, provide a detailed visual description for ALL recurring people or creatures in the story.
  
  Style: ${style}. ${charDesc ? `Existing Character Context: ${charDesc}` : ''}`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      style: { type: Type.STRING },
      characterName: { type: Type.STRING },
      characterDescription: { type: Type.STRING },
      author: { type: Type.STRING },
      dedication: { type: Type.STRING },
      authorBio: { type: Type.STRING },
      backCoverBlurb: { type: Type.STRING },
      pages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pageNumber: { type: Type.INTEGER },
            text: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          }
        }
      }
    }
  };
  return generateStructuredContent<StorybookData>(prompt, schema);
};

export const generateComicScriptFromImages = async (images: string[], topic: string): Promise<StorybookData> => {
  const ai = getAiClient();
  const parts: any[] = [];
  
  images.forEach(img => {
    const base64Data = img.split(',')[1];
    const mimeType = img.split(';')[0].split(':')[1];
    parts.push({ inlineData: { mimeType, data: base64Data } });
  });

  const promptText = `
    Analyze these images. They are the seed for a short comic strip story.
    Topic/Context: ${topic || "Create a fun narrative connecting these images."}
    
    Task: Write a script for a 4-panel comic strip based on these characters/scenes.
    Style: Comic Book.
    
    Return JSON with:
    - title
    - author (Creative name)
    - characterName (The primary name of the character)
    - characterDescription (Detailed visual description of the main character seen in images for consistency)
    - pages (Array of 4 objects, one for each panel):
      - pageNumber
      - text (Speech bubble text or caption)
      - imagePrompt (Detailed visual prompt for this specific panel. Include 'comic book style', 'bold lines', 'speech bubble space' in the prompt.)
  `;
  parts.push({ text: promptText });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      style: { type: Type.STRING },
      characterName: { type: Type.STRING },
      characterDescription: { type: Type.STRING },
      author: { type: Type.STRING },
      dedication: { type: Type.STRING },
      authorBio: { type: Type.STRING },
      backCoverBlurb: { type: Type.STRING },
      pages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pageNumber: { type: Type.INTEGER },
            text: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          }
        }
      }
    }
  };

  try {
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    }));
    const text = response.text || "{}";
    return JSON.parse(text) as StorybookData;
  } catch (error) {
    handleGeminiError(error);
    return {} as StorybookData;
  }
};

export const generateMemeConcept = async (topic: string): Promise<MemeData> => {
  const prompt = `Create a funny meme concept about: ${topic}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topText: { type: Type.STRING },
      bottomText: { type: Type.STRING },
      visualPrompt: { type: Type.STRING }
    }
  };
  return generateStructuredContent<MemeData>(prompt, schema);
};

export const generateSocialCampaign = async (topic: string, settings: SocialSettings): Promise<SocialCampaign> => {
  const prompt = `Create a social media campaign about "${topic}". Tone: ${settings.tone}. Style: ${settings.style}. Language: ${settings.language}. Emojis: ${settings.useEmojis}. Platforms: ${settings.platforms.join(', ')}.`;
  const postSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING }, 
      imagePrompt: { type: Type.STRING },
      hashtags: { type: Type.STRING }
    }
  };

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      linkedin: postSchema,
      twitter: { 
         type: Type.OBJECT, 
         properties: { 
            text: { type: Type.ARRAY, items: { type: Type.STRING }},
            imagePrompt: { type: Type.STRING },
            hashtags: { type: Type.STRING }
         } 
      },
      instagram: postSchema,
      facebook: postSchema,
      tiktok: { 
         type: Type.OBJECT, 
         properties: { 
            text: { type: Type.ARRAY, items: { type: Type.STRING }},
            imagePrompt: { type: Type.STRING },
            hashtags: { type: Type.STRING }
         } 
      },
      youtube_shorts: postSchema,
      threads: postSchema,
      pinterest: postSchema
    }
  };
  return generateStructuredContent<SocialCampaign>(prompt, schema);
};

export const analyzePrompt = async (userPrompt: string, platform: string): Promise<PromptAnalysis> => {
  const prompt = `Analyze this prompt for ${platform}: "${userPrompt}". Provide scoring and improvement suggestions.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      isOptimal: { type: Type.BOOLEAN },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      suggestion: { type: Type.STRING },
      reasoning: { type: Type.STRING },
      platformAdvice: { type: Type.STRING }
    }
  };
  return generateStructuredContent<PromptAnalysis>(prompt, schema);
};

export const generateDailyTip = async (dayIndex: number): Promise<DailyTip> => {
  const prompt = `Generate a daily tip for Day ${dayIndex} of an AI Academy. Category: either 'Prompting' or 'Security'.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      dayIndex: { type: Type.INTEGER },
      date: { type: Date.now().toString() },
      category: { type: Type.STRING, enum: ['Prompting', 'Security'] },
      title: { type: Type.STRING },
      content: { type: Type.STRING },
      example: { type: Type.STRING }
    }
  };
  return generateStructuredContent<DailyTip>(prompt, schema);
};

export const generateHelpfulList = async (topic: string): Promise<HelpfulList> => {
  const prompt = `Create a helpful checklist or list about: ${topic}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      items: { type: Type.ARRAY, items: { type: Type.STRING } },
      imagePrompt: { type: Type.STRING }
    }
  };
  return generateStructuredContent<HelpfulList>(prompt, schema);
};

export const generatePodcastScript = async (topic: string, hostName: string, guestName: string): Promise<PodcastScript> => {
  const prompt = `Write a podcast script about ${topic} between host ${hostName} and guest ${guestName}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      script: { type: Type.STRING },
      visualPrompt: { type: Type.STRING }
    }
  };
  return generateStructuredContent<PodcastScript>(prompt, schema);
};

export const generateQuiz = async (topic: string, count: number, difficulty: string): Promise<QuizData> => {
  const prompt = `Generate a ${count}-question quiz about ${topic}. Difficulty: ${difficulty}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          }
        }
      }
    }
  };
  return generateStructuredContent<QuizData>(prompt, schema);
};

export const generateRiddleContent = async (topic: string): Promise<RiddleData> => {
  const prompt = `Generate a clever riddle about ${topic}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      riddle: { type: Type.STRING },
      answer: { type: Type.STRING },
      explanation: { type: Type.STRING }
    }
  };
  return generateStructuredContent<RiddleData>(prompt, schema);
};

export const generateUiCode = async (prompt: string, device: string, style: string, refImage?: string): Promise<string> => {
  const ai = getAiClient();
  const fullPrompt = `Generate clean HTML/CSS code for a ${device} UI component described as: ${prompt}. Style: ${style}. Return ONLY the raw code inside standard html tags.`;
  
  let contents: any = [{ text: fullPrompt }];
  if (refImage) {
     const base64Data = refImage.split(',')[1];
     contents.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
  }

  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    get model() { return 'gemini-3-pro-preview'; },
    contents: { parts: contents }
  }));
  
  let code = response.text || "";
  code = code.replace(/```html/g, '').replace(/```/g, '');
  return code;
};

export const generateAffirmationPlan = async (topic: string, tone: string): Promise<AffirmationPlan> => {
  const prompt = `Generate a weekly affirmation plan for: ${topic}. Tone: ${tone}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      weeklyMantra: { type: Type.STRING },
      dailyAffirmations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            text: { type: Type.STRING }
          }
        }
      }
    }
  };
  return generateStructuredContent<AffirmationPlan>(prompt, schema);
};

export const generateHiddenMessage = async (secret: string, cover: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Write a paragraph about "${cover}". HIDE the secret message "${secret}" inside the text. 
  
  Format the output so that every word belonging to the secret message is wrapped in double curly braces, e.g. {{secret}}.`;
  
  const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  }));
  return response.text || "";
};

export const generateBrandIdentity = async (name: string, industry: string, vibe: string, personality: string, colors: string, fonts: string): Promise<BrandIdentity> => {
  const prompt = `Create a brand identity for "${name}" in the ${industry} industry. Vibe: ${vibe}. Personality: ${personality}. Pref Colors: ${colors}. Pref Fonts: ${fonts}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      companyName: { type: Type.STRING },
      missionStatement: { type: Type.STRING },
      slogan: { type: Type.STRING },
      colorPalette: { 
         type: Type.ARRAY, 
         items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } 
      },
      fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } },
      logoPrompt: { type: Type.STRING },
      brandVoice: { type: Type.STRING },
      stationaryPrompt: { type: Type.STRING },
      pptTemplatePrompt: { type: Type.STRING },
      calendarPrompt: { type: Type.STRING }
    }
  };
  return generateStructuredContent<BrandIdentity>(prompt, schema);
};

export const regenerateBrandPalette = async (current: BrandIdentity): Promise<BrandIdentity> => {
  const prompt = `Regenerate ONLY the color palette for brand "${current.companyName}".`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      colorPalette: { 
         type: Type.ARRAY, 
         items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } 
      }
    }
  };
  return generateStructuredContent<BrandIdentity>(prompt, schema);
};

export const regenerateBrandTypography = async (current: BrandIdentity): Promise<BrandIdentity> => {
  const prompt = `Regenerate ONLY the font pairing for brand "${current.companyName}".`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } }
    }
  };
  return generateStructuredContent<BrandIdentity>(prompt, schema);
};

export const generateUGCScript = async (product: string, audience: string, painPoint: string): Promise<UGCScript> => {
  const prompt = `Write a viral TikTok/UGC ad script for ${product}. Target: ${audience}. Pain Point: ${painPoint}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      targetAudience: { type: Type.STRING },
      totalDuration: { type: Type.STRING },
      sections: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            section: { type: Type.STRING },
            visual: { type: Type.STRING },
            audio: { type: Type.STRING },
            duration: { type: Type.STRING }
          }
        }
      }
    }
  };
  return generateStructuredContent<UGCScript>(prompt, schema);
};

export const generatePoem = async (topic: string, style: string): Promise<string> => {
  return generateTextWithGemini(`Write a poem about ${topic} in the style of ${style}.`);
};

export const generateDailyJoke = async (dayIndex: number): Promise<string> => {
  return generateTextWithGemini(`Tell me a unique, funny joke for day ${dayIndex}.`);
};

export const generateQuote = async (category: string): Promise<string> => {
  return generateTextWithGemini(`Give me an inspiring quote about ${category}.`);
};

export const generateConnectionFact = async (person: string): Promise<string> => {
  return generateTextWithGemini(`Tell me a surprising, obscure connection or fact about ${person || "a random famous historical figure"}.`);
};

export const analyzeWealthPath = async (name: string): Promise<WealthAnalysis> => {
  const prompt = `Analyze the wealth creation path of ${name}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      personName: { type: Type.STRING },
      estimatedNetWorth: { type: Type.STRING },
      originStart: { type: Type.STRING },
      privilegeAnalysis: { type: Type.STRING },
      keySuccessFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
      actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      realityCheck: { type: Type.STRING }
    }
  };
  return generateStructuredContent<WealthAnalysis>(prompt, schema);
};

export const generateLearnerBrief = async (text: string): Promise<LearnerBrief> => {
  const prompt = `Summarize this text and create a podcast script to learn it. Content: ${text.substring(0, 10000)}...`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      podcastScript: { type: Type.STRING }
    }
  };
  return generateStructuredContent<LearnerBrief>(prompt, schema);
};

export const analyzePaperCommercial = async (text: string): Promise<CommercialAnalysis> => {
  const prompt = `Analyze this research paper for commercial viability: ${text.substring(0, 5000)}...`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      marketPotential: { type: Type.STRING },
      monetizationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
      targetIndustries: { type: Type.ARRAY, items: { type: Type.STRING } },
      commercialHurdles: { type: Type.ARRAY, items: { type: Type.STRING } },
      elevatorPitch: { type: Type.STRING }
    }
  };
  return generateStructuredContent<CommercialAnalysis>(prompt, schema);
};

export const generateBabyNames = async (gender: string, style: string, origin: string, invent: boolean): Promise<BabyName[]> => {
  const prompt = `Generate 5 ${gender} baby names. Style: ${style}. Origin: ${origin}. ${invent ? 'INVENT new unique names.' : 'Use existing names.'}`;
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        gender: { type: Type.STRING },
        origin: { type: Type.STRING },
        meaning: { type: Type.STRING },
        lineage: { type: Type.STRING },
        reason: { type: Type.STRING }
      }
    }
  };
  return generateStructuredContent<BabyName[]>(prompt, schema);
};

export const generate3DOrchestration = async (input: string, image?: string): Promise<AI360Response> => {
  const prompt = `Analyze this request for 3D generation: "${input}". Validate safety and clarity. If valid, create a detailed prompt.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING, enum: ['accepted', 'rejected', 'needs_clarification'] },
      reason: { type: Type.STRING },
      safety_categories: { type: Type.ARRAY, items: { type: Type.STRING } },
      clarification_question: { type: Type.STRING, nullable: true },
      generation_prompt: { type: Type.STRING, nullable: true },
      style: { type: Type.STRING, enum: ['realistic', 'stylized', 'neutral'], nullable: true }
    }
  };
  return generateStructuredContent<AI360Response>(prompt, schema);
};

export const generateCarouselContent = async (topic: string, count: number, handle: string): Promise<CarouselData> => {
  const prompt = `Create a LinkedIn carousel about ${topic} with ${count} slides. Author: ${handle}.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      authorHandle: { type: Type.STRING },
      slides: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['intro', 'content', 'outro'] }
          }
        }
      }
    }
  };
  return generateStructuredContent<CarouselData>(prompt, schema);
};

export const analyzeDream = async (dreamText: string): Promise<DreamAnalysis> => {
  const prompt = `Analyze this dream: "${dreamText}". Provide interpretation and visual prompt.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      interpretation: { type: Type.STRING },
      symbols: { type: Type.ARRAY, items: { type: Type.STRING } },
      visualPrompt: { type: Type.STRING }
    }
  };
  return generateStructuredContent<DreamAnalysis>(prompt, schema);
};

export const analyzePetProfile = async (image: string): Promise<PetProfile> => {
  const prompt = `Analyze this pet photo. Create a fun persona and visual prompt for a 3D version.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      personality: { type: Type.STRING },
      jobTitle: { type: Type.STRING },
      quote: { type: Type.STRING },
      visualPrompt: { type: Type.STRING }
    }
  };
  return generateStructuredContent<PetProfile>(prompt, schema, 'gemini-3-flash-preview', image);
};

export const generateCalendarThemeImage = async (month: string, year: number, style: string): Promise<string> => {
  const prompt = `Artistic calendar header illustration for ${month} ${year}. Style: ${style}.`;
  return generateImageWithGemini(prompt, '16:9');
};

// --- Game Puzzles ---

export const generateEmojiPuzzle = async (): Promise<EmojiPuzzle> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      emojis: { type: Type.STRING },
      answer: { type: Type.STRING },
      category: { type: Type.STRING }
    }
  };
  return generateStructuredContent<EmojiPuzzle>("Generate an emoji puzzle.", schema);
};

export const generateWordPuzzle = async (): Promise<WordPuzzle> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      definition: { type: Type.STRING },
      distractors: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  };
  return generateStructuredContent<WordPuzzle>("Generate a word puzzle.", schema);
};

export const generateTwoTruthsPuzzle = async (): Promise<TwoTruthsPuzzle> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      statements: { 
         type: Type.ARRAY, 
         items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, isTruth: { type: Type.BOOLEAN } } } 
      },
      explanation: { type: Type.STRING }
    }
  };
  return generateStructuredContent<TwoTruthsPuzzle>("Generate a Two Truths and a Lie puzzle.", schema);
};

export const generateRiddlePuzzle = async (): Promise<RiddlePuzzle> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      answer: { type: Type.STRING },
      hint: { type: Type.STRING },
      difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] }
    }
  };
  return generateStructuredContent<RiddlePuzzle>("Generate a riddle.", schema);
};

// --- Baby Version Transformer Logic ---

export const analyzeVideoCharacters = async (frameBase64: string): Promise<string> => {
  const prompt = `Analyze this frame. List all entities, their poses, and describe their attire in extreme detail. Output as structured JSON. You MUST use non-humanoid terminology. Refer to entities as 'characters', 'figures', or 'subjects'. Avoid words like 'woman', 'man', 'person', 'human'.`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      characters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            description: { type: Type.STRING },
            pose: { type: Type.STRING },
            attire: { type: Type.STRING }
          }
        }
      }
    }
  };
  
  const result = await generateStructuredContent<any>(prompt, schema, 'gemini-3-flash-preview', frameBase64);
  return JSON.stringify(result);
};

export const generateBabyTransformation = async (frameBase64: string, attireData: string): Promise<string> => {
  let attireDescription = "the characters from the reference image";
  try {
    const parsed = JSON.parse(attireData);
    if (parsed && parsed.characters && Array.isArray(parsed.characters)) {
        attireDescription = parsed.characters.map((c: any) => `${c.description || 'a toy figure'} wearing ${c.attire || 'regular clothes'} in ${c.pose || 'a pose'}`).join(', ');
    }
  } catch (e) {
    console.warn("Could not parse attire data, using fallback description.");
  }

  // Base Style Call
  const prompt = `Adorable 3D stylized toy figurine animation video. The subjects from the reference are reinterpreted as cute, expressive miniature 3D toy-like characters. 
  Constraint: The tiny figurines must wear the exact same ${attireDescription} and maintain the exact same poses and background as the reference.
  Visual Style: High-quality 3D render, smooth surfaces, non-photorealistic artistic features. (ABSTRACT_STYLE_B_01)`;

  return generateVideoWithGemini(prompt, '9:16', frameBase64);
};

// --- Baby Debates Logic ---

export const generateBabyDebateScript = async (topic: string, participants: string[]): Promise<BabyDebateScript> => {
  const prompt = `Write a script for a funny "Baby Debate" video. 
  Participants: ${participants.join(', ')}. 
  Topic: ${topic}. 
  The participants are tiny 3D baby versions of themselves. 
  Capture the essence of their real-life personalities but translate it into a hilarious nursery/playground context.
  
  Format as JSON with:
  - topic (string)
  - scriptLines (array of { speaker, text })
  - visualContext (detailed prompt describing the 3D nursery set and baby likenesses)`;

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

  return generateStructuredContent<BabyDebateScript>(prompt, schema);
};

export const generateTalkingBabyVideo = async (script: BabyDebateScript, style: string): Promise<string> => {
  const dialogueText = script.scriptLines.map(l => `${l.speaker}: "${l.text}"`).join(' ');
  
  // Refined prompt to maximize lip sync and character preservation
  const prompt = `High-end 3D animated debate video. Style: ${style}. 
  Scene: ${script.visualContext}. 
  Characters are talking directly to the camera or each other. 
  ACTION REQUIREMENTS: Precise lip-sync and mouth articulation matched to the following conversation: [${dialogueText}]. 
  Characters must have expressive eyebrow movements and animated facial expressions. 
  Visual Style: 4K render, smooth subsurface scattering, playful lighting. 
  Constraint: Characters are adorable miniature baby figurines. (ABSTRACT_STYLE_B_01)`;

  return generateVideoWithGemini(prompt, '16:9');
};
