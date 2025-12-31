import React, { useState, useEffect, useRef } from 'react';
import { Film, Download, RefreshCw, Lock, Smartphone, Monitor, Upload, Video, AlertTriangle, Clock, PlusCircle, ArrowRight, Layers, Clapperboard } from 'lucide-react';
import { generateAdvancedVideo, extendVideo } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

interface TimelineClip {
  id: string;
  url: string;
  handle: any;
  prompt: string;
  type: 'initial' | 'visual' | 'narrative';
}

const VideoGenerator: React.FC = () => {
  // Initial Gen State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [inputImage, setInputImage] = useState<string | null>(null);
  
  // Story/Timeline State
  const [timeline, setTimeline] = useState<TimelineClip[]>([]);
  
  // Extension State
  const [extensionPrompt, setExtensionPrompt] = useState('');
  const [extensionMode, setExtensionMode] = useState<'visual' | 'narrative'>('visual');
  
  // System State
  const [status, setStatus] = useState<LoadingState>('idle');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryMessage, setRetryMessage] = useState('');
  
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
      setHasKey(true);
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
    }

    setStatus('loading');
    setErrorMessage('');
    setRetryMessage('');
    
    // Clear timeline on new initial generation? 
    // Yes, a new generation from the top box starts a new story.
    setTimeline([]); 

    const onRetry = (msg: string) => setRetryMessage(msg);

    try {
      const finalPrompt = prompt || (inputImage ? "Animate this image cinematically" : "");
      
      const { uri, video } = await generateAdvancedVideo(finalPrompt, aspectRatio, inputImage || undefined, onRetry);
      
      const response = await fetch(uri);
      if (!response.ok) throw new Error("Failed to load video stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setTimeline([{
        id: Date.now().toString(),
        url: objectUrl,
        handle: video,
        prompt: finalPrompt,
        type: 'initial'
      }]);
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found") || msg.includes("BILLING_ERROR") || msg.includes("active billing")) {
          setHasKey(false);
          handleSelectKey();
          setErrorMessage("Please select a billing-enabled project to continue.");
      } else {
          setErrorMessage(msg || "Generation failed");
      }
      setStatus('error');
    } finally {
      setRetryMessage('');
    }
  };

  const handleExtension = async () => {
    if (!extensionPrompt.trim() || timeline.length === 0) return;
    
    const lastClip = timeline[timeline.length - 1];
    
    setStatus('loading');
    setErrorMessage('');
    setRetryMessage('');
    
    const onRetry = (msg: string) => setRetryMessage(msg);

    try {
      let result;
      
      if (extensionMode === 'visual') {
        // Option A: Extend Clip (Time Continuity) - Uses previous handle
        result = await extendVideo(extensionPrompt, lastClip.handle, onRetry);
      } else {
        // Option B: New Scene (Narrative Continuity) - Fresh Gen, NO handle
        result = await generateAdvancedVideo(extensionPrompt, aspectRatio, undefined, onRetry);
      }
      
      const { uri, video } = result;
      
      const response = await fetch(uri);
      if (!response.ok) throw new Error("Failed to load extended video stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setTimeline(prev => [...prev, {
        id: Date.now().toString(),
        url: objectUrl,
        handle: video,
        prompt: extensionPrompt,
        type: extensionMode
      }]);

      setExtensionPrompt(''); // Clear input after success
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found") || msg.includes("BILLING_ERROR") || msg.includes("active billing")) {
          setHasKey(false);
          handleSelectKey();
          setErrorMessage("Please select a billing-enabled project to continue.");
      } else {
          setErrorMessage(msg || "Extension failed.");
      }
      setStatus('error');
    } finally {
      setRetryMessage('');
    }
  };

  if (!hasKey) {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-fade-in text-center py-12">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Unlock AI Video</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Professional video generation is powered by the advanced <strong>Veo</strong> model. 
            To create videos, you must connect a paid Google Gemini API key.
          </p>
          <button onClick={handleSelectKey} className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg">Connect API Key</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Video className="w-8 h-8 text-red-500" />
          AI Video
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Pro-grade video generation from text or image.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">Model: veo-3.1</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Inputs (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Generator Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Aspect Ratio</label>
                <div className="flex gap-3">
                   <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${aspectRatio === '16:9' ? 'bg-red-600/20 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Monitor className="w-5 h-5" /><span className="text-xs font-bold">16:9 Landscape</span></button>
                   <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${aspectRatio === '9:16' ? 'bg-red-600/20 border-red-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}><Smartphone className="w-5 h-5" /><span className="text-xs font-bold">9:16 Portrait</span></button>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Input Image (Optional)</label>
                <div onClick={() => fileRef.current?.click()} className={`relative h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${inputImage ? 'border-red-500 bg-slate-900' : 'border-slate-700 hover:border-red-500 hover:bg-slate-800'}`}>
                   {inputImage ? (<><img src={inputImage} className="h-full w-full object-contain opacity-50" /><div className="absolute inset-0 flex items-center justify-center"><span className="bg-black/70 text-white text-xs px-2 py-1 rounded">Image Loaded</span></div><button onClick={(e) => { e.stopPropagation(); setInputImage(null); }} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"><RefreshCw className="w-3 h-3" /></button></>) : (<div className="text-center text-slate-500"><Upload className="w-6 h-6 mx-auto mb-1 opacity-50" /><span className="text-xs font-medium">Upload Reference Image</span></div>)}
                   <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Prompt</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the video you want to generate..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none" />
             </div>

             <button onClick={handleGenerate} disabled={(!prompt.trim() && !inputImage) || status === 'loading'} className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20">
                  {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Film />}
                  Generate Video
             </button>
          </div>

          {/* Extension Panel (Appears if timeline exists) */}
          {timeline.length > 0 && (
             <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 shadow-lg space-y-4 animate-fade-in-up">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                   <PlusCircle className="w-5 h-5" />
                   <h3 className="text-sm font-bold uppercase tracking-widest">Story Continuation</h3>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Extension Mode</label>
                   <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button 
                        onClick={() => setExtensionMode('visual')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${extensionMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Continues the exact shot (time extension)"
                      >
                         <Layers className="w-3 h-3" /> Visual Extension
                      </button>
                      <button 
                        onClick={() => setExtensionMode('narrative')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all ${extensionMode === 'narrative' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Creates a new shot in the sequence"
                      >
                         <Clapperboard className="w-3 h-3" /> New Scene
                      </button>
                   </div>
                   <p className="text-[9px] text-slate-500 mt-1">
                      {extensionMode === 'visual' 
                        ? "Maintains exact pixels/characters, moves time forward." 
                        : "Generates a fresh shot based on new prompt (New camera/action)."}
                   </p>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">What happens next?</label>
                   <textarea 
                     value={extensionPrompt} 
                     onChange={(e) => setExtensionPrompt(e.target.value)} 
                     placeholder={extensionMode === 'visual' ? "Describe the movement..." : "Describe the next scene..."} 
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none" 
                   />
                </div>

                <button 
                  onClick={handleExtension} 
                  disabled={!extensionPrompt.trim() || status === 'loading'} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                   {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                   Generate {extensionMode === 'visual' ? 'Extension' : 'Next Scene'}
                </button>
             </div>
          )}
        </div>

        {/* RIGHT COLUMN: Video Sequence (7/12) */}
        <div className="lg:col-span-7 space-y-6">
           {status === 'loading' && (
              <div className="text-center space-y-4 p-8 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl animate-fade-in">
                 <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <div className="space-y-2">
                    <p className="text-red-400 font-medium animate-pulse">Rendering video...</p>
                    {retryMessage && (
                      <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 animate-fade-in mx-auto w-fit">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">{retryMessage}</span>
                      </div>
                    )}
                 </div>
                 <p className="text-xs text-slate-500">Veo generation usually takes 30-60 seconds.</p>
              </div>
           )}

           {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center p-6 bg-red-900/10 rounded-2xl border border-red-500/20">
                 <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                 <div className="space-y-1"><h3 className="text-red-500 font-bold">Generation Failed</h3><p className="text-slate-400 text-sm">{errorMessage}</p></div>
                 <button onClick={handleSelectKey} className="text-amber-500 text-xs hover:underline flex items-center gap-1 mx-auto mt-2"><Lock className="w-3 h-3" /> Check API Key</button>
              </div>
           )}

           {timeline.length === 0 && status !== 'loading' && (
              <div className="text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
                 <Video className="w-16 h-16 opacity-20 mb-4" /><p>Your story timeline will appear here.</p>
              </div>
           )}

           {timeline.map((clip, index) => (
              <div key={clip.id} className="space-y-3 animate-fade-in-up">
                 <div className="flex items-center gap-3">
                    <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-1 rounded-md">Scene {index + 1}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                       clip.type === 'visual' ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' :
                       clip.type === 'narrative' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                       'text-slate-500 border-slate-700 bg-slate-800'
                    }`}>
                       {clip.type === 'initial' ? 'Start' : clip.type === 'visual' ? 'Visual Ext' : 'Narrative Cut'}
                    </span>
                 </div>
                 
                 <div className={`bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group mx-auto ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm' : 'aspect-video w-full'}`}>
                    <video src={clip.url} controls loop playsInline className="w-full h-full object-contain" />
                 </div>
                 
                 <div className="flex justify-between items-start bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                    <p className="text-xs text-slate-400 italic line-clamp-2 flex-1 mr-4">"{clip.prompt}"</p>
                    <a href={clip.url} download={`scene-${index + 1}.mp4`} className="text-slate-500 hover:text-white transition-colors">
                       <Download className="w-4 h-4" />
                    </a>
                 </div>
                 
                 {index < timeline.length - 1 && (
                    <div className="flex justify-center py-2">
                       <div className="h-8 w-0.5 bg-slate-800"></div>
                    </div>
                 )}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;