
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
  PromptTrainer = 'PROMPT_TRAINER',
  Academy = 'ACADEMY',
  AssistantCreator = 'ASSISTANT_CREATOR',
  ListCreator = 'LIST_CREATOR',
  Podcast = 'PODCAST',
  ImageToPrompt = 'IMAGE_TO_PROMPT',
  QuizGenerator = 'QUIZ_GENERATOR',
  RiddleGenerator = 'RIDDLE_GENERATOR',
  SoundFX = 'SOUND_FX',
  AudioTranscriber = 'AUDIO_TRANSCRIBER',
  Heritage = 'HERITAGE',
  MockupDesigner = 'MOCKUP_DESIGNER',
  AffirmationGenerator = 'AFFIRMATION_GENERATOR',
  VideoGenerator = 'VIDEO_GENERATOR',
  Copywriter = 'COPYWRITER',
  Magic = 'MAGIC',
  Cipher = 'CIPHER',
  BrandCollateral = 'BRAND_COLLATERAL',
  UGCAds = 'UGC_ADS',
  LiveNotetaker = 'LIVE_NOTETAKER',
  SecurityBox = 'SECURITY_BOX',
  Studio = 'STUDIO',
  Poetry = 'POETRY',
  DailyJoke = 'DAILY_JOKE',
  Quotes = 'QUOTES',
  Connections = 'CONNECTIONS',
  WealthCalculator = 'WEALTH_CALCULATOR',
  Learner = 'LEARNER',
  CommercialReview = 'COMMERCIAL_REVIEW',
  MeetingBooker = 'MEETING_BOOKER',
  BabyNames = 'BABY_NAMES'
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
  // hint?: string; // Optional if you decide to add hints later
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

export interface DailyTip {
  dayIndex: number;
  date: string;
  category: 'Prompting' | 'Security';
  title: string;
  content: string;
  example?: string;
}

export interface HelpfulList {
  title: string;
  description: string;
  items: string[];
  imagePrompt: string;
}

export interface PodcastScript {
  title: string;
  script: string; // The formatted script for TTS
  visualPrompt: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizData {
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
}

export interface RiddleData {
  topic: string;
  riddle: string;
  answer: string;
  explanation: string;
}

export interface AffirmationPlan {
  topic: string;
  weeklyMantra: string;
  dailyAffirmations: { day: string; text: string }[];
}

export interface BrandIdentity {
  companyName: string;
  missionStatement: string;
  slogan: string;
  colorPalette: { name: string; hex: string }[];
  fontPairing: { heading: string; body: string };
  logoPrompt: string;
  brandVoice: string;
  // Template Prompts
  stationaryPrompt: string;
  pptTemplatePrompt: string;
  calendarPrompt: string;
}

export interface UGCSection {
  section: string; // Hook, Pain Point, etc.
  visual: string;
  audio: string;
  duration: string;
}

export interface UGCScript {
  title: string;
  targetAudience: string;
  totalDuration: string;
  sections: UGCSection[];
}

export interface WealthAnalysis {
  personName: string;
  estimatedNetWorth: string;
  originStart: string; // "Wealthy", "Middle Class", "Poverty"
  privilegeAnalysis: string; // Description of family wealth/connections
  keySuccessFactors: string[];
  actionableSteps: string[]; // Steps for a normal person
  realityCheck: string; // The "gap" between them and us
}

export interface CommercialAnalysis {
  title: string;
  marketPotential: string;
  monetizationStrategies: string[];
  targetIndustries: string[];
  commercialHurdles: string[];
  elevatorPitch: string;
}

export interface BabyName {
  name: string;
  gender: string;
  origin: string;
  meaning: string;
  lineage: string; // Historical context
  reason: string; // Why it was suggested
}

export interface LearnerBrief {
  summary: string; // Bulleted summary
  podcastScript: string; // Script for TTS
}
