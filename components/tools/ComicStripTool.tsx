
import React, { useState, useRef, useEffect } from 'react';
import { Layout, RefreshCw, Upload, X, Download, Image as ImageIcon, MessageSquare, Palette, Columns, Rows, Clock, Volume2, Music, Play, Waves, Settings2, Check, Film, AlertTriangle, Lock } from 'lucide-react';
import { generateComicScriptFromImages, generateProImageWithGemini, generateSpeechWithGemini, generateBackgroundMusic } from '../../services/geminiService';
import { LoadingState, StorybookData } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const STRIP_STYLES = [
  { 
    id: 'graphic_novel', 
    label: 'Graphic Novel', 
    desc: 'Modern cinematic layouts, varied camera angles, and professional digital storytelling format.' 
  },
  { 
    id: 'sunday_strip', 
    label: 'Sunday Strip', 
    desc: 'Classic multi-panel newspaper layout with bold character focuses and traditional gag-strip logic.' 
  }
];

const ART_STYLES = [
  { 
    id: 'noir', 
    label: 'Noir', 
    desc: 'High-contrast black and white, dramatic shadows, ink wash textures, gritty atmosphere.' 
  },
  { 
    id: 'chibi', 
    label: 'Kawaii / Chibi', 
    desc: 'Adorable chibi style, pastel colors, soft thick lines, simple expressive faces.' 
  },
  { 
    id: 'golden_age', 
    label: 'Golden Age', 
    desc: '1950s vintage comic book style, Ben-Day dots, limited color palette, aged paper texture.' 
  },
  { 
    id: 'cyberpunk', 
    label: 'Cyberpunk', 
    desc: 'Neon colors, digital glitch effects, sharp high-tech lines, dark futuristic mood.' 
  },
  { 
    id: 'manga', 
    label: 'Classic Manga', 
    desc: 'Traditional manga style, screentone patterns, expressive action lines, black and white shades.' 
  },
  {
    id: 'edewede_ai_o3',
    label: 'Edewede-AI-O3',
    desc: 'Analog 2D storybook minimalism inspired by mid-century printmaking. Features intentional contours and flat color blocks with misregistered ink edges mimicking vintage offset printing. Palette: strictly limited earthy tones on off-white paper. Compositions are flattened frontal views with zero gradients, zero highlights, and zero 3D depth cues. Environment props are reduced to primitive geometric blocks.',
    uiDesc: 'Pure 2D minimalism, flat tones, vintage print aesthetic.'
  }
];

const VOICES = [
  { id: 'Kore', name: 'Kore (Balanced)' },
  { id: 'Puck', name: 'Puck (Energetic)' },
  { id: 'Charon', name: 'Charon (Deep)' },
  { id: 'Fenrir', name: 'Fenrir (Intense)' },
  { id: 'Zephyr', name: 'Zephyr (Calm)' }
];

