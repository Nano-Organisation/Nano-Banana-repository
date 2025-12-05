
export enum ToolId {
  Dashboard = 'DASHBOARD',
  ImageEditor = 'IMAGE_EDITOR',
  ImageGenerator = 'IMAGE_GENERATOR',
  VisualQA = 'VISUAL_QA',
  Summarizer = 'SUMMARIZER',
  StoryTeller = 'STORY_TELLER',
  CodeAssistant = 'CODE_ASSISTANT',
  Chat = 'CHAT',
  Design = 'DESIGN',
  Tutor = 'TUTOR',
  Games = 'GAMES',
  BackgroundRemover = 'BACKGROUND_REMOVER',
  DocTool = 'DOC_TOOL',
  GifGenerator = 'GIF_GENERATOR',
  SoundGenerator = 'SOUND_GENERATOR',
  Pinterest = 'PINTEREST',
  YouTubeThumbnail = 'YOUTUBE_THUMBNAIL',
  Storybook = 'STORYBOOK',
  Live = 'LIVE',
  Meme = 'MEME',
  AutomationHub = 'AUTOMATION_HUB',
  Social = 'SOCIAL',
  PromptTrainer = 'PROMPT_TRAINER'
}

export interface ToolConfig {
  id: ToolId;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
  feedback?: 'up' | 'down';
  isThinking?: boolean; // Visual indicator for thinking models
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface EmojiPuzzle {
  emojis: string;
  answer: string;
  category: string;
}

export interface WordPuzzle {
  word: string;
  definition: string;
  distractors: string[];
}

export interface TwoTruthsPuzzle {
  statements: { text: string; isTruth: boolean }[];
  topic: string;
  explanation: string;
}

export interface RiddlePuzzle {
  question: string;
  answer: string;
  hint: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string; // Populated after image generation
}

export interface StorybookData {
  title: string;
  style: string;
  characterDescription: string;
  pages: StoryPage[];
}

export interface SavedCharacter {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
}

export interface MemeData {
  topText: string;
  bottomText: string;
  visualPrompt: string;
}

export interface SocialPostContent {
  text: string | string[]; // Array for threads
  imagePrompt: string;
  hashtags?: string;
}

export interface SocialCampaign {
  topic: string;
  linkedin?: SocialPostContent;
  twitter?: SocialPostContent;
  instagram?: SocialPostContent;
  facebook?: SocialPostContent;
  tiktok?: SocialPostContent;
  youtube_shorts?: SocialPostContent;
  threads?: SocialPostContent;
  pinterest?: SocialPostContent;
}

export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'youtube_shorts' | 'threads' | 'pinterest';

export interface SocialSettings {
  platforms: SocialPlatform[];
  tone: string;
  style: string;
  language: string;
  useEmojis: boolean;
}

export interface PromptAnalysis {
  score: number;
  isOptimal: boolean;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
  reasoning: string;
  platformAdvice: string;
}
