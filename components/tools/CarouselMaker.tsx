
import React, { useState, useRef, useEffect } from 'react';
import { GalleryHorizontal, RefreshCw, Download, Palette, Type, User, Layers, Smartphone, FileText, Upload, X, Image as ImageIcon, Monitor, Square, Settings, ToggleLeft, ToggleRight, PaintBucket, Flower, Grid, Circle, Box, Play, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Smile, Frame, Move, Eye, EyeOff, Plus, Trash2, PenLine, Save } from 'lucide-react';
import { generateCarouselContent } from '../../services/geminiService';
import { LoadingState, CarouselData, CarouselSlide } from '../../types';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { runFileSecurityChecks } from '../../utils/security';

const THEMES = [
  { id: 'corporate', label: 'Corporate Blue', bg: '#0077b5', text: '#ffffff', accent: '#ffffff' },
  { id: 'minimal', label: 'Clean Minimal', bg: '#ffffff', text: '#1e293b', accent: '#0077b5' },
  { id: 'dark', label: 'Bold Dark', bg: '#0f172a', text: '#f8fafc', accent: '#fbbf24' },
  { id: 'forest', label: 'Forest Green', bg: '#064e3b', text: '#ecfdf5', accent: '#34d399' },
  { id: 'luxury', label: 'Luxury Gold', bg: '#000000', text: '#ffd700', accent: '#ffffff' },
  { id: 'tech', label: 'Cyber Tech', bg: '#1a1a2e', text: '#00fff5', accent: '#ff007f' },
  { id: 'sunset', label: 'Sunset Vibes', bg: '#ff7e5f', text: '#3f000f', accent: '#feb47b' },
  { id: 'lavender', label: 'Soft Lavender', bg: '#e6e6fa', text: '#483d8b', accent: '#9370db' },
  { id: 'mint', label: 'Fresh Mint', bg: '#f5fffa', text: '#2e8b57', accent: '#00ced1' },
  { id: 'retro', label: 'Retro Pop', bg: '#fef3c7', text: '#d97706', accent: '#ef4444' },
  { id: 'berry', label: 'Berry Blast', bg: '#4a044e', text: '#fbcfe8', accent: '#f472b6' },
  { id: 'slate', label: 'Sleek Slate', bg: '#334155', text: '#e2e8f0', accent: '#94a3b8' }
];

const FONTS = [
  { id: 'inter', label: 'Inter (Clean)', css: 'font-sans' },
  { id: 'oswald', label: 'Oswald (Bold/Viral)', css: 'font-oswald' },
  { id: 'playfair', label: 'Playfair (Luxury)', css: 'font-playfair' },
  { id: 'courier', label: 'Courier (Mono)', css: 'font-mono' }
];

const BORDERS = [
  { id: 'none', label: 'None', css: '' },
  { id: 'thin', label: 'Minimal', css: 'border-2' },
  { id: 'bold', label: 'Neo-Brutalist', css: 'border-8' },
  { id: 'double', label: 'Double', css: 'border-4 border-double' }
];

const STICKER_CATEGORIES = {
  "Urgency": ['🚨', '🛑', '🔔', '⚠️', '📢', '🔥', '⏳'],
  "Growth": ['🚀', '📈', '🏆', '🤑', '💎', '💰', '🎯'],
  "Annotation": ['🖊️', '🖍️', '📌', '📍', '✂️', '👇', '👉'],
  "Reaction": ['🤯', '🥶', '🤬', '🤡', '👻', '👀', '💡'],
  "UI / Tech": ['💾', '🔍', '🖱️', '🔋', '📱', '💬', '❤️']
};

const ASPECT_RATIOS = [
  { id: 'portrait', label: 'Portrait (4:5)', width: 108, height: 135, icon: Smartphone },
  { id: 'square', label: 'Square (1:1)', width: 108, height: 108, icon: Square },
  { id: 'landscape', label: 'Landscape (16:9)', width: 192, height: 108, icon: Monitor }
];

