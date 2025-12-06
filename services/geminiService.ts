
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { 
  MemeData, QuizData, RiddleData, StorybookData, SocialSettings, 
  SocialCampaign, PromptAnalysis, DailyTip, HelpfulList, PodcastScript,
  EmojiPuzzle, WordPuzzle, TwoTruthsPuzzle, RiddlePuzzle, AffirmationPlan,
  BrandIdentity, UGCScript
} from "../types";

const getAiClient = () => {
  // Safe access for process.env to prevent 'process is not defined' crashes in browser
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  return new GoogleGenAI({ apiKey: apiKey });
};

const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error:", error);
  
  // Attempt to extract error details from various potential structures
  const innerError = error.error || error;
  const msg = innerError.message || error.message || JSON.stringify(error);
  const code = innerError.code || error.status || error.code;
  const status = innerError.status || error.status;
  
  if (
    msg.includes("429") || 
    code === 429 || 
    status === "RESOURCE_EXHAUSTED" || 
    msg.includes("RESOURCE_EXHAUSTED") || 
    msg.includes("quota")
  ) {
    throw new Error("Quota Exceeded: You have reached the usage limit for the Google Gemini API. Please check your billing details or try again later.");
  }
  if (msg.includes("API key not valid") || code === 403 || code === 400) { // 400 often returned for invalid keys too
     throw new Error("Invalid API Key or Bad Request. Please check your settings.");
  }
  
  throw new Error(msg);
};

// --- WAV Header Helpers ---
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const createWavUrl = (base64Data: string): string => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Gemini TTS returns raw PCM at 24kHz, 1 channel, 16-bit
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + len, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (1 is PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  /* bits per sample */
  view.setUint16(34, bitsPerSample, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, len, true);

  const blob = new Blob([view, bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

/**
 * Text Generation
 */
export const generateTextWithGemini = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text || "";
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Image Generation (Standard)
 */
export const generateImageWithGemini = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
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
        // If text looks positive but no image, likely a safety block
        if (refusalText.toLowerCase().includes("here is") || refusalText.toLowerCase().includes("image")) {
            throw new Error("Image Filtered: The model generated a response but the image was blocked by safety filters.");
        }
        throw new Error(`Model Refusal: ${refusalText}`);
    }

    throw new Error("No image generated. The model may have refused the prompt.");
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Image Generation (Pro)
 */
export const generateProImageWithGemini = async (prompt: string, size: string = '1K'): Promise<string> => {
  try {
    const ai = getAiClient();
    // Using gemini-3-pro-image-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
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
    
    // FIRST PASS: Look for image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // SECOND PASS: Look for text
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
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Image Editing
 */
export const editImageWithGemini = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1];
    
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
          { text: prompt }
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

    // FIRST PASS: Look for image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // SECOND PASS: Look for text
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
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Visual QA / Image Analysis
 */
export const analyzeImageWithGemini = async (imageBase64: string, question: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const base64Data = imageBase64.split(',')[1];
    const mimeType = imageBase64.split(';')[0].split(':')[1];

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
          { text: question }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Image to Prompt
 */
export const generateImagePrompt = async (imageBase64: string, platform: string): Promise<string> => {
    const prompt = `Analyze this image and generate a detailed text prompt that could be used to recreate it using ${platform}. Include details about style, lighting, composition, and subject.`;
    return analyzeImageWithGemini(imageBase64, prompt);
};

/**
 * Chat
 */
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

/**
 * Batch Image Generation
 */
export const generateBatchImages = async (prompt: string, quantity: number): Promise<string[]> => {
  const promises = [];
  for (let i = 0; i < quantity; i++) {
    promises.push(generateImageWithGemini(prompt));
  }
  return Promise.all(promises);
};

export const generateViralThumbnails = async (prompt: string): Promise<string[]> => {
    return generateBatchImages(prompt, 5);
};

/**
 * Games - Puzzles
 */
export const generateEmojiPuzzle = async (): Promise<EmojiPuzzle> => {
    const ai = getAiClient();
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
};

export const generateWordPuzzle = async (): Promise<WordPuzzle> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Generate a difficult vocabulary word with its definition and some distractor words (incorrect spellings or similar looking words).",
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
};

export const generateTwoTruthsPuzzle = async (): Promise<TwoTruthsPuzzle> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Generate 'Two Truths and a Lie' game content about a random interesting topic (History, Science, Nature).",
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    statements: { 
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                isTruth: { type: Type.BOOLEAN }
                            }
                        }
                    }
                },
                required: ['topic', 'explanation', 'statements']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

export const generateRiddlePuzzle = async (): Promise<RiddlePuzzle> => {
    const ai = getAiClient();
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
                    difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard'] }
                },
                required: ['question', 'answer', 'hint', 'difficulty']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

// Alias for RiddleGenerator usage
export const generateRiddleContent = async (topic: string): Promise<RiddleData> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a riddle about: ${topic}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    riddle: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ['topic', 'riddle', 'answer', 'explanation']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Quiz Generator
 */
