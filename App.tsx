
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
import { Sparkles, Image as ImageIcon, Palette, Eye, FileText, Feather, Code, MessageSquare, PenTool, GraduationCap, Gamepad2, Eraser, FileType, Terminal, Film, Volume2, Pin, Youtube, BookOpen, Activity, Laugh, Bot, Share2 } from 'lucide-react';

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
    id: ToolId.Live,
    title: "Nano Live",
    description: "Real-time voice conversation with Gemini.",
    icon: Activity,
    color: "indigo",
    gradient: "from-indigo-500 to-violet-600",
    isNew: true
  },
  {
    id: ToolId.Social,
    title: "Nano Social",
    description: "Multi-platform social media campaign generator.",
    icon: Share2,
    color: "blue",
    gradient: "from-blue-500 to-cyan-600",
    isNew: true
  },
  {
    id: ToolId.Meme,
    title: "Nano Meme",
    description: "Instant meme generator from topics.",
    icon: Laugh,
    color: "yellow",
    gradient: "from-yellow-400 to-amber-500",
    isNew: true
  },
  {
    id: ToolId.Storybook,
    title: "Nano Storybook",
    description: "Create illustrated books, comics, and fairy tales.",
    icon: BookOpen,
    color: "amber",
    gradient: "from-amber-500 to-yellow-600",
    isNew: true
  },
  {
    id: ToolId.YouTubeThumbnail,
    title: "Nano Thumbnails",
    description: "Generate 5 viral-style YouTube thumbnails at once.",
    icon: Youtube,
    color: "red",
    gradient: "from-red-600 to-orange-600",
    isNew: true
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
    isNew: true
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
    isNew: true
  },
  {
    id: ToolId.SoundGenerator,
    title: "Nano Speech",
    description: "Convert text to lifelike speech.",
    icon: Volume2,
    color: "sky",
    gradient: "from-sky-500 to-blue-600",
    isNew: true
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
    isNew: true
  }
];

const App: React.FC = () => {
  const [currentTool, setCurrentTool] = useState<ToolId>(ToolId.Dashboard);

  const renderTool = () => {
    switch (currentTool) {
      case ToolId.Chat:
        return <ChatInterface />;
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setCurrentTool(tool.id)}
            title={tool.description}
            className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-2xl p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden"
          >
            {/* New Badge */}
            {(tool as any).isNew && (
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
        ))}
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