interface Decoration {
  id: string;
  content: string; // Emoji or Image URL
  type: 'emoji' | 'image';
  x: number; // Percent
  y: number; // Percent
  scale: number;
}

const CarouselMaker: React.FC = () => {
  const [creationMode, setCreationMode] = useState<'ai' | 'images'>('ai');
  const [includeHandle, setIncludeHandle] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(false);
  const [topic, setTopic] = useState('');
  const [authorHandle, setAuthorHandle] = useState('@yourname');
  const [footerText, setFooterText] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [themeId, setThemeId] = useState('corporate');
  const [aspectRatioId, setAspectRatioId] = useState('portrait');
  
  // --- Progressive Disclosure / Advanced State ---
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fontId, setFontId] = useState('inter');
  const [borderId, setBorderId] = useState('none');
  
  // --- Decoration / Emoji State ---
  // A map of slide index to a list of decorations
  const [decorations, setDecorations] = useState<Record<number, Decoration[]>>({});
  const [showEmojis, setShowEmojis] = useState(true); // The requested toggle
  const [userUploadedSticker, setUserUploadedSticker] = useState<string | null>(null);

  // --- Content Editing State ---
  const [isEditing, setIsEditing] = useState(false);

  const [carouselData, setCarouselData] = useState<CarouselData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatioId) || ASPECT_RATIOS[0];
  const selectedFont = FONTS.find(f => f.id === fontId) || FONTS[0];
  const selectedBorder = BORDERS.find(b => b.id === borderId) || BORDERS[0];

  // Inject Fonts dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Playfair+Display:wght@700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const handleGenerate = async () => {
    if (creationMode === 'ai' && !topic.trim()) return;
    setStatus('loading');
    setCurrentSlideIndex(0);
    setDecorations({}); // Clear old decorations
    setIsEditing(false); // Reset edit mode

    try {
      let data: CarouselData;
      
      if (creationMode === 'images') {
        const slides = uploadedImages.map((_, i) => ({ title: `Slide ${i+1}`, content: '', type: 'content' as any }));
        data = { topic: 'Gallery', authorHandle, slides };
      } else {
        data = await generateCarouselContent(topic, slideCount, authorHandle);
      }
      
      setCarouselData(data);

      // --- AUTO-INJECT VIRAL EMOJIS (The "At the same point" requirement) ---
      const newDecorations: Record<number, Decoration[]> = {};
      
      data.slides.forEach((_, idx) => {
         const slideDecos: Decoration[] = [];
         
         // 1. Swipe Arrow on all but last
         if (idx < data.slides.length - 1) {
            slideDecos.push({
               id: `arrow-${idx}`,
               content: '👉',
               type: 'emoji',
               x: 90, y: 90, scale: 1.5
            });
         }

         // 2. Hook Icon on first slide
         if (idx === 0) {
            slideDecos.push({
               id: `hook-${idx}`,
               content: '🔥',
               type: 'emoji',
               x: 10, y: 10, scale: 2
            });
         }

         // 3. Save Icon on last slide
         if (idx === data.slides.length - 1) {
            slideDecos.push({
               id: `save-${idx}`,
               content: '💾',
               type: 'emoji',
               x: 50, y: 85, scale: 2
            });
         }

         newDecorations[idx] = slideDecos;
      });
      
      setDecorations(newDecorations);
      setShowEmojis(true); // Ensure they are shown initially
      setStatus('success');

    } catch (e) { setStatus('error'); }
  };

  const addStickerToCurrentSlide = (content: string, type: 'emoji' | 'image') => {
     if (!carouselData) return;
     setDecorations(prev => {
        const current = prev[currentSlideIndex] || [];
        // Add random slight offset so they don't stack perfectly
        const offset = Math.random() * 10;
        return {
           ...prev,
           [currentSlideIndex]: [
              ...current, 
              { 
                 id: Date.now().toString(), 
                 content, 
                 type, 
                 x: 50 + offset - 5, 
                 y: 50 + offset - 5, 
                 scale: 1.5 
              }
           ]
        };
     });
  };

  const removeDecoration = (decoId: string) => {
     setDecorations(prev => {
        const current = prev[currentSlideIndex] || [];
        return {
           ...prev,
           [currentSlideIndex]: current.filter(d => d.id !== decoId)
        };
     });
  };

  const handleStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       try {
          await runFileSecurityChecks(file, 'image');
          const reader = new FileReader();
          reader.onload = () => {
             const res = reader.result as string;
             setUserUploadedSticker(res);
             addStickerToCurrentSlide(res, 'image');
          };
          reader.readAsDataURL(file);
       } catch (err) { alert("Invalid sticker image"); }
    }
    if (stickerInputRef.current) stickerInputRef.current.value = '';
  };

  const updateSlideContent = (field: 'title' | 'content', value: string) => {
    if (!carouselData) return;
    const newSlides = [...carouselData.slides];
    newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], [field]: value };
    setCarouselData({ ...carouselData, slides: newSlides });
  };

  const generatePDF = () => {
    if (!carouselData) return;
    const doc = new jsPDF({ orientation: selectedRatio.width > selectedRatio.height ? 'l' : 'p', unit: 'mm', format: [selectedRatio.width, selectedRatio.height] });
    
    carouselData.slides.forEach((slide, i) => {
      if (i > 0) doc.addPage([selectedRatio.width, selectedRatio.height]);
      
      // Background
      doc.setFillColor(selectedTheme.bg);
      doc.rect(0, 0, selectedRatio.width, selectedRatio.height, 'F');
      
      // Border (Basic implementation for PDF)
      if (borderId !== 'none') {
         doc.setDrawColor(selectedTheme.text);
         doc.setLineWidth(borderId === 'bold' ? 2 : 0.5);
         doc.rect(5, 5, selectedRatio.width - 10, selectedRatio.height - 10);
      }

      // Font Mapping (Approximate for PDF)
      const pdfFont = fontId === 'courier' ? 'courier' : fontId === 'playfair' ? 'times' : 'helvetica';
      
      // Title
      doc.setTextColor(selectedTheme.text);
      doc.setFont(pdfFont, 'bold');
      doc.setFontSize(fontId === 'oswald' ? 22 : 18);
      const titleSplit = doc.splitTextToSize(slide.title.toUpperCase(), selectedRatio.width - 20);
      doc.text(titleSplit, selectedRatio.width / 2, 40, { align: 'center' });
      
      // Content
      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(12);
      const contentSplit = doc.splitTextToSize(slide.content, selectedRatio.width - 24);
      doc.text(contentSplit, selectedRatio.width / 2, 65, { align: 'center' });

      // Handle
      if (includeHandle && authorHandle) {
         doc.setFontSize(8);
         doc.text(authorHandle, selectedRatio.width / 2, selectedRatio.height - 10, { align: 'center' });
      }

      // PDF Generation doesn't easily support arbitrary HTML/Emojis without canvas rasterization.
      // We skip emoji rendering in PDF for this lightweight implementation to keep it fast.
    });
    
    doc.save(`carousel-${Date.now()}.pdf`);
  };

  const nextSlide = () => {
    if (carouselData && currentSlideIndex < carouselData.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12 font-sans">
      <style>{`
        .font-oswald { font-family: 'Oswald', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
      `}</style>

      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <GalleryHorizontal className="w-8 h-8 text-blue-600" />
          AI Carousel Maker
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Create professional LinkedIn carousels instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
             
             {/* Topic Input */}
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase">Content Topic</label>
               <textarea 
                 value={topic} 
                 onChange={e => setTopic(e.target.value)} 
                 placeholder="What is this carousel about?" 
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white h-20 resize-none text-sm focus:outline-none focus:border-blue-500"
               />
             </div>

             {/* Basic Theme Grid */}
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-500 uppercase">Color Theme</label>
               <div className="grid grid-cols-4 gap-2">
                  {THEMES.slice(0,8).map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setThemeId(t.id)} 
                      className={`h-8 rounded-lg border transition-all ${themeId === t.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-700 opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: t.bg }}
                      title={t.label}
                    />
                  ))}
               </div>
             </div>

             {/* ADVANCED TOGGLE - PROGRESSIVE DISCLOSURE */}
             <div className="pt-2 border-t border-slate-800">
               <button 
                  onClick={() => setShowAdvanced(!showAdvanced)} 
                  className="w-full flex items-center justify-between text-xs font-bold text-blue-400 hover:text-blue-300 py-2 transition-colors"
               >
                  <span className="flex items-center gap-2"><Settings className="w-3 h-3" /> Customize Design</span>
                  {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
               </button>

               {showAdvanced && (
                  <div className="space-y-4 pt-3 animate-fade-in-up">
                     
                     {/* Typography */}
                     <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1"><Type className="w-3 h-3" /> Typography</label>
                        <select value={fontId} onChange={(e) => setFontId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500">
                           {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                     </div>
                     
                     {/* Borders */}
                     <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1"><Frame className="w-3 h-3" /> Frame Style</label>
                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-700">
                           {BORDERS.map(b => (
                              <button 
                                key={b.id} 
                                onClick={() => setBorderId(b.id)}
                                className={`flex-1 py-1.5 text-[9px] font-bold rounded transition-all ${borderId === b.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                              >
                                {b.label}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Stickers / Assets */}
                     <div className="space-y-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1"><Smile className="w-3 h-3" /> Viral Stickers</label>
                        
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                           {Object.entries(STICKER_CATEGORIES).map(([cat, stickers]) => (
                              <div key={cat} className="space-y-1">
                                 <span className="text-[9px] text-slate-600 font-bold uppercase ml-1">{cat}</span>
                                 <div className="flex flex-wrap gap-1.5">
                                    {stickers.map(sticker => (
                                       <button 
                                          key={sticker}
                                          onClick={() => addStickerToCurrentSlide(sticker, 'emoji')}
                                          className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-lg transition-transform active:scale-95"
                                       >
                                          {sticker}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>

                        <button 
                           onClick={() => stickerInputRef.current?.click()}
                           className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors border border-slate-700 border-dashed"
                           title="Upload Sticker"
                        >
                           <Plus className="w-4 h-4" /> Upload Custom
                        </button>
                        <input type="file" ref={stickerInputRef} className="hidden" accept="image/*" onChange={handleStickerUpload} />
                        <p className="text-[9px] text-slate-600 italic">Click to add to current slide.</p>
                     </div>
                  </div>
               )}
             </div>

             <button onClick={handleGenerate} disabled={status === 'loading'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
                {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />} 
                {status === 'loading' ? 'Generating...' : 'Generate Carousel'}
             </button>
          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="lg:col-span-2">
          {carouselData ? (
             <div className="space-y-6 animate-fade-in">
                
                {/* TOOLBAR */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                   <div className="flex items-center gap-2 px-2">
                      <span className="text-xs font-bold text-slate-500">Slide {currentSlideIndex + 1} / {carouselData.slides.length}</span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <button
                         onClick={() => setIsEditing(!isEditing)}
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isEditing ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                      >
                         {isEditing ? <Save className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                         {isEditing ? 'Done Editing' : 'Edit Text'}
                      </button>
                      <button 
                         onClick={() => setShowEmojis(!showEmojis)} 
                         className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${showEmojis ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
                      >
                         {showEmojis ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                         {showEmojis ? 'Hide Emojis' : 'Show Emojis'}
                      </button>
                      <div className="h-4 w-px bg-slate-300 mx-1"></div>
                      <button onClick={generatePDF} className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors">
                         <Download className="w-3 h-3" /> PDF
                      </button>
                   </div>
                </div>

                {/* SLIDE PREVIEW CONTAINER */}
                <div className={`aspect-[4/5] max-w-sm mx-auto rounded-none overflow-hidden shadow-2xl relative transition-all duration-300 group select-none`}
                     style={{ backgroundColor: selectedTheme.bg }}>
                   
                   {/* Border Layer */}
                   <div className={`absolute inset-0 pointer-events-none z-10 ${selectedBorder.css}`} style={{ borderColor: selectedTheme.text }}></div>

                   {/* Content Layer */}
                   <div className={`absolute inset-0 flex flex-col p-8 z-0 ${selectedFont.css}`}>
                      <div className="flex-1 flex flex-col justify-center text-center space-y-6">
                         {isEditing ? (
                            <textarea
                               value={carouselData.slides[currentSlideIndex].title}
                               onChange={(e) => updateSlideContent('title', e.target.value)}
                               className="text-3xl font-black uppercase leading-tight tracking-tight bg-white/20 border border-dashed border-slate-400 p-2 rounded w-full text-center resize-none outline-none focus:bg-white/40"
                               style={{ color: selectedTheme.text }}
                               rows={2}
                            />
                         ) : (
                            <h3 className="text-3xl font-black uppercase leading-tight tracking-tight drop-shadow-sm break-words" style={{ color: selectedTheme.text }}>
                               {carouselData.slides[currentSlideIndex].title}
                            </h3>
                         )}

                         {isEditing ? (
                            <textarea
                               value={carouselData.slides[currentSlideIndex].content}
                               onChange={(e) => updateSlideContent('content', e.target.value)}
                               className="text-sm font-medium leading-relaxed opacity-90 bg-white/20 border border-dashed border-slate-400 p-2 rounded w-full text-center resize-none outline-none focus:bg-white/40 h-40"
                               style={{ color: selectedTheme.text }}
                            />
                         ) : (
                            <p className="text-sm font-medium leading-relaxed opacity-90 break-words whitespace-pre-wrap" style={{ color: selectedTheme.text }}>
                               {carouselData.slides[currentSlideIndex].content}
                            </p>
                         )}
                      </div>
                      
                      {includeHandle && (
                         <div className="pt-4 border-t border-current/20 flex justify-center opacity-70" style={{ color: selectedTheme.text }}>
                            {/* Editable Author Handle */}
                            <input 
                               value={authorHandle}
                               onChange={(e) => setAuthorHandle(e.target.value)}
                               className="text-[10px] font-bold tracking-widest uppercase bg-transparent text-center border-b border-transparent hover:border-current focus:border-current focus:outline-none transition-colors w-full"
                               style={{ color: selectedTheme.text }}
                            />
                         </div>
                      )}
                   </div>

                   {/* Decorations / Sticker Layer */}
                   {showEmojis && (decorations[currentSlideIndex] || []).map((deco) => (
                      <div 
                         key={deco.id}
                         className="absolute z-20 cursor-pointer hover:scale-110 transition-transform flex flex-col items-center group/sticker"
                         style={{ 
                            left: `${deco.x}%`, 
                            top: `${deco.y}%`, 
                            transform: `translate(-50%, -50%) scale(${deco.scale})` 
                         }}
                      >
                         {deco.type === 'emoji' ? (
                            <span className="text-4xl filter drop-shadow-md">{deco.content}</span>
                         ) : (
                            <img src={deco.content} className="w-16 h-16 object-contain drop-shadow-md" />
                         )}
                         <button 
                           onClick={(e) => { e.stopPropagation(); removeDecoration(deco.id); }}
                           className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/sticker:opacity-100 transition-opacity"
                         >
                            <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                   ))}
                   
                   {/* Quick Edit Toggle Overlay Button */}
                   <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className={`absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      title={isEditing ? "Save Text" : "Edit Text"}
                   >
                      {isEditing ? <Save className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
                   </button>
                </div>
                
                {/* Pagination */}
                <div className="flex justify-center gap-4">
                   <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:scale-110 transition-transform">
                      <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                   </button>
                   <button onClick={nextSlide} disabled={currentSlideIndex === carouselData.slides.length - 1} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:scale-110 transition-transform">
                      <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                   </button>
                </div>

             </div>
          ) : (
            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50">
               <ImageIcon className="w-16 h-16 opacity-20 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest opacity-50">Content Preview Area</p>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CarouselMaker;
