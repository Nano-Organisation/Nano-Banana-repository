import React, { useState, useEffect } from 'react';
import { ToolId } from './types';
import Layout from './components/Layout';
import LoginGate from './components/LoginGate';
import ImageEditor from './components/tools/ImageEditor';
import ImageGenerator from './components/tools/ImageGenerator';
import VisualQA from './components/tools/VisualQA';
import TextTool from './components/tools/TextTool';
import ChatInterface from './components/tools/ChatInterface';
import DesignTool from './components/tools/DesignTool';
import GamesTool from './components/tools/GamesTool';
import BackgroundRemover from './components/tools/BackgroundRemover';
import DocTool from './components/tools/DocTool';
import CodeHub from './components/tools/CodeHub';
import GifGenerator from './components/tools/GifGenerator';
import SoundGenerator from './components/tools/SoundGenerator';
import PinterestTool from './components/tools/PinterestTool';
import ThumbnailTool from './components/tools/ThumbnailTool';
import StorybookTool from './components/tools/StorybookTool';
import LiveTool from './components/tools/LiveTool';
import MemeGenerator from './components/tools/MemeGenerator';
import AutomationHub from './components/tools/AutomationHub';
import SocialTool from './components/tools/SocialTool';
import PromptTrainer from './components/tools/PromptTrainer';
import PromptAcademy from './components/tools/PromptAcademy';
import AssistantCreator from './components/tools/AssistantCreator';
import ListCreator from './components/tools/ListCreator';
import PodcastTool from './components/tools/PodcastTool';
import ImageToPrompt from './components/tools/ImageToPrompt';
import QuizGenerator from './components/tools/QuizGenerator';
import RiddleGenerator from './components/tools/RiddleGenerator';
import SoundFXTool from './components/tools/SoundFXTool';
import AudioTranscriber from './components/tools/AudioTranscriber';
import HeritageTool from './components/tools/HeritageTool';
import MockupDesigner from './components/tools/MockupDesigner';
import AffirmationGenerator from './components/tools/AffirmationGenerator';
import VideoGenerator from './components/tools/VideoGenerator';
import CopywriterTool from './components/tools/CopywriterTool';
import MagicTool from './components/tools/MagicTool';
import CipherTool from './components/tools/CipherTool';
import BrandCollateralTool from './components/tools/BrandCollateralTool';
import UGCAdsTool from './components/tools/UGCAdsTool';
import LiveNotetaker from './components/tools/LiveNotetaker';
import StudioTool from './components/tools/StudioTool';
import PoetryTool from './components/tools/PoetryTool';
import DailyJokeTool from './components/tools/DailyJokeTool';
import QuoteTool from './components/tools/QuoteTool';
import ConnectionsTool from './components/tools/ConnectionsTool';
import WealthCalculator from './components/tools/WealthCalculator';
import LearnerTool from './components/tools/LearnerTool';
import CommercialReviewTool from './components/tools/CommercialReviewTool';
import MeetingBooker from './components/tools/MeetingBooker';
import BabyNameTool from './components/tools/BabyNameTool';
import AetherEditTool from './components/tools/AetherEditTool';
import AI360Tool from './components/tools/AI360Tool';
import CarouselMaker from './components/tools/CarouselMaker';
import CalendarCreator from './components/tools/CalendarCreator';
import AIMimicryTool from './components/tools/AIMimicryTool';
import DesignCritic from './components/tools/DesignCritic';
import ComicStripTool from './components/tools/ComicStripTool';
import BabyVisionTransformer from './components/tools/BabyVisionTransformer';
import BabyDebates from './components/tools/BabyDebates';
import ImagesToMovie from './components/tools/ImagesToMovie';
import StyleForge from './components/tools/StyleForge';
import NurseryRhymesTool from './components/tools/NurseryRhymesTool';
import CaptionCreator from './components/tools/CaptionCreator';

import { 
  Sparkles, MessageSquare, MonitorPlay, Users, Stars, Grid, Copy as CopyIcon, 
  Calendar, GalleryHorizontal, AlertCircle, Box, Clapperboard, BookOpen, 
  DollarSign, CalendarCheck, Baby, ClipboardList, Briefcase, Video, Lock, 
  Wand2, Pen, Heart, Shield, FileAudio, Radio, Layout as LayoutIcon, Feather, 
  Laugh, Quote, Network, Scan, FileQuestion, Lightbulb, Mic2, UserPlus, 
  ListChecks, BookMarked, Brain, Activity, Share2, Youtube, Pin, Film, 
  Volume2, Eraser, FileType, Terminal, FileText, Image as ImageIcon, Palette, 
  Eye, Code, Search, X, Gamepad2, GraduationCap, PenTool, Bot, FlaskConical,
  Key, Music, Type
} from 'lucide-react';

