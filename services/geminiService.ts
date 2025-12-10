
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { 
  MemeData, QuizData, RiddleData, StorybookData, SocialSettings, 
  SocialCampaign, PromptAnalysis, DailyTip, HelpfulList, PodcastScript,
  EmojiPuzzle, WordPuzzle, TwoTruthsPuzzle, RiddlePuzzle, AffirmationPlan,
  BrandIdentity, UGCScript, WealthAnalysis, CommercialAnalysis, BabyName, LearnerBrief,
  AI360Response, DreamAnalysis, CarouselData
} from "../types";
import { runSecurityChecks, sanitizeInput } from "../utils/security";

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
  if (msg.includes("API key not valid") || code === 403 || code === 400) { 
     throw new Error("Invalid API Key or Bad Request. Please check your settings.");
  }
  
  // Pass through security errors
  if (msg.includes("Security Alert") || msg.includes("Rate Limit") || msg.includes("Safety Alert")) {
      throw new Error(msg);
  }
  
  throw new Error(msg);
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: cleanPrompt,
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
    // SECURITY CHECKS
    const cleanPrompt = sanitizeInput(prompt);
    runSecurityChecks(cleanPrompt, "Image Prompt");

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: cleanPrompt }] },
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
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Image Editing
 */
export const editImageWithGemini = async (imageBase64: string, prompt: string): Promise<string> => {
  try {
    const cleanPrompt = sanitizeInput(prompt);
    runSecurityChecks(cleanPrompt, "Edit Prompt");

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
  } catch (error) {
    handleGeminiError(error);
  }
};

/**
 * Visual QA / Image Analysis
 */
export const analyzeImageWithGemini = async (imageBase64: string, question: string): Promise<string> => {
  try {
    const cleanQuestion = sanitizeInput(question);
    runSecurityChecks(cleanQuestion, "Question");

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
          { text: cleanQuestion }
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
    const cleanPlatform = sanitizeInput(platform); 
    const prompt = `Analyze this image and generate a detailed text prompt that could be used to recreate it using ${cleanPlatform}. Include details about style, lighting, composition, and subject.`;
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
    runSecurityChecks("Generate Word Puzzle", "System");
    const ai = getAiClient();
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
};

export const generateTwoTruthsPuzzle = async (): Promise<TwoTruthsPuzzle> => {
    runSecurityChecks("Generate Two Truths", "System");
    const ai = getAiClient();
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
};

export const generateRiddlePuzzle = async (): Promise<RiddlePuzzle> => {
    runSecurityChecks("Generate Riddle", "System");
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
                    difficulty: { type: Type.STRING }
                },
                required: ['question', 'answer', 'hint', 'difficulty']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};

