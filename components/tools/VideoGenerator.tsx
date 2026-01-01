
import React, { useState, useEffect, useRef } from 'react';
import { Film, Download, RefreshCw, Lock, Smartphone, Monitor, Upload, Video, AlertTriangle, Clock, PlusCircle, ArrowRight, Layers, Clapperboard, X, Film as FilmIcon, Palette } from 'lucide-react';
import { generateAdvancedVideo, extendVideo } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const REASSURING_MESSAGES = [
  "Initializing neural canvases...",
  "Synthesizing cinematic motion...",
  "Upscaling textures to 720p...",
  "Polishing frame transitions...",
  "Finalizing high-fidelity stream...",
  "Running temporal consistency checks...",
  "Embedding dynamic motion vectors...",
  "Optimizing light transport..."
];

const STYLES = [
  { id: 'cinematic', label: 'Cinematic', desc: 'Modern cinematic digital art, dynamic lighting, high detail, movie-style atmosphere.' },
  { id: 'pixar', label: '3D Pixar', desc: 'Cute, rounded, high-fidelity 3D render, bright and whimsical Pixar-inspired animation.' },
  { id: 'noir', label: 'Noir', desc: 'High-contrast black and white, dramatic shadows, ink wash textures, gritty and moody atmosphere.' },
  { id: 'anime', label: 'Anime', desc: 'Classic Japanese animation style, vibrant colors, expressive character movement, cel-shaded.' },
  { id: 'clay', label: 'Claymation', desc: 'Handcrafted stop-motion clay aesthetic, visible thumbprints, soft studio lighting.' },
  { 
    id: 'edewede_ai_o3', 
    label: 'Edewede-AI-O3', 
    desc: 'Analog 2D storybook minimalism inspired by mid-century printmaking. Features intentional contours and flat color blocks with misregistered ink edges mimicking vintage offset printing. Palette: strictly limited earthy tones on off-white paper. Compositions are flattened frontal views with zero gradients, zero highlights, and zero 3D depth cues. Environment props are reduced to primitive geometric blocks.',
    uiDesc: 'Pure 2D minimalism, flat tones, vintage print aesthetic.'
  }
];