export const generateQuiz = async (topic: string, count: number, difficulty: string): Promise<QuizData> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a ${count}-question quiz about ${topic}. Difficulty: ${difficulty}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
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
                            },
                            required: ['id', 'question', 'options', 'correctAnswer', 'explanation']
                        }
                    }
                },
                required: ['topic', 'difficulty', 'questions']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Podcast
 */
export const generatePodcastScript = async (topic: string, hostName: string, guestName: string): Promise<PodcastScript> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a short podcast script (approx 2 mins) about ${topic}. Hosts: ${hostName} and ${guestName}. Also suggest a visual prompt for cover art.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    script: { type: Type.STRING, description: "The dialogue text." },
                    visualPrompt: { type: Type.STRING }
                },
                required: ['title', 'script', 'visualPrompt']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Speech
 */
export const generateSpeechWithGemini = async (text: string, voice: string, speed: number, pitch: number, speakers?: {speaker: string, voice: string}[]): Promise<string> => {
    const ai = getAiClient();
    let speechConfig: any = {};
    
    if (speakers && speakers.length > 0) {
        // Multi-speaker config
        speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: speakers.map(s => ({
                    speaker: s.speaker,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } }
                }))
            }
        };
    } else {
        // Single speaker
        speechConfig = {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice }
            }
        };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfig
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            // Convert raw PCM to a playable WAV Blob URL
            return createWavUrl(part.inlineData.data);
        }
    }
    throw new Error("No audio generated");
};

/**
 * Video
 */
export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string): Promise<string> => {
  try {
    const ai = getAiClient();
    let safeAspectRatio = aspectRatio;
    // Veo strictly supports 16:9 or 9:16.
    if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        console.warn(`Aspect ratio ${aspectRatio} not supported by Veo. Defaulting to 16:9.`);
        safeAspectRatio = '16:9';
    }
    
    const config: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: safeAspectRatio 
    };

    const request: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config
    };

    if (imageBase64) {
        request.image = {
          imageBytes: imageBase64.split(',')[1],
          mimeType: 'image/png' 
        };
    }

    let operation = await ai.models.generateVideos(request);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned.");

    // For safety, assume process.env might be missing in some builds, fallback or fail gracefully
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Meme Concept
 */
export const generateMemeConcept = async (topic: string): Promise<MemeData> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a funny meme concept about: ${topic}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topText: { type: Type.STRING },
                    bottomText: { type: Type.STRING },
                    visualPrompt: { type: Type.STRING, description: "Prompt to generate the meme image without text." }
                },
                required: ['topText', 'bottomText', 'visualPrompt']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Social Campaign
 */
export const generateSocialCampaign = async (topic: string, settings: SocialSettings): Promise<SocialCampaign> => {
    const ai = getAiClient();
    
    const platformProperties: any = {};
    settings.platforms.forEach(p => {
        platformProperties[p] = {
            type: Type.OBJECT,
            properties: {
                text: { type: (p === 'twitter' || p === 'threads') ? Type.ARRAY : Type.STRING, ...( (p === 'twitter' || p === 'threads') ? { items: { type: Type.STRING } } : {}) },
                imagePrompt: { type: Type.STRING },
                hashtags: { type: Type.STRING }
            },
            required: ['text', 'imagePrompt']
        };
    });

    // Custom emoji instructions based on settings
    let emojiInstruction = settings.useEmojis ? "Use emojis appropriate for the platform." : "Do NOT use any emojis.";
    if (settings.useEmojis) {
        emojiInstruction = `
        Emoji Guidelines:
        - LinkedIn: Use professional symbols (✅, 📈, 💡). Minimal usage.
        - TikTok/Instagram: Use trending and expressive emojis (✨, 🔥, 😂).
        - Twitter/X: Use concise emojis to save space.
        - General: Match the tone of the content.
        `;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a social media campaign about "${topic}". Tone: ${settings.tone}. Style: ${settings.style}. Language: ${settings.language}. ${emojiInstruction} Platforms: ${settings.platforms.join(', ')}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING },
                    ...platformProperties
                },
                required: ['topic', ...settings.platforms]
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Daily Tip
 */
export const generateDailyTip = async (dayIndex: number): Promise<DailyTip> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a daily tip for Day ${dayIndex}. Category: either 'Prompting' or 'Security'.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    dayIndex: { type: Type.INTEGER },
                    date: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ['Prompting', 'Security'] },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    example: { type: Type.STRING }
                },
                required: ['dayIndex', 'title', 'content', 'category']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Helpful List
 */
export const generateHelpfulList = async (topic: string): Promise<HelpfulList> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a helpful checklist for: ${topic}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING }
                },
                required: ['title', 'description', 'items', 'imagePrompt']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Storybook
 */
export const generateStoryScript = async (concept: string, style: string, charDesc?: string): Promise<StorybookData> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a 4-page story script based on concept: "${concept}". Style: ${style}. ${charDesc ? `Use this character: ${charDesc}` : 'Create a main character.'}
        For each page, provide the text and a detailed image prompt.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    style: { type: Type.STRING },
                    characterDescription: { type: Type.STRING },
                    pages: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                pageNumber: { type: Type.INTEGER },
                                text: { type: Type.STRING },
                                imagePrompt: { type: Type.STRING }
                            },
                            required: ['pageNumber', 'text', 'imagePrompt']
                        }
                    }
                },
                required: ['title', 'style', 'characterDescription', 'pages']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Prompt Analysis
 */