const SHADOW_COLORS: Record<string, string> = {
  green: 'rgba(34, 197, 94, 0.4)',
  teal: 'rgba(20, 184, 166, 0.4)',
  pink: 'rgba(236, 72, 153, 0.4)',
  indigo: 'rgba(99, 102, 241, 0.4)',
  blue: 'rgba(59, 130, 246, 0.4)',
  yellow: 'rgba(234, 179, 8, 0.4)',
  amber: 'rgba(245, 158, 11, 0.4)',
  red: 'rgba(239, 68, 68, 0.4)',
  orange: 'rgba(249, 115, 22, 0.4)',
  rose: 'rgba(244, 63, 94, 0.4)',
  sky: 'rgba(14, 165, 233, 0.4)',
  purple: 'rgba(168, 85, 247, 0.4)',
  fuchsia: 'rgba(217, 70, 239, 0.4)',
  cyan: 'rgba(6, 182, 212, 0.4)',
  violet: 'rgba(139, 92, 246, 0.4)',
  lime: 'rgba(132, 204, 22, 0.4)',
  emerald: 'rgba(16, 185, 129, 0.4)',
  slate: 'rgba(100, 116, 139, 0.4)'
};

const TOOLS = [
  { id: ToolId.Chat, title: "AI Chat", description: "Conversational AI assistant for general queries.", icon: MessageSquare, color: "green", gradient: "from-green-500 to-emerald-600" },
  { id: ToolId.VideoCaptioner, title: "AI Captions", description: "Auto-generate viral timed captions with emojis and animations.", icon: Type, color: "blue", gradient: "from-blue-500 to-indigo-600", releaseDate: '2025-12-21' },
  { id: ToolId.NurseryRhymes, title: "AI Nursery Rhymes", description: "Visualize classic nursery rhymes with beautiful AI art.", icon: Music, color: "pink", gradient: "from-pink-400 to-rose-500", releaseDate: '2025-12-20' },
  { id: ToolId.StyleEngine, title: "AI Style Forge", description: "Create, name, and reuse your own visual recipes for consistent art.", icon: FlaskConical, color: "indigo", gradient: "from-indigo-600 to-violet-700", releaseDate: '2025-12-19' },
  { id: ToolId.ImagesToMovie, title: "AI Images to movie", description: "Turn a collection of photos into a cinematic movie sequence.", icon: Clapperboard, color: "amber", gradient: "from-amber-400 to-orange-600", releaseDate: '2025-12-18' },
  { id: ToolId.BabyDebates, title: "AI Baby Debates", description: "Generate talking baby videos of famous people with scripts.", icon: Users, color: "sky", gradient: "from-sky-400 to-blue-600", releaseDate: '2025-12-17' },
  { id: ToolId.BabyVisionTransformer, title: "AI Baby Transformer", description: "Turn YouTube Shorts characters into baby versions.", icon: Stars, color: "pink", gradient: "from-pink-500 to-rose-600", releaseDate: '2025-12-16' },
  { id: ToolId.ComicStrip, title: "AI Comic Strip", description: "Turn photos into 4-panel comic narratives.", icon: Grid, color: "yellow", gradient: "from-yellow-500 to-orange-500", releaseDate: '2025-12-15' },
  { id: ToolId.AIMimicry, title: "AI Mimicry", description: "Intricate video mimicry with hallucination modes.", icon: CopyIcon, color: "fuchsia", gradient: "from-fuchsia-600 to-purple-700", releaseDate: '2025-12-13' },
  { id: ToolId.CalendarCreator, title: "AI Calendar", description: "Design custom calendars with unique themes like Claymation.", icon: Calendar, color: "indigo", gradient: "from-indigo-500 to-blue-600", releaseDate: '2025-12-12' },
  { id: ToolId.LinkedInCarousel, title: "AI Carousel", description: "Create viral LinkedIn carousels from any topic.", icon: GalleryHorizontal, color: "blue", gradient: "from-blue-600 to-sky-600", releaseDate: '2025-12-11' },
  { id: ToolId.DesignCritic, title: "AI Design Critic", description: "Get brutal or constructive feedback on your UI/UX.", icon: AlertCircle, color: "red", gradient: "from-red-500 to-rose-600", releaseDate: '2025-12-14' },
  { id: ToolId.AI360, title: "AI 360", description: "3D-GEN Orchestrator for structured 3D prompts.", icon: Box, color: "blue", gradient: "from-blue-600 to-indigo-700", releaseDate: '2025-12-10' },
  { id: ToolId.AetherEdit, title: "AI AetherEdit", description: "AI-Powered Video & Sound Editor with real-time effects.", icon: Clapperboard, color: "cyan", gradient: "from-cyan-500 to-blue-600", releaseDate: '2025-12-10' },
  { id: ToolId.Learner, title: "AI Learner", description: "Summarize papers and turn them into podcasts.", icon: BookOpen, color: "emerald", gradient: "from-emerald-500 to-green-600", releaseDate: '2025-12-09' },
  { id: ToolId.CommercialReview, title: "AI Commercial", description: "Analyze research papers for market viability.", icon: DollarSign, color: "blue", gradient: "from-blue-600 to-indigo-700", releaseDate: '2025-12-09' },
  { id: ToolId.MeetingBooker, title: "AI Meet", description: "Book meetings without storing any data.", icon: CalendarCheck, color: "cyan", gradient: "from-cyan-500 to-sky-600", releaseDate: '2025-12-09' },
  { id: ToolId.BabyNames, title: "AI Names", description: "Suggest or invent names with deep lineage.", icon: Baby, color: "pink", gradient: "from-pink-400 to-rose-500", releaseDate: '2025-12-09' },
  { id: ToolId.LiveNotetaker, title: "AI Note Taker", description: "Live dictation with auto-summarization.", icon: ClipboardList, color: "teal", gradient: "from-teal-500 to-cyan-600", releaseDate: '2025-12-07' },
  { id: ToolId.BrandCollateral, title: "AI Brand", description: "Generate complete brand kits and logos.", icon: Briefcase, color: "orange", gradient: "from-orange-500 to-amber-600", releaseDate: '2025-12-07' },
  { id: ToolId.UGCAds, title: "AI UGC", description: "Create viral scripts for TikTok and Reels.", icon: Video, color: "pink", gradient: "from-pink-500 to-rose-600", releaseDate: '2025-12-07' },
  { id: ToolId.Cipher, title: "AI Cipher", description: "Learn encryption and play code-breaking games.", icon: Lock, color: "sky", gradient: "from-sky-500 to-indigo-600", releaseDate: '2025-12-07' },
  { id: ToolId.Magic, title: "AI Magic", description: "Create dancing text effects and hidden secret messages.", icon: Wand2, color: "indigo", gradient: "from-indigo-500 to-purple-600", releaseDate: '2025-12-07' },
  { id: ToolId.VideoGenerator, title: "AI Video", description: "Pro-grade video generation powered by Veo.", icon: Video, color: "red", gradient: "from-red-600 to-rose-700", releaseDate: '2025-12-07' },
  { id: ToolId.Copywriter, title: "AI Copy", description: "Professional copywriter for blogs, ads, and emails.", icon: Pen, color: "emerald", gradient: "from-emerald-500 to-teal-600", releaseDate: '2025-12-07' },
  { id: ToolId.AffirmationGenerator, title: "AI Affirmations", description: "Generate a weekly affirmation plan for positivity.", icon: Heart, color: "teal", gradient: "from-teal-500 to-emerald-600", releaseDate: '2025-12-07' },
  { id: ToolId.Heritage, title: "AI Heritage", description: "Design coats of arms, signet rings, and authentic tartan.", icon: Shield, color: "amber", gradient: "from-amber-600 to-orange-700", releaseDate: '2025-12-07' },
  { id: ToolId.AudioTranscriber, title: "AI Media Scribe", description: "Accurately transcribe audio and video files to text.", icon: FileAudio, color: "sky", gradient: "from-sky-500 to-blue-600", releaseDate: '2025-12-07' },
  { id: ToolId.SoundFX, title: "AI FX", description: "Generate sound effects and audio-visualizers.", icon: Radio, color: "rose", gradient: "from-rose-500 to-red-600", releaseDate: '2025-12-06' },
  { id: ToolId.MockupDesigner, title: "AI Mockup", description: "Create high-fidelity UI designs for apps & websites.", icon: LayoutIcon, color: "fuchsia", gradient: "from-fuchsia-500 to-purple-600", releaseDate: '2025-12-07' },
  { id: ToolId.Poetry, title: "AI Poetry", description: "Generate poetry in any style, from Haiku to Sonnet.", icon: Feather, color: "fuchsia", gradient: "from-fuchsia-500 to-pink-600", releaseDate: '2025-12-08' },
  { id: ToolId.DailyJoke, title: "AI Jokes", description: "Get your unique AI-generated joke of the day.", icon: Laugh, color: "yellow", gradient: "from-yellow-400 to-amber-500", releaseDate: '2025-12-08' },
  { id: ToolId.Quotes, title: "AI Quotes", description: "Find inspiration with famous quotes on any topic.", icon: Quote, color: "cyan", gradient: "from-cyan-500 to-blue-500", releaseDate: '2025-12-08' },
  { id: ToolId.Connections, title: "AI Connections", description: "Discover surprising links between famous people.", icon: Network, color: "violet", gradient: "from-violet-500 to-purple-600", releaseDate: '2025-12-08' },
  { id: ToolId.WealthCalculator, title: "AI Wealth Path", description: "Analyze how the rich got rich and how to emulate them.", icon: DollarSign, color: "green", gradient: "from-green-600 to-emerald-700", releaseDate: '2025-12-08' },
  { id: ToolId.ImageToPrompt, title: "AI Vision", description: "Convert images to text descriptions or prompts.", icon: Scan, color: "fuchsia", gradient: "from-pink-500 to-purple-600", releaseDate: '2025-12-06' },
  { id: ToolId.QuizGenerator, title: "AI Quiz", description: "Generate quizzes on any topic instantly.", icon: FileQuestion, color: "indigo", gradient: "from-indigo-500 to-blue-600", releaseDate: '2025-12-06' },
  { id: ToolId.RiddleGenerator, title: "AI Riddle", description: "Generate clever riddles on any subject.", icon: Lightbulb, color: "amber", gradient: "from-amber-400 to-orange-500", releaseDate: '2025-12-06' },
  { id: ToolId.Podcast, title: "AI Cast", description: "Generate multi-speaker audio podcasts from any topic.", icon: Mic2, color: "indigo", gradient: "from-indigo-500 to-violet-600", releaseDate: '2025-12-05' },
  { id: ToolId.Studio, title: "AI Studio", description: "Create professional YouTube Intros and Outros.", icon: MonitorPlay, color: "red", gradient: "from-red-600 to-rose-600", releaseDate: '2025-12-08' },
  { id: ToolId.AssistantCreator, title: "AI Assistant", description: "Create your own custom AI assistant.", icon: UserPlus, color: "cyan", gradient: "from-cyan-500 to-blue-600", releaseDate: '2025-12-05' },
  { id: ToolId.ListCreator, title: "AI Lists", description: "Generate helpful checklists with visuals.", icon: ListChecks, color: "lime", gradient: "from-lime-500 to-green-600", releaseDate: '2025-12-05' },
  { id: ToolId.Academy, title: "AI Academy", description: "Infinite daily prompt engineering tips.", icon: BookMarked, color: "teal", gradient: "from-teal-500 to-emerald-600", releaseDate: '2025-12-05' },
  { id: ToolId.PromptTrainer, title: "AI Prompt Trainer", description: "Optimize prompts for ChatGPT, Claude, Midjourney & more.", icon: Brain, color: "pink", gradient: "from-pink-500 to-fuchsia-600", releaseDate: '2025-12-05' },
  { id: ToolId.Live, title: "AI Live", description: "Real-time voice conversation with Gemini.", icon: Activity, color: "indigo", gradient: "from-indigo-500 to-violet-600", releaseDate: '2025-12-05' },
  { id: ToolId.Social, title: "AI Social", description: "Multi-platform social media campaign generator.", icon: Share2, color: "blue", gradient: "from-blue-500 to-cyan-600", releaseDate: '2025-12-04' },
  { id: ToolId.Meme, title: "AI Meme", description: "Instant meme generator from topics.", icon: Laugh, color: "yellow", gradient: "from-yellow-400 to-amber-500", releaseDate: '2025-12-04' },
  { id: ToolId.Storybook, title: "AI Storybook", description: "Create illustrated books, comics, and fairy tales.", icon: BookOpen, color: "amber", gradient: "from-amber-500 to-yellow-600", releaseDate: '2025-12-04' },
  { id: ToolId.YouTubeThumbnail, title: "AI Thumbnails", description: "Generate 5 viral-style YouTube thumbnails at once.", icon: Youtube, color: "red", gradient: "from-red-600 to-orange-600", releaseDate: '2025-12-04' },
  { id: ToolId.Games, title: "AI Games", description: "Interactive AI adventures, mysteries, and trivia.", icon: Gamepad2, color: "orange", gradient: "from-orange-500 to-red-600" },
  { id: ToolId.Pinterest, title: "AI Pinterest", description: "Generate viral-worthy, vertical images tailored for Pinterest.", icon: Pin, color: "red", gradient: "from-red-500 to-rose-600", releaseDate: '2025-12-04' },
  { id: ToolId.Tutor, title: "AI Tutor", description: "Expert guidance on using popular AI platforms.", icon: GraduationCap, color: "indigo", gradient: "from-indigo-500 to-violet-600" },
  { id: ToolId.GifGenerator, title: "AI GIF", description: "Generate animated GIFs using Veo.", icon: Film, color: "rose", gradient: "from-rose-500 to-pink-600", releaseDate: '2025-12-04' },
  { id: ToolId.SoundGenerator, title: "AI Speech", description: "Convert text to lifelike speech.", icon: Volume2, color: "sky", gradient: "from-sky-500 to-blue-600", releaseDate: '2025-12-04' },
  { id: ToolId.ImageEditor, title: "AI Edit", description: "Edit images using natural language prompts.", icon: ImageIcon, color: "amber", gradient: "from-amber-500 to-orange-600" },
  { id: ToolId.BackgroundRemover, title: "AI Remove", description: "Instantly remove backgrounds from images.", icon: Eraser, color: "rose", gradient: "from-rose-500 to-pink-600" },
  { id: ToolId.ImageGenerator, title: "AI Create", description: "Generate high-quality images from text.", icon: Palette, color: "purple", gradient: "from-purple-500 to-indigo-600" },
  { id: ToolId.Design, title: "AI Design", description: "Create logos, icons, and UI mockups.", icon: PenTool, color: "fuchsia", gradient: "from-fuchsia-500 to-pink-600" },
  { id: ToolId.DocTool, title: "AI Doc", description: "PDF conversion and intelligent file splitting.", icon: FileType, color: "teal", gradient: "from-teal-500 to-cyan-600" },
  { id: ToolId.VisualQA, title: "AI Lens", description: "Ask questions about any image you upload.", icon: Eye, color: "blue", gradient: "from-blue-500 to-cyan-600" },
  { id: ToolId.Summarizer, title: "AI Sum", description: "Intelligent text summarization.", icon: FileText, color: "emerald", gradient: "from-emerald-500 to-teal-600" },
  { id: ToolId.StoryTeller, title: "AI Tales", description: "Creative story and content generation.", icon: Feather, color: "pink", gradient: "from-pink-500 to-rose-600" },
  { id: ToolId.CodeAssistant, title: "AI Dev", description: "Code generation, debugging, and security auditing.", icon: Terminal, color: "cyan", gradient: "from-cyan-500 to-sky-600" },
  { id: ToolId.AutomationHub, title: "AI Automate", description: "Browser extension builder and Excel automation.", icon: Bot, color: "violet", gradient: "from-violet-500 to-purple-600", releaseDate: '2025-12-04' },
  { id: ToolId.SecurityBox, title: "AI Security Box", description: "Access the external Security Hub.", icon: Shield, color: "slate", gradient: "from-slate-700 to-slate-900", externalUrl: "https://sec-hub.online" }
];