interface TimelineClip {
  id: string;
  url: string;
  handle: any;
  prompt: string;
  type: 'initial' | 'visual' | 'narrative';
}

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedStyleId, setSelectedStyleId] = useState(STYLES[0].id);
  const [inputImage, setInputImage] = useState<string | null>(null);
  
  const [timeline, setTimeline] = useState<TimelineClip[]>([]);
  const [extensionPrompt, setExtensionPrompt] = useState('');
  const [extensionMode, setExtensionMode] = useState<'visual' | 'narrative'>('visual');
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryMessage, setRetryMessage] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(REASSURING_MESSAGES[0]);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    checkKey();
    return () => { if (loadingIntervalRef.current) window.clearInterval(loadingIntervalRef.current); };
  }, []);

  const startLoadingMessages = () => {
    let i = 0;
    setLoadingMessage(REASSURING_MESSAGES[0]);
    loadingIntervalRef.current = window.setInterval(() => {
      i = (i + 1) % REASSURING_MESSAGES.length;
      setLoadingMessage(REASSURING_MESSAGES[i]);
    }, 8000);
  };

  const stopLoadingMessages = () => {
    if (loadingIntervalRef.current) {
      window.clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

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
    setTimeline([]); 
    startLoadingMessages();

    const onRetry = (msg: string) => setRetryMessage(msg);
    const selectedStyle = STYLES.find(s => s.id === selectedStyleId);

    try {
      const basePrompt = prompt || (inputImage ? "Animate this image" : "");
      const finalPrompt = `${basePrompt}. Style: ${selectedStyle?.desc}`;
      
      const { uri, video } = await generateAdvancedVideo(finalPrompt, aspectRatio, inputImage || undefined, onRetry);
      
      if (!uri) throw new Error("Synthesis failed.");

      const response = await fetch(uri);
      if (!response.ok) throw new Error("Failed to download video stream.");
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
          setErrorMessage("Please select a billing-enabled project to continue.");
          handleSelectKey();
      } else {
          setErrorMessage(msg || "Generation failed.");
      }
      setStatus('error');
    } finally {
      setRetryMessage('');
      stopLoadingMessages();
    }
  };

  const handleExtension = async () => {
    if (!extensionPrompt.trim() || timeline.length === 0) return;
    
    const lastClip = timeline[timeline.length - 1];
    const aiStudio = getAIStudio();
    if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
       handleSelectKey();
    }

    setStatus('loading');
    setErrorMessage('');
    setRetryMessage('');
    startLoadingMessages();
    
    const onRetry = (msg: string) => setRetryMessage(msg);
    const selectedStyle = STYLES.find(s => s.id === selectedStyleId);

    try {
      let result;
      const finalPrompt = `${extensionPrompt}. Maintain consistency with the previous scene. Style: ${selectedStyle?.desc}`;
      
      if (extensionMode === 'visual') {
        result = await extendVideo(finalPrompt, lastClip.handle, onRetry);
      } else {
        result = await generateAdvancedVideo(finalPrompt, aspectRatio, undefined, onRetry);
      }
      
      const { uri, video } = result;
      if (!uri) throw new Error("Extension failed.");

      const response = await fetch(uri);
      if (!response.ok) throw new Error("Failed to load extended video stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setTimeline(prev => [...prev, {
        id: Date.now().toString(),
        url: objectUrl,
        handle: video,
        prompt: finalPrompt,
        type: extensionMode
      }]);

      setExtensionPrompt('');
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found") || msg.includes("BILLING_ERROR") || msg.includes("active billing")) {
          setHasKey(false);
          setErrorMessage("Please select a billing-enabled project.");
          handleSelectKey();
      } else {
          setErrorMessage(msg || "Extension failed.");
      }
      setStatus('error');
    } finally {
      setRetryMessage('');
      stopLoadingMessages();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <FilmIcon className="w-8 h-8 text-red-600" />
          AI Video
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400 text-sm">Pro-grade video generation powered by Veo.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Model: veo-3.1
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Controls Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aspect Ratio</label>
                   <div className="flex bg-slate-50 dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                      <button 
                        onClick={() => setAspectRatio('16:9')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all ${aspectRatio === '16:9' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        16:9
                      </button>
                      <button 
                        onClick={() => setAspectRatio('9:16')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all ${aspectRatio === '9:16' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        9:16
                      </button>
                   </div>
                </div>
             </div>

             {/* Style Selector Grid */}
             <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Palette className="w-3.5 h-3.5" /> Visual Style
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                   {STYLES.map(s => (
                      <button
                         key={s.id}
                         onClick={() => setSelectedStyleId(s.id)}
                         className={`p-3 rounded-xl border text-left transition-all ${
                            selectedStyleId === s.id 
                            ? 'bg-red-50 dark:bg-red-900/10 border-red-500 text-red-600 dark:text-red-400 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                         }`}
                      >
                         <div className="font-bold text-[10px] uppercase truncate">{s.label}</div>
                         <div className="text-[9px] opacity-60 leading-tight mt-0.5 line-clamp-1">{(s as any).uiDesc || s.desc}</div>
                      </button>
                   ))}
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source Image (Optional)</label>
                <div 
                   onClick={() => fileRef.current?.click()}
                   className={`relative h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${inputImage ? 'border-red-500 bg-red-50 dark:bg-red-900/5' : 'border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-slate-50 dark:hover:bg-slate-950'}`}
                >
                   {inputImage ? (
                      <>
                         <img src={inputImage} className="h-full w-full object-contain opacity-50" />
                         <button onClick={(e) => { e.stopPropagation(); setInputImage(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors">
                            <X className="w-4 h-4" />
                         </button>
                      </>
                   ) : (
                      <div className="text-center text-slate-400">
                         <Upload className="w-6 h-6 mx-auto mb-1 opacity-50" />
                         <span className="text-[10px] font-bold">SELECT BASE IMAGE</span>
                      </div>
                   )}
                   <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scene Vision</label>
                <textarea 
                   value={prompt} 
                   onChange={(e) => setPrompt(e.target.value)} 
                   placeholder="Describe the cinematic action..." 
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 h-24 resize-none transition-colors" 
                />
             </div>

             <button 
                onClick={handleGenerate} 
                disabled={(!prompt.trim() && !inputImage) || status === 'loading'} 
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 uppercase tracking-widest text-xs"
             >
                  {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Film className="w-4 h-4" />}
                  Generate First Scene
             </button>
          </div>

          {timeline.length > 0 && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-3">
                   <PlusCircle className="w-5 h-5 text-indigo-500" />
                   <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest">Continue the Story</h3>
                </div>

                <div className="space-y-4">
                   <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <button 
                        onClick={() => setExtensionMode('visual')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all ${extensionMode === 'visual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                         <Layers className="w-3.5 h-3.5" /> Visual Extension
                      </button>
                      <button 
                        onClick={() => setExtensionMode('narrative')}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all ${extensionMode === 'narrative' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                         <Clapperboard className="w-3.5 h-3.5" /> Narrative Cut
                      </button>
                   </div>
                   
                   <textarea 
                     value={extensionPrompt} 
                     onChange={(e) => setExtensionPrompt(e.target.value)} 
                     placeholder={extensionMode === 'visual' ? "How does the motion continue?" : "What happens in the next scene?"} 
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 resize-none text-sm transition-colors" 
                   />

                   <button 
                     onClick={handleExtension} 
                     disabled={!extensionPrompt.trim() || status === 'loading'} 
                     className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 uppercase tracking-widest text-xs"
                   >
                      {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      Forge {extensionMode === 'visual' ? 'Extension' : 'Next Scene'}
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* Results Column */}
        <div className="space-y-6">
           {status === 'loading' && (
              <div className="text-center space-y-6 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-fade-in">
                 <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <div className="space-y-3">
                    <p className="text-red-500 font-bold uppercase tracking-widest text-sm animate-pulse">{loadingMessage}</p>
                    {retryMessage && (
                       <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-fade-in mx-auto w-fit">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">{retryMessage}</span>
                       </div>
                    )}
                    <p className="text-[10px] text-slate-500 uppercase font-medium">Veo synthesis in progress (up to 60s)</p>
                 </div>
              </div>
           )}

           {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-500/20 shadow-xl">
                 <AlertTriangle className="w-10 h-10 text-red-500" />
                 <div className="space-y-1">
                    <h3 className="text-slate-900 dark:text-white font-bold uppercase text-sm">Synthesis Halted</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-sm">{errorMessage}</p>
                 </div>
                 {!hasKey && (
                    <button onClick={handleSelectKey} className="text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1.5 mt-2">
                       <Lock className="w-3 h-3" /> Re-Verify License
                    </button>
                 )}
              </div>
           )}

           {timeline.length === 0 && status !== 'loading' && (
              <div className="text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 h-full flex flex-col items-center justify-center min-h-[400px]">
                 <Video className="w-16 h-16 opacity-10 mb-4" />
                 <p className="text-sm font-bold uppercase tracking-widest opacity-20">Awaiting Signal</p>
              </div>
           )}

           <div className="space-y-8 pb-10">
              {timeline.map((clip, index) => (
                 <div key={clip.id} className="space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sequence Segment {index + 1}</span>
                       <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          clip.type === 'visual' ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-900/10' :
                          clip.type === 'narrative' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-900/10' :
                          'text-slate-500 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                       }`}>
                          {clip.type === 'initial' ? 'Start' : clip.type === 'visual' ? 'Extension' : 'Cut'}
                       </span>
                    </div>
                    
                    <div className={`bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 relative group mx-auto transition-transform hover:scale-[1.01] ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[320px]' : 'aspect-video w-full'}`}>
                       <video src={clip.url} controls loop playsInline className="w-full h-full object-contain" />
                       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={clip.url} download={`scene-${index + 1}.mp4`} className="bg-white/90 text-black p-2 rounded-lg backdrop-blur-md shadow-xl transition-transform active:scale-95 block"><Download className="w-4 h-4" /></a>
                       </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 italic text-xs text-slate-500 dark:text-slate-400 leading-relaxed shadow-sm">
                       "{clip.prompt}"
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;
