import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Download, Edit3, FileText, Smartphone, Save, User, Trash2, CheckCircle2, Settings, X, FileJson, Book, Image as ImageIcon, Music, Volume2, VolumeX, ToggleLeft, ToggleRight, PlusCircle, Users, Clock, MapPin, UserMinus } from 'lucide-react';
import { generateStoryScript, generateImageWithGemini, generateBackgroundMusic, generateProImageWithGemini } from '../../services/geminiService';
import { StorybookData, StoryPage, LoadingState, SavedCharacter } from '../../types';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';
import { runFileSecurityChecks } from '../../utils/security';
import { dbService, STORES } from '../../utils/db';

const STYLES = [
  { id: 'fairytale', label: 'Fairy Tale', desc: 'Watercolor, whimsical, soft lighting, storybook style' },
  { id: 'comic', label: 'Comic Book', desc: 'Bold lines, vibrant colors, dynamic action' },
  { id: 'cyberpunk', label: 'Sci-Fi', desc: 'Neon lights, futuristic, digital art, sharp details' },
  { id: 'pixel', label: 'Pixel Art', desc: 'Retro game style, 8-bit, nostalgic' },
  { id: '3d', label: '3D Pixar', desc: 'Cute, rounded, high fidelity 3D render, bright' },
  { id: 'watercolor', label: 'Classic Watercolor', desc: 'Traditional watercolor painting, soft edges, pastel palette, dreamy and artistic' },
  { id: 'noir', label: 'Noir', desc: 'High contrast black and white, dramatic shadows, cinematic lighting, mysterious' },
  { id: 'oil', label: 'Oil Painting', desc: 'Textured brushstrokes, rich colors, classical art style, impasto' },
  { id: 'ukiyoe', label: 'Ukiyo-e', desc: 'Japanese woodblock print style, flat colors, distinct outlines, nature motifs' },
  { id: 'anime', label: 'Anime', desc: 'Japanese animation style, vibrant, expressive characters, detailed backgrounds' },
  { id: 'clay', label: 'Claymation', desc: 'Plasticine texture, stop-motion look, handcrafted feel, soft lighting' },
  { id: 'lineart', label: 'Line Art', desc: 'Black ink on white, minimalist, clean lines, sketching style' },
  { id: 'papercut', label: 'Paper Cutout', desc: 'Layered paper aesthetic, depth shadows, craft style, collage' },
  { id: 'steampunk', label: 'Steampunk', desc: 'Victorian technology, brass and gears, sepia tones, retro-futuristic' },
  { id: 'gothic', label: 'Gothic', desc: 'Dark, atmospheric, ornate details, moody, Tim Burton style' },
  { 
    id: 'edewede_ai_o3', 
    label: 'Edewede-AI-O3', 
    desc: 'Analog 2D storybook minimalism inspired by mid-century printmaking and educational infographics. Features clean, intentional contours and flat color blocks with slight misregistered ink edges to mimic vintage offset printing. Compositions are calm and airy, utilizing generous negative space and geometric groupings in flattened frontal views. Palette: 3–5 strictly limited earthy tones (ochre, muted sage, dusty terracotta, charcoal) on off-white paper. Characters are essential symbols: bodies as bold silhouettes, hair as tidy geometric shapes that clearly frame the face, limbs as thin tapered lines, and faces with clearly visible tiny dot eyes and small pink circular cheeks. Zero gradients, zero highlights, and zero 3D depth cues. Environment props like trees and buildings are reduced to primitive geometric blocks, circles, and triangles.' 
  }
];