const isToolNew = (releaseDate?: string) => {
  if (!releaseDate) return false;
  const releaseTime = new Date(releaseDate).getTime();
  const currentTime = new Date().getTime();
  const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
  return currentTime <= (releaseTime + sixtyDaysInMs);
};

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolId>(ToolId.Dashboard);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingExternalUrl, setPendingExternalUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Use null for checking state
  const [hasSelectedKey, setHasSelectedKey] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial Auth Check
    const hasAccess = localStorage.getItem('nano_access_granted');
    setIsAuthenticated(hasAccess === 'true');
    
    // API Key Check
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasSelectedKey(selected);
      } else {
        setHasSelectedKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasSelectedKey(true);
    }
  };

  const confirmExternalNavigation = () => {
    if (pendingExternalUrl) {
      window.open(pendingExternalUrl, '_blank', 'noopener,noreferrer');
      setPendingExternalUrl(null);
    }
  };

  const filteredTools = TOOLS.filter(tool => {
    const query = searchQuery.toLowerCase();
    return tool.title.toLowerCase().includes(query) || 
           tool.description.toLowerCase().includes(query);
  });

  const renderTool = () => {
    switch (currentTool) {
      case ToolId.Chat: return <ChatInterface />;
      case ToolId.VideoCaptioner: return <CaptionCreator />;
      case ToolId.NurseryRhymes: return <NurseryRhymesTool />;
      case ToolId.StyleEngine: return <StyleForge />;
      case ToolId.ImagesToMovie: return <ImagesToMovie />;
      case ToolId.BabyDebates: return <BabyDebates />;
      case ToolId.BabyVisionTransformer: return <BabyVisionTransformer />;
      case ToolId.ComicStrip: return <ComicStripTool />;
      case ToolId.AIMimicry: return <AIMimicryTool />;
      case ToolId.CalendarCreator: return <CalendarCreator />;
      case ToolId.LinkedInCarousel: return <CarouselMaker />;
      case ToolId.AI360: return <AI360Tool />;
      case ToolId.AetherEdit: return <AetherEditTool />;
      case ToolId.Learner: return <LearnerTool />;
      case ToolId.CommercialReview: return <CommercialReviewTool />;
      case ToolId.MeetingBooker: return <MeetingBooker />;
      case ToolId.BabyNames: return <BabyNameTool />;
      case ToolId.LiveNotetaker: return <LiveNotetaker />;
      case ToolId.BrandCollateral: return <BrandCollateralTool />;
      case ToolId.UGCAds: return <UGCAdsTool />;
      case ToolId.Cipher: return <CipherTool />; 
      case ToolId.Magic: return <MagicTool />;
      case ToolId.VideoGenerator: return <VideoGenerator />;
      case ToolId.Copywriter: return <CopywriterTool />;
      case ToolId.AffirmationGenerator: return <AffirmationGenerator />;
      case ToolId.Heritage: return <HeritageTool />;
      case ToolId.AudioTranscriber: return <AudioTranscriber />;
      case ToolId.SoundFX: return <SoundFXTool />;
      case ToolId.MockupDesigner: return <MockupDesigner />;
      case ToolId.ImageToPrompt: return <ImageToPrompt />;
      case ToolId.QuizGenerator: return <QuizGenerator />;
      case ToolId.RiddleGenerator: return <RiddleGenerator />;
      case ToolId.Podcast: return <PodcastTool />;
      case ToolId.Studio: return <StudioTool />;
      case ToolId.AssistantCreator: return <AssistantCreator />;
      case ToolId.ListCreator: return <ListCreator />;
      case ToolId.Academy: return <PromptAcademy />;
      case ToolId.PromptTrainer: return <PromptTrainer />;
      case ToolId.Live: return <LiveTool />;
      case ToolId.Social: return <SocialTool />;
      case ToolId.Meme: return <MemeGenerator />;
      case ToolId.Storybook: return <StorybookTool />;
      case ToolId.YouTubeThumbnail: return <ThumbnailTool />;
      case ToolId.Games: return <GamesTool />;
      case ToolId.Pinterest: return <PinterestTool />;
      case ToolId.Tutor: return <TextTool mode="tutor" />;
      case ToolId.GifGenerator: return <GifGenerator />;
      case ToolId.SoundGenerator: return <SoundGenerator />;
      case ToolId.ImageEditor: return <ImageEditor />;
      case ToolId.BackgroundRemover: return <BackgroundRemover />;
      case ToolId.ImageGenerator: return <ImageGenerator />;
      case ToolId.Design: return <DesignTool />;
      case ToolId.DocTool: return <DocTool />;
      case ToolId.VisualQA: return <VisualQA />;
      case ToolId.Summarizer: return <TextTool mode="summarizer" />;
      case ToolId.StoryTeller: return <TextTool mode="story" />;
      case ToolId.CodeAssistant: return <CodeHub />;
      case ToolId.AutomationHub: return <AutomationHub />;
      case ToolId.Poetry: return <PoetryTool />;
      case ToolId.DailyJoke: return <DailyJokeTool />;
      case ToolId.Quotes: return <QuoteTool />;
      case ToolId.Connections: return <ConnectionsTool />;
      case ToolId.WealthCalculator: return <WealthCalculator />;
      case ToolId.DesignCritic: return <DesignCritic />;
      default: return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-4 py-10">
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Unleash <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">AI Power</span>
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Experience the next generation of AI tools powered by Gemini 3. 
        </p>
        <div className="max-w-md mx-auto relative pt-4">
           <div className="absolute inset-y-0 left-0 pl-3 pt-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
           </div>
           <input
              type="text"
              placeholder="Find a feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-10 pr-10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
           />
           {searchQuery && (
             <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 pt-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
               <X className="h-5 w-5" />
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTools.length > 0 ? (
           filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => (tool as any).externalUrl ? setPendingExternalUrl((tool as any).externalUrl) : setCurrentTool(tool.id)}
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
              className="group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 text-left transition-all hover:-translate-y-1 overflow-hidden"
              style={{ boxShadow: hoveredTool === tool.id ? `0 10px 30px -10px ${SHADOW_COLORS[tool.color] || 'rgba(0,0,0,0.5)'}` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            >
              {isToolNew((tool as any).releaseDate) && (
                 <div className="absolute top-3 right-3 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse">NEW</div>
              )}
              <div className={`absolute top-0 right-0 p-24 opacity-5 bg-gradient-to-br ${tool.gradient} blur-3xl rounded-full -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                 <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-white transition-colors">
                {(tool as any).externalUrl ? 'Open Site' : 'Launch Tool'} <span className="ml-2">→</span>
              </div>
            </button>
          ))
        ) : (
           <div className="col-span-full text-center py-12 text-slate-500"><p>No tools found matching "{searchQuery}".</p></div>
        )}
      </div>
    </div>
  );

  // Still checking Local Storage - show nothing to avoid flash
  if (isAuthenticated === null) return <div className="min-h-screen bg-slate-950" />;

  // Not logged in - show login gate
  if (isAuthenticated === false) return <LoginGate onLogin={() => setIsAuthenticated(true)} />;

  // API Key missing - show key selection gate
  if (hasSelectedKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-8 animate-fade-in">
        <div className="bg-amber-500 p-6 rounded-[2.5rem] shadow-2xl shadow-amber-900/30 ring-8 ring-amber-500/10">
          <Key className="w-14 h-14 text-slate-900" />
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">AI PRO UNLOCK</h1>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            To enable the full suite of Pro features (including Video synthesis, high-resolution Image generation, and Live Audio), you must select your own paid Google Gemini API key.
          </p>
        </div>
        <div className="flex flex-col gap-5 w-full max-w-xs">
          <button 
            onClick={handleOpenSelectKey}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-10 py-5 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
          >
            Select API Key
          </button>
          <div className="space-y-2">
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest underline underline-offset-4 transition-colors">
               Setup Billing & Key Guide
             </a>
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Digital Gentry Secure Tunnel v2.5</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      onBack={currentTool !== ToolId.Dashboard ? () => setCurrentTool(ToolId.Dashboard) : undefined}
      title={currentTool !== ToolId.Dashboard ? TOOLS.find(t => t.id === currentTool)?.title : undefined}
      onGoHome={() => setCurrentTool(ToolId.Dashboard)}
    >
      {renderTool()}
      {pendingExternalUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-sm rounded-2xl shadow-2xl p-6 space-y-6 text-center transform scale-100 transition-all">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <Shield className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">External Link Warning</h3>
              <p className="text-slate-400 text-sm leading-relaxed">You are about to leave Digital Gentry AI. <br /> Proceed to <span className="text-amber-400 font-medium">{new URL(pendingExternalUrl).hostname}</span>?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPendingExternalUrl(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors border border-slate-700">Cancel</button>
              {/* Fix: Added missing onClick handler for the Proceed button to fix external navigation. */}
              <button onClick={confirmExternalNavigation} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-900/20">Proceed</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;