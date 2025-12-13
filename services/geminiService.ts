
// ... existing imports ...
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { 
  MemeData, QuizData, RiddleData, StorybookData, SocialSettings, 
  SocialCampaign, PromptAnalysis, DailyTip, HelpfulList, PodcastScript,
  EmojiPuzzle, WordPuzzle, TwoTruthsPuzzle, RiddlePuzzle, AffirmationPlan,
  BrandIdentity, UGCScript, WealthAnalysis, CommercialAnalysis, BabyName, LearnerBrief,
  AI360Response, DreamAnalysis, CarouselData
} from "../types";
import { runSecurityChecks, sanitizeInput } from "../utils/security";

const getApiKey = (): string => {
  // 1. Check process.env (Standard Node/Webpack/Compatible)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // 2. Check import.meta.env (Vite Standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    // @ts-ignore
    if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
  }
  return '';
};

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error:", error);
  
  // Attempt to extract error details from various potential structures
  const innerError = error.error || error;
  const msg = (innerError.message || error.message || JSON.stringify(error)).toLowerCase();
  const code = innerError.code || error.status || error.code;
  const status = innerError.status || error.status;
  
  if (
    msg.includes("429") || 
    code === 429 || 
    status === "RESOURCE_EXHAUSTED" || 
    msg.includes("resource_exhausted") || 
    msg.includes("quota") ||
    msg.includes("billing")
  ) {
    throw new Error("Quota Exceeded: You have reached the usage limit for the Google Gemini API. Please check your billing details or try again later.");
  }
  if (msg.includes("api key") || code === 403 || code === 400) { 
     throw new Error("Invalid API Key or Bad Request. Please check your settings.");
  }
  
  // Pass through security errors
  if (msg.includes("security alert") || msg.includes("rate limit") || msg.includes("safety alert")) {
      throw new Error(innerError.message || error.message);
  }
  
  if (code === 503 || status === "UNAVAILABLE" || msg.includes("overloaded")) {
      throw new Error("The AI model is currently overloaded. Please try again in a few moments.");
  }
  
  throw new Error(innerError.message || error.message || "An unexpected error occurred.");
};

