import React, { useState, useEffect } from 'react';
import { MonitorPlay, Download, RefreshCw, Lock, Type, Music, Layout, AlertTriangle } from 'lucide-react';
import { generateVideoWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

const STYLES = [
  { id: 'gaming', label: 'Gaming', desc: 'Neon, glitch effects, energetic' },
  { id: 'tech', label: 'Tech Review', desc: 'Clean, minimalist, sleek, 4k' },
  { id: 'vlog', label: 'Vlog / Lifestyle', desc: 'Bright, cinematic, aesthetic' },
  { id: 'minimal', label: 'Minimalist', desc: 'Simple text on solid color, elegant' },
  { 
    id: 'edewede_ai_o3', 
    label: 'Edewede-AI-O3', 
    desc: 'Analog 2D storybook minimalism inspired by mid-century printmaking and educational infographics. Features clean, intentional contours and flat color blocks with slight misregistered ink edges to mimic vintage offset printing. Compositions are calm and airy, utilizing generous negative space and geometric groupings in flattened frontal views. Palette: 3–5 strictly limited earthy tones (ochre, muted sage, dusty terracotta, charcoal) on off-white paper. Characters are essential symbols: bodies as bold silhouettes, hair as oversized solid geometric shapes (like large afros or circular bobs), limbs as thin tapered lines, and faces with tiny dot eyes and small pink circular cheeks. Zero gradients, zero highlights, and zero 3D depth cues. Environment props like trees and buildings are reduced to primitive geometric blocks, circles, and triangles.',
    uiDesc: 'Mid-century minimalism with flat geometric characters and earthy tones.'
  }
];

const StudioTool: React.FC = () => {
  const [channelName, setChannelName] = useState('');
  const [tagline, setTagline] = useState('');
  const [type, setType] = useState<'intro' | 'outro'>('intro');
  const [style, setStyle] = useState(STYLES[0].id);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    checkKey();
  }, []);

  const getAIStudio = () => (window as any).aistudio;

  const checkKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      const selected = await aiStudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true); 
    }
  };

  const handleSelectKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      await aiStudio.openSelectKey();
      /* Fix: Assume selection success immediately after triggering the dialog to mitigate race condition. */
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!channelName.trim()) return;
    
    // API Check
    const aiStudio = getAIStudio();
    if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
       // Fix: Guideline requires assuming success and proceeding after triggering selection.
       handleSelectKey();
    }

    setStatus('loading');
    setErrorMessage('');
    setVideoUrl(null);

    try {
      const selectedStyle = STYLES.find(s => s.id === style);
      
      const prompt = type === 'intro' 
        ? `Create a YouTube Intro Video for channel "${channelName}". Style: ${selectedStyle?.desc}. Visuals: Kinetic typography animating the name "${channelName}" ${tagline ? `with tagline "${tagline}"` : ''}. Background: Dynamic, high energy motion graphics matching the ${style} aesthetic. Audio: Upbeat energetic intro music. Length: 5 seconds.`
        : `Create a YouTube Outro / End Screen video for channel "${channelName}". Style: ${selectedStyle?.desc}. Layout: Leave space for "Next Video" and "Subscribe" buttons. Text: "Thanks for watching!". Background: Looping, subtle motion graphics. Audio: Chill lo-fi outer music. Length: 10 seconds.`;

      const url = await generateVideoWithGemini(prompt, '16:9');
      
      // Fetch as blob for reliable playback
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load video stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setVideoUrl(objectUrl);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      // Fix: Reset key state and prompt for a new key if the request fails with "Requested entity was not found."
      if (msg.includes("Requested entity was not found")) {
          setHasKey(false);
          handleSelectKey();
      }
      setErrorMessage(msg || "Studio generation failed.");
      setStatus('error');
    }
  };

  if (!hasKey) {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-fade-in text-center py-12">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Unlock AI Studio</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Video generation uses the <strong>Veo</strong> model. 
            Please connect a paid Google Gemini API key to proceed.
          </p>
          <button
             onClick={handleSelectKey}
             className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg"
           >
             Connect API Key
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <MonitorPlay className="w-8 h-8 text-red-600" />
          AI Studio
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Create professional YouTube intros and outros instantly.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: veo-3.1
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
             
             {/* Type Selector */}
             <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                   onClick={() => setType('intro')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      type === 'intro' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                   }`}
                >
                   Intro (Opener)
                </button>
                <button
                   onClick={() => setType('outro')}
                   className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      type === 'outro' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                   }`}
                >
                   Outro (End Screen)
                </button>
             </div>

             {/* Style Grid */}
             <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Visual Style</label>
                <div className="grid grid-cols-2 gap-3">
                   {STYLES.map(s => (
                      <button
                         key={s.id}
                         onClick={() => setStyle(s.id)}
                         className={`p-3 rounded-xl border text-left transition-all ${
                            style === s.id 
                            ? 'bg-slate-800 border-red-500 text-white ring-1 ring-red-500/50' 
                            : 'bg-slate-950/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                         }`}
                      >
                         <div className="font-bold text-sm">{s.label}</div>
                         <div className="text-xs opacity-60 truncate">{(s as any).uiDesc || s.desc}</div>
                      </button>
                   ))}
                </div>
             </div>

             {/* Text Inputs */}
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Channel Name</label>
                   <input 
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="e.g. Tech With Tim"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Tagline (Optional)</label>
                   <input 
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Daily Reviews"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                   />
                </div>
             </div>

             <button
                onClick={handleGenerate}
                disabled={!channelName.trim() || status === 'loading'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20"
             >
                {status === 'loading' ? <RefreshCw className="animate-spin" /> : <MonitorPlay />}
                Generate {type === 'intro' ? 'Intro' : 'Outro'}
             </button>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col justify-center">
           {status === 'loading' ? (
              <div className="text-center space-y-4 p-8 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                 <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-red-400 font-medium animate-pulse">Rendering motion graphics...</p>
                 <p className="text-xs text-slate-500">Veo generation usually takes 30-60 seconds.</p>
              </div>
           ) : status === 'error' ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center p-6 bg-red-900/10 rounded-2xl border border-red-500/20">
                 <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-red-500 font-bold">Generation Failed</h3>
                    <p className="text-slate-400 text-sm">{errorMessage}</p>
                 </div>
                 <button 
                   onClick={handleSelectKey}
                   className="text-amber-500 text-xs hover:underline flex items-center gap-1 mx-auto mt-2"
                 >
                    <Lock className="w-3 h-3" /> Check API Key
                 </button>
              </div>
           ) : videoUrl ? (
              <div className="space-y-4 animate-fade-in-up">
                 <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group mx-auto aspect-video w-full">
                    <video 
                       src={videoUrl} 
                       controls 
                       autoPlay
                       loop
                       playsInline
                       className="w-full h-full object-contain" 
                    />
                 </div>
                 <a 
                    href={videoUrl} 
                    download={`nano-studio-${type}-${Date.now()}.mp4`}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
                 >
                    <Download className="w-5 h-5" />
                    Download MP4
                 </a>
              </div>
           ) : (
              <div className="text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 h-full flex flex-col items-center justify-center min-h-[400px]">
                 <Layout className="w-16 h-16 opacity-20 mb-4" />
                 <p>Enter channel details to generate a video.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudioTool;