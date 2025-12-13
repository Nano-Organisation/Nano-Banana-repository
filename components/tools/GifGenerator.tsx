
import React, { useState, useEffect, useRef } from 'react';
import { Film, Download, RefreshCw, Lock, Smartphone, Monitor, Image as ImageIcon, Square, Upload, AlertTriangle } from 'lucide-react';
import { generateVideoWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const GifGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [inputImage, setInputImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      await checkKey();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            await runFileSecurityChecks(file, 'image');
            const reader = new FileReader();
            reader.onload = () => setInputImage(reader.result as string);
            reader.readAsDataURL(file);
        } catch (err: any) {
            alert(err.message);
            e.target.value = '';
        }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !inputImage) return; 
    
    const aiStudio = getAIStudio();
    if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
       setStatus('error');
       setErrorMessage("API Key required");
       setHasKey(false);
       return;
    }

    setStatus('loading');
    setVideoUrl(null);
    setErrorMessage('');

    try {
      const finalPrompt = prompt || (inputImage ? "Animate this image" : "");
      const generatedUrl = await generateVideoWithGemini(finalPrompt, aspectRatio, inputImage || undefined);
      
      // Robust Fetch: Get blob to avoid cross-origin/auth issues in video tag
      const response = await fetch(generatedUrl);
      if (!response.ok) throw new Error("Failed to load generated video stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setVideoUrl(objectUrl);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Generation failed");
      setStatus('error');
    }
  };

  if (!hasKey) {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-fade-in text-center py-12">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700">
          <Lock className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Unlock AI GIF</h2>
          <p className="text-slate-600 dark:text-slate-400">
            This feature is powered by the advanced <strong>Veo</strong> model. 
            To create animations, you must select a valid paid API key (GCP project).
          </p>
          <div className="flex flex-col gap-3 justify-center items-center pt-4">
             <button
               onClick={handleSelectKey}
               className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-rose-900/20"
             >
               Select API Key
             </button>
             <a 
               href="https://ai.google.dev/gemini-api/docs/billing" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-sm text-slate-500 hover:text-slate-300 underline"
             >
               View Billing Documentation
             </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Film className="w-8 h-8 text-rose-500" />
          AI GIF
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate videos from text or animate images.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Powered by Veo 3.1
           </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-400">Format</label>
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => setAspectRatio('16:9')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${aspectRatio === '16:9' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Landscape (16:9)"
              >
                <Monitor className="w-3.5 h-3.5" />
                Landscape
              </button>
              <button 
                onClick={() => setAspectRatio('1:1')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${aspectRatio === '1:1' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Square (1:1)"
              >
                <Square className="w-3.5 h-3.5" />
                Square
              </button>
              <button 
                onClick={() => setAspectRatio('9:16')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${aspectRatio === '9:16' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                title="Story (9:16)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Story
              </button>
            </div>
          </div>
          
          <div 
             onClick={() => fileRef.current?.click()}
             className={`
               relative h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden
               ${inputImage ? 'border-rose-500 bg-slate-900' : 'border-slate-700 hover:border-rose-500 hover:bg-slate-800'}
             `}
          >
             {inputImage ? (
                <>
                   <img src={inputImage} className="h-full w-full object-contain opacity-60" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white border border-slate-600">
                         Using as Base
                      </div>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setInputImage(null); }}
                     className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                   >
                     <RefreshCw className="w-3 h-3" />
                   </button>
                </>
             ) : (
                <div className="text-center text-slate-500">
                   <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                   <span className="text-xs font-medium">Upload Image to Animate (Optional)</span>
                </div>
             )}
             <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={inputImage ? "Describe how to animate this image (e.g. 'Make the water flow', 'Zoom in')" : "A cyberpunk cat running on a neon rooftop..."}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 h-32 resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={(!prompt && !inputImage) || status === 'loading'}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/20"
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Film />}
            Generate Video
          </button>
        </div>

        <div className={`
          flex-1 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex items-center justify-center relative group transition-all mx-auto
          ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm w-full' : aspectRatio === '1:1' ? 'aspect-square max-w-md w-full' : 'aspect-video w-full'}
        `}>
          {status === 'loading' ? (
             <div className="text-center space-y-4 p-6">
              <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-rose-400 text-sm animate-pulse">Rendering video frames...</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">This process uses the powerful Veo model and may take up to a minute.</p>
            </div>
          ) : status === 'error' ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center p-6">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30">
                   <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-white font-bold">Generation Failed</h3>
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
            <>
              <video 
                src={videoUrl} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none md:pointer-events-auto">
                 <a 
                  href={videoUrl} 
                  download="ai-animation.mp4"
                  className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
              </div>
            </>
          ) : (
            <div className="text-slate-600 flex flex-col items-center text-center p-6">
              <Film className="w-16 h-16 opacity-20 mb-4" />
              <p>Animation preview</p>
              {inputImage && <p className="text-xs text-rose-500 mt-2 font-medium">Ready to animate upload</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GifGenerator;
