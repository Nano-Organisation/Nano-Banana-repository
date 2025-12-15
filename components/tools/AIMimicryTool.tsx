
import React, { useState, useEffect, useRef } from 'react';
import { Video, RefreshCw, Upload, Lock, Play, Pause, Zap, Sparkles, Ghost, Camera, Box, Type, Activity, Image as ImageIcon, Download, AlertTriangle } from 'lucide-react';
import { generateVideoWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const AIMimicryTool: React.FC = () => {
  // Config State
  const [hallucinate, setHallucinate] = useState(false);
  const [environment, setEnvironment] = useState('Studio');
  const [replaceSubject, setReplaceSubject] = useState('');
  const [textOverlay, setTextOverlay] = useState('');
  const [smoothMotion, setSmoothMotion] = useState(false);
  const [backgroundType, setBackgroundType] = useState('Original');
  
  // Video State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  
  // Output State
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasKey, setHasKey] = useState<boolean>(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setHasKey(true); // Fallback
    }
  };

  const handleSelectKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      await aiStudio.openSelectKey();
      await checkKey();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setResultVideoUrl(null);
      setCapturedFrame(null);
      setIsPlaying(false);
      setErrorMessage('');
      setStatus('idle');
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      // Ensure dimensions are valid
      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedFrame(canvas.toDataURL('image/jpeg'));
      }
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      // Auto capture first frame after a slight delay
      setTimeout(() => {
         if (videoRef.current) {
            videoRef.current.currentTime = 0.1; // Seek a bit to avoid black frame
         }
      }, 500);
    }
  };

  // Capture frame when seeking ends (for robust capture)
  const handleSeeked = () => {
     if (!capturedFrame) captureFrame();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleGenerate = async () => {
    if (!capturedFrame && !videoSrc) return;
    
    // Ensure we have a frame to send
    if (!capturedFrame) captureFrame();
    
    // Wait a tick for state update if just captured
    await new Promise(r => setTimeout(r, 200));
    const frameToSend = capturedFrame || (canvasRef.current ? canvasRef.current.toDataURL('image/jpeg') : null);

    if (!frameToSend || frameToSend === 'data:,') {
       alert("Could not capture video frame. Please ensure the video is loaded and visible.");
       return;
    }

    if (!hasKey) {
       handleSelectKey();
       return;
    }

    setStatus('loading');
    setErrorMessage('');
    setResultVideoUrl(null);

    try {
      // Construct imaginative prompt
      const mimicryStyle = hallucinate ? "Surreal, dreamlike, abstract interpretation" : "High fidelity, realistic mimicry";
      const subject = replaceSubject ? `Replace subject with a ${replaceSubject}` : "The original subject";
      const bgPrompt = backgroundType === 'Original' ? "matching the original scene" : `with a ${backgroundType} background`;
      const motion = smoothMotion ? "ultra-smooth, fluid motion" : "dynamic motion";
      const env = environment === 'Studio' ? "" : `in a ${environment} environment`;
      const text = textOverlay ? `Text overlay: "${textOverlay}" integrated into scene` : "";

      const prompt = `AI Mimicry: ${mimicryStyle}. ${subject} performing the action from the reference video. ${bgPrompt} ${env}. ${motion}. ${text}. Cinematic lighting, 4k detail.`;

      const url = await generateVideoWithGemini(prompt, '16:9', frameToSend);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load video stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setResultVideoUrl(objectUrl);
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      let msg = e.message || "Failed to mimic video.";
      if (msg.includes("safety filters") || msg.includes("download link")) {
         msg = "Generation blocked by safety filters. Veo avoids generating videos of realistic people or harmful content. Try a different video or abstract prompt.";
      }
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600 flex items-center justify-center gap-3 tracking-tighter">
          <Ghost className="w-10 h-10 text-fuchsia-500" />
          AI Mimicry
        </h2>
        <p className="text-slate-400">Upload a video. Clone the vibe. Twist reality.</p>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-[#0f0a1e] to-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
         {/* Top Bar */}
         <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-sm">
               <Activity className="w-4 h-4" /> VE0-3.1 ACTIVE
            </div>
            {!hasKey && (
               <button onClick={handleSelectKey} className="text-xs flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold border border-amber-500/30 px-3 py-1.5 rounded-full bg-amber-500/10 transition-all">
                  <Lock className="w-3 h-3" /> UNLOCK PRO
               </button>
            )}
         </div>

         <div className="flex flex-col lg:flex-row h-[700px]">
            
            {/* LEFT: CONTROLS */}
            <div className="w-full lg:w-[400px] border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto bg-black/20 custom-scrollbar">
               
               {/* Source */}
               <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Source Material</label>
                  <div 
                     onClick={() => fileInputRef.current?.click()}
                     className={`
                        h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                        ${videoSrc ? 'border-fuchsia-500/50 bg-fuchsia-900/10' : 'border-slate-700 hover:border-fuchsia-500 hover:bg-slate-800'}
                     `}
                  >
                     {videoSrc ? (
                        <>
                           <video src={videoSrc} className="w-full h-full object-cover opacity-50" />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">Change Video</span>
                           </div>
                        </>
                     ) : (
                        <div className="text-center text-slate-500 group-hover:text-fuchsia-400 transition-colors">
                           <Upload className="w-8 h-8 mx-auto mb-2" />
                           <span className="text-xs font-bold">DROP VIDEO HERE</span>
                        </div>
                     )}
                     <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
                  </div>
               </div>

               {/* Mimicry Core */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                     <span className="text-sm font-bold text-white flex items-center gap-2"><Ghost className="w-4 h-4 text-purple-400"/> Hallucinate</span>
                     <button 
                        onClick={() => setHallucinate(!hallucinate)}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${hallucinate ? 'bg-purple-600' : 'bg-slate-700'}`}
                     >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${hallucinate ? 'translate-x-6' : ''}`}></div>
                     </button>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Zap className="w-3 h-3"/> Shape Shift (Subject)</label>
                     <input 
                        value={replaceSubject}
                        onChange={(e) => setReplaceSubject(e.target.value)}
                        placeholder="e.g. A dancing cat, A robot..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
                     />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Box className="w-3 h-3"/> Environment</label>
                     <div className="flex flex-wrap gap-2">
                        {['Studio', 'Desert', 'Snow', 'Jungle', 'Cyber City', 'Space'].map(env => (
                           <button
                              key={env}
                              onClick={() => setEnvironment(env)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                 environment === env 
                                 ? 'bg-fuchsia-600 border-fuchsia-500 text-white' 
                                 : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                           >
                              {env}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Type className="w-3 h-3"/> Text Overlay</label>
                     <input 
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        placeholder="e.g. VIBE CHECK"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fuchsia-500 placeholder-slate-600"
                     />
                  </div>

                  <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                     <span className="text-sm font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400"/> Smooth Motion</span>
                     <button 
                        onClick={() => setSmoothMotion(!smoothMotion)}
                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${smoothMotion ? 'bg-blue-600' : 'bg-slate-700'}`}
                     >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${smoothMotion ? 'translate-x-6' : ''}`}></div>
                     </button>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Background Style</label>
                     <select 
                        value={backgroundType}
                        onChange={(e) => setBackgroundType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-fuchsia-500"
                     >
                        <option>Original</option>
                        <option>Generate New</option>
                        <option>Nebula</option>
                        <option>Cityscape</option>
                        <option>Abstract Liquid</option>
                        <option>Fire & Smoke</option>
                     </select>
                  </div>
               </div>

               <button
                  onClick={handleGenerate}
                  disabled={!videoSrc || status === 'loading'}
                  className={`mt-auto w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                     status === 'loading' 
                     ? 'bg-slate-800 cursor-wait' 
                     : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:shadow-fuchsia-500/20 hover:scale-[1.02]'
                  }`}
               >
                  {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Sparkles className="fill-white" />}
                  {status === 'loading' ? 'Mimicking Reality...' : 'Generate Mimicry'}
               </button>
            </div>

            {/* RIGHT: PREVIEW */}
            <div className="flex-1 bg-black/50 relative flex items-center justify-center p-8">
               {/* Grid Background */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

               {videoSrc && !resultVideoUrl && (
                  <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group">
                     <video 
                        ref={videoRef}
                        src={videoSrc}
                        onLoadedMetadata={handleVideoLoaded}
                        onSeeked={handleSeeked}
                        className="w-full h-full object-contain"
                        onClick={togglePlay}
                        onEnded={() => setIsPlaying(false)}
                     />
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {!isPlaying && <div className="bg-black/50 p-4 rounded-full backdrop-blur-md"><Play className="w-8 h-8 text-white fill-white" /></div>}
                     </div>
                     {status === 'loading' && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                           <div className="w-20 h-20 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                           <p className="text-fuchsia-400 font-bold animate-pulse text-lg">AI is dreaming...</p>
                           <p className="text-slate-500 text-sm mt-2">Processing intricate details</p>
                        </div>
                     )}
                     {status === 'error' && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 text-center p-6">
                           <div className="w-16 h-16 bg-red-900/30 border border-red-500 rounded-full flex items-center justify-center mb-4">
                              <AlertTriangle className="w-8 h-8 text-red-500" />
                           </div>
                           <h3 className="text-xl font-bold text-white mb-2">Generation Failed</h3>
                           <p className="text-slate-400 text-sm max-w-md mb-4">{errorMessage}</p>
                           <button 
                              onClick={() => setStatus('idle')}
                              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold transition-colors"
                           >
                              Try Again
                           </button>
                        </div>
                     )}
                  </div>
               )}

               {resultVideoUrl && (
                  <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(192,38,211,0.3)] border border-fuchsia-500/30">
                     <video 
                        src={resultVideoUrl} 
                        className="w-full h-full object-contain" 
                        controls 
                        autoPlay 
                        loop
                     />
                     <div className="absolute top-4 right-4">
                        <a href={resultVideoUrl} download="mimicry.mp4" className="bg-black/60 hover:bg-fuchsia-600 text-white px-4 py-2 rounded-lg font-bold backdrop-blur-md transition-colors text-xs flex items-center gap-2">
                           <Download className="w-4 h-4" /> Download
                        </a>
                     </div>
                  </div>
               )}

               {!videoSrc && (
                  <div className="text-center space-y-4 opacity-50">
                     <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-2 border-slate-700">
                        <Camera className="w-10 h-10 text-slate-400" />
                     </div>
                     <p className="text-xl font-bold text-slate-400">Waiting for Source Signal...</p>
                  </div>
               )}
               
               {/* Hidden Canvas for Frame Capture */}
               <canvas ref={canvasRef} className="hidden" />
            </div>
         </div>
      </div>
    </div>
  );
};

export default AIMimicryTool;
