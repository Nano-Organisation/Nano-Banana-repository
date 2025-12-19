import React, { useState, useRef, useEffect } from 'react';
import { Type as TypeIcon, Upload, RefreshCw, Play, Pause, Edit3, Save, Download, Palette, Wand2, Smartphone, Monitor, Smile, Trash2, CheckCircle2, Volume2, AlertCircle, Film } from 'lucide-react';
/* Fix: Using strictly correct Type from @google/genai as per guidelines. */
import { GoogleGenAI, Type } from "@google/genai";
import { LoadingState, CaptionBlock } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const FONTS = [
  { id: 'impact', label: 'Impact (Viral)', css: 'font-black uppercase italic tracking-tighter' },
  { id: 'inter', label: 'Inter (Clean)', css: 'font-bold tracking-tight' },
  { id: 'mono', label: 'Roboto Mono', css: 'font-mono' },
  { id: 'serif', label: 'Playfair (Serif)', css: 'font-serif italic' },
  { id: 'comic', label: 'Bangers (Comic)', css: 'font-black tracking-wide' }
];

const EMOJI_STYLES = ['Vibrant', 'Minimalist', 'Symbolic', 'None'];

// Emoji sound triggers mapping
const EMOJI_SOUND_TRIGGERS: Record<string, string[]> = {
  vroom: ['🚗', '🏎️', '🏍️', '🏎', '🚙', '🚕', '🚓', '🚑', '🚒', '🚜'],
  chime: ['⭐', '✨', '🌟', '💫', '🪄', '💎', '🎉'],
  pop: ['🎈', '🫧', '🍾', '💥', '🔥', '🧨'],
  bell: ['🔔', '🛎️', '⏰', '💡', '💬', '📢']
};

