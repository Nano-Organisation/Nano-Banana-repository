
export enum ToolId {
  Dashboard = 'DASHBOARD',
  UserProfile = 'USER_PROFILE', // Added for User Dashboard
  ImageEditor = 'IMAGE_EDITOR',
  ImageGenerator = 'IMAGE_GENERATOR',
  VisualQA = 'VISUAL_QA',
  Summarizer = 'SUMMARIZER',
  StoryTeller = 'STORY_TELLER',
  CodeAssistant = 'CODE_ASSISTANT',
  Chat = 'CHAT',
  Design = 'DESIGN',
  Tutor = 'TUTOR',
  GAMES = 'GAMES',
  BackgroundRemover = 'BACKGROUND_REMOVER',
  DocTool = 'DOC_TOOL',
  GifGenerator = 'GIF_GENERATOR',
  SoundGenerator = 'SOUND_GENERATOR',
  Pinterest = 'PINTEREST',
  YouTubeThumbnail = 'YOUTUBE_THUMBNAIL',
  Storybook = 'STORYBOOK',
  StorybookLarge = 'STORYBOOK_LARGE',
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
  BabyNames = 'BABY_NAMES',
  AetherEdit = 'AETHER_EDIT',
  AI360 = 'AI_360',
  DreamInterpreter = 'DREAM_INTERPRETER',
  LinkedInCarousel = 'LINKEDIN_CAROUSEL',
  CalendarCreator = 'CALENDAR_CREATOR',
  AIMimicry = 'AI_MIMICRY',
  DesignCritic = 'DESIGN_CRITIC',
  ComicStrip = 'COMIC_STRIP',
  BabyVisionTransformer = 'BABY_VISION_TRANSFORMER',
  BabyDebates = 'BABY_DEBATES',
  ImagesToMovie = 'IMAGES_TO_MOVIE',
  StyleEngine = 'STYLE_ENGINE',
  NurseryRhymes = 'NURSERY_RHYMES',
  VideoCaptioner = 'VIDEO_CAPTIONER'
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
  isThinking?: boolean;
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
  imageUrl?: string;
  isAttireChange?: boolean;
  timeOfDay?: string;
  wardrobeItemId?: string;
  charactersPresent?: string[];
  locationId?: string;
  environmentDescription?: string;
  stageDirections?: string;
}

export interface StorybookData {
  title: string;
  style: string;
  characterName: string;
  characterDescription: string;
  author: string;
  authorImage?: string;
  dedication: string;
  authorBio: string;
  backCoverBlurb: string;
  pages: StoryPage[];
  wardrobeManifest?: { id: string; description: string }[];
  castingSheet?: { id: string; description: string }[];
  propManifest?: { id: string; description: string }[];
}

export interface RhymeData {
  title: string;
  panels: {
    lyrics: string;
    imagePrompt: string;
    imageUrl?: string;
  }[];
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
  text: string | string[];
  imagePrompt: string;
  hashtags?: string;
}

export type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'youtube_shorts' | 'threads' | 'pinterest';

export interface SocialSettings {
  platforms: SocialPlatform[];
  tone: string;
  style: string;
  language: string;
  useEmojis: boolean;
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

export interface PromptAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
  reasoning: string;
  platformAdvice: string;
  isOptimal: boolean;
}

export interface DailyTip {
  dayIndex: number;
  title: string;
  content: string;
  category: string;
  example: string;
}

export interface HelpfulList {
  title: string;
  description: string;
  items: string[];
  imagePrompt: string;
}

export interface PodcastScript {
  title: string;
  script: string;
  visualPrompt: string;
}

export interface QuizQuestion {
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
  riddle: string;
  answer: string;
  explanation: string;
}

export interface AffirmationItem {
  day: string;
  text: string;
}

export interface AffirmationPlan {
  topic: string;
  weeklyMantra: string;
  dailyAffirmations: AffirmationItem[];
}

export interface BrandColor {
  name: string;
  hex: string;
}

export interface BrandIdentity {
  companyName: string;
  slogan: string;
  missionStatement: string;
  colorPalette: BrandColor[];
  fontPairing: { heading: string; body: string };
  logoPrompt: string;
  brandVoice: string;
  stationaryPrompt: string;
  pptTemplatePrompt: string;
  calendarPrompt: string;
}

export interface UGCScriptSection {
  section: string;
  visual: string;
  audio: string;
  duration: string;
}

export interface UGCScript {
  title: string;
  targetAudience: string;
  totalDuration: string;
  sections: UGCScriptSection[];
}

export interface WealthAnalysis {
  personName: string;
  estimatedNetWorth: string;
  originStart: string;
  privilegeAnalysis: string;
  keySuccessFactors: string[];
  actionableSteps: string[];
  realityCheck: string;
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
  meaning: string;
  origin: string;
  reason: string;
  gender: string;
  lineage: string;
}

export interface LearnerBrief {
  summary: string;
  podcastScript: string;
}

export interface AI360Response {
  status: 'accepted' | 'rejected' | 'needs_clarification';
  reason: string;
  safety_categories: string[];
  generation_prompt?: string;
  clarification_question?: string;
}

export interface CarouselSlide {
  title: string;
  content: string;
  type: 'intro' | 'content' | 'outro';
}

export interface CarouselData {
  topic: string;
  authorHandle?: string;
  slides: CarouselSlide[];
}

export interface DreamAnalysis {
  interpretation: string;
  symbols: string[];
  visualPrompt: string;
}

export interface PetProfile {
  name: string;
  personality: string;
  jobTitle: string;
  quote: string;
  visualPrompt: string;
}

export interface BabyDebateScriptLine {
  speaker: string;
  text: string;
}

export interface BabyDebateParticipant {
  name: string;
  tone: string;
  image?: string;
}

export interface BabyDebateScript {
  topic: string;
  scriptLines: BabyDebateScriptLine[];
  visualContext: string;
  safeCharacterDescriptions: { name: string; description: string }[];
  participants: BabyDebateParticipant[];
}

export interface UserDefinedStyle {
  id: string;
  version: number;
  name: string;
  concept: string;
  rules: {
    rendering: string;
    colors: string;
    composition: string;
    world: string;
    negative: string;
  };
  referenceImages: string[];
  styleBlock: string;
  createdAt: string;
  thumbnail?: string;
}

export interface CaptionBlock {
  id: string;
  start: number;
  end: number;
  text: string;
}
