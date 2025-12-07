
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Upload, Type, Trash2, Download, RefreshCw, Sliders, Monitor, Layers, Clock } from 'lucide-react';

interface Overlay {
  id: number;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  start: number;
  end: number;
}

const AetherEditTool: React.FC = () => {
  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>(0);

  // State
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Editor State
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, hue: 0 });
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Trim State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // --- File Handling ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    
    // Reset state
    setOverlays([]);
    setFilters({ brightness: 100, contrast: 100, hue: 0 });
    setSelectedOverlayId(null);
    setIsPlaying(false);
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTrimEnd(videoRef.current.duration);
      // Set canvas size
      if (canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }
      renderFrame();
    }
  };

  // --- Rendering Loop ---
  const renderFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });

    if (video && canvas && ctx) {
      // 1. Draw Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Video Frame with Filters
      // Note: context filter is safer than CSS filter for export
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) hue-rotate(${filters.hue}deg)`;
      
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      ctx.filter = 'none';

      // 3. Draw Overlays
      overlays.forEach(overlay => {
        if (video.currentTime >= overlay.start && video.currentTime <= overlay.end) {
          ctx.font = `bold ${overlay.size}px Inter, sans-serif`;
          ctx.fillStyle = overlay.color;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          // Shadow
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          ctx.fillText(overlay.text, overlay.x, overlay.y);
          
          // Selection Highlight
          if (selectedOverlayId === overlay.id) {
             ctx.shadowColor = "transparent";
             ctx.strokeStyle = "#00f2ff";
             ctx.lineWidth = 4;
             const metrics = ctx.measureText(overlay.text);
             ctx.strokeRect(overlay.x - 10, overlay.y - 10, metrics.width + 20, overlay.size * 1.2);
          }
          
          ctx.shadowColor = "transparent";
        }
      });

      // Update Time
      if (!video.paused) {
        setCurrentTime(video.currentTime);
        requestRef.current = requestAnimationFrame(renderFrame);
      }
    }
  };

  // Trigger render when not playing (for scrubbing)
  useEffect(() => {
    if (!isPlaying) {
       requestAnimationFrame(renderFrame);
    }
  }, [currentTime, filters, overlays, selectedOverlayId]);

  // --- Playback Controls ---
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        requestRef.current = requestAnimationFrame(renderFrame);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        cancelAnimationFrame(requestRef.current);
      }
    }
  };

  const handleScrub = (val: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  // --- Overlay Management ---
  const addTextOverlay = () => {
    if (!videoSrc) return;
    const newOverlay: Overlay = {
      id: Date.now(),
      text: "Double Click Edit",
      x: 100,
      y: 100,
      size: 60,
      color: "#ffffff",
      start: currentTime,
      end: Math.min(currentTime + 3, duration)
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
  };

  const updateSelectedOverlay = (key: keyof Overlay, value: any) => {
    if (selectedOverlayId === null) return;
    setOverlays(prev => prev.map(o => o.id === selectedOverlayId ? { ...o, [key]: value } : o));
  };

  const deleteSelectedOverlay = () => {
    if (selectedOverlayId === null) return;
    setOverlays(prev => prev.filter(o => o.id !== selectedOverlayId));
    setSelectedOverlayId(null);
  };

  // --- Export Logic ---
  const handleExport = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsExporting(true);
    videoRef.current.pause();
    setIsPlaying(false);
    
    const stream = canvasRef.current.captureStream(30);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    
    recorder.ondataavailable = (e) => {
       if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
       const blob = new Blob(chunks, { type: 'video/webm' });
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `AetherEdit_Export_${Date.now()}.webm`;
       a.click();
       setIsExporting(false);
       if (videoRef.current) videoRef.current.currentTime = trimStart; // Reset
    };

    // Start Recording process
    videoRef.current.currentTime = trimStart;
    await new Promise(r => setTimeout(r, 200)); // Buffer
    
    recorder.start();
    videoRef.current.play();
    
    // Stop check loop
    const checkEnd = setInterval(() => {
       if (videoRef.current && (videoRef.current.currentTime >= trimEnd || videoRef.current.ended)) {
          recorder.stop();
          videoRef.current.pause();
          clearInterval(checkEnd);
       }
    }, 100);
  };

  const selectedOverlay = overlays.find(o => o.id === selectedOverlayId);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    const ms = Math.floor((t % 1) * 10).toString();
    return `${m}:${s}.${ms}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#050511] text-white overflow-hidden rounded-xl border border-[#1f2a40] font-sans">
      
      {/* HEADER */}
      <header className="h-14 bg-[#0f1221] border-b border-[#1f2a40] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#fff] to-[#a5b4fc]">
           <Monitor className="w-5 h-5 text-[#00f2ff]" /> AetherEdit
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleExport}
             disabled={!videoSrc || isExporting}
             className="px-4 py-1.5 bg-gradient-to-r from-[#00f2ff] to-[#0078ff] text-black font-bold rounded-lg text-sm flex items-center gap-2 hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
              {isExporting ? 'Rendering...' : 'Export Video'}
           </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
         
         {/* SIDEBAR TOOLS */}
         <aside className="w-16 bg-[#0f1221] border-r border-[#1f2a40] flex flex-col items-center py-4 gap-4 shrink-0">
            <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all"
               title="Upload Video"
            >
               <Upload className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileUpload} />
            
            <button 
               onClick={addTextOverlay}
               disabled={!videoSrc}
               className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-[#bd00ff] hover:bg-[#bd00ff]/10 transition-all disabled:opacity-30"
               title="Add Text"
            >
               <Type className="w-5 h-5" />
            </button>
         </aside>

         {/* EDITOR STAGE */}
         <div className="flex-1 flex flex-col bg-[#080a12] relative min-w-0">
            
            {/* Viewport */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
               {/* Hidden Video Source */}
               <video 
                  ref={videoRef} 
                  src={videoSrc || undefined} 
                  onLoadedMetadata={handleVideoLoaded} 
                  className="hidden" 
                  crossOrigin="anonymous" 
                  playsInline 
               />
               
               {/* Main Canvas */}
               <canvas 
                  ref={canvasRef} 
                  className={`max-w-[95%] max-h-[90%] border border-[#333] shadow-2xl rounded ${!videoSrc ? 'hidden' : ''}`}
               />

               {!videoSrc && (
                  <div className="text-center text-slate-600 flex flex-col items-center gap-4">
                     <Upload className="w-16 h-16 opacity-20" />
                     <h2 className="text-2xl font-bold text-slate-500">Drag & Drop Video</h2>
                     <button onClick={() => fileInputRef.current?.click()} className="text-[#00f2ff] hover:underline">or browse files</button>
                  </div>
               )}

               {isExporting && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                     <div className="w-16 h-16 border-4 border-[#00f2ff] border-t-transparent rounded-full animate-spin mb-4"></div>
                     <h3 className="text-xl font-bold text-white">Rendering Video...</h3>
                     <p className="text-slate-400 text-sm">Please do not switch tabs.</p>
                  </div>
               )}
            </div>

            {/* Timeline */}
            <div className="h-48 bg-[#0f1221] border-t border-[#1f2a40] flex flex-col shrink-0">
               <div className="h-10 border-b border-[#1f2a40] flex items-center justify-between px-4 bg-black/20">
                  <div className="flex items-center gap-4">
                     <button onClick={togglePlay} className="text-white hover:text-[#00f2ff] transition-colors" disabled={!videoSrc}>
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                     </button>
                     <span className="font-mono text-[#00f2ff] text-sm tracking-widest">
                        {formatTime(currentTime)} / {formatTime(duration)}
                     </span>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => { setTrimStart(currentTime); alert('Start point set'); }} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-slate-400 border border-slate-700">SET START</button>
                     <button onClick={() => { setTrimEnd(currentTime); alert('End point set'); }} className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-slate-400 border border-slate-700">SET END</button>
                  </div>
               </div>

               <div className="flex-1 relative p-4 overflow-x-hidden">
                  <input 
                     type="range" 
                     min="0" 
                     max={duration || 100} 
                     step="0.01"
                     value={currentTime}
                     onChange={(e) => handleScrub(Number(e.target.value))}
                     className="absolute inset-x-4 top-0 h-full opacity-0 z-20 cursor-crosshair w-[calc(100%-2rem)]"
                     disabled={!videoSrc}
                  />
                  
                  {/* Playhead */}
                  <div 
                     className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none shadow-[0_0_10px_white]"
                     style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                  ></div>

                  {/* Tracks */}
                  <div className="space-y-3 pt-2">
                     <div className="relative h-8 bg-[#151b2b] rounded border border-[#2a344a] flex items-center overflow-hidden">
                        {videoSrc && (
                           <div className="absolute inset-y-0 bg-[#00f2ff]/10 border-l-2 border-[#00f2ff] w-full flex items-center px-2 text-[10px] text-[#ccfaff] truncate">
                              Video Track
                           </div>
                        )}
                     </div>
                     <div className="relative h-8 bg-[#151b2b] rounded border border-[#2a344a] flex items-center overflow-hidden">
                        {overlays.map(overlay => {
                           const left = (overlay.start / (duration || 1)) * 100;
                           const width = ((overlay.end - overlay.start) / (duration || 1)) * 100;
                           const isSelected = selectedOverlayId === overlay.id;
                           return (
                              <div 
                                 key={overlay.id}
                                 className={`absolute inset-y-0 cursor-pointer flex items-center px-2 text-[10px] truncate transition-all ${isSelected ? 'bg-[#bd00ff]/40 border border-[#bd00ff] z-10' : 'bg-[#bd00ff]/20 border-l-2 border-[#bd00ff]'}`}
                                 style={{ left: `${left}%`, width: `${width}%` }}
                                 onClick={() => setSelectedOverlayId(overlay.id)}
                              >
                                 <span className="text-[#f0ccff]">{overlay.text}</span>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* PROPERTIES PANEL */}
         <aside className="w-72 bg-[#0f1221] border-l border-[#1f2a40] flex flex-col p-6 gap-6 overflow-y-auto shrink-0">
            {/* Filters */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Sliders className="w-4 h-4 text-[#00f2ff]" /> Global Filters
               </div>
               <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs text-slate-400">
                        <span>Brightness</span>
                        <span>{filters.brightness}%</span>
                     </div>
                     <input type="range" min="0" max="200" value={filters.brightness} onChange={(e) => setFilters({...filters, brightness: Number(e.target.value)})} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00f2ff]" />
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs text-slate-400">
                        <span>Contrast</span>
                        <span>{filters.contrast}%</span>
                     </div>
                     <input type="range" min="0" max="200" value={filters.contrast} onChange={(e) => setFilters({...filters, contrast: Number(e.target.value)})} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00f2ff]" />
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between text-xs text-slate-400">
                        <span>Hue</span>
                        <span>{filters.hue}°</span>
                     </div>
                     <input type="range" min="0" max="360" value={filters.hue} onChange={(e) => setFilters({...filters, hue: Number(e.target.value)})} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00f2ff]" />
                  </div>
               </div>
            </div>

            <div className="h-px bg-[#1f2a40]"></div>

            {/* Text Properties */}
            <div className={`space-y-4 transition-opacity ${selectedOverlay ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
               <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Type className="w-4 h-4 text-[#bd00ff]" /> Text Controls
               </div>
               <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="space-y-1">
                     <label className="text-xs text-slate-500">Content</label>
                     <input 
                        type="text" 
                        value={selectedOverlay?.text || ''} 
                        onChange={(e) => updateSelectedOverlay('text', e.target.value)}
                        className="w-full bg-[#050511] border border-slate-700 rounded p-2 text-xs text-white focus:border-[#bd00ff] outline-none"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-xs text-slate-500">Pos X</label>
                        <input type="number" value={selectedOverlay?.x || 0} onChange={(e) => updateSelectedOverlay('x', Number(e.target.value))} className="w-full bg-[#050511] border border-slate-700 rounded p-1 text-xs text-white" />
                     </div>
                     <div>
                        <label className="text-xs text-slate-500">Pos Y</label>
                        <input type="number" value={selectedOverlay?.y || 0} onChange={(e) => updateSelectedOverlay('y', Number(e.target.value))} className="w-full bg-[#050511] border border-slate-700 rounded p-1 text-xs text-white" />
                     </div>
                  </div>
                  <div>
                     <label className="text-xs text-slate-500">Size: {selectedOverlay?.size}px</label>
                     <input type="range" min="10" max="200" value={selectedOverlay?.size || 40} onChange={(e) => updateSelectedOverlay('size', Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#bd00ff]" />
                  </div>
                  <div>
                     <label className="text-xs text-slate-500">Color</label>
                     <input type="color" value={selectedOverlay?.color || '#ffffff'} onChange={(e) => updateSelectedOverlay('color', e.target.value)} className="w-full h-8 bg-transparent cursor-pointer border-none" />
                  </div>
                  <button 
                     onClick={deleteSelectedOverlay}
                     className="w-full border border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs py-2 rounded font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                     <Trash2 className="w-3 h-3" /> Remove Text
                  </button>
               </div>
            </div>
         </aside>
      </div>
    </div>
  );
};

export default AetherEditTool;