const StorybookLargeTool: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [bookData, setBookData] = useState<StorybookData | null>(null);
  const [viewIndex, setViewIndex] = useState(0);

  // Character Management State
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [showSaveCharDialog, setShowSaveCharDialog] = useState(false);
  const [selectedToSave, setSelectedToSave] = useState<string[]>([]);
  const [showCharManager, setShowCharManager] = useState(false);
  const [isSavingChar, setIsSavingChar] = useState(false);

  // Extension State
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extensionCastMode, setExtensionCastMode] = useState<'keep' | 'change'>('keep');
  const [agingEffect, setAgingEffect] = useState('Immediate continuation');
  const [locationChange, setLocationChange] = useState('Same location');

  // Edit Metadata State
  const [showEditMetadata, setShowEditMetadata] = useState(false);
  const [editData, setEditData] = useState<Partial<StorybookData>>({});
  const authorImageRef = useRef<HTMLInputElement>(null);

  // Sound/Music State
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const saved = await dbService.getAll<SavedCharacter>(STORES.CHARACTERS);
      setSavedCharacters(saved);
    } catch (e) {
      console.error("Failed to load saved characters from IndexedDB", e);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.15;
      if (musicUrl && !isMuted) {
        audioRef.current.play().catch(e => console.log("Auto-play prevented"));
      }
    }
  }, [musicUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const playPageTurnSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 0.35;
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + duration);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch (e) {}
  };

  const nextView = () => {
    if (viewIndex < totalViews - 1) {
      setViewIndex(v => v + 1);
      playPageTurnSound();
    }
  };

  const prevView = () => {
    if (viewIndex > 0) {
      setViewIndex(v => v - 1);
      playPageTurnSound();
    }
  };

  const toggleCharacterSelection = (id: string) => {
    setSelectedCharacterIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const handleSaveCharacters = async () => {
    if (!bookData || selectedToSave.length === 0) return;
    setIsSavingChar(true);

    for (const charId of selectedToSave) {
      const charInfo = bookData.castingSheet?.find(c => c.id === charId);
      if (!charInfo) continue;

      let previewUrl = (bookData.pages || [])[0]?.imageUrl;
      try {
         const portraitPrompt = `Character portrait of ${charInfo.id}: ${charInfo.description}. Isolated, white background, high quality. Visual Style: ${bookData.style}`;
         previewUrl = await generateImageWithGemini(portraitPrompt, '1:1');
      } catch (e) {
         console.error("Failed to generate character preview", e);
      }

      const newChar: SavedCharacter = {
        id: (Date.now() + Math.random()).toString(),
        name: charInfo.id,
        description: charInfo.description,
        previewImage: previewUrl
      };

      try {
        await dbService.put(STORES.CHARACTERS, newChar);
      } catch (e) { console.error("Save failed", e); }
    }
    
    await loadCharacters();
    alert(`Selected characters archived!`);
    setIsSavingChar(false);
    setShowSaveCharDialog(false);
    setSelectedToSave([]);
  };

  const handleDeleteCharacter = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this character?")) return;
    try {
      await dbService.delete(STORES.CHARACTERS, id);
      setSavedCharacters(prev => prev.filter(c => c.id !== id));
      setSelectedCharacterIds(prev => prev.filter(i => i !== id));
    } catch (e) { console.error("Delete failed", e); }
  };

  const updatePageText = (index: number, newText: string) => {
    if (!bookData) return;
    const updatedPages = [...bookData.pages];
    updatedPages[index] = { ...updatedPages[index], text: newText };
    setBookData({ ...bookData, pages: updatedPages });
  };

  const cleanNarrativeText = (text: string) => {
    return text.replace(/\[.*?\]/g, '').trim();
  };

  const handleGenerate = async (isExtending = false) => {
    if (!concept.trim() && !isExtending) return;

    setStatus('loading');
    if (isExtending) {
      setShowExtendModal(false);
    } else {
      setBookData(null);
      setMusicUrl(null);
      setViewIndex(0);
    }

    try {
      setProgressMsg(isExtending ? 'Drafting story continuation...' : 'Drafting 10-page epic...');
      const styleDesc = STYLES.find(s => s.id === selectedStyle)?.desc || 'illustration';
      
      const characterDescs = selectedCharacterIds
        .map(id => {
          const c = savedCharacters.find(sc => sc.id === id);
          return c ? `${c.name}: ${c.description}` : '';
        })
        .filter(Boolean)
        .join('. ');

      const targetPageCount = 10;
      let finalConcept = isExtending 
        ? `CONTINUATION: The previous story was about: ${bookData?.backCoverBlurb}. NEW PLOT: ${concept}. 
           RULES: Start exactly where we left off. ${agingEffect}. ${locationChange}. 
           CAST CHANGES: ${extensionCastMode === 'keep' ? 'Keep existing cast' : 'Introduce new characters or remove old ones as per the plot'}.
           LENGTH: Write exactly ${targetPageCount} additional pages.` 
        : `Write a long, detailed ${targetPageCount}-page illustrated story about: ${concept}. Ensure each page feels substantial.`;

      const script = await generateStoryScript(finalConcept, styleDesc, characterDescs || undefined);
      
      if (characterDescs) script.characterDescription = characterDescs;
      if (!script.pages || !Array.isArray(script.pages)) script.pages = [];
      
      script.pages = script.pages.map(p => ({
        ...p,
        text: cleanNarrativeText(p.text)
      })).slice(0, targetPageCount);

      const existingPages = isExtending ? [...(bookData?.pages || [])] : [];
      
      const locationAnchorMap: Record<string, string> = {};
      if (isExtending && existingPages.length > 0) {
         existingPages.forEach(p => {
            if (p.locationId && p.imageUrl && !locationAnchorMap[p.locationId]) {
               locationAnchorMap[p.locationId] = p.imageUrl;
            }
         });
      }

      const placeholderPages = script.pages.map((p, i) => ({
        ...p,
        imageUrl: '',
      }));

      if (isExtending) {
        setBookData(prev => prev ? { ...prev, pages: [...existingPages, ...placeholderPages] } : null);
        setViewIndex(existingPages.length + 2);
      } else {
        setBookData({ ...script, pages: placeholderPages });
      }

      const castingInstructions = (script.castingSheet || [])
        .map(c => `CHARACTER DNA [${c.id}]: ${c.description}`)
        .join('. ');

      const propInstructions = (script.propManifest || [])
        .map(p => `PROP DNA [${p.id}]: ${p.description}`)
        .join('. ');

      const drawPage = async (idx: number, prompt: string, ref?: string) => {
         for (let attempt = 0; attempt < 3; attempt++) {
            try {
               setProgressMsg(`Illustrating Panel ${idx + 1}/${script.pages.length}...`);
               return await generateImageWithGemini(prompt, '1:1', ref);
            } catch (e) {
               await new Promise(r => setTimeout(r, 7000));
            }
         }
         return '';
      };

      for (let i = 0; i < script.pages.length; i++) {
          if (i > 0 || isExtending) await new Promise(resolve => setTimeout(resolve, 8500));
          
          const page = script.pages[i];
          const locId = page.locationId || 'default';
          const currentReference = locationAnchorMap[locId];

          const pagePrompt = `
            STYLE: ${script.style}. 
            GLOBAL CAST: ${castingInstructions}.
            GLOBAL PROPS: ${propInstructions}.
            ENVIRONMENT: ${page.environmentDescription}.
            SCENE: ${page.imagePrompt}. 
            STAGE DIRECTIONS: ${page.stageDirections || 'None'}.
            
            IMMUTABILITY RULE: 
            - Use reference image for character facial structure ONLY.
            - If this is location "${locId}", do NOT use visual data from other locations.
            - Maintain absolute visual consistency for props defined in DNA.
          `.replace(/\s+/g, ' ').trim();

          const imageUrl = await drawPage(i, pagePrompt, currentReference);
          
          if (!locationAnchorMap[locId] && imageUrl) {
             locationAnchorMap[locId] = imageUrl;
          }
          
          setBookData(prev => {
              if (!prev) return null;
              const nextPages = [...prev.pages];
              const targetIdx = isExtending ? existingPages.length + i : i;
              nextPages[targetIdx] = { ...nextPages[targetIdx], imageUrl };
              return { ...prev, pages: nextPages };
          });
      }
      
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleGenerateMusic = async () => {
    if (!bookData) return;
    setGeneratingMusic(true);
    try {
      const url = await generateBackgroundMusic(bookData.title, bookData.style);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load music stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setMusicUrl(objectUrl);
      setIsMuted(false);
    } catch (e) {
      console.error("Music generation failed", e);
      alert("Could not generate music. Please ensure you have a paid API key for Veo connected in Settings.");
    }
    setGeneratingMusic(false);
  };

  const openMetadataEditor = () => {
    if (!bookData) return;
    setEditData({
      title: bookData.title,
      characterName: bookData.characterName,
      author: bookData.author || "AI Storyteller",
      authorImage: bookData.authorImage || "",
      dedication: bookData.dedication || "",
      authorBio: bookData.authorBio || "",
      backCoverBlurb: bookData.backCoverBlurb || ""
    });
    setShowEditMetadata(true);
  };

  const handleAuthorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            await runFileSecurityChecks(file, 'image');
            const reader = new FileReader();
            reader.onloadend = () => setEditData(prev => ({ ...prev, authorImage: reader.result as string }));
            reader.readAsDataURL(file);
        } catch (err) { console.error("Invalid file"); }
    }
  };

  const saveMetadata = () => {
    if (!bookData) return;
    setBookData({
      ...bookData,
      title: editData.title || bookData.title,
      characterName: editData.characterName || bookData.characterName,
      author: editData.author || bookData.author,
      authorImage: editData.authorImage || bookData.authorImage,
      dedication: editData.dedication || bookData.dedication,
      authorBio: editData.authorBio || bookData.authorBio,
      backCoverBlurb: editData.backCoverBlurb || bookData.backCoverBlurb
    });
    setShowEditMetadata(false);
  };

  const totalViews = bookData ? (bookData.pages?.length || 0) + 4 : 0;

  const renderCurrentView = () => {
    if (!bookData) return null;
    if (viewIndex === 0) {
      return (
        <div className="flex-1 bg-[#fffbf0] p-8 md:p-12 flex flex-col items-center justify-center text-center relative border-r border-slate-300">
           <div className="border-4 border-double border-slate-800 p-8 w-full h-full flex flex-col items-center justify-center relative">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-black mb-6 leading-tight">{bookData.title}</h1>
              <div className="w-24 h-px bg-slate-800 mb-6"></div>
              <div className="w-48 h-48 bg-slate-200 rounded-full overflow-hidden mb-8 border-2 border-slate-400 shadow-inner flex items-center justify-center">
                 {bookData.pages && bookData.pages[0]?.imageUrl ? (
                    <img src={bookData.pages[0].imageUrl} className="w-full h-full object-cover" alt="Cover" />
                 ) : ( <BookOpen className="w-16 h-16 text-slate-400 opacity-50" /> )}
              </div>
              <p className="text-xl font-serif italic text-black">Written & Illustrated by</p>
              <p className="text-2xl font-bold text-black mt-2">{bookData.author || "AI Storyteller"}</p>
              <button onClick={openMetadataEditor} className="absolute top-2 right-2 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full shadow-sm border border-slate-300 transition-all z-10"><Edit3 className="w-4 h-4" /></button>
           </div>
        </div>
      );
    }
    if (viewIndex === 1) {
      return (
        <div className="flex-1 bg-[#fffbf0] p-12 flex flex-col items-center justify-center text-center relative border-r border-slate-300">
           <div className="max-w-md mx-auto italic text-black font-serif text-lg leading-relaxed">{bookData.dedication || "Dedicated to all the dreamers."}</div>
           <div className="absolute bottom-8 text-xs text-black uppercase tracking-widest">© {new Date().getFullYear()} {bookData.author}</div>
           <button onClick={openMetadataEditor} className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full shadow-sm border border-slate-300 transition-all z-10"><Edit3 className="w-4 h-4" /></button>
        </div>
      );
    }
    const pages = bookData.pages || [];
    if (viewIndex === pages.length + 2) {
      return (
        <div className="flex-1 bg-[#fffbf0] p-12 flex flex-col items-center justify-center text-center relative border-r border-slate-300">
           <h2 className="text-2xl font-bold text-black mb-6 font-serif uppercase tracking-widest border-b-2 border-indigo-500 pb-2">About the Author</h2>
           <div className="w-32 h-32 bg-slate-200 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg mx-auto">
              {bookData.authorImage ? <img src={bookData.authorImage} alt="Author" className="w-full h-full object-cover" /> : <User className="w-full h-full text-slate-400 p-6 bg-slate-100" />}
           </div>
           <h3 className="text-xl font-bold text-black mb-4">{bookData.author}</h3>
           <p className="text-black font-serif leading-relaxed max-w-md mx-auto">{bookData.authorBio || "An AI storyteller crafting worlds from pixels and code."}</p>
           <button onClick={openMetadataEditor} className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full shadow-sm border border-slate-300 transition-all z-10"><Edit3 className="w-4 h-4" /></button>
        </div>
      );
    }
    if (viewIndex === pages.length + 3) {
      return (
        <div className="flex-1 bg-[#fffbf0] p-12 flex flex-col items-center justify-center text-center relative text-black">
           <div className="max-w-md mx-auto space-y-8">
              <div className="bg-slate-900/5 border border-slate-200 p-8 rounded-xl backdrop-blur-sm relative">
                 <p className="font-serif text-lg leading-relaxed italic text-black">"{bookData.backCoverBlurb || bookData.characterDescription}"</p>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-50">
                 <div className="w-32 h-12 bg-white border border-slate-200 rounded flex items-center justify-center"><div className="w-24 h-8 border-t-4 border-b-4 border-black"></div></div>
                 <span className="text-xs font-mono">ISBN-9000-AI-STORY</span>
              </div>
           </div>
           <button onClick={openMetadataEditor} className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full shadow-sm border border-slate-300 transition-all z-10"><Edit3 className="w-4 h-4" /></button>
        </div>
      );
    }
    const pageIndex = viewIndex - 2;
    const page = pages[pageIndex];
    if (!page) return null;
    return (
      <>
         <div className="flex-1 bg-white p-4 md:p-8 flex items-center justify-center border-r border-slate-300 relative">
            <div className="w-full h-full bg-slate-100 rounded-lg shadow-inner overflow-hidden flex items-center justify-center relative group">
              {page.imageUrl ? (
                <>
                  <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
                  <a href={page.imageUrl} download={`ai-book-p${page.pageNumber}.png`} className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Download className="w-4 h-4" /></a>
                </>
              ) : (
                <div className="text-center space-y-2">
                   <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                   <p className="text-xs text-slate-500 font-medium">Illustrating...</p>
                </div>
              )}
              <div className="absolute top-2 left-2 text-xs font-bold text-black bg-white/80 px-2 py-1 rounded">Page {page.pageNumber}</div>
            </div>
         </div>
         <div className="flex-1 bg-[#fffbf0] p-6 md:p-12 flex flex-col justify-center relative overflow-y-auto">
            <div className="prose prose-slate max-w-none flex flex-col h-full">
               {pageIndex === 0 && <h2 className="text-2xl font-serif font-bold text-black mb-6 border-b border-indigo-900/10 pb-4">{bookData.title}</h2>}
               <textarea
                  value={page.text}
                  onChange={(e) => updatePageText(pageIndex, e.target.value)}
                  className="flex-1 w-full bg-transparent text-lg md:text-xl font-serif leading-relaxed text-black whitespace-pre-wrap focus:outline-none resize-none border-none p-0 custom-scrollbar"
               />
            </div>
            <div className="absolute bottom-4 right-6 text-xs text-black font-mono">{pageIndex + 1}</div>
         </div>
      </>
    );
  };

  const handleDownloadBook = (mode: 'portrait' | 'landscape') => {
    if (!bookData) return;
    try {
      const doc = new jsPDF({ orientation: mode, unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const addWatermark = () => { doc.setTextColor(0); doc.setFontSize(8); doc.text(WATERMARK_TEXT, pageWidth / 2, pageHeight - 5, { align: 'center' }); };
      doc.setFillColor(255, 251, 240); doc.rect(0, 0, pageWidth, pageHeight, 'F'); addWatermark();
      doc.setDrawColor(50); doc.setLineWidth(1); doc.rect(margin, margin, pageWidth - margin*2, pageHeight - margin*2);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(32);
      const splitTitle = doc.splitTextToSize((bookData.title || '').toUpperCase(), pageWidth - (margin * 3));
      doc.text(splitTitle, pageWidth / 2, pageHeight / 3, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(16); doc.text(`Written & Illustrated by`, pageWidth / 2, (pageHeight / 3) + 30, { align: 'center' });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(bookData.author || "AI Storyteller", pageWidth / 2, (pageHeight / 3) + 40, { align: 'center' });
      doc.addPage(); addWatermark();
      doc.setFontSize(12); doc.setFont('times', 'italic'); doc.text(bookData.dedication || "", pageWidth / 2, pageHeight / 2, { align: 'center' });
      (bookData.pages || []).forEach((page) => {
        doc.addPage(); addWatermark();
        if (mode === 'portrait') {
          let textY = margin + 20;
          if (page.imageUrl) { try { doc.addImage(page.imageUrl, 'PNG', (pageWidth - 120) / 2, margin + 10, 120, 120); textY = margin + 10 + 120 + 20; } catch (e) {} }
          doc.setFontSize(14); const splitText = doc.splitTextToSize(page.text || '', pageWidth - (margin * 2)); doc.text(splitText, pageWidth/2, textY, { align: 'center' });
        } else {
          if (page.imageUrl) { try { doc.addImage(page.imageUrl, 'PNG', margin, margin, (pageWidth/2) - margin*1.5, (pageWidth/2) - margin*1.5); } catch (e) {} }
          doc.setFontSize(14); const splitText = doc.splitTextToSize(page.text || '', (pageWidth/2) - margin*2); doc.text(splitText, (pageWidth/2) + margin, pageHeight / 2, { align: 'left', baseline: 'middle' });
        }
      });
      doc.addPage(); addWatermark(); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text("About the Author", pageWidth / 2, margin + 20, { align: 'center' });
      doc.setFontSize(12); const splitBio = doc.splitTextToSize(bookData.authorBio || "", pageWidth - (margin * 3)); doc.text(splitBio, pageWidth / 2, margin + 40, { align: 'center' });
      doc.addPage(); doc.setFillColor(255, 251, 240); doc.rect(0, 0, pageWidth, pageHeight, 'F'); doc.setTextColor(0);
      const splitBlurb = doc.splitTextToSize(`"${bookData.backCoverBlurb || bookData.characterDescription}"`, pageWidth - (margin * 4));
      doc.text(splitBlurb, pageWidth / 2, pageHeight / 2, { align: 'center' });
      doc.save(`ai-storybook-large-${Date.now()}.pdf`);
    } catch (e) { alert("PDF Error"); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          AI Storybook Large
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Longer 10-page epics with multi-character casting and story extensions.</p>
      </div>

      {!bookData ? (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">1. Style Forge</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-64 overflow-y-auto custom-scrollbar pr-2">
                    {STYLES.map(style => (
                      <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={`p-3 rounded-xl border text-left transition-all ${selectedStyle === style.id ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'}`}>
                        <div className="font-bold text-sm">{style.label}</div>
                        <div className="text-xs opacity-60 truncate">{(style as any).uiDesc || style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">2. Ensemble Cast (Select Multiple)</label>
                    <button onClick={() => setShowCharManager(true)} className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1 font-medium"><Settings className="w-3 h-3" /> Manage</button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button onClick={() => { setSelectedCharacterIds([]); setShowCharManager(true); }} className={`flex-shrink-0 p-3 rounded-xl border flex flex-col items-center justify-center w-24 h-24 transition-all bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-750`}>
                      <PlusCircle className="w-6 h-6 mb-1" /> <span className="text-xs font-bold">New Actor</span>
                    </button>
                    {savedCharacters.map(char => (
                       <button key={char.id} onClick={() => toggleCharacterSelection(char.id)} className={`flex-shrink-0 rounded-xl border overflow-hidden w-24 h-24 transition-all relative ${selectedCharacterIds.includes(char.id) ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700 hover:border-slate-500'}`}>
                        {char.previewImage ? <img src={char.previewImage} alt={char.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><span className="text-xs">{char.name[0]}</span></div>}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-1 text-center truncate px-1">{char.name}</div>
                        {selectedCharacterIds.includes(char.id) && <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-0.5"><CheckCircle2 className="w-3 h-3 text-black" /></div>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">3. Plot Arc</label>
                   <textarea value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="A grand 10-page adventure about..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32" />
                </div>

                <button onClick={() => handleGenerate(false)} disabled={!concept.trim() || status === 'loading'} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20">
                  {status === 'loading' ? <><RefreshCw className="animate-spin" /> {progressMsg}</> : <><Sparkles className="fill-current" /> Forge 10-Page Book</>}
                </button>
             </div>
             <div className="hidden md:flex flex-col items-center justify-center text-indigo-400/20 space-y-4 border-l border-slate-800 pl-8">
               <BookOpen className="w-32 h-32" />
               <p className="text-sm text-center max-w-xs text-slate-500 font-bold uppercase tracking-widest">High Fidelity Sequencing Engaged</p>
             </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
             <div className="flex gap-2">
               <button onClick={() => { setBookData(null); setStatus('idle'); setConcept(''); setSelectedCharacterIds([]); }} className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"><Edit3 className="w-4 h-4" /> New Concept</button>
               <button onClick={() => { setConcept(''); setShowExtendModal(true); }} className="flex items-center gap-2 text-indigo-400 hover:text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors bg-indigo-900/20 border border-indigo-900/30"><PlusCircle className="w-4 h-4" /> Extend Story</button>
             </div>
             <div className="flex flex-wrap gap-2 justify-center items-center">
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 bg-slate-800 rounded-lg text-indigo-400">{soundEnabled ? <ToggleRight className="w-5 h-5 text-indigo-400" /> : <ToggleLeft className="w-5 h-5" />}</button>
                <button onClick={() => { setSelectedToSave([]); setShowSaveCharDialog(true); }} className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 hover:bg-indigo-600 transition-colors"><Save className="w-4 h-4" /> Save Actor</button>
                <button onClick={handleGenerateMusic} disabled={generatingMusic} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg disabled:opacity-50">{generatingMusic ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Music className="w-4 h-4"/>} Soundtrack</button>
                <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>
                <button onClick={() => handleDownloadBook('portrait')} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 hover:bg-indigo-600"><Smartphone className="w-4 h-4" /> PDF</button>
                <button onClick={() => handleDownloadBook('landscape')} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700 hover:bg-indigo-600"><BookOpen className="w-4 h-4" /> Spread</button>
             </div>
          </div>

          {status === 'loading' && (
             <div className="bg-indigo-600/10 border border-indigo-500/30 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">{progressMsg}</span>
             </div>
          )}

          <div className="relative aspect-[3/2] md:aspect-[2/1] bg-slate-200 rounded-xl shadow-2xl overflow-hidden flex text-slate-900 border-8 border-indigo-900/10">
             {renderCurrentView()}
             <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none"></div>
          </div>

          <div className="flex items-center justify-center gap-6 pb-6 relative">
            <button onClick={prevView} disabled={viewIndex === 0} className="bg-slate-800 hover:bg-indigo-600 disabled:opacity-50 text-white p-4 rounded-full transition-colors shadow-lg"><ChevronLeft className="w-6 h-6" /></button>
            <div className="flex gap-1 items-center">
               <span className="text-xs font-mono text-black uppercase mr-2">{viewIndex === 0 ? 'Cover' : viewIndex === 1 ? 'Intro' : viewIndex >= totalViews - 2 ? 'Back' : `P${viewIndex - 1}`}</span>
               <div className="flex gap-1">
                  {[...Array(totalViews)].map((_, i) => (
                    <button key={i} onClick={() => { setViewIndex(i); playPageTurnSound(); }} className={`w-2 h-2 rounded-full transition-all ${viewIndex === i ? 'bg-indigo-500 w-4' : 'bg-slate-700 hover:bg-slate-600'}`} />
                  ))}
               </div>
            </div>
            <button disabled={viewIndex === totalViews - 1} onClick={nextView} className="bg-slate-800 hover:bg-indigo-600 disabled:opacity-50 text-white p-4 rounded-full transition-colors shadow-lg"><ChevronRight className="w-6 h-6" /></button>
            {musicUrl && (
               <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-900 border border-slate-700 p-2 rounded-full shadow-xl">
                  <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-indigo-400 hover:text-indigo-300">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                  <audio ref={audioRef} src={musicUrl} loop className="hidden" />
               </div>
            )}
          </div>
        </div>
      )}

      {/* EXTEND STORY MODAL */}
      {showExtendModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-[2.5rem] w-full max-xl space-y-6 shadow-2xl">
               <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center justify-center gap-2"><PlusCircle className="text-indigo-500" /> Extend Adventure</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Configuration for next 10-page chapter</p>
               </div>
               
               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3"/> Cast Mode</label>
                        <select value={extensionCastMode} onChange={e => setExtensionCastMode(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white">
                           <option value="keep">Keep Same Cast</option>
                           <option value="change">Add/Remove Actors</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Aging</label>
                        <select value={agingEffect} onChange={e => setAgingEffect(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white">
                           <option>No aging</option>
                           <option>5 years later</option>
                           <option>20 years later</option>
                           <option>Flashback (younger)</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Setting</label>
                        <select value={locationChange} onChange={e => setLocationChange(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white">
                           <option>Stay in same location</option>
                           <option>Move to new location</option>
                           <option>Unknown destination</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase">New Plot Twist / Next Arc</label>
                     <textarea value={concept} onChange={e => setConcept(e.target.value)} placeholder="What happens next? e.g. They discover a hidden cave..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm h-24 resize-none" />
                  </div>
               </div>

               <div className="flex gap-3">
                  <button onClick={() => setShowExtendModal(false)} className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold uppercase text-xs">Abort</button>
                  <button onClick={() => handleGenerate(true)} disabled={!concept.trim() || status === 'loading'} className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
                     <Sparkles className="w-4 h-4" /> AUTHOR NEXT CHAPTER
                  </button>
               </div>
            </div>
         </div>
      )}

      {showEditMetadata && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-lg space-y-4 shadow-2xl">
               <div className="flex justify-between items-center border-b border-slate-800 pb-4"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Book className="w-5 h-5 text-indigo-500"/> Edit Manuscript</h3><button onClick={() => setShowEditMetadata(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button></div>
               <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Title</label><input value={editData.title || ''} onChange={(e) => setEditData({...editData, title: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Author</label><input value={editData.author || ''} onChange={(e) => setEditData({...editData, author: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none" /></div>
                  <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-slate-700">{editData.authorImage ? <img src={editData.authorImage} className="w-full h-full object-cover"/> : <User className="w-6 h-6 text-slate-500 m-3"/>}</div><button onClick={() => authorImageRef.current?.click()} className="text-xs bg-slate-800 px-3 py-2 rounded text-slate-300">New Photo</button><input type="file" ref={authorImageRef} className="hidden" accept="image/*" onChange={handleAuthorImageUpload} /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dedication</label><textarea value={editData.dedication || ''} onChange={(e) => setEditData({...editData, dedication: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-20 resize-none" /></div>
                  <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Blurb</label><textarea value={editData.backCoverBlurb || ''} onChange={(e) => setEditData({...editData, backCoverBlurb: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white h-24 resize-none" /></div>
               </div>
               <div className="flex gap-3 pt-2"><button onClick={() => setShowEditMetadata(false)} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-medium">Discard</button><button onClick={saveMetadata} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Commit Changes</button></div>
            </div>
         </div>
      )}

      {showSaveCharDialog && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-[2.5rem] w-full max-w-lg space-y-6 shadow-2xl">
               <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Archive Cast</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Select characters to save to your agency</p>
               </div>
               
               <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                  {bookData?.castingSheet && bookData.castingSheet.length > 0 ? (
                    bookData.castingSheet.map((char) => (
                      <label key={char.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedToSave.includes(char.id) ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                         <div className="pt-0.5">
                            <input 
                              type="checkbox" 
                              checked={selectedToSave.includes(char.id)}
                              onChange={() => {
                                 setSelectedToSave(prev => prev.includes(char.id) ? prev.filter(id => id !== char.id) : [...prev, char.id]);
                              }}
                              className="w-4 h-4 accent-indigo-600 rounded border-slate-700 bg-slate-800"
                            />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white uppercase tracking-tight">{char.id}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{char.description}</p>
                         </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                       <UserMinus className="w-12 h-12 mx-auto mb-2 opacity-20" />
                       <p className="text-xs font-bold uppercase">No casting data found</p>
                    </div>
                  )}
               </div>

               <div className="flex gap-3">
                  <button onClick={() => setShowSaveCharDialog(false)} className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold uppercase text-xs">Ignore</button>
                  <button 
                    onClick={handleSaveCharacters} 
                    disabled={selectedToSave.length === 0 || isSavingChar}
                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                  >
                     {isSavingChar ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     {isSavingChar ? 'ARCHIVING...' : 'SAVE SELECTED'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {showCharManager && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center"><h3 className="text-xl font-bold text-white uppercase tracking-tighter">Casting Agency</h3><button onClick={() => setShowCharManager(false)} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button></div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {savedCharacters.length === 0 ? (<div className="text-center text-slate-500 py-12"><User className="w-16 h-16 mx-auto mb-4 opacity-10" /><p>No actors in the database.</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{savedCharacters.map(char => (<div key={char.id} className={`bg-slate-950 border rounded-xl p-4 flex gap-4 relative group transition-all ${selectedCharacterIds.includes(char.id) ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-800'}`} onClick={() => toggleCharacterSelection(char.id)}><div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">{char.previewImage ? <img src={char.previewImage} alt={char.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600"><User className="w-8 h-8" /></div>}</div><div className="flex-1 min-w-0"><h4 className="font-bold text-white truncate">{char.name}</h4><p className="text-xs text-slate-500 line-clamp-3 mt-1">{char.description}</p></div><button onClick={(e) => handleDeleteCharacter(char.id, e)} className="absolute top-2 right-2 p-2 bg-red-900/50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900"><Trash2 className="w-3 h-3" /></button></div>))}</div>)}
              </div>
              <div className="p-6 border-t border-slate-800 flex justify-end"><button onClick={() => setShowCharManager(false)} className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold uppercase text-xs">Close Casting</button></div>
            </div>
         </div>
      )}
    </div>
  );
};

export default StorybookLargeTool;