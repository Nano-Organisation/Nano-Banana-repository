
import React, { useState, useRef, useEffect } from 'react';
import { Film, Upload, RefreshCw, X, Download, Lock, Monitor, Smartphone, Square, Clapperboard, Music, Sliders, Play, Sparkles, Plus, Star, AlertCircle, Layers, Shuffle, Image as ImageIcon } from 'lucide-react';
import { generateBackgroundMusic, analyzeSlideshow } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const MUSIC_STYLES = [
  { id: 'cinematic', label: 'Dramatic / Cinematic', desc: 'Epic orchestral and slow builds' },
  { id: 'classical', label: 'Classical / Elegant', desc: 'Piano and strings for a refined feel' },
  { id: 'upbeat', label: 'Upbeat / Pop', desc: 'Energetic and modern' },
  { id: 'lofi', label: 'Lofi / Chill', desc: 'Relaxed hip-hop beats' },
  { id: 'nature', label: 'Nature Ambience', desc: 'Birds, wind, and soft pads' }
];

const TRANSITION_TYPES = [
  { id: 'fade', label: 'Cross-Fade', desc: 'Smooth opacity blending' },
  { id: 'slide', label: 'Slide Pushes', desc: 'Lateral frame movement' },
  { id: 'zoom', label: 'Zoom/Push', desc: 'Ken Burns style movement' },
  { id: 'cut', label: 'Hard Cut', desc: 'Instant frame swap' },
  { id: 'random', label: 'Random Mix', desc: 'Dynamic varied styles' }
];

