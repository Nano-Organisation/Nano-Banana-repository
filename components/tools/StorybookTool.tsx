
import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Download, Edit3, FileText, Smartphone, Save, User, Trash2, CheckCircle2, Settings, X, FileJson, Book } from 'lucide-react';
import { generateStoryScript, generateImageWithGemini } from '../../services/geminiService';
import { StorybookData, StoryPage, LoadingState, SavedCharacter } from '../../types';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const STYLES = [
  { id: 'comic', label: 'Comic Strip', desc: 'Bold lines, speech bubbles, vibrant colors' },
  { id: 'fairytale', label: 'Fairy Tale', desc: 'Watercolor, whimsical, soft lighting, storybook style' },
  { id: 'cyberpunk', label: 'Sci-Fi', desc: 'Neon lights, futuristic, digital art, sharp details' },
  { id: 'pixel', label: 'Pixel Art', desc: 'Retro game style, 8-bit, nostalgic' },
  { id: '3d', label: '3D Pixar', desc: 'Cute, rounded, high fidelity 3D render, bright' }
];

const StorybookTool: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[1].id);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [bookData, setBookData] = useState<StorybookData | null>(null);
  
  // Viewing State (0 = Front Cover, 1 = Dedication, 2+ = Story, Last-1 = Bio, Last = Back Cover)
  const [viewIndex, setViewIndex] = useState(0);

  // Character Management State
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showSaveCharDialog, setShowSaveCharDialog] = useState(false);
  const [showCharManager, setShowCharManager] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [isSavingChar, setIsSavingChar] = useState(false);

  // Edit Metadata State
  const [showEditMetadata, setShowEditMetadata] = useState(false);
  const [editData, setEditData] = useState<Partial<StorybookData>>({});

  // Load characters from local storage
  useEffect(() => {
    const stored = localStorage.getItem('nano_saved_characters');
    if (stored) {
      try {
        setSavedCharacters(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load saved characters");
      }
    }
  }, []);

  const saveToLocalStorage = (chars: SavedCharacter[]) => {
    setSavedCharacters(chars);
    localStorage.setItem('nano_saved_characters', JSON.stringify(chars));
  };

  const handleSaveCharacter = async () => {
    if (!bookData || !newCharName.trim()) return;
    setIsSavingChar(true);

    let previewUrl = bookData.pages[0]?.imageUrl; // Fallback

    try {
       // Generate a specific portrait for the saved character to ensure high quality preview
       const portraitPrompt = `Character portrait of ${bookData.characterDescription}. Isolated, white background, high quality. Visual Style: ${bookData.style}`;
       previewUrl = await generateImageWithGemini(portraitPrompt, '1:1');
    } catch (e) {
       console.error("Failed to generate character preview, using page 1", e);
    }
    
    const newChar: SavedCharacter = {
      id: Date.now().toString(),
      name: newCharName.trim(),
      description: bookData.characterDescription,
      previewImage: previewUrl
    };

    const updated = [...savedCharacters, newChar];
    saveToLocalStorage(updated);
    
    setIsSavingChar(false);
    setShowSaveCharDialog(false);
    setNewCharName('');
    alert(`Character "${newChar.name}" saved!`);
  };

  const handleDeleteCharacter = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this character?")) return;
    
    const updated = savedCharacters.filter(c => c.id !== id);
    saveToLocalStorage(updated);
    if (selectedCharacterId === id) setSelectedCharacterId(null);
  };

  const handleUpdateCharacter = (id: string, field: 'name' | 'description', value: string) => {
    const updated = savedCharacters.map(char => 
      char.id === id ? { ...char, [field]: value } : char
    );
    saveToLocalStorage(updated);
  };

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setStatus('loading');
    setProgressMsg('Writing script...');
    setBookData(null);
    setViewIndex(0);

    try {
      // 1. Generate Text Script
      const styleDesc = STYLES.find(s => s.id === selectedStyle)?.desc || 'illustration';
      const existingCharacterDescription = selectedCharacterId 
        ? savedCharacters.find(c => c.id === selectedCharacterId)?.description 
        : undefined;

      const script = await generateStoryScript(concept, styleDesc, existingCharacterDescription);
      
      // Strict consistency for saved characters
      if (existingCharacterDescription) {
        script.characterDescription = existingCharacterDescription;
      }

      setBookData(script);

      // 2. Generate Images Sequentially for Consistency
      // We generate Page 1 first, then use it as a reference for all other pages
      setProgressMsg('Illustrating Page 1...');
      
      let characterReferenceImage: string | undefined = undefined;

      // Generate First Page
      try {
         const firstPagePrompt = `${script.characterDescription}. ${script.pages[0].imagePrompt}. Visual Style: ${script.style}`;
         characterReferenceImage = await generateImageWithGemini(firstPagePrompt, '1:1');
         
         // Update state with first page
         setBookData(prev => {
            if (!prev) return null;
            const newPages = [...prev.pages];
            newPages[0] = { ...newPages[0], imageUrl: characterReferenceImage };
            return { ...prev, pages: newPages };
         });
      } catch (e) {
         console.error("Failed to generate first page", e);
      }

      // Generate remaining pages using the first image as reference
      if (characterReferenceImage) {
         for (let i = 1; i < script.pages.length; i++) {
            setProgressMsg(`Illustrating Page ${i + 1}/${script.pages.length}...`);
            try {
               const pagePrompt = `Action: ${script.pages[i].imagePrompt}. Context: ${script.characterDescription}. Visual Style: ${script.style}`;
               const imageUrl = await generateImageWithGemini(pagePrompt, '1:1', characterReferenceImage);
               
               setBookData(prev => {
                  if (!prev) return null;
                  const newPages = [...prev.pages];
                  newPages[i] = { ...newPages[i], imageUrl };
                  return { ...prev, pages: newPages };
               });
            } catch (e) {
               console.error(`Failed to gen image for page ${i + 1}`, e);
            }
         }
      }

      setStatus('success');
      
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  // --- Edit Metadata Logic ---
  const openMetadataEditor = () => {
    if (!bookData) return;
    setEditData({
      title: bookData.title,
      author: bookData.author || "AI Storyteller",
      dedication: bookData.dedication || "",
      authorBio: bookData.authorBio || "",
      backCoverBlurb: bookData.backCoverBlurb || ""
    });
    setShowEditMetadata(true);
  };

  const saveMetadata = () => {
    if (!bookData) return;
    setBookData({
      ...bookData,
      title: editData.title || bookData.title,
      author: editData.author || bookData.author,
      dedication: editData.dedication || bookData.dedication,
      authorBio: editData.authorBio || bookData.authorBio,
      backCoverBlurb: editData.backCoverBlurb || bookData.backCoverBlurb
    });
    setShowEditMetadata(false);
  };

  // --- Pagination Logic ---
  // Pages: 0 (Cover), 1 (Front Matter), 2..N+1 (Story), N+2 (Bio), N+3 (Back Cover)
  const totalViews = bookData ? bookData.pages.length + 4 : 0;

  const nextView = () => {
    if (viewIndex < totalViews - 1) setViewIndex(v => v + 1);
  };

  const prevView = () => {
    if (viewIndex > 0) setViewIndex(v => v - 1);
  };

  // --- Rendering Helpers ---
  const renderCurrentView = () => {
    if (!bookData) return null;

    // FRONT COVER
    if (viewIndex === 0) {
      return (
        <div className="flex-1 bg-[#fffbf0] p-8 md:p-12 flex flex-col items-center justify-center text-center relative border-r border-slate-300 group">
           <div className="border-4 border-double border-slate-800 p-8 w-full h-full flex flex-col items-center justify-center relative">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6 leading-tight">
                 {bookData.title}
              </h1>
              <div className="w-24 h-px bg-slate-800 mb-6"></div>
              {/* Reuse first image as cover art if available, else placeholder */}
              <div className="w-48 h-48 bg-slate-200 rounded-full overflow-hidden mb-8 border-2 border-slate-400 shadow-inner flex items-center justify-center">
                 {bookData.pages[0]?.imageUrl ? (
                    <img src={bookData.pages[0].imageUrl} className="w-full h-full object-cover" alt="Cover Art" />
                 ) : (
                    <BookOpen className="w-16 h-16 text-slate-400 opacity-50" />
                 )}
              </div>
              <p className="text-xl font-serif italic text-slate-700">Written & Illustrated by</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{bookData.author || "AI Storyteller"}</p>
              
              <button 
                 onClick={openMetadataEditor}
                 className="absolute top-2 right-2 bg-black/10 hover:bg-black/20 text-slate-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                 title="Edit Cover Details"
              >
                 <Edit3 className="w-4 h-4" />
              </button>
           </div>
        </div>
      );
    }

    // FRONT MATTER (DEDICATION)
    if (viewIndex === 1) {
      return (
        <div className="flex-1 bg-[#fffbf0] p-12 flex flex-col items-center justify-center text-center relative border-r border-slate-300 group">
           <div className="max-w-md mx-auto italic text-slate-600 font-serif text-lg leading-relaxed">
              {bookData.dedication || "Dedicated to all the dreamers."}
           </div>
           <div className="absolute bottom-8 text-xs text-slate-400 uppercase tracking-widest">
              © {new Date().getFullYear()} {bookData.author} • Generated with Nano Banana
           </div>
           <button 
              onClick={openMetadataEditor}
              className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-slate-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Dedication"
           >
              <Edit3 className="w-4 h-4" />
           </button>
        </div>
      );
    }

    // AUTHOR BIO
    if (viewIndex === bookData.pages.length + 2) {
      return (
        <div className="flex-1 bg-[#fffbf0] p-12 flex flex-col items-center justify-center text-center relative border-r border-slate-300 group">
           <h2 className="text-2xl font-bold text-slate-900 mb-6 font-serif uppercase tracking-widest border-b-2 border-amber-500 pb-2">About the Author</h2>
           <div className="w-32 h-32 bg-slate-200 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg mx-auto">
              <User className="w-full h-full text-slate-400 p-6 bg-slate-100" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mb-4">{bookData.author}</h3>
           <p className="text-slate-600 font-serif leading-relaxed max-w-md mx-auto">
              {bookData.authorBio || "An AI storyteller crafting worlds from pixels and code."}
           </p>
           <button 
              onClick={openMetadataEditor}
              className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 text-slate-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Bio"
           >
              <Edit3 className="w-4 h-4" />
           </button>
        </div>
      );
    }

    // BACK COVER
    if (viewIndex === bookData.pages.length + 3) {
      return (
        <div className="flex-1 bg-[#1e293b] p-12 flex flex-col items-center justify-center text-center relative text-white group">
           <div className="max-w-md mx-auto space-y-8">
              <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm border border-white/10 relative">
                 <p className="font-serif text-lg leading-relaxed italic text-amber-100">
                    "{bookData.backCoverBlurb || bookData.characterDescription}"
                 </p>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-50">
                 <div className="w-32 h-12 bg-white rounded flex items-center justify-center">
                    <div className="w-24 h-8 border-t-4 border-b-4 border-black"></div>
                 </div>
                 <span className="text-xs font-mono">ISBN-9000-AI-STORY</span>
              </div>
           </div>
           <button 
              onClick={openMetadataEditor}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Back Cover"
           >
              <Edit3 className="w-4 h-4" />
           </button>
        </div>
      );
    }

    // STORY PAGES
    const pageIndex = viewIndex - 2;
    const page = bookData.pages[pageIndex];

    return (
      <>
         {/* Left Page (Image) */}
         <div className="flex-1 bg-white p-4 md:p-8 flex items-center justify-center border-r border-slate-300 relative">
            <div className="w-full h-full bg-slate-100 rounded-lg shadow-inner overflow-hidden flex items-center justify-center relative group">
              {page.imageUrl ? (
                <>
                  <img 
                    src={page.imageUrl} 
                    alt={`Page ${page.pageNumber}`} 
                    className="w-full h-full object-cover"
                  />
                  <a 
                    href={page.imageUrl}
                    download={`ai-book-p${page.pageNumber}.png`}
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </>
              ) : (
                <div className="text-center space-y-2">
                   <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                   <p className="text-xs text-slate-500 font-medium">Illustrating...</p>
                </div>
              )}
              <div className="absolute top-2 left-2 text-xs font-bold text-slate-400 bg-white/80 px-2 py-1 rounded">
                Page {page.pageNumber}
              </div>
            </div>
         </div>

         {/* Right Page (Text) */}
         <div className="flex-1 bg-[#fffbf0] p-6 md:p-12 flex flex-col justify-center relative overflow-y-auto">
            <div className="prose prose-slate max-w-none">
               {pageIndex === 0 && (
                 <h2 className="text-2xl font-serif font-bold text-slate-800 mb-6 border-b border-amber-900/10 pb-4">
                   {bookData.title}
                 </h2>
               )}
               {/* Use whitespace-pre-wrap to respect newlines for rhymes */}
               <p className="text-lg md:text-xl font-serif leading-relaxed text-slate-800 whitespace-pre-wrap">
                 {page.text}
               </p>
            </div>
            <div className="absolute bottom-4 right-6 text-xs text-slate-400 font-mono">
               {pageIndex + 1}
            </div>
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

      const addWatermark = () => {
         doc.setTextColor(200);
         doc.setFontSize(8);
         doc.text(WATERMARK_TEXT, pageWidth / 2, pageHeight - 5, { align: 'center' });
         doc.setTextColor(0);
      };

      // 1. FRONT COVER
      addWatermark();
      // Background color for cover
      doc.setFillColor(255, 251, 240); // #fffbf0 cream
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Border
      doc.setDrawColor(50);
      doc.setLineWidth(1);
      doc.rect(margin, margin, pageWidth - margin*2, pageHeight - margin*2);

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(32);
      const splitTitle = doc.splitTextToSize(bookData.title.toUpperCase(), pageWidth - (margin * 3));
      doc.text(splitTitle, pageWidth / 2, pageHeight / 3, { align: 'center' });
      
      // Author
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text(`Written & Illustrated by`, pageWidth / 2, (pageHeight / 3) + 30, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(bookData.author || "AI Storyteller", pageWidth / 2, (pageHeight / 3) + 40, { align: 'center' });

      // 2. FRONT MATTER
      doc.addPage();
      addWatermark();
      doc.setFontSize(12);
      doc.setFont('times', 'italic');
      doc.text(bookData.dedication || "", pageWidth / 2, pageHeight / 2, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`© ${new Date().getFullYear()} ${bookData.author}`, pageWidth / 2, pageHeight - margin - 10, { align: 'center' });

      // 3. STORY PAGES
      bookData.pages.forEach((page) => {
        doc.addPage();
        addWatermark();
        
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`${page.pageNumber}`, pageWidth - margin, margin, { align: 'right' });
        doc.setTextColor(0);

        if (mode === 'portrait') {
          const maxTextWidth = pageWidth - (margin * 2);
          let textY = margin + 20;
          
          if (page.imageUrl) {
            const imgSize = 120; 
            const x = (pageWidth - imgSize) / 2;
            try {
              doc.addImage(page.imageUrl, 'PNG', x, margin + 10, imgSize, imgSize);
              textY = margin + 10 + imgSize + 20;
            } catch (e) { console.error("PDF Img Error"); }
          }

          doc.setFontSize(14);
          doc.setFont('times', 'roman');
          const splitText = doc.splitTextToSize(page.text, maxTextWidth);
          doc.text(splitText, pageWidth/2, textY, { align: 'center' });

        } else {
          // Side by side roughly
          const halfWidth = pageWidth / 2;
          
          if (page.imageUrl) {
            try {
              doc.addImage(page.imageUrl, 'PNG', margin, margin, halfWidth - margin*1.5, halfWidth - margin*1.5);
            } catch (e) { console.error("PDF Img Error"); }
          }

          doc.setFontSize(14);
          doc.setFont('times', 'roman');
          const splitText = doc.splitTextToSize(page.text, halfWidth - margin*2);
          doc.text(splitText, halfWidth + margin, pageHeight / 2, { align: 'left', baseline: 'middle' });
        }
      });

      // 4. BACK MATTER (BIO)
      doc.addPage();
      addWatermark();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text("About the Author", pageWidth / 2, margin + 20, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      const splitBio = doc.splitTextToSize(bookData.authorBio || "", pageWidth - (margin * 3));
      doc.text(splitBio, pageWidth / 2, margin + 40, { align: 'center' });

      // 5. BACK COVER
      doc.addPage();
      doc.setFillColor(30, 41, 59); // Dark slate
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setTextColor(255);
      doc.setFont('times', 'italic');
      doc.setFontSize(14);
      const splitBlurb = doc.splitTextToSize(`"${bookData.backCoverBlurb || bookData.characterDescription}"`, pageWidth - (margin * 4));
      doc.text(splitBlurb, pageWidth / 2, pageHeight / 2, { align: 'center' });
      
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text("ISBN-9000-AI-STORY", pageWidth / 2, pageHeight - margin - 20, { align: 'center' });

      doc.save(`ai-storybook-${mode}.pdf`);
    } catch (e) {
      console.error("PDF Generation Error", e);
      alert("Could not generate PDF. Please ensure all images are loaded.");
    }
  };

  const handleDownloadPrompt = () => {
    if (!bookData) return;
    const styleObj = STYLES.find(s => s.id === selectedStyle);
    
    const content = `AI STORYBOOK CONFIGURATION
----------------------------
Title: ${bookData.title}
Author: ${bookData.author}
Style: ${styleObj?.label} - ${styleObj?.desc}

DEDICATION
----------
${bookData.dedication}

BACK COVER BLURB
----------------
${bookData.backCoverBlurb}

AUTHOR BIO
----------
${bookData.authorBio}

PAGES
-----
${bookData.pages.map(p => `Page ${p.pageNumber}:
${p.text}
[Prompt: ${p.imagePrompt}]
`).join('\n')}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storybook-prompt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper for selected character in view
  const activeCharacter = savedCharacters.find(c => c.id === selectedCharacterId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-amber-500" />
          AI Storybook
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Create illustrated short stories in your favorite style.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      {!bookData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
          {/* ... [Keep Existing Input UI Unchanged for Brevity - Style Selector, Char Manager, Concept Input, Generate Button] ... */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase">1. Choose a Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === style.id
                        ? 'bg-amber-600/20 border-amber-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <div className="font-bold text-sm">{style.label}</div>
                    <div className="text-xs opacity-60 truncate">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-400 uppercase">2. Starring (Optional)</label>
                <button 
                  onClick={() => setShowCharManager(true)}
                  className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 font-medium"
                >
                  <Settings className="w-3 h-3" />
                  Manage Characters
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                   onClick={() => setSelectedCharacterId(null)}
                   className={`flex-shrink-0 p-3 rounded-xl border flex flex-col items-center justify-center w-24 h-24 transition-all ${
                     selectedCharacterId === null
                       ? 'bg-slate-700 border-slate-500 text-white shadow-lg'
                       : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-750'
                   }`}
                >
                  <User className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">New Char</span>
                </button>
                {savedCharacters.map(char => (
                   <div key={char.id} className="relative group">
                      <button
                        onClick={() => setSelectedCharacterId(char.id)}
                        className={`flex-shrink-0 rounded-xl border overflow-hidden w-24 h-24 transition-all relative ${
                          selectedCharacterId === char.id
                            ? 'border-amber-500 ring-2 ring-amber-500/50'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {char.previewImage ? (
                          <img src={char.previewImage} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <span className="text-xs">{char.name[0]}</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-1 text-center truncate px-1">
                          {char.name}
                        </div>
                        {selectedCharacterId === char.id && (
                           <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5">
                              <CheckCircle2 className="w-3 h-3 text-black" />
                           </div>
                        )}
                      </button>
                   </div>
                ))}
              </div>

              {activeCharacter && (
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                     <Edit3 className="w-3 h-3" />
                     Editing {activeCharacter.name}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Character Name</label>
                    <input 
                      value={activeCharacter.name}
                      onChange={(e) => handleUpdateCharacter(activeCharacter.id, 'name', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Character Description (Immutable)</label>
                    <textarea 
                      value={activeCharacter.description}
                      onChange={(e) => handleUpdateCharacter(activeCharacter.id, 'description', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none h-20 resize-none text-xs leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-400 uppercase">3. Story Concept</label>
               <textarea
                 value={concept}
                 onChange={(e) => setConcept(e.target.value)}
                 placeholder="e.g. A lonely robot finds a flower in a scrapyard..."
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-32"
               />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!concept || status === 'loading'}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20"
            >
              {status === 'loading' ? (
                <>
                  <RefreshCw className="animate-spin" />
                  {progressMsg || 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="fill-current" />
                  Generate Book
                </>
              )}
            </button>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center text-slate-600 space-y-4 border-l border-slate-800 pl-8">
            <div className="w-32 h-40 bg-slate-800 rounded-r-2xl rounded-l-md border-l-4 border-l-amber-700 shadow-2xl flex items-center justify-center transform rotate-3">
               <BookOpen className="w-12 h-12 opacity-20" />
            </div>
            <p className="text-sm">Enter a prompt to generate a 4-page illustrated book with consistent characters.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
             <div className="flex gap-2">
               <button 
                  onClick={() => setBookData(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
               >
                  <Edit3 className="w-4 h-4" />
                  New Concept
               </button>
               <button 
                  onClick={openMetadataEditor}
                  className="flex items-center gap-2 text-amber-500 hover:text-amber-400 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors bg-amber-900/10 border border-amber-900/30"
               >
                  <Book className="w-4 h-4" />
                  Edit Book Details
               </button>
             </div>
             
             <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setShowSaveCharDialog(true)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Character
                </button>
                <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>
                <button 
                  onClick={handleDownloadPrompt}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
                  title="Download Prompt"
                >
                  <FileJson className="w-4 h-4" />
                  Prompt
                </button>
                <button 
                  onClick={() => handleDownloadBook('portrait')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
                >
                  <Smartphone className="w-4 h-4" />
                  Portrait PDF
                </button>
                <button 
                  onClick={() => handleDownloadBook('landscape')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Spread PDF
                </button>
             </div>
          </div>

          {/* Book Viewer */}
          <div className="relative aspect-[3/2] md:aspect-[2/1] bg-slate-200 rounded-xl shadow-2xl overflow-hidden flex text-slate-900">
             {renderCurrentView()}
             
             {/* Binding Effect */}
             <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none"></div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 pb-6">
            <button
              onClick={prevView}
              disabled={viewIndex === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white p-4 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex gap-1 items-center">
               <span className="text-xs font-mono text-slate-500 uppercase mr-2">
                  {viewIndex === 0 ? 'Cover' : viewIndex === 1 ? 'Intro' : viewIndex >= totalViews - 2 ? 'Back' : `Page ${viewIndex - 1}`}
               </span>
               <div className="flex gap-1">
                  {[...Array(totalViews)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setViewIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        viewIndex === i ? 'bg-amber-500 w-4' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
               </div>
            </div>

            <button
              onClick={nextView}
              disabled={viewIndex === totalViews - 1}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white p-4 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {showEditMetadata && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl">
               <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                     <Book className="w-5 h-5 text-amber-500"/> Book Details
                  </h3>
                  <button onClick={() => setShowEditMetadata(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
               </div>
               
               <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Title</label>
                     <input 
                        value={editData.title || ''}
                        onChange={(e) => setEditData({...editData, title: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Author Name</label>
                     <input 
                        value={editData.author || ''}
                        onChange={(e) => setEditData({...editData, author: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Dedication (Front Matter)</label>
                     <textarea 
                        value={editData.dedication || ''}
                        onChange={(e) => setEditData({...editData, dedication: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 h-20 resize-none"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Author Bio (Back Matter)</label>
                     <textarea 
                        value={editData.authorBio || ''}
                        onChange={(e) => setEditData({...editData, authorBio: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 h-24 resize-none"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Blurb (Back Cover)</label>
                     <textarea 
                        value={editData.backCoverBlurb || ''}
                        onChange={(e) => setEditData({...editData, backCoverBlurb: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 h-24 resize-none"
                     />
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                  <button 
                     onClick={() => setShowEditMetadata(false)}
                     className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={saveMetadata}
                     className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold transition-colors"
                  >
                     Save Changes
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Save Character Dialog */}
      {showSaveCharDialog && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
               <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Save Character</h3>
                  <p className="text-slate-400 text-sm">Give this character a name. We will generate a clear portrait for future use.</p>
               </div>
               
               <input 
                  type="text" 
                  autoFocus
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="e.g. Captain Sparky"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCharacter()}
               />

               <div className="flex gap-3">
                  <button 
                     onClick={() => setShowSaveCharDialog(false)}
                     className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={handleSaveCharacter}
                     disabled={!newCharName.trim() || isSavingChar}
                     className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                     {isSavingChar ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     {isSavingChar ? 'Creating...' : 'Save'}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Character Manager Modal */}
      {showCharManager && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Manage Characters</h3>
                <button 
                  onClick={() => setShowCharManager(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {savedCharacters.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No saved characters yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {savedCharacters.map(char => (
                      <div key={char.id} className="bg-slate-950 border border-slate-700 rounded-xl p-4 flex gap-4 relative group">
                        <div className="w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                          {char.previewImage ? (
                            <img src={char.previewImage} alt={char.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <User className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate">{char.name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-3 mt-1">{char.description}</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteCharacter(char.id, e)}
                          className="absolute top-2 right-2 p-2 bg-red-900/50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900"
                          title="Delete Character"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default StorybookTool;