// --- Retry Helper ---
const withRetry = async <T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const innerError = error.error || error;
    const msg = (innerError.message || error.message || JSON.stringify(error)).toLowerCase();
    const status = innerError.status || error.status || error.code;

    // Check for 503 Service Unavailable / Overloaded
    const isOverloaded =
      status === 503 ||
      status === "UNAVAILABLE" ||
      msg.includes("503") ||
      msg.includes("overloaded") ||
      msg.includes("unavailable") ||
      msg.includes("server error");

    if (isOverloaded && retries > 0) {
      console.warn(`Model overloaded (503). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      // Exponential backoff
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

// --- WAV Header Helpers ---
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Text Generation
 */
export const generateTextWithGemini = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
    // SECURITY CHECKS
    const cleanPrompt = sanitizeInput(prompt);
    runSecurityChecks(cleanPrompt, "Text Prompt");

    const ai = getAiClient();
    return await withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: cleanPrompt,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      return response.text || "";
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Image Generation (Standard)
 * supports optional reference image for consistency
 */
export const generateImageWithGemini = async (prompt: string, aspectRatio: string = '1:1', referenceImageBase64?: string): Promise<string> => {
  try {
    // SECURITY CHECKS
    const cleanPrompt = sanitizeInput(prompt);
    runSecurityChecks(cleanPrompt, "Image Prompt");

    const ai = getAiClient();
    
    // Construct parts
    const parts: any[] = [];
    
    // If reference image exists, add it first to guide the model
    if (referenceImageBase64) {
        // Strip data prefix if present to get raw base64
        const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
        parts.push({
            inlineData: {
                mimeType: 'image/png', 
                data: base64Data
            }
        });
        
        // Enhance prompt to explicitly use the reference
        parts.push({ 
            text: `Using the provided image as a strict character reference, generate: ${cleanPrompt}. Maintain exact character details, colors, and style.` 
        });
    } else {
        parts.push({ text: cleanPrompt });
    }
    
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
            ]
          },
        });
        
        // FIRST PASS: Look for image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }

        // SECOND PASS: If no image, look for text refusal
        let refusalText = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.text) {
              refusalText += part.text;
          }
        }
        
        if (refusalText) {
            if (refusalText.toLowerCase().includes("here is") || refusalText.toLowerCase().includes("image")) {
                throw new Error("Image Filtered: The model generated a response but the image was blocked by safety filters.");
            }
            throw new Error(`Model Refusal: ${refusalText}`);
        }

        throw new Error("No image generated. The model may have refused the prompt.");
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Image Generation (Pro)
 */
export const generateProImageWithGemini = async (prompt: string, size: string = '1K'): Promise<string> => {
  try {
    // SECURITY CHECKS
    const cleanPrompt = sanitizeInput(prompt);
    runSecurityChecks(cleanPrompt, "Pro Image Prompt");

    const ai = getAiClient();
    
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: cleanPrompt }] },
          config: {
            imageConfig: {
              imageSize: size as any, 
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
            ]
          },
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }

        let refusalText = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.text) {
              refusalText += part.text;
          }
        }
        
        if (refusalText) {
            if (refusalText.toLowerCase().includes("here is") || refusalText.toLowerCase().includes("image")) {
                throw new Error("Image Filtered: The model generated a response but the image was blocked by safety filters.");
            }
            throw new Error(`Model Refusal: ${refusalText}`);
        }

        throw new Error("No image generated");
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

// ... [Keep existing exports for editImageWithGemini, analyzeImageWithGemini, etc. unchanged] ...
export const editImageWithGemini = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    const cleanPrompt = sanitizeInput(prompt);
    runSecurityChecks(cleanPrompt, "Edit Prompt");

    const ai = getAiClient();
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1];
    
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              { text: cleanPrompt }
            ]
          },
          config: {
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
            ]
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }

        let refusalText = "";
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.text) {
              refusalText += part.text;
          }
        }
        
        if (refusalText) {
            if (refusalText.toLowerCase().includes("here is") || refusalText.toLowerCase().includes("image")) {
                throw new Error("Image Filtered: The model generated a response but the image was blocked by safety filters.");
            }
            throw new Error(`Model Refusal: ${refusalText}`);
        }

        throw new Error("No edited image returned");
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

export const analyzeImageWithGemini = async (imageBase64: string, question: string): Promise<string> => {
  try {
    const cleanQuestion = sanitizeInput(question);
    runSecurityChecks(cleanQuestion, "Question");

    const ai = getAiClient();
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1];

    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              { text: cleanQuestion }
            ]
          }
        });
        return response.text || "";
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

export const generateImagePrompt = async (imageBase64: string, platform: string): Promise<string> => {
    const cleanPlatform = sanitizeInput(platform); 
    const prompt = `Analyze this image and generate a detailed text prompt that could be used to recreate it using ${cleanPlatform}. Include details about style, lighting, composition, and subject.`;
    return analyzeImageWithGemini(imageBase64, prompt);
};

export const createChatSession = (systemInstruction?: string): Chat => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    }
  });
};

export const createThinkingChatSession = (systemInstruction?: string): Chat => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 1024 } 
    }
  });
};

export const generateBatchImages = async (prompt: string, quantity: number): Promise<string[]> => {
  const cleanPrompt = sanitizeInput(prompt);
  runSecurityChecks(cleanPrompt, "Design Prompt");

  const promises = [];
  for (let i = 0; i < quantity; i++) {
    promises.push(generateImageWithGemini(cleanPrompt));
  }
  return Promise.all(promises);
};

export const generateViralThumbnails = async (prompt: string): Promise<string[]> => {
    return generateBatchImages(prompt, 5);
};

export const generateEmojiPuzzle = async (): Promise<EmojiPuzzle> => {
    runSecurityChecks("Generate Emoji Puzzle", "System"); 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: "Generate a fun emoji puzzle where a sequence of emojis represents a movie, book, or famous phrase.",
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          emojis: { type: Type.STRING },
                          answer: { type: Type.STRING },
                          category: { type: Type.STRING }
                      },
                      required: ['emojis', 'answer', 'category']
                  }
              }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateWordPuzzle = async (): Promise<WordPuzzle> => {
    runSecurityChecks("Generate Word Puzzle", "System");
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: "Generate a difficult vocabulary word with its definition and some distractor words.",
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          word: { type: Type.STRING },
                          definition: { type: Type.STRING },
                          distractors: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ['word', 'definition', 'distractors']
                  }
              }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateTwoTruthsPuzzle = async (): Promise<TwoTruthsPuzzle> => {
    runSecurityChecks("Generate Two Truths", "System");
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: "Generate 'Two Truths and a Lie' statements about a random educational topic.",
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          topic: { type: Type.STRING },
                          statements: { 
                              type: Type.ARRAY, 
                              items: { 
                                  type: Type.OBJECT,
                                  properties: { text: { type: Type.STRING }, isTruth: { type: Type.BOOLEAN } } 
                              } 
                          },
                          explanation: { type: Type.STRING }
                      },
                      required: ['topic', 'statements', 'explanation']
                  }
              }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateRiddlePuzzle = async (): Promise<RiddlePuzzle> => {
    runSecurityChecks("Generate Riddle", "System");
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: "Generate a clever riddle.",
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          question: { type: Type.STRING },
                          answer: { type: Type.STRING },
                          hint: { type: Type.STRING },
                          difficulty: { type: Type.STRING }
                      },
                      required: ['question', 'answer', 'hint', 'difficulty']
                  }
              }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateCarouselContent = async (topic: string, count: number, authorHandle: string): Promise<CarouselData> => {
  const cleanTopic = sanitizeInput(topic);
  runSecurityChecks(cleanTopic, "Carousel Topic");
  const ai = getAiClient();
  const prompt = `Create a ${count}-slide LinkedIn carousel content about: "${cleanTopic}". Structure: Slide 1: Powerful Hook/Title. Middle Slides: Key points. Last Slide: Conclusion/CTA. Output JSON.`;
  try {
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
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
                    },
                    required: ['title', 'content', 'type']
                  }
                }
              },
              required: ['topic', 'slides']
            }
          }
        });
        const data = JSON.parse(response.text || "{}");
        data.authorHandle = authorHandle || data.authorHandle || "@YourHandle";
        return data;
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

export const transcribeMediaWithGemini = async (mediaBase64: string, mimeType: string): Promise<string> => {
    runSecurityChecks("Transcribe Media", "System");
    const ai = getAiClient();
    const base64Data = mediaBase64.split(',')[1];
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: {
                  parts: [
                      { inlineData: { mimeType: mimeType, data: base64Data } },
                      { text: "Transcribe the audio from this media file accurately." }
                  ]
              }
          });
          return response.text || "No transcription generated.";
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string): Promise<string> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          let operation;
          if (imageBase64) {
              const base64Data = imageBase64.split(',')[1];
              const mimeType = imageBase64.split(';')[0].split(':')[1];
              operation = await ai.models.generateVideos({
                  model: 'veo-3.1-fast-generate-preview',
                  prompt: prompt,
                  image: { imageBytes: base64Data, mimeType: mimeType },
                  config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as any }
              });
          } else {
              operation = await ai.models.generateVideos({
                  model: 'veo-3.1-fast-generate-preview',
                  prompt: prompt,
                  config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as any }
              });
          }
          while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              operation = await ai.operations.getVideosOperation({operation: operation});
          }
          const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (!downloadLink) throw new Error("Video generation failed.");
          const apiKey = getApiKey();
          return `${downloadLink}&key=${apiKey}`;
      }, 3, 5000);
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateSpeechWithGemini = async (text: string, voiceName: string, speed: number = 1.0, pitch: number = 0, multiSpeaker?: any): Promise<string> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          let config: any = { responseModalities: [Modality.AUDIO], speechConfig: {} };
          if (multiSpeaker) {
              config.speechConfig.multiSpeakerVoiceConfig = {
                  speakerVoiceConfigs: multiSpeaker.map((s: any) => ({ speaker: s.speaker, voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } } }))
              };
          } else {
              config.speechConfig.voiceConfig = { prebuiltVoiceConfig: { voiceName: voiceName } };
          }
          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: [{ parts: [{ text }] }],
              config: config
          });
          const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!base64Audio) throw new Error("Audio generation failed");
          return `data:audio/wav;base64,${base64Audio}`; 
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateCalendarThemeImage = async (month: string, year: number, style: string): Promise<string> => {
    const cleanStyle = sanitizeInput(style);
    let prompt = `Artistic header image for a calendar representing ${month} ${year}. Style: ${cleanStyle}. High quality, aesthetic. If text is included, it must say "${year}".`;
    if (cleanStyle.toLowerCase().includes("claymation")) {
        prompt = `A cute, high-quality claymation scene for ${month} ${year}. Soft rounded clay textures, plasticine style, bright pastel colors, stop-motion aesthetic, miniature world feel. If text is included, it must say "${year}".`;
    } else if (cleanStyle.toLowerCase().includes("memphis")) {
        prompt = `Trendy 80s Memphis Design pattern for ${month} ${year}. Geometric shapes, squiggles, zig-zags, confetti. Bright pop colors (pink, teal, yellow) on white background. Flat vector illustration style. High quality. If text is included, it must say "${year}".`;
    }
    return generateImageWithGemini(prompt, '16:9');
};

export const generateDailyTip = async (dayIndex: number): Promise<DailyTip> => {
    return { dayIndex, date: new Date().toISOString(), category: 'Prompting', title: 'Tip Title', content: 'Tip Content' };
};

export const generateSocialCampaign = async (topic: string, settings: SocialSettings): Promise<SocialCampaign> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a social media campaign about "${topic}" for ${settings.platforms.join(', ')}.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                 type: Type.OBJECT,
                 properties: {
                   topic: { type: Type.STRING },
                   linkedin: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } },
                   twitter: { type: Type.OBJECT, properties: { text: { type: Type.ARRAY, items: { type: Type.STRING } }, imagePrompt: { type: Type.STRING } } },
                   instagram: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING }, hashtags: { type: Type.STRING } } },
                   facebook: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } },
                   tiktok: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } },
                   youtube_shorts: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } },
                   threads: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } },
                   pinterest: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } }
                 }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateMemeConcept = async (topic: string): Promise<MemeData> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a funny meme concept about "${topic}".`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: { topText: { type: Type.STRING }, bottomText: { type: Type.STRING }, visualPrompt: { type: Type.STRING } }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateHelpfulList = async (topic: string): Promise<HelpfulList> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a helpful checklist about "${topic}".`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } }, imagePrompt: { type: Type.STRING } }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generatePodcastScript = async (topic: string, host: string, guest: string): Promise<PodcastScript> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a short podcast script between ${host} and ${guest} about "${topic}".`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, script: { type: Type.STRING }, visualPrompt: { type: Type.STRING } }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateQuiz = async (topic: string, count: number, diff: string): Promise<QuizData> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a ${diff} difficulty quiz with ${count} questions about "${topic}".`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.INTEGER }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, explanation: { type: Type.STRING } } } }
                }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateRiddleContent = async (topic: string): Promise<RiddleData> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a riddle about "${topic}".`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: { topic: { type: Type.STRING }, riddle: { type: Type.STRING }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const generateBrandIdentity = async (name: string, industry: string, vibe: string, personality: string, colors: string, fonts: string): Promise<BrandIdentity> => {
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a complete brand identity for "${name}" in the ${industry} industry. Vibe: ${vibe}. Personality: ${personality}.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  companyName: { type: Type.STRING },
                  missionStatement: { type: Type.STRING },
                  slogan: { type: Type.STRING },
                  colorPalette: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } },
                  fontPairing: { type: Type.OBJECT, properties: { heading: { type: Type.STRING }, body: { type: Type.STRING } } },
                  logoPrompt: { type: Type.STRING },
                  brandVoice: { type: Type.STRING },
                  stationaryPrompt: { type: Type.STRING },
                  pptTemplatePrompt: { type: Type.STRING },
                  calendarPrompt: { type: Type.STRING }
                }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};

