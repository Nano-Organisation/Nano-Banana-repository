
import React, { useState, useEffect, useRef } from 'react';
import { Film, Download, RefreshCw, Lock, Smartphone, Monitor, Upload, Video, AlertTriangle } from 'lucide-react';
import { generateVideoWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasKey, setHasKey] = useState<boolean>(false);
  
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
       handleSelectKey();
       return;
    }

    setStatus('loading');
    setErrorMessage('');
    setVideoUrl(null);

    try {
      const finalPrompt = prompt || (inputImage ? "Animate this image cinematically" : "");
      const url = await generateVideoWithGemini(finalPrompt, aspectRatio, inputImage || undefined);
      
      // Fix: Fetch as blob to avoid CORS/Auth issues in video tag
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load video stream. The link may have expired or is inaccessible.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setVideoUrl(objectUrl);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Video generation failed.");
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Unlock Nano Video</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Professional video generation is powered by the advanced <strong>Veo</strong> model. 
            To create videos, you must connect a paid Google Gemini API key.
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
          <Video className="w-8 h-8 text-red-500" />
          Nano Video
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Pro-grade video generation from text or image.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: veo-3.1
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
             
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Aspect Ratio</label>
                <div className="flex gap-3">
                   <button
                      onClick={() => setAspectRatio('16:9')}
                      className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                         aspectRatio === '16:9' ? 'bg-red-600/20 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                   >
                      <Monitor className="w-5 h-5" />
                      <span className="text-xs font-bold">16:9 Landscape</span>
                   </button>
                   <button
                      onClick={() => setAspectRatio('9:16')}
                      className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                         aspectRatio === '9:16' ? 'bg-red-600/20 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                   >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-xs font-bold">9:16 Portrait</span>
                   </button>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Input Image (Optional)</label>
                <div 
                   onClick={() => fileRef.current?.click()}
                   className={`
                     relative h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden
                     ${inputImage ? 'border-red-500 bg-slate-900' : 'border-slate-700 hover:border-red-500 hover:bg-slate-800'}
                   `}
                >
                   {inputImage ? (
                      <>
                         <img src={inputImage} className="h-full w-full object-contain opacity-50" />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">Image Loaded</span>
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
                         <span className="text-xs font-medium">Upload Reference Image</span>
                      </div>
                   )}
                   <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Prompt</label>
                <textarea
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                   placeholder="Describe the video you want to generate (e.g., A cinematic drone shot of a futuristic city at sunset...)"
                   className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none"
                />
             </div>

             <button
                onClick={handleGenerate}
                disabled={(!prompt.trim() && !inputImage) || status === 'loading'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20"
             >
                {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Film />}
                Generate Video
             </button>
          </div>
        </div>

        <div className="flex flex-col justify-center">
           {status === 'loading' ? (
              <div className="text-center space-y-4 p-8 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                 <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-red-400 font-medium animate-pulse">Rendering video...</p>
                 <p className="text-xs text-slate-500">Veo generation usually takes 30-60 seconds.</p>
              </div>
           ) : status === 'error' ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center p-6 bg-red-900/10 rounded-2xl border border-red-500/20">
                 <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-red-500 font-bold">Video Generation Failed</h3>
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
                 <div className={`
                    bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group mx-auto
                    ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm' : 'aspect-video w-full'}
                 `}>
                    <video 
                       src={videoUrl} 
                       controls 
                       autoPlay
                       loop
                       muted // Crucial for autoplay
                       playsInline
                       className="w-full h-full object-contain" 
                    />
                 </div>
                 <a 
                    href={videoUrl} 
                    download={`nano-video-${Date.now()}.mp4`}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
                 >
                    <Download className="w-5 h-5" />
                    Download MP4
                 </a>
              </div>
           ) : (
              <div className="text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 h-full flex flex-col items-center justify-center min-h-[400px]">
                 <Video className="w-16 h-16 opacity-20 mb-4" />
                 <p>Your video creation will appear here.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