const ComicStripTool: React.FC = () => {
  const [seedImages, setSeedImages] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [selectedStripStyleId, setSelectedStripStyleId] = useState(STRIP_STYLES[0].id);
  const [selectedArtStyleId, setSelectedArtStyleId] = useState(ART_STYLES[0].id);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [comicData, setComicData] = useState<StorybookData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [addMusic, setAddMusic] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePanelIndex, setActivePanelIndex] = useState<number | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLVideoElement | null>(null);
  const cancelPlaybackRef = useRef(false);

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

  // Helper to compress images for multimodal stability
  const compressImage = async (dataUrl: string, maxDim: number = 768): Promise<string> => {
     return new Promise((resolve) => {
        const img = document.createElement('img');
        img.onload = () => {
           const canvas = document.createElement('canvas');
           let w = img.width;
           let h = img.height;
           if (w > h) {
              if (w > maxDim) { h *= maxDim / w; w = maxDim; }
           } else {
              if (h > maxDim) { w *= maxDim / h; h = maxDim; }
           }
           canvas.width = w;
           canvas.height = h;
           const ctx = canvas.getContext('2d');
           ctx?.drawImage(img, 0, 0, w, h);
           resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = dataUrl;
     });
  };

  const handleSeedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (seedImages.length + newImages.length >= 4) break;
        try {
            await runFileSecurityChecks(file, 'image');
            const reader = new FileReader();
            const result = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
            // Auto-compress on upload to save memory/payload
            const compressed = await compressImage(result);
            newImages.push(compressed);
        } catch(err) { console.error("Skipping invalid file"); }
    }
    setSeedImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSeedImage = (index: number) => {
    setSeedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (seedImages.length === 0) return;
    setStatus('loading');
    setComicData(null);
    setProgressMsg('Directing Script...');

    const stripStyle = STRIP_STYLES.find(s => s.id === selectedStripStyleId) || STRIP_STYLES[0];
    const artStyle = ART_STYLES.find(s => s.id === selectedArtStyleId) || ART_STYLES[0];

    try {
      // 1. Unified Request: Audit & Scripting
      const script = await generateComicScriptFromImages(seedImages, topic);
      script.style = `${stripStyle.label} with ${artStyle.label} art`;
      
      if (!script.pages || !Array.isArray(script.pages)) script.pages = [];
      setComicData(script);

      // 2. Sequential Panel Synthesis
      const newPages = [...(script.pages || [])];
      
      // Ensure anchor is manageable size
      const anchorImage = await compressImage(seedImages[0], 768);

      for (let i = 0; i < newPages.length; i++) {
         // Fresh delay to avoid backend overload/race
         if (i > 0) await new Promise(r => setTimeout(r, 9000));
         setProgressMsg(`Inking Panel ${i + 1}/${newPages.length}...`);
         
         const panelActiveIDs = newPages[i].charactersPresent || [];
         const localCasting = (script.castingSheet || [])
            .filter(c => panelActiveIDs.includes(c.id))
            .map(c => `${c.id}: ${c.description}`)
            .join('. ') || "Subject from anchor.";

         // RESTORE STYLE LOGIC: Injects aggressive layout directions to override anchor photo depth
         const stripDirection = stripStyle.id === 'sunday_strip' 
            ? "MANDATORY: FLAT 2D PERSPECTIVE. WIDE ANGLE STAGE-LIKE COMPOSITION. ZERO DEPTH OF FIELD. NO BLURRED BACKGROUNDS. NO CINEMATIC LIGHTING. NO CAMERA TILT. FULL BODY SHOTS ONLY. TRADITIONAL NEWSPAPER COMIC STRIP LAYOUT. IGNORE 3D DEPTH OF ANCHOR IMAGE. RENDER AS FLAT 2D ILLUSTRATION." 
            : "Modern cinematic digital art, varied camera angles, dynamic shot depths, depth of field, bokeh, movie-style lighting.";

         const telegraphicPrompt = `
           COMPOSITION: ${stripDirection}.
           ACTIVE_CAST: ${localCasting}.
           SCENE: ${newPages[i].imagePrompt}. 
           STYLE: ${artStyle.label}. ${artStyle.desc}. 
           RULES: 1 PANEL. NO BUBBLES. MATCH REF POSE. IGNORE ANCHOR DEPTH.
         `.replace(/\s+/g, ' ').trim();

         try {
            // Using the centralized service which includes exponential backoff retries for 500s
            const imageUrl = await generateProImageWithGemini(
               telegraphicPrompt, 
               '1:1', 
               '1K', 
               anchorImage,
               (msg) => setProgressMsg(msg)
            );
            
            if (!imageUrl) throw new Error("Synthesis Empty");

            newPages[i] = { ...newPages[i], imageUrl };
            setComicData(prev => prev ? { ...prev, pages: [...newPages] } : null);
         } catch (e: any) {
            console.error(`Final Panel ${i+1} Critical Failure:`, e);
            const msg = (e.message || "").toLowerCase();
            if (msg.includes("billing") || msg.includes("active billing")) {
                setHasKey(false);
                handleSelectKey();
                alert("Pro Image generation requires a billing-enabled API key. Please connect one.");
                throw e; // Stop generation
            }
            // Skip failed panel gracefully so user can see what worked
         }
      }
      setStatus('success');
    } catch (e) { 
      console.error("General Comic Generation Error:", e);
      setStatus('error'); 
    }
  };

  const handleDownload = () => {
    if (!comicData) return;
    const isHorizontal = orientation === 'horizontal';
    const doc = new jsPDF({ orientation: isHorizontal ? 'l' : 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let y = 20;

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(comicData.title || 'AI Comic Strip', pageWidth / 2, y, { align: 'center' });
    y += 15;

    const pages = comicData.pages || [];
    if (isHorizontal) {
      const panelSize = 65;
      const spacing = 5;
      let x = margin;
      y += 10;
      pages.forEach((page, i) => {
        if (x + panelSize > pageWidth - margin) { x = margin; y += panelSize + 35; }
        if (y + panelSize + 20 > pageHeight - margin) { doc.addPage(); y = margin + 10; x = margin; }
        if (page.imageUrl) {
          try { doc.addImage(page.imageUrl, 'PNG', x, y, panelSize, panelSize); doc.rect(x, y, panelSize, panelSize); } catch(e) {}
        } else { doc.rect(x, y, panelSize, panelSize); }
        doc.setFontSize(10); doc.setFont('courier', 'bold');
        const splitText = doc.splitTextToSize(page.text || '', panelSize - 4);
        const textHeight = (splitText.length * 5) + 5;
        doc.setFillColor(255, 255, 224);
        doc.roundedRect(x, y + panelSize + 2, panelSize, textHeight, 2, 2, 'FD');
        doc.text(splitText, x + 2, y + panelSize + 7);
        x += panelSize + spacing;
      });
    } else {
      pages.forEach((page, i) => {
        const panelImgHeight = 90;
        const textAreaPadding = 20;
        const totalPanelEstimatedHeight = panelImgHeight + textAreaPadding;
        if (y + totalPanelEstimatedHeight > pageHeight - margin) { doc.addPage(); y = 20; }
        if (page.imageUrl) {
           try { doc.addImage(page.imageUrl, 'PNG', margin, y, 90, 90); doc.rect(margin, y, 90, 90); } catch(e) {}
        } else { doc.rect(margin, y, 90, 90); }
        doc.setFontSize(12); doc.setFont('courier', 'bold');
        const textX = margin + 100;
        const availableTextWidth = pageWidth - textX - margin;
        const splitText = doc.splitTextToSize(page.text || '', availableTextWidth);
        const finalBoxHeight = (splitText.length * 7) + 10;
        doc.setDrawColor(0); doc.setFillColor(255, 255, 224);
        doc.roundedRect(textX - 5, y + 10, availableTextWidth + 5, finalBoxHeight, 3, 3, 'FD');
        doc.text(splitText, textX, y + 20);
        y += Math.max(100, finalBoxHeight + 20);
      });
    }
    doc.setFontSize(8); doc.setTextColor(150); doc.text(WATERMARK_TEXT, pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Human-readable timestamp helper (YYYY-MM-DD_HH-mm-ss)
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    doc.save(`comic-strip-${timestamp}.pdf`);
  };

  const handlePlayNarrative = async () => {
    if (!comicData || isPlaying) return;
    setIsPlaying(true); setIsAudioLoading(true); cancelPlaybackRef.current = false;
    
    try {
      if (addMusic) {
        // Pre-check key
        const aiStudio = getAIStudio();
        if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
            handleSelectKey();
        }

        const musicUrl = await generateBackgroundMusic(comicData.title || "Comic Narrative", comicData.style || "Comic");
        const musicResp = await fetch(musicUrl);
        const musicBlob = await musicResp.blob();
        const musicObjUrl = URL.createObjectURL(musicBlob);
        if (musicRef.current) {
          musicRef.current.src = musicObjUrl;
          await new Promise((resolve) => {
            if (!musicRef.current) return resolve(null);
            musicRef.current.oncanplaythrough = resolve;
            setTimeout(resolve, 3000);
          });
          if (cancelPlaybackRef.current) return;
          musicRef.current.volume = 0.2; musicRef.current.loop = true;
          musicRef.current.play().catch(e => console.log("Music play prevented", e));
        }
      }
      const panels = comicData.pages || [];
      for (let i = 0; i < panels.length; i++) {
        if (cancelPlaybackRef.current) break;
        setActivePanelIndex(i);
        // FIX ACCENT DRIFT: Prepend a prosody instruction to ensure consistent voice performance
        const speechUrl = await generateSpeechWithGemini(`[Maintain consistent voice performance]: ${panels[i].text}`, selectedVoice);
        if (i === 0) setIsAudioLoading(false);
        if (audioRef.current) {
          audioRef.current.src = speechUrl;
          await new Promise((resolve) => {
            if (!audioRef.current) return resolve(null);
            audioRef.current.onended = () => resolve(null);
            audioRef.current.play().catch(e => { resolve(null); });
          });
        }
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e: any) { 
        console.error("Narrative playback error", e); 
        const msg = e.message || "";
        if (msg.includes("BILLING_ERROR") || msg.includes("active billing") || msg.includes("Requested entity was not found")) {
            setHasKey(false);
            handleSelectKey();
            alert("Music generation requires a paid API key (Veo). Please connect a project with billing enabled.");
        }
    } finally {
      setIsPlaying(false); setActivePanelIndex(null); setIsAudioLoading(false);
      if (musicRef.current) musicRef.current.pause();
    }
  };

  const handleExportMovie = async () => {
    if (!comicData) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Canvas init failed");

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      
      const finishExport = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          
          // Human-readable timestamp helper (YYYY-MM-DD_HH-mm-ss)
          const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
          a.download = `comic-movie-${timestamp}.webm`;
          
          a.click();
          resolve();
        };
      });

      recorder.start();

      const drawFrame = (color: string, text?: string, image?: HTMLImageElement, bubbleText?: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (image) {
          const scale = Math.min(canvas.width / image.width, (canvas.height * 0.8) / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          const x = (canvas.width - w) / 2;
          const y = (canvas.height - h) / 2 - 50;
          ctx.drawImage(image, x, y, w, h);

          if (bubbleText) {
            ctx.font = "bold 40px Courier New";
            const words = bubbleText.split(' ');
            let lines = [];
            let currentLine = '';
            for (let word of words) {
              if (ctx.measureText(currentLine + word).width < 800) currentLine += word + ' ';
              else { lines.push(currentLine); currentLine = word + ' '; }
            }
            lines.push(currentLine);

            const bubbleH = lines.length * 50 + 40;
            const bubbleY = y + h + 20;
            const bubbleX = canvas.width / 2 - 450;
            
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.roundRect(bubbleX, bubbleY, 900, bubbleH, 30);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            lines.forEach((line, i) => {
              ctx.fillText(line.trim(), canvas.width / 2, bubbleY + 50 + (i * 50));
            });
          }
        }

        if (text && !bubbleText) {
          ctx.fillStyle = "white";
          ctx.font = "black 80px Helvetica";
          ctx.textAlign = "center";
          ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        }
      };

      // 1. Intro Card
      drawFrame("#1e293b", comicData.title?.toUpperCase());
      await new Promise(r => setTimeout(r, 3000));
      setExportProgress(10);

      // 2. Sequential Panels
      for (let i = 0; i < comicData.pages.length; i++) {
        const page = comicData.pages[i];
        if (!page.imageUrl) continue;
        
        const img = document.createElement('img');
        img.src = page.imageUrl;
        img.crossOrigin = "anonymous";
        await new Promise(res => img.onload = res);

        // FIX ACCENT DRIFT: Prepend a prosody instruction for consistent movie voice track
        const speechUrl = await generateSpeechWithGemini(`[Maintain consistent voice performance]: ${page.text}`, selectedVoice);
        const speechResp = await fetch(speechUrl);
        const speechArr = await speechResp.arrayBuffer();
        const buffer = await audioCtx.decodeAudioData(speechArr);
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(dest);
        source.connect(audioCtx.destination);

        // Transition: Fade In
        for (let alpha = 0; alpha <= 1; alpha += 0.05) {
          ctx.globalAlpha = alpha;
          drawFrame("#000", undefined, img, page.text);
          await new Promise(r => setTimeout(r, 30));
        }
        ctx.globalAlpha = 1;

        source.start();
        await new Promise(res => source.onended = res);
        await new Promise(r => setTimeout(r, 500));
        
        setExportProgress(10 + ((i + 1) / comicData.pages.length) * 80);
      }

      // 3. Outro Card
      drawFrame("#000", "FIN");
      await new Promise(r => setTimeout(r, 2000));
      
      recorder.stop();
      await finishExport;
      setExportProgress(100);
    } catch (e) {
      console.error(e);
      alert("Export failed. Please check your API limits.");
    } finally {
      setIsExporting(false);
    }
  };

  const stopPlayback = () => {
    cancelPlaybackRef.current = true; setIsPlaying(false); setActivePanelIndex(null); setIsAudioLoading(false);
    if (audioRef.current) audioRef.current.pause(); if (musicRef.current) musicRef.current.pause();
  };

  const isAllImagesGenerated = comicData && comicData.pages && comicData.pages.length > 0 && comicData.pages.every(p => p.imageUrl);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Layout className="w-8 h-8 text-yellow-500" />
          AI Comic Strip
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Assemble visual narratives with Ensemble Casting Protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">1. Seed Images (Anchor First)</label>
                  <div className="grid grid-cols-2 gap-2">
                     {seedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                           <img src={img} className="w-full h-full object-cover" />
                           {idx === 0 && <div className="absolute top-1 left-1 bg-yellow-500 text-black text-[8px] font-black px-1 rounded shadow">ANCHOR</div>}
                           <button onClick={() => removeSeedImage(idx)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                              <X className="w-5 h-5" />
                           </button>
                        </div>
                     ))}
                     {seedImages.length < 4 && (
                        <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-yellow-500 hover:border-yellow-500 transition-colors">
                           <Upload className="w-6 h-6 mb-1" />
                           <span className="text-[10px] font-bold">Upload</span>
                        </button>
                     )}
                     <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleSeedImageUpload} />
                  </div>
                  <p className="text-[10px] text-slate-500 italic">The first image uploaded will be the Primary Anchor.</p>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Columns className="w-3 h-3" /> 2. Orientation</label>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button onClick={() => setOrientation('vertical')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex gap-2 justify-center transition-all ${orientation === 'vertical' ? 'bg-yellow-500 text-black' : 'text-slate-400'}`}><Rows className="w-3.5 h-3.5" /> Vertical</button>
                    <button onClick={() => setOrientation('horizontal')} className={`flex-1 py-2 rounded-lg text-xs font-bold flex gap-2 justify-center transition-all ${orientation === 'horizontal' ? 'bg-yellow-500 text-black' : 'text-slate-400'}`}><Columns className="w-3.5 h-3.5" /> Horizontal</button>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Palette className="w-3 h-3" /> 3. Strip Style</label>
                  <div className="flex flex-col gap-2">
                     {STRIP_STYLES.map(style => (
                        <button key={style.id} onClick={() => setSelectedStripStyleId(style.id)} className={`p-3 rounded-xl border text-left transition-all ${selectedStripStyleId === style.id ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>
                           <div className="text-sm font-bold">{style.label}</div>
                        </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Palette className="w-3 h-3" /> 4. Art Style</label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                     {ART_STYLES.map(style => (
                        <button key={style.id} onClick={() => setSelectedArtStyleId(style.id)} className={`p-3 rounded-xl border text-left transition-all ${selectedArtStyleId === style.id ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}>
                           <div className="text-sm font-bold">{style.label}</div>
                           <div className="text-[10px] opacity-70 leading-tight mt-1">{(style as any).uiDesc || style.desc}</div>
                        </button>
                     ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">5. Context</label>
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. A heist goes wrong..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm h-20 resize-none" />
               </div>
               <button onClick={handleGenerate} disabled={seedImages.length === 0 || status === 'loading'} className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all">
                  {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Layout className="w-4 h-4" />}
                  {status === 'loading' ? progressMsg || 'Directing AI...' : 'Generate Strip'}
               </button>
            </div>

            {isAllImagesGenerated && (
               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Volume2 className="w-4 h-4 text-yellow-500" /> AI Narration Hub</h3>
                     {isPlaying && (
                        <div className="flex gap-0.5 items-end h-3">
                           <div className="w-0.5 bg-yellow-500 animate-[bounce_0.6s_ease-in-out_infinite]" style={{ height: '60%' }}></div>
                           <div className="w-0.5 bg-yellow-500 animate-[bounce_0.6s_ease-in-out_infinite_0.2s]" style={{ height: '100%' }}></div>
                           <div className="w-0.5 bg-yellow-500 animate-[bounce_0.6s_ease-in-out_infinite_0.4s]" style={{ height: '40%' }}></div>
                        </div>
                     )}
                  </div>
                  <div className="space-y-4">
                     {isExporting && (
                       <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] text-amber-600 dark:text-amber-200 font-bold uppercase leading-relaxed">
                             TAB SUSPENDING WARNING: Keep this tab active and visible during export to prevent browser throttling and corrupted movie files.
                          </p>
                       </div>
                     )}
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Voice Casting</label>
                        <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} disabled={isPlaying} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none">
                           {VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                     </div>
                     <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 cursor-pointer">
                           <Music className="w-3 h-3 text-yellow-500" /> Cinematic Score
                        </label>
                        <button onClick={() => !isPlaying && setAddMusic(!addMusic)} className={`w-8 h-4 rounded-full relative transition-all ${addMusic ? 'bg-yellow-500' : 'bg-slate-700'} ${isPlaying ? 'opacity-50' : ''}`}>
                           <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${addMusic ? 'translate-x-4' : ''}`}></div>
                        </button>
                     </div>
                     {!hasKey && addMusic && (
                        <div className="flex items-center justify-center gap-1 text-[9px] text-amber-500 border border-amber-500/20 bg-amber-500/5 p-2 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors" onClick={handleSelectKey}>
                           <Lock className="w-3 h-3" /> Music requires Paid Key
                        </div>
                     )}
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={isPlaying ? stopPlayback : handlePlayNarrative} className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                           {isAudioLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : isPlaying ? <X className="w-3 h-3" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                           {isAudioLoading ? '...' : isPlaying ? 'Stop' : 'Play'}
                        </button>
                        <button onClick={handleExportMovie} disabled={isExporting} className="py-3 rounded-xl font-bold text-[10px] bg-slate-800 text-white border border-slate-700 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-700 disabled:opacity-50">
                           {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Film className="w-3 h-3" />}
                           {isExporting ? `${Math.round(exportProgress)}%` : 'Export'}
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>

         <div className="md:col-span-2 space-y-6">
            {!comicData && status !== 'loading' && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 min-h-[400px]">
                  <ImageIcon className="w-16 h-16 opacity-20 mb-4" />
                  <p>Upload character images to begin. Anchor first.</p>
               </div>
            )}
            {comicData && (
               <div className="space-y-6 animate-fade-in-up">
                  <div className={`bg-white p-8 rounded-sm shadow-2xl border-4 border-black w-full mx-auto relative ${orientation === 'horizontal' ? 'overflow-x-auto custom-scrollbar' : ''}`}>
                     <div className="bg-yellow-300 border-2 border-black p-4 mb-6 text-center shadow-[4px_4px_0px_rgba(0,0,0,1)] sticky left-0">
                        <h1 className="text-3xl font-black text-black uppercase tracking-tighter">{comicData.title}</h1>
                     </div>
                     <div className={`flex ${orientation === 'horizontal' ? 'flex-row gap-8 pb-4 min-w-max' : 'flex-col gap-8'}`}>
                        {(comicData.pages || []).map((panel, idx) => (
                           <div key={idx} className={`flex ${orientation === 'horizontal' ? 'flex-col w-64' : 'flex-row gap-4'}`}>
                              <div className={`
                                 ${orientation === 'horizontal' ? 'w-full mb-4' : 'w-1/2'} 
                                 aspect-square border-2 border-black bg-slate-100 relative overflow-hidden transition-all duration-700
                                 ${activePanelIndex === idx ? 'ring-4 ring-yellow-400 ring-offset-2 scale-[1.02] shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse' : ''}
                              `}>
                                 {panel.imageUrl ? (
                                    <img src={panel.imageUrl} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                       <RefreshCw className="w-8 h-8 text-slate-300 animate-spin"/>
                                    </div>
                                 )}
                                 <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5">{idx + 1}</div>
                              </div>
                              <div className={`${orientation === 'horizontal' ? 'w-full' : 'w-1/2'} flex items-center`}>
                                 <div className={`
                                    bg-white border-2 border-black p-4 rounded-[20px] relative shadow-[2px_2px_0px_rgba(0,0,0,0.2)] text-black font-mono text-sm leading-snug w-full transition-all duration-700
                                    ${activePanelIndex === idx ? 'bg-yellow-50 border-yellow-500 shadow-lg' : ''}
                                 `}>
                                    {orientation === 'vertical' && (
                                      <div className={`absolute top-1/2 -left-3 w-4 h-4 bg-white border-b-2 border-l-2 border-black transform rotate-45 transition-colors ${activePanelIndex === idx ? 'bg-yellow-50 border-yellow-500' : ''}`}></div>
                                    )}
                                    {orientation === 'horizontal' && (
                                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-black transform rotate-45 transition-colors ${activePanelIndex === idx ? 'bg-yellow-50 border-yellow-500' : ''}`}></div>
                                    )}
                                    {panel.text}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="mt-8 pt-4 border-t-2 border-black text-center text-xs font-bold font-mono text-black sticky left-0 uppercase">
                        Ensemble Casting Protocol Engaged • {selectedArtStyleId}
                     </div>
                  </div>
                  <div className="flex justify-center gap-4">
                     <button onClick={handleDownload} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-700">
                        <Download className="w-5 h-5" /> Download PDF Strip
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
      <audio ref={audioRef} className="hidden" />
      <video ref={musicRef} className="hidden" playsInline />
      <style>{`
        @keyframes bounce {
          0%, 100% { height: 40%; }
          50% { height: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ComicStripTool;