const CaptionCreator: React.FC = () => {
  // Media State
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'video' | 'audio'>('video');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Editor State
  const [captions, setCaptions] = useState<CaptionBlock[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [selectedFont, setSelectedFont] = useState(FONTS[0].id);
  const [emojiStyle, setEmojiStyle] = useState(EMOJI_STYLES[0]);
  const [displayMode, setDisplayMode] = useState<'text_only' | 'text_emoji' | 'rebus' | 'emoji_only' | 'highlight'>('text_emoji');
  const [accentColor, setAccentColor] = useState('#fbbf24'); // Yellow-400
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sound Engine initialization
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playSynthesizedSound = (type: string) => {
    if (!isSoundEnabled) return;
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'vroom') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(40, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    } else if (type === 'chime') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else if (type === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 1);
  };

  // Listen for caption changes to play sounds
  const activeCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);
  const prevActiveId = useRef<string | null>(null);

  useEffect(() => {
    if (activeCaption && activeCaption.id !== prevActiveId.current) {
      prevActiveId.current = activeCaption.id;
      if (isSoundEnabled) {
        for (const [sound, emojis] of Object.entries(EMOJI_SOUND_TRIGGERS)) {
          if (emojis.some(e => activeCaption.text.includes(e))) {
            playSynthesizedSound(sound);
            break;
          }
        }
      }
    }
    if (!activeCaption) prevActiveId.current = null;
  }, [activeCaption, isSoundEnabled]);

  // Effective State for UI logic
  const isEmojiDisabled = displayMode === 'text_only' || displayMode === 'highlight';
  const isFontDisabled = displayMode === 'emoji_only';
  const effectiveEmojiStyle = isEmojiDisabled ? 'None' : emojiStyle;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large. Max 50MB.");
        return;
      }
      
      const type = file.type.startsWith('video') ? 'video' : 'audio';
      try {
        await runFileSecurityChecks(file, type);
        const url = URL.createObjectURL(file);
        setFileSrc(url);
        setFileType(type);
        setCaptions([]);
        setStatus('idle');
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      if (videoRef.current.duration > 60) {
        alert("Video exceeds 60 second limit.");
        setFileSrc(null);
        return;
      }
      setDuration(videoRef.current.duration);
    }
  };

  const handleAudioMetadata = () => {
    if (audioRef.current) {
      if (audioRef.current.duration > 60) {
        alert("Audio exceeds 60 second limit.");
        setFileSrc(null);
        return;
      }
      setDuration(audioRef.current.duration);
    }
  };

  const generateCaptions = async () => {
    if (!fileSrc) return;
    setStatus('loading');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const mediaResponse = await fetch(fileSrc);
        const blob = await mediaResponse.blob();
        const base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });

        let promptText = `Task: Transcribe the provided audio from the media file into high-impact timed captions for social media.
        
        Chunk Requirements: 
        - Split the transcription into short segments (2-4 words each).
        - Provide 'start' and 'end' timestamps in seconds for each segment.
        - The language should be automatically detected from the speech.
        
        Display Rules (Applied to 'text' field):`;

        if (displayMode === 'emoji_only') {
            promptText += `\n- MODE: EMOJI ONLY. Replace the spoken words entirely with highly relevant emojis or icons that represent the meaning. Do not return any words.`;
        } else if (displayMode === 'rebus') {
            promptText += `\n- MODE: REBUS. Keep most text but replace key nouns or verbs with relevant emojis or icons to create a visual riddle style.`;
        } else if (displayMode === 'text_emoji') {
            promptText += `\n- MODE: TEXT + EMOJI. Include the transcription text and add 1-2 relevant emojis at the end of each block.`;
        } else if (displayMode === 'highlight') {
            promptText += `\n- MODE: HIGHLIGHT. Provide accurate text transcription only. (Formatting will be handled by the UI).`;
        } else {
            promptText += `\n- MODE: TEXT ONLY. Provide accurate text transcription with no emojis.`;
        }

        if (effectiveEmojiStyle !== 'None') {
            promptText += `\n- Visual Style for Emojis/Icons: ${effectiveEmojiStyle}.`;
        }

        promptText += `\n\nReturn ONLY a JSON array of objects: { "start": number, "end": number, "text": "string" }.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: blob.type,
                            data: base64Data,
                        },
                    },
                    {
                        text: promptText
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            start: { type: Type.NUMBER },
                            end: { type: Type.NUMBER },
                            text: { type: Type.STRING }
                        },
                        required: ['start', 'end', 'text']
                    }
                }
            }
        });

        const raw = response.text;
        if (!raw) throw new Error("AI returned an empty response.");
        const data = JSON.parse(raw);
        setCaptions(data.map((c: any, i: number) => ({ ...c, id: i.toString() })));
        setStatus('success');
    } catch (e: any) {
        console.error(e);
        setStatus('error');
        alert(`Transcription failed: ${e.message || "Unknown error"}. Ensure your API key is correct and multimodal models are available.`);
    }
  };

  const updateCaption = (id: string, text: string) => {
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, text } : c));
  };

  const togglePlay = () => {
    const el = fileType === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      if (isPlaying) el.pause();
      else el.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    const el = fileType === 'video' ? videoRef.current : audioRef.current;
    if (el) setCurrentTime(el.currentTime);
  };

  const fontStyle = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  // Client-Side Burn & Export logic
  const handleBurnAndExport = async () => {
    if (!fileSrc || !captions.length) return;
    
    setIsExporting(true);
    setExportProgress(0);

    // Create a worker element to avoid modifying the main UI video state
    // Note: It MUST be attached to the DOM and have specific CSS for some browsers (Safari/Chrome Mobile) to process it.
    const workerMedia = document.createElement(fileType === 'video' ? 'video' : 'audio') as HTMLVideoElement | HTMLAudioElement;
    workerMedia.src = fileSrc;
    workerMedia.muted = true;
    workerMedia.crossOrigin = "anonymous";
    workerMedia.style.position = 'fixed';
    workerMedia.style.top = '-9999px';
    workerMedia.style.left = '-9999px';
    workerMedia.style.opacity = '0';
    workerMedia.style.pointerEvents = 'none';
    document.body.appendChild(workerMedia);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Canvas context initialization failed.");

      // Wait for metadata on the worker media
      await new Promise((resolve, reject) => {
          workerMedia.onloadedmetadata = resolve;
          workerMedia.onerror = reject;
          if (workerMedia.readyState >= 1) resolve(null);
      });

      // Set canvas dimensions based on source video or standard square
      if (fileType === 'video') {
          canvas.width = (workerMedia as HTMLVideoElement).videoWidth || 1080;
          canvas.height = (workerMedia as HTMLVideoElement).videoHeight || 1920;
      } else {
          canvas.width = 1080;
          canvas.height = 1080;
      }

      const canvasStream = canvas.captureStream(30);
      const tracks = [...canvasStream.getVideoTracks()];

      // Add audio track from the original media
      try {
          const sourceStream = (workerMedia as any).captureStream ? (workerMedia as any).captureStream() : (workerMedia as any).mozCaptureStream?.();
          if (sourceStream) {
            const audioTrack = sourceStream.getAudioTracks()[0];
            if (audioTrack) tracks.push(audioTrack);
          }
      } catch (e) {
          console.warn("Audio track capture failed. Video will be silent.", e);
      }

      // Check supported MIME types for robustness (Safari fallback to mp4)
      const supportedTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      const selectedMime = supportedTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      const extension = selectedMime.includes('mp4') ? 'mp4' : 'webm';

      const recorder = new MediaRecorder(new MediaStream(tracks), { 
        mimeType: selectedMime,
        videoBitsPerSecond: 6000000 
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
      };

      const recorderStopPromise = new Promise<void>((resolve) => {
        recorder.onstop = () => {
            if (chunks.length === 0) {
               console.error("No data recorded.");
               resolve();
               return;
            }
            const blob = new Blob(chunks, { type: selectedMime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Exact requested naming convention: AI Caption Creator - [timestamp]
            a.download = `AI Caption Creator - ${Date.now()}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            resolve();
        };
      });

      // Prepare rendering loop
      const renderLoop = () => {
          if (recorder.state !== 'recording') return;

          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (fileType === 'video') {
              ctx.drawImage(workerMedia as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
          } else {
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Apply styled captions
          const t = workerMedia.currentTime;
          const currentCap = captions.find(c => t >= c.start && t <= c.end);
          if (currentCap) {
              ctx.save();
              ctx.fillStyle = accentColor;
              ctx.strokeStyle = 'black';
              ctx.lineWidth = Math.max(2, canvas.width * 0.012);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              
              const fontSize = Math.max(24, canvas.width * 0.08);
              ctx.font = `bold ${fontSize}px ${selectedFont === 'serif' ? 'serif' : 'sans-serif'}`;
              
              ctx.strokeText(currentCap.text, canvas.width / 2, canvas.height * 0.85);
              ctx.fillText(currentCap.text, canvas.width / 2, canvas.height * 0.85);
              ctx.restore();
          }

          setExportProgress((workerMedia.currentTime / (workerMedia.duration || 1)) * 100);

          // Check for completion with a safety threshold
          if (workerMedia.ended || workerMedia.currentTime >= (workerMedia.duration - 0.1)) {
              if (recorder.state === 'recording') {
                  recorder.stop();
              }
          } else {
              requestAnimationFrame(renderLoop);
          }
      };

      // Begin recording
      workerMedia.currentTime = 0;
      await new Promise(r => setTimeout(r, 600)); // Ensure buffer seek

      recorder.start();
      await (workerMedia as HTMLVideoElement).play();
      renderLoop();
      
      // Wait for the stop process to finish
      await recorderStopPromise;

    } catch (error: any) {
      console.error("Export process failed:", error);
      alert("Failed to export: " + (error.message || "Unknown error"));
    } finally {
      // Final cleanup
      setIsExporting(false);
      workerMedia.pause();
      if (workerMedia.parentNode) document.body.removeChild(workerMedia);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <TypeIcon className="w-8 h-8 text-blue-500" />
          AI Caption Creator
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Generate high-impact viral captions with timed animations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Settings & Captions Edit (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Palette className="w-4 h-4" /> Global Style
              </h3>

              {/* Display Mode */}
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Display Mode</label>
                 <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'text_only', label: 'Plain Text' },
                      { id: 'text_emoji', label: 'Text+Emoji' },
                      { id: 'rebus', label: 'Rebus' },
                      { id: 'emoji_only', label: 'Icons Only' },
                      { id: 'highlight', label: 'Highlight' }
                    ].map(mode => (
                       <button
                          key={mode.id}
                          onClick={() => setDisplayMode(mode.id as any)}
                          className={`px-2 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${displayMode === mode.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'}`}
                       >
                          {mode.label}
                       </button>
                    ))}
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Font Family</label>
                    <select 
                      value={isFontDisabled ? 'impact' : selectedFont} 
                      disabled={isFontDisabled}
                      onChange={e => setSelectedFont(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-xs transition-all ${isFontDisabled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-40 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer'}`}
                    >
                       {isFontDisabled ? (
                         <option value="impact">N/A (Icons Only)</option>
                       ) : (
                         FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)
                       )}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Emoji Theme</label>
                    <select 
                      value={effectiveEmojiStyle} 
                      disabled={isEmojiDisabled}
                      onChange={e => setEmojiStyle(e.target.value)}
                      className={`w-full border rounded-lg p-2 text-xs transition-all ${isEmojiDisabled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer'}`}
                    >
                       {isEmojiDisabled ? (
                         <option value="None">N/A (None)</option>
                       ) : (
                         EMOJI_STYLES.map(s => <option key={s} value={s}>{s}</option>)
                       )}
                    </select>
                 </div>
              </div>

              {/* Sound Effects Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                 <input 
                   type="checkbox" 
                   id="sound-toggle"
                   checked={isSoundEnabled}
                   onChange={(e) => setIsSoundEnabled(e.target.checked)}
                   className="w-4 h-4 accent-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded transition-all"
                 />
                 <label htmlFor="sound-toggle" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none flex items-center gap-1.5">
                    <Volume2 className={`w-3 h-3 ${isSoundEnabled ? 'text-blue-500' : 'text-slate-400'}`} />
                    Enable Contextual Sounds
                 </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center justify-between mb-4">
                  <span>Edit Captions</span>
                  <span className="text-[10px] text-blue-500 font-bold">{captions.length} Blocks</span>
               </h3>
               
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {captions.length === 0 ? (
                     <div className="text-center py-10 opacity-30">
                        <Edit3 className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-[10px] font-bold uppercase">No Captions Yet</p>
                     </div>
                  ) : (
                     captions.map((cap) => (
                        <div key={cap.id} className={`p-3 rounded-xl border transition-all ${activeCaption?.id === cap.id ? 'border-blue-500 bg-blue-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'}`}>
                           <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
                              <span>{cap.start.toFixed(2)}s - {cap.end.toFixed(2)}s</span>
                              <button onClick={() => setCaptions(prev => prev.filter(c => c.id !== cap.id))} className="hover:text-red-500 transition-colors">
                                 <Trash2 className="w-3 h-3" />
                              </button>
                           </div>
                           <textarea 
                              value={cap.text}
                              onChange={e => updateCaption(cap.id, e.target.value)}
                              className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 border-none p-0 focus:ring-0 resize-none font-bold"
                              rows={2}
                           />
                        </div>
                     ))
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Right: Preview (7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
           
           <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl aspect-[9/16] max-w-[320px] mx-auto border-8 border-slate-900 ring-4 ring-slate-100 dark:ring-slate-800 group">
              {fileSrc ? (
                 <>
                    {fileType === 'video' ? (
                       <video 
                         ref={videoRef}
                         src={fileSrc}
                         className="w-full h-full object-contain"
                         onTimeUpdate={handleTimeUpdate}
                         onLoadedMetadata={handleVideoMetadata}
                         onEnded={() => setIsPlaying(false)}
                         playsInline
                       />
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-8 text-center space-y-4">
                          <Volume2 className="w-16 h-16 text-blue-500 animate-pulse" />
                          <p className="text-xs font-bold text-white uppercase tracking-widest">Audio Only Mode</p>
                          <audio 
                            ref={audioRef} 
                            src={fileSrc} 
                            onTimeUpdate={handleTimeUpdate} 
                            onLoadedMetadata={handleAudioMetadata} 
                            onEnded={() => setIsPlaying(false)}
                          />
                       </div>
                    )}

                    {activeCaption && (
                       <div className="absolute inset-x-4 bottom-32 flex flex-col items-center justify-center text-center pointer-events-none animate-fade-in">
                          <div 
                            className={`px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl text-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${displayMode === 'emoji_only' ? 'text-4xl' : fontStyle.css}`}
                            style={{ color: accentColor }}
                          >
                             {displayMode === 'highlight' ? (
                                (() => {
                                  const words = activeCaption.text.split(' ');
                                  const totalDur = activeCaption.end - activeCaption.start;
                                  const timeInBlock = currentTime - activeCaption.start;
                                  const wordDur = totalDur / Math.max(1, words.length);
                                  const currentWordIdx = Math.floor(timeInBlock / wordDur);
                                  
                                  return words.map((word, i) => (
                                    <span key={i} className={`transition-all duration-200 ${i === currentWordIdx ? 'text-white scale-110' : 'opacity-40'}`}>
                                      {word}{' '}
                                    </span>
                                  ));
                                })()
                             ) : (
                                activeCaption.text
                             )}
                          </div>
                       </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button onClick={togglePlay} className="p-6 bg-white/20 backdrop-blur-xl rounded-full text-white hover:scale-110 transition-transform">
                          {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current" />}
                       </button>
                    </div>

                    {isExporting && (
                      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6 text-center backdrop-blur-sm">
                         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                         <h4 className="text-white font-black uppercase text-xs tracking-widest">Burning Captions_</h4>
                         <div className="w-full bg-slate-800 h-1 rounded-full mt-4 overflow-hidden max-w-xs">
                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                         </div>
                         <p className="text-slate-400 text-[10px] mt-2 uppercase font-bold tracking-tighter">Preparing Final Render...</p>
                      </div>
                    )}
                 </>
              ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4 text-slate-500">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-700">
                       <Upload className="w-8 h-8 opacity-20" />
                    </div>
                    <div className="space-y-1">
                       <p className="font-bold text-xs uppercase tracking-widest">No Media Signal</p>
                       <p className="text-[10px]">Upload a clip (max 60s) to begin transcription.</p>
                    </div>
                 </div>
              )}
           </div>

           <div className="flex gap-4">
              {!fileSrc ? (
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg"
                 >
                    <Upload className="w-5 h-5" /> SELECT VIDEO / AUDIO
                 </button>
              ) : (
                 <>
                    <button 
                       onClick={generateCaptions}
                       disabled={status === 'loading'}
                       className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg"
                    >
                       {status === 'loading' ? (
                          <>
                             <RefreshCw className="w-5 h-5 animate-spin" /> 
                             AI IS LISTENING...
                          </>
                       ) : (
                          <>
                             <Wand2 className="w-5 h-5" />
                             {captions.length > 0 ? 'RE-GENERATE AI CAPTIONS' : 'GENERATE AI CAPTIONS'}
                          </>
                       )}
                    </button>
                    <button 
                       onClick={() => {
                          setFileSrc(null);
                          setCaptions([]);
                          setIsPlaying(false);
                          setStatus('idle');
                       }}
                       className="px-6 bg-slate-800 hover:bg-red-600 text-white rounded-2xl transition-colors"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                 </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*,audio/*" onChange={handleFileUpload} />
           </div>

           {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 animate-fade-in">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <p className="text-xs font-bold uppercase">Processing Error. Ensure your API key is connected and has valid quota.</p>
              </div>
           )}

           {captions.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up shadow-lg">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
                       <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Production Ready</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400">Captions are synchronized and styled.</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all">
                       <Download className="w-4 h-4" /> SRT FILE
                    </button>
                    <button 
                      onClick={handleBurnAndExport}
                      disabled={isExporting}
                      className="flex-1 md:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                       {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                       BURN & EXPORT
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CaptionCreator;