export const analyzePrompt = async (prompt: string, platform: string): Promise<PromptAnalysis> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this prompt for ${platform}: "${prompt}". Provide a score (0-100), strengths, weaknesses, a better version, reasoning, and platform specific advice.`,
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
                },
                required: ['score', 'isOptimal', 'strengths', 'weaknesses', 'suggestion', 'reasoning', 'platformAdvice']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Audio Transcription
 */
export const transcribeAudioWithGemini = async (audioBase64: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();
    const base64Data = audioBase64.split(',')[1];
    
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
                { text: "Transcribe this audio." }
            ]
        }
    });
    return response.text || "";
};

/**
 * Code Generation (Multimodal or Text)
 */
export const generateUiCode = async (prompt: string, device: string, style: string, imageBase64?: string): Promise<string> => {
    const ai = getAiClient();
    const parts: any[] = [];
    
    if (imageBase64) {
        const base64Data = imageBase64.split(',')[1];
        parts.push({
            inlineData: {
                mimeType: 'image/png', 
                data: base64Data
            }
        });
        parts.push({ text: `Generate HTML/Tailwind CSS code that replicates this UI design for ${device}. Style: ${style}. Return ONLY the code.` });
    } else {
        parts.push({ text: `Generate HTML/Tailwind CSS code for a ${device} UI. Description: ${prompt}. Style: ${style}. Return ONLY the code.` });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: { parts }
    });
    
    let code = response.text || "";
    code = code.replace(/```html/g, '').replace(/```/g, '');
    return code;
};

/**
 * Affirmation Generator
 */
export const generateAffirmationPlan = async (topic: string, tone: string): Promise<AffirmationPlan> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a weekly affirmation plan focused on "${topic}". Tone: ${tone}. Include a main "Mantra of the Week" and 7 daily affirmations (Monday to Sunday).`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
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
                            },
                            required: ['day', 'text']
                        }
                    }
                },
                required: ['topic', 'weeklyMantra', 'dailyAffirmations']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * Magic: Hidden Message
 */
export const generateHiddenMessage = async (secret: string, topic: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a coherent paragraph (3-5 sentences) strictly about "${topic}". 
        
        HIDDEN TASK: You must seamlessly embed the secret words "${secret}" into this paragraph.
        The secret words must appear in order, but scattered throughout the text.
        
        CRITICAL: The paragraph must sound completely natural and focused on the topic. 
        Do NOT force the secret message if it makes the sentence weird. Prioritize the cover story.
        
        Mark the secret words with double curly braces {{word}} in the output so I can highlight them later.
        
        Example:
        Secret: "help me"
        Topic: "Cooking"
        Output: "When you {{help}} chop the onions, it saves time. Make sure the {{me}}at is tender."`,
    });
    return response.text || "";
};

/**
 * Brand Identity Generator
 */
export const generateBrandIdentity = async (companyName: string, industry: string, vibe: string): Promise<BrandIdentity> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a comprehensive brand identity for a company named "${companyName}". Industry: ${industry}. Vibe/Values: ${vibe}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    companyName: { type: Type.STRING },
                    missionStatement: { type: Type.STRING },
                    slogan: { type: Type.STRING },
                    brandVoice: { type: Type.STRING },
                    colorPalette: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                hex: { type: Type.STRING }
                            },
                            required: ['name', 'hex']
                        }
                    },
                    fontPairing: {
                        type: Type.OBJECT,
                        properties: {
                            heading: { type: Type.STRING },
                            body: { type: Type.STRING }
                        },
                        required: ['heading', 'body']
                    },
                    logoPrompt: { type: Type.STRING, description: "A detailed prompt to generate a logo for this brand." }
                },
                required: ['companyName', 'missionStatement', 'slogan', 'brandVoice', 'colorPalette', 'fontPairing', 'logoPrompt']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

/**
 * UGC Script Generator
 */
export const generateUGCScript = async (product: string, audience: string, painPoint: string): Promise<UGCScript> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a high-converting User Generated Content (UGC) video script for TikTok/Reels. 
        Product: ${product}. 
        Target Audience: ${audience}. 
        Main Pain Point: ${painPoint}.
        Structure: 
        1. Hook (Stop the scroll)
        2. Problem/Agitation (Relatable pain)
        3. Solution (Introduce product)
        4. Social Proof/Benefits (Why it works)
        5. Call to Action (What to do next)
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
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
                                visual: { type: Type.STRING, description: "Visual description of what happens on screen." },
                                audio: { type: Type.STRING, description: "Spoken words or sound effects." },
                                duration: { type: Type.STRING }
                            },
                            required: ['section', 'visual', 'audio', 'duration']
                        }
                    }
                },
                required: ['title', 'targetAudience', 'totalDuration', 'sections']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};