const ImagesToMovie: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [musicStyle, setMusicStyle] = useState(MUSIC_STYLES[0].id);
  const [transitionType, setTransitionType] = useState(TRANSITION_TYPES[0].id);
  const [includeIntro, setIncludeIntro] = useState(true);
  const [includeOutro, setIncludeOutro] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [directorNotes, setDirectorNotes] = useState('Awaiting source signal for analysis...');
  const [musicWarning, setMusicWarning] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      await checkKey();
    }
  };

  const isPro = hasKey;
  const maxImages = 8; 

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      try {
        await runFileSecurityChecks(file as any, 'image');
        const reader = new FileReader();
        const b64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file as any);
        });
        newImages.push(b64);
      } catch (err: any) {
        alert(err.message);
      }
    }

    setImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // --- LITERAL SLIDESHOW RENDERER ---
  const handleGenerate = async () => {
    if (images.length === 0) return;

    setStatus('loading');
    setErrorMessage('');
    setVideoUrl(null);
    setMusicWarning(null);
    setDirectorNotes('AI is analyzing sequence and composing soundtrack...');

    try {
      // 1. AI STEP: Analyze sequence and generate soundtrack
      const selectedStyleLabel = MUSIC_STYLES.find(m => m.id === musicStyle)?.label || 'Cinematic';
      
      let notes = "Ready for production.";
      let musicVideoUrl = "";

      try {
        const [n, m] = await Promise.all([
           analyzeSlideshow(images),
           generateBackgroundMusic(`Slideshow about your images`, selectedStyleLabel)
        ]);
        notes = n;
        musicVideoUrl = m;
      } catch (aiErr: any) {
        const errStr = (aiErr?.message || "").toLowerCase();
        console.warn("AI Metadata/Music generation failed, proceeding with literal render only.", aiErr);
        if (errStr.includes("billing") || errStr.includes("quota")) {
           setMusicWarning("Soundtrack skipped: Your Gemini API quota is exhausted. Using silent mode for video generation.");
        } else {
           setMusicWarning("Soundtrack failed: An error occurred while generating audio. Proceeding without music.");
        }
      }
      
      setDirectorNotes(notes);

      // 2. STITCH STEP: Render the slideshow client-side
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Renderer initialization failed.");

      const isLandscape = aspectRatio === '16:9';
      canvas.width = isLandscape ? 1280 : 720;
      canvas.height = isLandscape ? 720 : 1280;

      // Load all images into memory
      /* Fix: Replaced 'new Image()' with 'document.createElement("img")' to prevent Illegal constructor errors during image loading. */
      const loadedImages = await Promise.all(images.map(src => new Promise<HTMLImageElement>((resolve, reject) => {
         const img = document.createElement('img');
         img.onload = () => resolve(img);
         img.onerror = reject;
         img.src = src;
      })));

      // Setup recording
      const stream = canvas.captureStream(30);
      let combinedStream = stream;

      // Handle Audio from generated music if available
      const audioEl = document.createElement('audio');
      if (musicVideoUrl) {
         try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();
            audioEl.crossOrigin = "anonymous";
            audioEl.src = musicVideoUrl;
            const source = audioCtx.createMediaElementSource(audioEl);
            source.connect(dest);
            source.connect(audioCtx.destination);
            combinedStream = new MediaStream([
               ...stream.getVideoTracks(),
               ...dest.stream.getAudioTracks()
            ]);
            // Ensure audio is buffered
            await new Promise((res) => {
                audioEl.oncanplaythrough = res;
                setTimeout(res, 2000); // Max wait
            });
         } catch (e) {
            console.warn("Audio sync failed", e);
         }
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      
      const videoResult = new Promise<string>((resolve) => {
         recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            resolve(URL.createObjectURL(blob));
         };
      });

      // RENDER LOOP
      const totalDuration = 15; // Set to 15s to ensure full capture and match UI
      const fps = 30;
      const frameDelay = 1000 / fps;
      const totalFrames = totalDuration * fps;
      const slideDuration = totalFrames / loadedImages.length;

      recorder.start();
      if (musicVideoUrl) audioEl.play().catch(() => {});

      for (let f = 0; f < totalFrames; f++) {
         const loopStartTime = Date.now();
         const currentSlide = Math.floor(f / slideDuration);
         const nextSlide = (currentSlide + 1) % loadedImages.length;
         const slideProgress = (f % slideDuration) / slideDuration;

         ctx.fillStyle = '#000';
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         const drawImg = (img: HTMLImageElement, alpha = 1, offset = 0, scale = 1) => {
            ctx.globalAlpha = alpha;
            const s = Math.min(canvas.width / img.width, canvas.height / img.height) * scale;
            const w = img.width * s;
            const h = img.height * s;
            const x = (canvas.width - w) / 2 + offset;
            const y = (canvas.height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
         };

         let globalAlpha = 1;
         
         // 1. Handle Smooth Intro (Fade in first slide)
         if (includeIntro && f < (fps * 1.5)) {
            globalAlpha = f / (fps * 1.5);
         }
         
         // 2. Handle Smooth Outro (Fade out last slide)
         if (includeOutro && f > (totalFrames - (fps * 1.5))) {
            globalAlpha = (totalFrames - f) / (fps * 1.5);
         }

         // 3. Handle Transitions
         if (slideProgress > 0.8 && loadedImages.length > 1 && currentSlide < loadedImages.length - 1) {
            const t = (slideProgress - 0.8) / 0.2;
            
            let activeTrans = transitionType;
            if (transitionType === 'random') {
               const options = ['fade', 'slide', 'zoom', 'cut'];
               activeTrans = options[currentSlide % options.length];
            }

            if (activeTrans === 'fade') {
               drawImg(loadedImages[currentSlide], (1 - t) * globalAlpha);
               drawImg(loadedImages[nextSlide], t * globalAlpha);
            } else if (activeTrans === 'slide') {
               drawImg(loadedImages[currentSlide], globalAlpha, -t * canvas.width);
               drawImg(loadedImages[nextSlide], globalAlpha, (1 - t) * canvas.width);
            } else if (activeTrans === 'zoom') {
               drawImg(loadedImages[currentSlide], (1 - t) * globalAlpha, 0, 1 + t * 0.1);
               drawImg(loadedImages[nextSlide], t * globalAlpha, 0, 0.9 + t * 0.1);
            } else { // cut
               drawImg(loadedImages[currentSlide], globalAlpha);
            }
         } else {
            // Apply subtle Ken Burns zoom during normal view
            const zoom = 1 + (f % slideDuration / slideDuration) * 0.05;
            drawImg(loadedImages[currentSlide], globalAlpha, 0, zoom);
         }

         ctx.globalAlpha = 1;

         // CRITICAL: Synchronize wall-clock time with frame generation
         const elapsed = Date.now() - loopStartTime;
         await new Promise(r => setTimeout(r, Math.max(0, frameDelay - elapsed)));
      }

      recorder.stop();
      if (musicVideoUrl) audioEl.pause();
      const finalUrl = await videoResult;
      setVideoUrl(finalUrl);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      const errStr = (err?.message || "").toLowerCase();
      if (errStr.includes("quota") || errStr.includes("429")) {
         setErrorMessage("Quota Exceeded: Your Gemini API key has hit its limit. Please check your usage at ai.google.dev/usage.");
      } else {
         setErrorMessage(err.message || "Failed to render movie.");
      }
      setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-3 tracking-tighter">
          <Clapperboard className="w-10 h-10 text-amber-500" />
          AI Images to movie
        </h2>
        <div className="flex flex-col items-center gap-1">
          <p className="text-slate-600 dark:text-slate-400">Assemble precise cinematic stories from your photo gallery.</p>
          <div className="flex gap-2 items-center">
             <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Engine: Canvas-AI Hybrid
             </span>
             {isPro && (
                <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                   <Star className="w-2.5 h-2.5 fill-current" /> Pro Mode Unlocked
                </span>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CONFIG COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            
            {/* Image Grid */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Source Frames ({images.length}/{maxImages})</label>
                 {images.length >= maxImages && <span className="text-[10px] font-bold text-amber-500 uppercase">Limit Reached</span>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                 {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group ring-1 ring-black/5 dark:ring-white/5">
                       <img src={img} className="w-full h-full object-cover" />
                       <button 
                         onClick={() => removeImage(idx)}
                         className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                       >
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                 ))}
                 {images.length < maxImages && (
                    <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-amber-500 hover:border-amber-500 transition-all hover:bg-amber-500/5"
                    >
                       <Plus className="w-6 h-6 mb-1" />
                       <span className="text-[9px] font-black">ADD</span>
                    </button>
                 )}
              </div>
              <input type="file" multiple ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <p className="text-[9px] text-slate-500 font-bold uppercase">Note: All uploaded images will be distributed across the 15s duration.</p>
            </div>

            {/* Movie Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Music className="w-3 h-3 text-amber-500" /> Soundtrack
                  </label>
                  <select 
                    value={musicStyle} 
                    onChange={e => setMusicStyle(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-[10px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                     {MUSIC_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Layers className="w-3 h-3 text-amber-500" /> Transition
                  </label>
                  <select 
                    value={transitionType} 
                    onChange={e => setTransitionType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-[10px] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                     {TRANSITION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Monitor className="w-3 h-3 text-amber-500" /> Aspect Ratio
               </label>
               <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                 <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-all ${aspectRatio === '16:9' ? 'bg-amber-600 text-white shadow' : 'text-slate-500'}`}>
                    <Monitor className="w-3 h-3" /> 16:9
                 </button>
                 <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold transition-all ${aspectRatio === '9:16' ? 'bg-amber-600 text-white shadow' : 'text-slate-500'}`}>
                    <Smartphone className="w-3 h-3" /> 9:16
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => setIncludeIntro(!includeIntro)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${includeIntro ? 'bg-slate-100 dark:bg-slate-800 border-amber-500/50 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-600'}`}
               >
                  <div className="flex items-center gap-2">
                     <Sparkles className={`w-3.5 h-3.5 ${includeIntro ? 'text-amber-500' : ''}`} />
                     <span className="text-[10px] font-bold uppercase">Smooth Intro</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${includeIntro ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
               </button>
               <button 
                  onClick={() => setIncludeOutro(!includeOutro)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${includeOutro ? 'bg-slate-100 dark:bg-slate-800 border-amber-500/50 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-600'}`}
               >
                  <div className="flex items-center gap-2">
                     <Film className={`w-3.5 h-3.5 ${includeOutro ? 'text-amber-500' : ''}`} />
                     <span className="text-[10px] font-bold uppercase">Smooth Outro</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${includeOutro ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
               </button>
            </div>

            <button
               onClick={handleGenerate}
               disabled={images.length === 0 || status === 'loading'}
               className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black py-4 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] mt-2 group"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />}
               {status === 'loading' ? 'STITCHING FRAMES...' : 'PRODUCE MOVIE'}
            </button>
          </div>
          
          {musicWarning && (
             <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-600 dark:text-amber-200 font-bold uppercase leading-relaxed">
                   {musicWarning}
                </p>
             </div>
          )}
        </div>

        {/* OUTPUT COLUMN */}
        <div className="lg:col-span-7">
           <div className={`
             relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col items-center justify-center group
             ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[360px] mx-auto' : 'aspect-video w-full'}
           `}>
             {/* Tech Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

             {status === 'loading' ? (
                <div className="text-center p-10 space-y-6 z-10">
                   <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Film className="w-6 h-6 text-amber-500 animate-pulse" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-xs">Directing Sequence</p>
                      <p className="text-slate-600 text-[10px] max-w-xs mx-auto uppercase">Processing precise transitions and mapping AI soundtrack to {images.length} slides...</p>
                   </div>
                </div>
             ) : videoUrl ? (
                <div className="w-full h-full relative z-10">
                   <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay loop playsInline />
                   <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={videoUrl} 
                        download="ai-movie.mp4"
                        className="bg-white text-black font-black px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-transform shadow-2xl"
                      >
                         <Download className="w-5 h-5" /> SAVE MOVIE
                      </a>
                   </div>
                </div>
             ) : errorMessage ? (
                <div className="text-center p-10 space-y-4 z-10">
                   <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                   <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs">Production Halted</h3>
                      <p className="text-slate-500 text-[10px] leading-relaxed max-sm">{errorMessage}</p>
                   </div>
                   <button onClick={() => setStatus('idle')} className="text-amber-500 font-black text-[10px] uppercase underline tracking-widest">Restart Pipeline</button>
                </div>
             ) : (
                <div className="text-center text-slate-300 dark:text-slate-800 space-y-4 z-10 px-10">
                   <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-800 shadow-inner">
                      <Clapperboard className="w-10 h-10 opacity-10" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Awaiting_Source_Signal</p>
                </div>
             )}
           </div>
           
           {(videoUrl || status === 'loading') && (
              <div className="mt-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex items-start gap-5 animate-fade-in-up">
                 <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Cinematic Continuity Engine</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-500 leading-relaxed mt-1">
                       {directorNotes}
                    </p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ImagesToMovie;