export const regenerateBrandPalette = async (data: BrandIdentity): Promise<BrandIdentity> => { return data; };
export const regenerateBrandTypography = async (data: BrandIdentity): Promise<BrandIdentity> => { return data; };
export const generateUiCode = async (prompt: string, device: string, style: string, img: string): Promise<string> => { return ""; };
export const generateAffirmationPlan = async (topic: string, tone: string): Promise<AffirmationPlan> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a weekly affirmation plan for "${topic}" with a "${tone}" tone.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  weeklyMantra: { type: Type.STRING },
                  dailyAffirmations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.STRING }, text: { type: Type.STRING } } } }
                }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const generateUGCScript = async (prod: string, aud: string, pain: string): Promise<UGCScript> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a UGC video script for product "${prod}". Audience: ${aud}. Pain point: ${pain}.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
                  totalDuration: { type: Type.STRING },
                  sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { section: { type: Type.STRING }, visual: { type: Type.STRING }, audio: { type: Type.STRING }, duration: { type: Type.STRING } } } }
                }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const analyzeWealthPath = async (name: string): Promise<WealthAnalysis> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the wealth path of ${name}.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
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
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const generateLearnerBrief = async (text: string): Promise<LearnerBrief> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize this text and create a podcast script: ${text.substring(0, 10000)}`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  podcastScript: { type: Type.STRING }
                }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const analyzePaperCommercial = async (text: string): Promise<CommercialAnalysis> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this paper for commercial viability: ${text.substring(0, 10000)}`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  marketPotential: { type: Type.STRING },
                  monetizationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  targetIndustries: { type: Type.ARRAY, items: { type: Type.STRING } },
                  commercialHurdles: { type: Type.ARRAY, items: { type: Type.STRING } },
                  elevatorPitch: { type: Type.STRING }
                }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const generateBabyNames = async (g: string, s: string, o: string, i: boolean): Promise<BabyName[]> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate ${i ? 'invented' : 'existing'} baby names. Gender: ${g}, Style: ${s}, Origin: ${o}.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
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
              }
            }
          });
          return JSON.parse(response.text || "[]");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const generateStoryScript = async (c: string, s: string, d?: string): Promise<StorybookData> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a children's storybook script. Concept: ${c}. Style: ${s}. Character Desc: ${d || ''}.
            
            CRITICAL FORMATTING INSTRUCTION:
            If the story is written in rhyme/verse, YOU MUST insert a newline character (\n) at the end of every line of the poem so it is formatted correctly. Do not write it as a single block paragraph.
            
            Include fields for:
            - title
            - author (default to "AI Storyteller")
            - dedication (a short creative dedication)
            - authorBio (a short creative bio for the author)
            - backCoverBlurb (a summary of the story)
            - pages (array of pageNumber, text, imagePrompt)
            `,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  author: { type: Type.STRING },
                  dedication: { type: Type.STRING },
                  authorBio: { type: Type.STRING },
                  backCoverBlurb: { type: Type.STRING },
                  style: { type: Type.STRING },
                  characterDescription: { type: Type.STRING },
                  pages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { pageNumber: { type: Type.INTEGER }, text: { type: Type.STRING }, imagePrompt: { type: Type.STRING } } } }
                }
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const generateHiddenMessage = async (s: string, c: string): Promise<string> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a paragraph about ${c} that hides the secret message "${s}". Enclose hidden words in {{double curly braces}}.`,
          });
          return response.text || "";
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const analyzePrompt = async (p: string, t: string): Promise<PromptAnalysis> => { 
    const ai = getAiClient();
    try {
      return await withRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this prompt for ${t}: "${p}"`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
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
              }
            }
          });
          return JSON.parse(response.text || "{}");
      });
    } catch (error) {
      handleGeminiError(error);
    }
};
export const generatePoem = async (topic: string, style: string): Promise<string> => {
  try {
    const cleanTopic = sanitizeInput(topic);
    runSecurityChecks(cleanTopic, "Poem Topic");

    const ai = getAiClient();
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Write a poem about "${cleanTopic}" in the style of ${style}.`
        });
        return response.text || "";
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

