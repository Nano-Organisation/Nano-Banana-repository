import React, { useState, useEffect, useRef } from 'react';
import { Palette, Download, RefreshCw, Lock, Star, Share2, Wand2, Monitor, Smartphone, Square, Layers, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import { generateImageWithGemini, generateProImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { drawWatermarkOnCanvas } from '../../utils/watermark';

// Filter Definitions (CSS-like)
const FILTERS = [
  { id: 'none', name: 'Original', style: 'none' },
  { id: 'vintage', name: 'Vintage', style: 'sepia(0.5) contrast(0.8) brightness(1.1)' },
  { id: 'noir', name: 'Noir', style: 'grayscale(1) contrast(1.2) brightness(0.9)' },
  { id: 'cinematic', label: 'Cinematic', style: 'contrast(1.1) saturate(1.2) brightness(0.9)' },
  { id: 'vivid', name: 'Vivid', style: 'saturate(1.5) contrast(1.1)' },
  { id: 'soft', name: 'Soft', style: 'contrast(0.9) brightness(1.1) saturate(0.8)' },
];

const PROMPTS = [
  { label: "Cyberpunk City", text: "A futuristic city with neon lights, rain-slicked streets, flying cars, cyberpunk aesthetic, high detail, 8k resolution" },
  { label: "Oil Painting", text: "A serene cottage by a lake at sunset, mountains in background, thick brushstrokes, impasto style, oil painting" },
  { label: "Studio Portrait", text: "Professional studio portrait of a futuristic astronaut, cinematic lighting, rim light, highly detailed face, 85mm lens" },
  { label: "3D Render", text: "Cute isometric 3D living room with plants and modern furniture, soft clay render style, pastel colors, cozy atmosphere" },
];

const RATIOS = [
  { id: '1:1', label: 'Square', icon: Square },
  { id: '16:9', label: 'Landscape', icon: Monitor },
  { id: '9:16', label: 'Portrait', icon: Smartphone },
];

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryMessage, setRetryMessage] = useState('');
  
  // Settings
  const [isPro, setIsPro] = useState(false);
  const [size, setSize] = useState('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [activeFilter, setActiveFilter] = useState('none');
  
  const [hasKey, setHasKey] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    if (isPro) {
      const aiStudio = getAIStudio();
      if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
         handleSelectKey();
      }
    }

    setStatus('loading');
    setErrorMessage('');
    setRetryMessage('');
    setResultImage(null);
    setActiveFilter('none'); 

    const onRetry = (msg: string) => setRetryMessage(msg);

    try {
      if (isPro) {
        const img = await generateProImageWithGemini(`${prompt} --ar ${aspectRatio}`, size, onRetry);
        setResultImage(img);
      } else {
        const img = await generateImageWithGemini(prompt, aspectRatio, undefined, onRetry);
        setResultImage(img);
      }
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found")) {
          setHasKey(false);
          handleSelectKey();
      }
      setErrorMessage(err.message || "Generation failed");
      setStatus('error');
    } finally {
      setRetryMessage('');
    }
  };

  const processImage = async (): Promise<Blob | null> => {
    if (!resultImage || !canvasRef.current) return null;
    return new Promise((resolve) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      img.crossOrigin = "anonymous";
      img.src = resultImage;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
           ctx.filter = FILTERS.find(f => f.id === activeFilter)?.style || 'none';
           ctx.drawImage(img, 0, 0);
           ctx.filter = 'none';
           drawWatermarkOnCanvas(ctx, canvas.width, canvas.height);
           canvas.toBlob((blob) => resolve(blob), 'image/png');
        } else {
           resolve(null);
        }
      };
    });
  };

  const handleDownload = async () => {
    const blob = await processImage();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-art-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async () => {
    const blob = await processImage();
    if (blob && navigator.share) {
       try {
         const file = new File([blob], 'ai-art.png', { type: 'image/png' });
         await navigator.share({
           title: 'Created with AI Create',
           text: `Check out this image I generated with AI Create! Prompt: "${prompt}"`,
           files: [file]
         });
       } catch (error) { console.log('Error sharing:', error); }
    } else {
       alert("Sharing is not supported on this device/browser. Please download the image instead.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold dark:text-white text-slate-900">AI Create</h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-500 dark:text-slate-400">Generate high-quality visuals with filters and pro tools.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: {isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'}
           </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="flex-1 space-y-6">
          
          {/* Mode & Size */}
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
             <div className="flex gap-2">
                <button
                   onClick={() => setIsPro(false)}
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${!isPro ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                   Standard
                </button>
                <button
                   onClick={() => setIsPro(true)}
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1 ${isPro ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                   <Star className="w-3 h-3 fill-white" /> Pro
                </button>
             </div>
             {isPro && (
                <select 
                   value={size}
                   onChange={(e) => setSize(e.target.value)}
                   className="bg-white dark:bg-slate-800 border border-slate-700 text-slate-900 dark:text-white text-xs rounded px-2 py-1 outline-none"
                >
                   <option value="1K">1K</option>
                   <option value="2K">2K</option>
                   <option value="4K">4K</option>
                </select>
             )}
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
             <div className="grid grid-cols-3 gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setAspectRatio(r.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                       aspectRatio === r.id 
                       ? 'bg-slate-800 border-purple-500 text-white shadow-md' 
                       : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                     <r.icon className={`w-5 h-5 mb-1 ${aspectRatio === r.id ? 'text-purple-400' : ''}`} />
                     <span className="text-xs font-medium">{r.label}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* Prompt Area */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prompt</label>
                <div className="group relative">
                   <button className="text-xs text-purple-500 flex items-center gap-1 font-bold hover:text-purple-400">
                      <Sparkles className="w-3 h-3" /> Inspiration
                   </button>
                   <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2 z-10 hidden group-hover:block animate-fade-in-up">
                      <div className="text-xs font-bold text-slate-500 px-2 py-1 mb-1">Try these styles:</div>
                      {PROMPTS.map((p, i) => (
                         <button key={i} onClick={() => setPrompt(p.text)} className="w-full text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white p-2 rounded-lg transition-colors truncate" title={p.text}>{p.label}</button>
                      ))}
                   </div>
                </div>
             </div>
             
             <textarea
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder={isPro ? "A highly detailed photorealistic masterpiece..." : "A futuristic city on Mars..."}
               className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
             />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!prompt || status === 'loading'}
            className={`w-full text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg 
                ${isPro ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-orange-900/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/20'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Palette />}
            {isPro ? 'Generate Pro Artwork' : 'Generate Artwork'}
          </button>

          {isPro && !hasKey && (
             <div className="text-xs text-center text-amber-600 dark:text-amber-500 flex items-center justify-center gap-1 cursor-pointer hover:underline" onClick={handleSelectKey}>
                <Lock className="w-3 h-3" /> Paid API Key required for Pro
             </div>
          )}
        </div>

        {/* RIGHT COLUMN: Output & Post-Processing */}
        <div className="flex-1 space-y-4">
           
           <div className={`
              w-full bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative group
              ${aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'}
           `}>
             {status === 'loading' ? (
                <div className="text-center space-y-4 p-6">
                 <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <div className="space-y-1">
                   <p className="text-purple-500 dark:text-purple-400 text-sm font-bold animate-pulse">Dreaming up pixels...</p>
                   {retryMessage && (
                     <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 animate-fade-in">
                       <Clock className="w-3 h-3" />
                       <span className="text-[10px] font-black uppercase tracking-wider">{retryMessage}</span>
                     </div>
                   )}
                 </div>
               </div>
             ) : status === 'error' ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center p-6">
                   <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-red-500 font-bold">Generation Failed</h3>
                      <p className="text-slate-400 text-sm">{errorMessage}</p>
                   </div>
                </div>
             ) : resultImage ? (
               <>
                 <img 
                    src={resultImage} 
                    alt="Generated" 
                    className="w-full h-full object-cover transition-all duration-300" 
                    style={{ filter: FILTERS.find(f => f.id === activeFilter)?.style }}
                 />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={handleDownload} className="bg-white text-black px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"><Download className="w-4 h-4" />Save</button>
                    <button onClick={handleShare} className="bg-black/50 text-white p-2.5 rounded-full backdrop-blur-md hover:bg-black/80 transition-colors" title="Share Image"><Share2 className="w-5 h-5" /></button>
                 </div>
               </>
             ) : (
               <div className="text-slate-500 dark:text-slate-600 flex flex-col items-center">
                 <Palette className="w-16 h-16 opacity-20 mb-4" />
                 <p>Art canvas ready</p>
               </div>
             )}
           </div>

           {resultImage && (
              <div className="space-y-2 animate-fade-in-up">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider"><Layers className="w-3 h-3" /> Filters</div>
                 <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {FILTERS.map((filter) => (
                       <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex-shrink-0 w-16 space-y-1 group ${activeFilter === filter.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                          <div className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeFilter === filter.id ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-transparent'}`}><img src={resultImage} className="w-full h-full object-cover" style={{ filter: filter.style }} /></div>
                          <div className="text-[10px] text-center font-medium text-slate-500 dark:text-slate-400 group-hover:text-purple-500">{filter.name}</div>
                       </button>
                    ))}
                 </div>
              </div>
           )}
           <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;