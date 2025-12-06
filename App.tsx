import React, { useState } from 'react';
import { ToolId } from './types';
import Layout from './components/Layout';
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
import { Sparkles, Image as ImageIcon, Palette, Eye, FileText, Feather, Code, MessageSquare, PenTool, GraduationCap, Gamepad2, Eraser, FileType, Terminal, Film, Volume2, Pin, Youtube, BookOpen, Activity, Laugh, Bot, Share2, Brain, BookMarked, UserPlus, ListChecks, Mic2, Scan, FileQuestion, Lightbulb, Radio, Search, FileAudio, Shield, Layout as LayoutIcon, Heart, Video, Pen, Wand2, Lock, Briefcase, X } from 'lucide-react';

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
  emerald: 'rgba(16, 185, 129, 0.4)'
};

const TOOLS = [
  {
    id: ToolId.Chat,
    title: "Nano Chat",
    description: "Conversational AI assistant for general queries.",
    icon: MessageSquare,
    color: "green",
    gradient: "from-green-500 to-emerald-600"
  },
  {
    id: ToolId.BrandCollateral,
    title: "Nano Brand",
    description: "Generate complete brand kits and logos.",
    icon: Briefcase,
    color: "orange",
    gradient: "from-orange-500 to-amber-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.UGCAds,
    title: "Nano UGC",
    description: "Create viral scripts for TikTok and Reels.",
    icon: Video,
    color: "pink",
    gradient: "from-pink-500 to-rose-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.Cipher,
    title: "Nano Cipher",
    description: "Learn encryption and play code-breaking games.",
    icon: Lock,
    color: "sky",
    gradient: "from-sky-500 to-indigo-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.Magic,
    title: "Nano Magic",
    description: "Create dancing text effects and hidden secret messages.",
    icon: Wand2,
    color: "indigo",
    gradient: "from-indigo-500 to-purple-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.VideoGenerator,
    title: "Nano Video",
    description: "Pro-grade video generation powered by Veo.",
    icon: Video,
    color: "red",
    gradient: "from-red-600 to-rose-700",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.Copywriter,
    title: "Nano Copy",
    description: "Professional copywriter for blogs, ads, and emails.",
    icon: Pen,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.AffirmationGenerator,
    title: "Nano Affirmations",
    description: "Generate a weekly affirmation plan for positivity.",
    icon: Heart,
    color: "teal",
    gradient: "from-teal-500 to-emerald-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.Heritage,
    title: "Nano Heritage",
    description: "Design coats of arms, signet rings, and authentic tartan.",
    icon: Shield,
    color: "amber",
    gradient: "from-amber-600 to-orange-700",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.AudioTranscriber,
    title: "Nano Scribe",
    description: "Accurately transcribe audio files to text.",
    icon: FileAudio,
    color: "sky",
    gradient: "from-sky-500 to-blue-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.SoundFX,
    title: "Nano FX",
    description: "Generate sound effects and audio-visuals.",
    icon: Radio,
    color: "rose",
    gradient: "from-rose-500 to-red-600",
    releaseDate: '2025-12-06'
  },
  {
    id: ToolId.MockupDesigner,
    title: "Nano Mockup",
    description: "Create high-fidelity UI designs for apps & websites.",
    icon: LayoutIcon,
    color: "fuchsia",
    gradient: "from-fuchsia-500 to-purple-600",
    releaseDate: '2025-12-07'
  },
  {
    id: ToolId.ImageToPrompt,
    title: "Nano Vision",
    description: "Convert images to text descriptions or prompts.",
    icon: Scan,
    color: "fuchsia",
    gradient: "from-fuchsia-500 to-purple-600",
    releaseDate: '2025-12-06'
  },
  {
    id: ToolId.QuizGenerator,
    title: "Nano Quiz",
    description: "Generate quizzes on any topic instantly.",
    icon: FileQuestion,
    color: "indigo",
    gradient: "from-indigo-500 to-blue-600",
    releaseDate: '2025-12-06'
  },
  {
    id: ToolId.RiddleGenerator,
    title: "Nano Riddle",
    description: "Generate clever riddles on any subject.",
    icon: Lightbulb,
    color: "amber",
    gradient: "from-amber-400 to-orange-500",
    releaseDate: '2025-12-06'
  },
  {
    id: ToolId.Podcast,
    title: "Nano Cast",
    description: "Generate multi-speaker audio podcasts from any topic.",
    icon: Mic2,
    color: "indigo",
    gradient: "from-indigo-500 to-violet-600",
    releaseDate: '2025-12-05'
  },
  {
    id: ToolId.AssistantCreator,
    title: "Nano Assistant",
    description: "Create your own custom AI assistant.",
    icon: UserPlus,
    color: "cyan",
    gradient: "from-cyan-500 to-blue-600",
    releaseDate: '2025-12-05'
  },
  {
    id: ToolId.ListCreator,
    title: "Nano Lists",
    description: "Generate helpful checklists with visuals.",
    icon: ListChecks,
    color: "lime",
    gradient: "from-lime-500 to-green-600",
    releaseDate: '2025-12-05'
  },
  {
    id: ToolId.Academy,
    title: "Nano Academy",
    description: "Infinite daily prompt engineering tips.",
    icon: BookMarked,
    color: "teal",
    gradient: "from-teal-500 to-emerald-600",
    releaseDate: '2025-12-05'
  },
  {
    id: ToolId.PromptTrainer,
    title: "Nano Prompt Trainer",
    description: "Optimize prompts for ChatGPT, Claude, Midjourney & more.",
    icon: Brain,
    color: "pink",
    gradient: "from-pink-500 to-fuchsia-600",
    releaseDate: '2025-12-05'
  },
  {
    id: ToolId.Live,
    title: "Nano Live",
    description: "Real-time voice conversation with Gemini.",
    icon: Activity,
    color: "indigo",
    gradient: "from-indigo-500 to-violet-600",
    releaseDate: '2025-12-05'
  },
  {
    id: ToolId.Social,
    title: "Nano Social",
    description: "Multi-platform social media campaign generator.",
    icon: Share2,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    releaseDate: '2025-12-04'
  },
  {
    id: ToolId.Meme,
    title: "Nano Meme",
    description: "Instant meme generator from topics.",
    icon: Laugh,
    color: "yellow",
    gradient: "from-yellow-400 to-amber-500",
    releaseDate: '2025-12-04'
  },
  {
    id: ToolId.Storybook,
    title: "Nano Storybook",
    description: "Create illustrated books, comics, and fairy tales.",
    icon: BookOpen,
    color: "amber",
    gradient: "from-amber-500 to-yellow-600",
    releaseDate: '2025-12-04'
  },
  {
    id: ToolId.YouTubeThumbnail,
    title: "Nano Thumbnails",
    description: "Generate 5 viral-style YouTube thumbnails at once.",
    icon: Youtube,
    color: "red",
    gradient: "from-red-600 to-orange-600",
    releaseDate: '2025-12-04'
  },
  {
    id: ToolId.Games,
    title: "Nano Games",
    description: "Interactive AI adventures, mysteries, and trivia.",
    icon: Gamepad2,
    color: "orange",
    gradient: "from-orange-500 to-red-600"
  },
  {
    id: ToolId.Pinterest,
    title: "Nano Pinterest",
    description: "Generate viral-worthy, vertical Pinterest images.",
    icon: Pin,
    color: "red",
    gradient: "from-red-500 to-rose-600",
    releaseDate: '2025-12-04'
  },
  {
    id: ToolId.Tutor,
    title: "Nano Tutor",
    description: "Expert guidance on using popular AI platforms.",
    icon: GraduationCap,
    color: "indigo",
    gradient: "from-indigo-500 to-violet-600"
  },
  {
    id: ToolId.GifGenerator,
    title: "Nano GIF",
    description: "Generate animated GIFs using Veo.",
    icon: Film,
    color: "rose",
    gradient: "from-rose-500 to-pink-600",
    releaseDate: '2025-12-04'
  },
  {
    id: ToolId.SoundGenerator,
    title: "Nano Speech",
    description: "Convert text to lifelike speech.",
    icon: Volume2,
    color: "sky",
    gradient: "from-sky-500 to-blue-600",
    releaseDate: '2025-12-04'
  },
  {
    id: ToolId.ImageEditor,
    title: "Nano Edit",
    description: "Edit images using natural language prompts.",
    icon: ImageIcon,
    color: "amber",
    gradient: "from-amber-500 to-orange-600"
  },
  {
    id: ToolId.BackgroundRemover,
    title: "Nano Remove",
    description: "Instantly remove backgrounds from images.",
    icon: Eraser,
    color: "rose",
    gradient: "from-rose-500 to-pink-600"
  },
  {
    id: ToolId.ImageGenerator,
    title: "Nano Create",
    description: "Generate high-quality images from text.",
    icon: Palette,
    color: "purple",
    gradient: "from-purple-500 to-indigo-600"
  },
  {
    id: ToolId.Design,
    title: "Nano Design",
    description: "Create logos, icons, and UI mockups.",
    icon: PenTool,
    color: "fuchsia",
    gradient: "from-fuchsia-500 to-pink-600"
  },
  {
    id: ToolId.DocTool,
    title: "Nano Doc",
    description: "PDF conversion and intelligent file splitting.",
    icon: FileType,
    color: "teal",
    gradient: "from-teal-500 to-cyan-600"
  },
  {
    id: ToolId.VisualQA,
    title: "Nano Lens",
    description: "Ask questions about any image you upload.",
    icon: Eye,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600"
  },
  {
    id: ToolId.Summarizer,
    title: "Nano Sum",
    description: "Intelligent text summarization.",
    icon: FileText,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    id: ToolId.StoryTeller,
    title: "Nano Tales",
    description: "Creative story and content generation.",
    icon: Feather,
    color: "pink",
    gradient: "from-pink-500 to-rose-600"
  },
  {
    id: ToolId.CodeAssistant,
    title: "Nano Dev",
    description: "Code generation, debugging, and security auditing.",
    icon: Terminal,
    color: "cyan",
    gradient: "from-cyan-500 to-sky-600"
  },
  {
    id: ToolId.AutomationHub,
    title: "Nano Automate",
    description: "Browser extension builder and Excel automation.",
    icon: Bot,
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    releaseDate: '2025-12-04'
  }
];

// Helper to determine if a tool is "New" based on 60-day window
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

  // Filter tools based on search query
  const filteredTools = TOOLS.filter(tool => {
    const query = searchQuery.toLowerCase();
    return tool.title.toLowerCase().includes(query) || 
           tool.description.toLowerCase().includes(query);
  });

  const renderTool = () => {
    switch (currentTool) {
      case ToolId.Chat:
        return <ChatInterface />;
      case ToolId.BrandCollateral:
        return <BrandCollateralTool />;
      case ToolId.UGCAds:
        return <UGCAdsTool />;
      case ToolId.Cipher:
        return <CipherTool />;
      case ToolId.Magic:
        return <MagicTool />;
      case ToolId.VideoGenerator:
        return <VideoGenerator />;
      case ToolId.Copywriter:
        return <CopywriterTool />;
      case ToolId.AffirmationGenerator:
        return <AffirmationGenerator />;
      case ToolId.Heritage:
        return <HeritageTool />;
      case ToolId.AudioTranscriber:
        return <AudioTranscriber />;
      case ToolId.SoundFX:
        return <SoundFXTool />;
      case ToolId.MockupDesigner:
        return <MockupDesigner />;
      case ToolId.ImageToPrompt:
        return <ImageToPrompt />;
      case ToolId.QuizGenerator:
        return <QuizGenerator />;
      case ToolId.RiddleGenerator:
        return <RiddleGenerator />;
      case ToolId.Podcast:
        return <PodcastTool />;
      case ToolId.AssistantCreator:
        return <AssistantCreator />;
      case ToolId.ListCreator:
        return <ListCreator />;
      case ToolId.Academy:
        return <PromptAcademy />;
      case ToolId.PromptTrainer:
        return <PromptTrainer />;
      case ToolId.Live:
        return <LiveTool />;
      case ToolId.Social:
        return <SocialTool />;
      case ToolId.Meme:
        return <MemeGenerator />;
      case ToolId.Storybook:
        return <StorybookTool />;
      case ToolId.YouTubeThumbnail:
        return <ThumbnailTool />;
      case ToolId.Games:
        return <GamesTool />;
      case ToolId.Pinterest:
        return <PinterestTool />;
      case ToolId.Tutor:
        return <TextTool mode="tutor" />;
      case ToolId.GifGenerator:
        return <GifGenerator />;
      case ToolId.SoundGenerator:
        return <SoundGenerator />;
      case ToolId.ImageEditor:
        return <ImageEditor />;
      case ToolId.BackgroundRemover:
        return <BackgroundRemover />;
      case ToolId.ImageGenerator:
        return <ImageGenerator />;
      case ToolId.Design:
        return <DesignTool />;
      case ToolId.DocTool:
        return <DocTool />;
      case ToolId.VisualQA:
        return <VisualQA />;
      case ToolId.Summarizer:
        return <TextTool mode="summarizer" />;
      case ToolId.StoryTeller:
        return <TextTool mode="story" />;
      case ToolId.CodeAssistant:
        return <CodeHub />;
      case ToolId.AutomationHub:
        return <AutomationHub />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-4 py-10">
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Unleash <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-amber-600">Nano Power</span>
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Experience the next generation of AI tools powered by Gemini 2.5. 
          Edit images with words, generate code, play games, and more.
        </p>
        
        {/* Search Bar */}
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
             <button
               onClick={() => setSearchQuery('')}
               className="absolute inset-y-0 right-0 pr-3 pt-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
               aria-label="Clear search"
             >
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
              onClick={() => setCurrentTool(tool.id)}
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
              title={tool.description}
              className="group relative bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 text-left transition-all hover:-translate-y-1 overflow-hidden"
              style={{ 
                 boxShadow: hoveredTool === tool.id 
                    ? `0 10px 30px -10px ${SHADOW_COLORS[tool.color] || 'rgba(0,0,0,0.5)'}` 
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* New Badge */}
              {isToolNew((tool as any).releaseDate) && (
                 <div className="absolute top-3 right-3 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                    NEW
                 </div>
              )}

              <div className={`absolute top-0 right-0 p-24 opacity-5 bg-gradient-to-br ${tool.gradient} blur-3xl rounded-full -mr-10 -mt-10 group-hover:opacity-10 transition-opacity`}></div>
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
              
              <div className="mt-6 flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-white transition-colors">
                Launch Tool <span className="ml-2">→</span>
              </div>
            </button>
          ))
        ) : (
           <div className="col-span-full text-center py-12 text-slate-500">
              <p>No tools found matching "{searchQuery}".</p>
           </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout 
      onBack={currentTool !== ToolId.Dashboard ? () => setCurrentTool(ToolId.Dashboard) : undefined}
      title={currentTool !== ToolId.Dashboard ? TOOLS.find(t => t.id === currentTool)?.title : undefined}
    >
      {renderTool()}
    </Layout>
  );
};

export default App;