// Adding new method for Carousel
export const generateCarouselContent = async (topic: string, count: number, authorHandle: string): Promise<CarouselData> => {
  const cleanTopic = sanitizeInput(topic);
  runSecurityChecks(cleanTopic, "Carousel Topic");

  const ai = getAiClient();
  const prompt = `Create a ${count}-slide LinkedIn carousel content about: "${cleanTopic}".
  
  Structure:
  - Slide 1: Powerful Hook/Title.
  - Middle Slides: Key points, actionable advice, or steps.
  - Last Slide: Conclusion and Call to Action (CTA).
  
  Output JSON format. Each slide must have a 'title' (short headline), 'content' (main body text, keep it concise and punchy for slides), and 'type' ('intro', 'content', 'outro').
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          authorHandle: { type: Type.STRING, description: "The provided author handle" },
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
  // Ensure author handle is passed through or set default
  data.authorHandle = authorHandle || data.authorHandle || "@YourHandle";
  return data;
};

export const transcribeMediaWithGemini = async (mediaBase64: string, mimeType: string): Promise<string> => {
    runSecurityChecks("Transcribe Media", "System");
    const ai = getAiClient();
    const base64Data = mediaBase64.split(',')[1];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: base64Data } },
                { text: "Transcribe the audio from this media file accurately. Identify speakers if possible. Ignore silence." }
            ]
        }
    });
    return response.text || "No transcription generated.";
};

export const generateVideoWithGemini = async (prompt: string, aspectRatio: string = '16:9', imageBase64?: string): Promise<string> => {
    const ai = getAiClient();
    
    let operation;
    
    if (imageBase64) {
        const base64Data = imageBase64.split(',')[1];
        const mimeType = imageBase64.split(';')[0].split(':')[1];
        
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: base64Data,
                mimeType: mimeType
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio as any
            }
        });
    } else {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio as any
            }
        });
    }

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed.");
    
    return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const generateSpeechWithGemini = async (text: string, voiceName: string, speed: number = 1.0, pitch: number = 0, multiSpeaker?: any): Promise<string> => {
    const ai = getAiClient();
    
    let config: any = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {}
    };

    if (multiSpeaker) {
        config.speechConfig.multiSpeakerVoiceConfig = {
            speakerVoiceConfigs: multiSpeaker.map((s: any) => ({
                speaker: s.speaker,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } }
            }))
        };
    } else {
        config.speechConfig.voiceConfig = {
            prebuiltVoiceConfig: { voiceName: voiceName }
        };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: config
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed");
    
    return `data:audio/wav;base64,${base64Audio}`; 
};

export const generateCalendarThemeImage = async (month: string, style: string): Promise<string> => {
    const cleanStyle = sanitizeInput(style);
    let prompt = "";
    
    if (cleanStyle.toLowerCase().includes("claymation")) {
        prompt = `A cute, high-quality claymation scene for the month of ${month}. Soft rounded clay textures, plasticine style, bright pastel colors, stop-motion aesthetic, miniature world feel.`;
    } else if (cleanStyle.toLowerCase().includes("cyberpunk")) {
        prompt = `Futuristic cyberpunk cityscape for the month of ${month}. Neon lights, dark atmosphere, glowing calendar grid holograms, high tech, cinematic.`;
    } else if (cleanStyle.toLowerCase().includes("watercolor")) {
        prompt = `Beautiful soft watercolor painting for ${month}. Artistic, flowing colors, paper texture visible, gentle seasonal theme.`;
    } else {
        prompt = `Artistic header image for a calendar representing ${month}. Style: ${cleanStyle}. High quality, aesthetic.`;
    }

    return generateImageWithGemini(prompt, '16:9');
};

export const generateDailyTip = async (dayIndex: number): Promise<DailyTip> => {
    return {
        dayIndex,
        date: new Date().toISOString(),
        category: 'Prompting',
        title: 'Tip Title',
        content: 'Tip Content'
    };
};

export const generateSocialCampaign = async (topic: string, settings: SocialSettings): Promise<SocialCampaign> => {
    return { topic: topic };
};

export const generateMemeConcept = async (topic: string): Promise<MemeData> => {
    return { topText: '', bottomText: '', visualPrompt: '' };
};

export const generateHelpfulList = async (topic: string): Promise<HelpfulList> => {
    return { title: '', description: '', items: [], imagePrompt: '' };
};

export const generatePodcastScript = async (topic: string, host: string, guest: string): Promise<PodcastScript> => {
    return { title: '', script: '', visualPrompt: '' };
};

export const generateQuiz = async (topic: string, count: number, diff: string): Promise<QuizData> => {
    return { topic, difficulty: diff, questions: [] };
};

export const generateRiddleContent = async (topic: string): Promise<RiddleData> => {
    return { topic, riddle: '', answer: '', explanation: '' };
};

export const generateBrandIdentity = async (name: string, industry: string, vibe: string, personality: string, colors: string, fonts: string): Promise<BrandIdentity> => {
    return {} as BrandIdentity;
};

export const regenerateBrandPalette = async (data: BrandIdentity): Promise<BrandIdentity> => { return data; };
export const regenerateBrandTypography = async (data: BrandIdentity): Promise<BrandIdentity> => { return data; };
export const generateUiCode = async (prompt: string, device: string, style: string, img: string): Promise<string> => { return ""; };
export const generateAffirmationPlan = async (topic: string, tone: string): Promise<AffirmationPlan> => { return {} as AffirmationPlan; };
export const generateUGCScript = async (prod: string, aud: string, pain: string): Promise<UGCScript> => { return {} as UGCScript; };
export const analyzeWealthPath = async (name: string): Promise<WealthAnalysis> => { return {} as WealthAnalysis; };
export const generateLearnerBrief = async (text: string): Promise<LearnerBrief> => { return {} as LearnerBrief; };
export const analyzePaperCommercial = async (text: string): Promise<CommercialAnalysis> => { return {} as CommercialAnalysis; };
export const generateBabyNames = async (g: string, s: string, o: string, i: boolean): Promise<BabyName[]> => { return []; };
export const generateStoryScript = async (c: string, s: string, d?: string): Promise<StorybookData> => { return {} as StorybookData; };
export const generateHiddenMessage = async (s: string, c: string): Promise<string> => { return ""; };
export const analyzePrompt = async (p: string, t: string): Promise<PromptAnalysis> => { return {} as PromptAnalysis; };
export const generatePoem = async (topic: string, style: string): Promise<string> => {
  const cleanTopic = sanitizeInput(topic);
  runSecurityChecks(cleanTopic, "Poem Topic");

  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Write a poem about "${cleanTopic}" in the style of ${style}.`
  });
  return response.text || "";
};
export const generateDailyJoke = async (d: number): Promise<string> => { return ""; };
export const generateQuote = async (c: string): Promise<string> => { return ""; };
export const generateConnectionFact = async (p: string): Promise<string> => { return ""; };
export const generate3DOrchestration = async (p: string, i?: string): Promise<AI360Response> => { return {} as AI360Response; };
export const analyzeDream = async (d: string, l: string): Promise<DreamAnalysis> => { return {} as DreamAnalysis; };