export const generateDailyJoke = async (d: number): Promise<string> => {
  try {
    const ai = getAiClient();
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are a comedian. Tell me a creative, witty, and clean joke for "Day ${d}" of my app. Ensure it is not a cliché.`
        });
        return response.text || "Why did the developer quit his job? He didn't get arrays.";
    });
  } catch (e) {
    console.error(e);
    return "My humor module is recharging. Please try again later!";
  }
};

export const generateQuote = async (category: string): Promise<string> => {
  const cleanCategory = sanitizeInput(category);
  const ai = getAiClient();
  try {
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Give me a profound and inspiring quote about "${cleanCategory}". Include the author's name. Format: "Quote" - Author`
        });
        return response.text || "The only way to do great work is to love what you do. - Steve Jobs";
    });
  } catch (e) {
    return "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill";
  }
};

export const generateConnectionFact = async (person: string): Promise<string> => {
  const cleanPerson = sanitizeInput(person) || "Kevin Bacon";
  const ai = getAiClient();
  try {
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Tell me a surprising or obscure connection fact involving ${cleanPerson} and another famous historical or modern figure. Keep it short and interesting.`
        });
        return response.text || "";
    });
  } catch (e) {
    return "";
  }
};

export const generate3DOrchestration = async (promptInput: string, imageBase64?: string): Promise<AI360Response> => {
  const ai = getAiClient();
  const parts: any[] = [];
  
  try {
    if (imageBase64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } });
    }
    parts.push({ text: `Analyze this request for 3D asset generation: "${promptInput}".
    
    Your goal: Orchestrate the generation of a 3D model prompt.
    
    1. Safety Check: If the request asks for NSFW, violence, or prohibited content, reject it.
    2. Clarity Check: If the request is too vague (e.g. "make a thing"), ask for clarification.
    3. Optimization: If safe and clear, create a highly detailed, technical prompt for a 3D generator (like Point-E or similar) describing the object from all angles, texture, and style.
    
    Return JSON.` });

    return await withRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        status: { type: Type.STRING, enum: ["accepted", "rejected", "needs_clarification"] },
                        reason: { type: Type.STRING },
                        safety_categories: { type: Type.ARRAY, items: { type: Type.STRING } },
                        clarification_question: { type: Type.STRING, nullable: true },
                        generation_prompt: { type: Type.STRING, nullable: true },
                        style: { type: Type.STRING, enum: ["realistic", "stylized", "neutral"], nullable: true }
                    },
                    required: ["status", "reason"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    });
  } catch (error) {
    handleGeminiError(error);
  }
};

export const analyzeDream = async (dream: string, lens: string): Promise<DreamAnalysis> => {
  const ai = getAiClient();
  const prompt = `Analyze this dream through the lens of ${lens}: "${dream}".
  Provide a JSON response with:
  - title: Creative title for the dream.
  - interpretation: Deep psychological or spiritual meaning.
  - symbols: Array of key symbols identified.
  - lucidityScore: A number from 1-100 indicating clarity/awareness.
  - visualPrompt: A detailed image generation prompt to visualize this dream scene.
  `;
  
  try {
    return await withRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      title: { type: Type.STRING },
                      interpretation: { type: Type.STRING },
                      symbols: { type: Type.ARRAY, items: { type: Type.STRING } },
                      lucidityScore: { type: Type.NUMBER },
                      visualPrompt: { type: Type.STRING }
                  }
              }
          }
        });
        return JSON.parse(response.text || "{}");
    });
  } catch (error) {
    handleGeminiError(error);
  }
};
