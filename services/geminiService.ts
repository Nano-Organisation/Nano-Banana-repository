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
  RiddlePuzzle
} from '../types';

export const getApiKey = () => process.env.API_KEY;

export const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Enhanced retry logic with exponential backoff and jitter.
 * Specifically tuned for 503 Overloaded and 429 Rate Limit errors.
 */
export const withRetry = async <T>(fn: () => Promise<T>, retries = 15, baseDelay = 2000): Promise<T> => {
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

      // If it's a permanent error (client side 4xx except 429), throw immediately
      if (!isOverloaded && !isRateLimit && !isServerErr) {
        throw error;
      }

      // If we used up all retries, break loop to throw error
      if (attempt === retries - 1) break;

      // Calculate wait time: Exponential backoff with jitter
      // Cap at 30 seconds to avoid overly long hangs, but give enough time for recovery
      const backoff = baseDelay * Math.pow(1.6, attempt); 
      const jitter = Math.random() * 1000;
      const waitTime = Math.min(backoff + jitter, 30000);

      if (isOverloaded || isRateLimit) {
         console.warn(`Gemini API Busy (Attempt ${attempt + 1}/${retries}). Retrying in ${Math.round(waitTime)}ms...`);
      } else {
         console.warn(`Gemini API Error ${status} (Attempt ${attempt + 1}/${retries}). Retrying in ${Math.round(waitTime)}ms...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

export const handleGeminiError = (error: any) => {
  const msg = (error.message || JSON.stringify(error)).toLowerCase();
  
  // Suppress console logging for expected safety filter blocks
  const isSafetyError = msg.includes("safety filters") || msg.includes("returned no video") || msg.includes("safety");
  const isOverloaded = msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable');

  if (!isSafetyError && !isOverloaded) {
     console.error("Gemini API Error Details:", error);
  } else if (isOverloaded) {
     console.warn("Gemini Model Overloaded (All retries exhausted).");
  }
  
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
      model: 'gemini-2.5-flash',
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

  // Internal helper to run a single generation attempt
  const attemptGeneration = async (includeRefImage: boolean, model: string): Promise<string | null> => {
    try {
      const parts: any[] = [];
      
      // If using reference image, add it FIRST for better adherence
      if (includeRefImage && referenceImage) {
        const base64Data = referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage;
        const mimeType = referenceImage.includes(';') ? referenceImage.split(';')[0].split(':')[1] : 'image/png';
        parts.push({
          inlineData: { mimeType, data: base64Data }
        });
      }
      
      // Add text prompt
      parts.push({ text: prompt });

      const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        }
      }), 7, 2500); // 7 retries for each model fallback

      const candidates = response.candidates || [];
      if (candidates.length === 0) {
        lastFailureReason = "Model returned empty candidates list.";
        return null;
      }

      const partsOut = candidates[0].content?.parts || [];
      for (const part of partsOut) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      if (candidates[0].finishReason === 'SAFETY') {
        lastFailureReason = "Image generation blocked by safety filters.";
      } else {
        lastFailureReason = `Model returned no image data (Finish Reason: ${candidates[0].finishReason}).`;
      }
      return null;
    } catch (e: any) {
      lastFailureReason = e.message || JSON.stringify(e);
      console.warn(`Image generation attempt failed on ${model}:`, e);
      return null;
    }
  };

  try {
    // Strategy:
    // 1. Flash Image (with Ref if applicable)
    // 2. Pro Image (with Ref if applicable) -> Higher capacity / quality fallback
    // 3. Flash Image (Text Only) -> Fallback if ref is causing rejection or failure
    // 4. Pro Image (Text Only) -> Final effort

    if (referenceImage) {
      console.log("Attempting Image Gen: Flash + Reference");
      let result = await attemptGeneration(true, 'gemini-2.5-flash-image');
      if (result) return result;
      
      console.log("Attempting Image Gen: Pro + Reference");
      result = await attemptGeneration(true, 'gemini-3-pro-image-preview');
      if (result) return result;

      console.warn("Reference-based image generation failed. Falling back to text-only mode...");
    }

    console.log("Attempting Image Gen: Flash Text-Only");
    let result = await attemptGeneration(false, 'gemini-2.5-flash-image');
    if (result) return result;

    console.log("Attempting Image Gen: Pro Text-Only");
    result = await attemptGeneration(false, 'gemini-3-pro-image-preview');
    if (result) return result;

    // Final Failure
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
      // Pacing for rate limits
      await new Promise(r => setTimeout(r, 1000));
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
      const img = await generateImageWithGemini(`YouTube Thumbnail for "${topic}". Style: ${style}. 16:9 aspect ratio.`, '16:9');
      if (img) results.push(img);
      await new Promise(r => setTimeout(r, 1500));
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
      model: 'gemini-2.5-flash',
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
    model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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

export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string): Promise<string> => {
  const ai = getAiClient();
  try {
    return await withRetry(async () => {
        let operation;
        const config = { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as any };
        
        if (imageBase64) {
            const base64Data = imageBase64.split(',')[1];
            const mimeType = imageBase64.split(';')[0].split(':')[1];
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                image: { imageBytes: base64Data, mimeType: mimeType },
                config: config
            });
        } else {
            operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: config
            });
        }
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        
        if (operation.error) {
           throw new Error(operation.error.message || "Video generation failed during processing.");
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
           throw new Error("Video generation completed but returned no video URI.");
        }

        const apiKey = getApiKey();
        return `${downloadLink}&key=${apiKey}`;
    }, 5, 5000); 
  } catch (error) {
    handleGeminiError(error);
    return "";
  }
};

export const generateBackgroundMusic = async (title: string, style: string): Promise<string> => {
  const prompt = `Generate background music for a story titled "${title}". Style: ${style}. 
  AUDIO REQUIREMENTS: High quality, instrumental, atmospheric background music fitting the style. 
  VISUAL: Static abstract album art or minimal visualizer.`;
  
  return generateVideoWithGemini(prompt, '16:9');
};

// --- Structured Content Generation (JSON) ---

const generateStructuredContent = async <T>(prompt: string, schema: Schema, model = 'gemini-2.5-flash', image?: string): Promise<T> => {
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
  const prompt = `Write a children's storybook script about: ${topic}. Style: ${style}. ${charDesc ? `Character Description: ${charDesc}` : ''}`;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      style: { type: Type.STRING },
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
      model: 'gemini-2.5-flash',
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
      date: { type: Type.STRING },
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
    model: 'gemini-3-pro-preview', 
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
  
  Format the output so that every word belonging to the secret message is wrapped in double curly braces, e.g. {{secret}}.
  The text should read naturally and make sense as a paragraph about ${cover}.`;
  
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
  const prompt = `Regenerate ONLY the color palette for brand "${current.companyName}". Keep other fields same or placeholders.`;
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
  return generateTextWithGemini(`Tell me a unique, funny joke for day ${dayIndex}. Do not repeat common jokes.`);
};

export const generateQuote = async (category: string): Promise<string> => {
  return generateTextWithGemini(`Give me an inspiring quote about ${category}. Include the author.`);
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
  const prompt = `Analyze this dream: "${dreamText}". Provide a psychological interpretation, list key symbols found, and write a vivid visual description (visualPrompt) to generate an image of the dream scene.`;
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
  const prompt = `Analyze this pet photo. Create a fun "human persona" for them.
  1. Give them a name.
  2. Describe their personality.
  3. Assign them a humorous job title.
  4. Write a quote they might say.
  5. detailed visual prompt to generate a 3D Pixar-style character version of them.`;
  
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
  return generateStructuredContent<PetProfile>(prompt, schema, 'gemini-2.5-flash', image);
};

export const generateCalendarThemeImage = async (month: string, year: number, style: string): Promise<string> => {
  const prompt = `Artistic calendar header illustration for ${month} ${year}. Style: ${style}. High quality, wide aspect ratio.`;
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
  return generateStructuredContent<EmojiPuzzle>("Generate an emoji puzzle (e.g. 🦁👑 for Lion King).", schema);
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
  return generateStructuredContent<WordPuzzle>("Generate a difficult word definition puzzle.", schema);
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
  return generateStructuredContent<TwoTruthsPuzzle>("Generate a 'Two Truths and a Lie' puzzle.", schema);
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
