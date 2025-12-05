
import React, { useState } from 'react';
import { Youtube, Download, RefreshCw, Zap, TrendingUp, Gamepad, Smile, Layout } from 'lucide-react';
import { generateViralThumbnails } from '../../services/geminiService';
import { LoadingState } from '../../types';

const STYLES = [
  { 
    id: 'reaction', 
    label: 'Reaction', 
    icon: Smile,
    desc: 'Shocked face, big emotions, arrows'
  },
  { 
    id: 'gaming', 
    label: 'Gaming', 
    icon: Gamepad,
    desc: 'High action, glowing effects, intense'
  },
  { 
    id: 'vlog', 
    label: 'Vlog / Lifestyle', 
    icon: Layout,
    desc: 'Bright, cinematic, depth of field'
  },
  { 
    id: 'versus', 
    label: 'Versus / Comparison', 
    icon: Zap,
    desc: 'Split screen, red vs blue, contrast'
  },
  { 
    id: 'trending', 
    label: 'General Viral', 
    icon: TrendingUp,
    desc: 'High saturation, bold text, clickbait style'
  }
];

const ThumbnailTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState(STYLES[4].id); // Default to Trending
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');

  const selectedStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[4];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus('loading');
    setThumbnails([]);
    
    try {
      // enhance prompt with style instructions
      const finalPrompt = `${prompt}. Style: ${selectedStyle.label} - ${selectedStyle.desc}`;
      const results = await generateViralThumbnails(finalPrompt);
      setThumbnails(results);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Youtube className="w-8 h-8 text-red-600" />
          Nano Thumbnails
        </h2>
        <p className="text-slate-400">Generate 5 viral-ready YouTube thumbnails at once.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Controls */}
        <div className="space-y-6">
          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-400">Select Viral Style</label>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
               {STYLES.map((style) => (
                 <button
                   key={style.id}
                   onClick={() => setSelectedStyleId(style.id)}
                   className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all text-center ${
                     selectedStyleId === style.id 
                       ? 'bg-red-600/20 border-red-500 text-white' 
                       : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                   }`}
                 >
                   <style.icon className={`w-5 h-5 ${selectedStyleId === style.id ? 'text-red-500' : ''}`} />
                   <span className="text-xs font-bold">{style.label}</span>
                 </button>
               ))}
             </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
             <input
               type="text"
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="Video topic: e.g., 'I survived 24 hours in a haunted house' or 'iPhone 16 Review'"
               className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
               onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
             />
             <button
               onClick={handleGenerate}
               disabled={!prompt || status === 'loading'}
               className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 whitespace-nowrap"
             >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Zap className="fill-current" />}
               Generate 5 Variants
             </button>
          </div>
        </div>

        {/* Results Grid */}
        <div className="border-t border-slate-800 pt-8">
           {status === 'loading' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-video bg-slate-800/50 rounded-xl animate-pulse flex items-center justify-center border border-slate-700/50">
                     <Youtube className="w-10 h-10 text-slate-700" />
                  </div>
                ))}
             </div>
           ) : thumbnails.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                {thumbnails.map((src, idx) => (
                  <div key={idx} className="group relative aspect-video bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
                     <img src={src} alt={`Thumbnail variant ${idx + 1}`} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a 
                          href={src} 
                          download={`nano-thumbnail-${idx+1}.png`}
                          className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                     </div>
                     <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">
                        Variant {idx + 1}
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-12 text-slate-500">
               <Youtube className="w-16 h-16 mx-auto mb-4 opacity-10" />
               <p>Enter a topic and generate 5 viral thumbnails instantly.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailTool;
