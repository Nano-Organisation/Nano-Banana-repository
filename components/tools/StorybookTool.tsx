
import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Download, Edit3, FileText, Smartphone, Save, User, Trash2, CheckCircle2, Settings, X, FileJson } from 'lucide-react';
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
  const [bookData, setBookData] = useState<StorybookData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Character Management State
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showSaveCharDialog, setShowSaveCharDialog] = useState(false);
  const [showCharManager, setShowCharManager] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [isSavingChar, setIsSavingChar] = useState(false);

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
    setBookData(null);
    setCurrentPage(0);

    try {
      // 1. Generate Text Script
      const styleDesc = STYLES.find(s => s.id === selectedStyle)?.desc || 'illustration';
      
      // Look up selected character definition
      const existingCharacterDescription = selectedCharacterId 
        ? savedCharacters.find(c => c.id === selectedCharacterId)?.description 
        : undefined;

      const script = await generateStoryScript(concept, styleDesc, existingCharacterDescription);
      
      // STRICT CONSISTENCY CHECK:
      // If we selected a saved character, force the script to use that exact description string.
      if (existingCharacterDescription) {
        script.characterDescription = existingCharacterDescription;
      }

      // Initialize book data with text, images are undefined
      setBookData(script);

      // 2. Generate Images in parallel
      const imagePromises = script.pages.map(async (page, index) => {
        try {
          // Construct prompt: Character Description + Page Action + Style
          const consistentPrompt = `${script.characterDescription}. ${page.imagePrompt}. Visual Style: ${script.style}`;
          
          const imageUrl = await generateImageWithGemini(consistentPrompt, '1:1');
          
          // Update state as images arrive
          setBookData(prev => {
            if (!prev) return null;
            const newPages = [...prev.pages];
            newPages[index] = { ...newPages[index], imageUrl };
            return { ...prev, pages: newPages };
          });
        } catch (e) {
          console.error(`Failed to gen image for page ${index + 1}`, e);
        }
      });

      setStatus('success');
      
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDownloadPrompt = () => {
    if (!bookData) return;
    const styleObj = STYLES.find(s => s.id === selectedStyle);
    const selectedChar = savedCharacters.find(c => c.id === selectedCharacterId);
    
    const content = `NANO STORYBOOK CONFIGURATION
----------------------------
Title: ${bookData.title}
Concept: ${concept}
Style: ${styleObj?.label} - ${styleObj?.desc}

CHARACTER DETAILS
-----------------
Character Name: ${selectedChar ? selectedChar.name : 'Generated for this story'}
Description Used:
${bookData.characterDescription}

GENERATED PAGES & PROMPTS
-------------------------
${bookData.pages.map(p => `Page ${p.pageNumber}:
Text: ${p.text}
Scene Prompt: ${p.imagePrompt}
`).join('\n')}

Generated by ${WATERMARK_TEXT}
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storybook-prompt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBook = (mode: 'portrait' | 'landscape') => {
    if (!bookData) return;
    
    try {
      const doc = new jsPDF({ orientation: mode, unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      // Add watermark function
      const addPDFWatermark = () => {
         doc.setTextColor(200);
         doc.setFontSize(8);
         // Top Right
         doc.text(WATERMARK_TEXT, pageWidth - 10, 10, { align: 'right' });
         // Bottom Center
         doc.text(WATERMARK_TEXT, pageWidth / 2, pageHeight - 10, { align: 'center' });
         doc.setTextColor(0);
      };

      // Title Page
      addPDFWatermark();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text(bookData.title, pageWidth / 2, pageHeight / 3, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text(`A ${bookData.style} Story`, pageWidth / 2, (pageHeight / 3) + 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Generated by Nano Storybook", pageWidth / 2, pageHeight - margin - 5, { align: 'center' });
      doc.setTextColor(0); 
      
      // Content Pages
      bookData.pages.forEach((page, index) => {
        doc.addPage();
        addPDFWatermark();
        
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Page ${page.pageNumber}`, pageWidth - margin, margin, { align: 'right' });
        doc.setTextColor(0);

        if (mode === 'portrait') {
          const maxTextWidth = pageWidth - (margin * 2);
          let textY = margin + 20;
          
          if (page.imageUrl) {
            const imgSize = 140; 
            const x = (pageWidth - imgSize) / 2;
            try {
              doc.addImage(page.imageUrl, 'PNG', x, margin + 10, imgSize, imgSize);
              textY = margin + 10 + imgSize + 20;
            } catch (e) {
              console.error("Error adding image to PDF", e);
            }
          }

          doc.setFontSize(12);
          doc.setFont('times', 'roman');
          const splitText = doc.splitTextToSize(page.text, maxTextWidth);
          doc.text(splitText, margin, textY);

        } else {
          const halfWidth = pageWidth / 2;
          const imageAreaWidth = halfWidth - (margin * 1.5);
          const textAreaWidth = halfWidth - (margin * 1.5);
          
          if (page.imageUrl) {
            const imgSize = Math.min(pageHeight - (margin * 2), imageAreaWidth);
            const x = (halfWidth - imgSize) / 2;
            const y = (pageHeight - imgSize) / 2;
            try {
              doc.addImage(page.imageUrl, 'PNG', x, y, imgSize, imgSize);
            } catch (e) {
              console.error("Error adding image to PDF", e);
            }
          }

          doc.setFontSize(12);
          doc.setFont('times', 'roman');
          const splitText = doc.splitTextToSize(page.text, textAreaWidth);
          const lineHeight = doc.getLineHeight() * (0.352778);
          const textBlockHeight = splitText.length * lineHeight;
          const textX = halfWidth + (margin * 0.5);
          const textY = (pageHeight - textBlockHeight) / 2 + lineHeight;
          
          doc.text(splitText, textX, textY);
        }
      });

      doc.save(`nano-storybook-${mode}.pdf`);
    } catch (e) {
      console.error("PDF Generation Error", e);
      alert("Could not generate PDF. Please ensure all images are loaded.");
    }
  };

  const nextPage = () => {
    if (bookData && currentPage < bookData.pages.length - 1) {
      setCurrentPage(p => p + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  };

  // Helper for selected character in view
  const activeCharacter = savedCharacters.find(c => c.id === selectedCharacterId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-amber-500" />
          Nano Storybook
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

              {/* Inline Character Editor */}
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
                  Writing & Illustrating...
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
             <button 
                onClick={() => setBookData(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Concept
              </button>
             
             <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setShowSaveCharDialog(true)}
                  className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 px-4 py-2 rounded-lg border border-amber-500/50 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Character
                </button>
                <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>
                <button 
                  onClick={handleDownloadPrompt}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-colors shadow-sm"
                  title="Download the prompt used to create this story"
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
             {/* Left Page (Image) */}
             <div className="flex-1 bg-white p-4 md:p-8 flex items-center justify-center border-r border-slate-300 relative">
                <div className="w-full h-full bg-slate-100 rounded-lg shadow-inner overflow-hidden flex items-center justify-center relative group">
                  {bookData.pages[currentPage].imageUrl ? (
                    <>
                      <img 
                        src={bookData.pages[currentPage].imageUrl} 
                        alt={`Page ${currentPage + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <a 
                        href={bookData.pages[currentPage].imageUrl}
                        download={`nano-book-p${currentPage + 1}.png`}
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
                    Page {currentPage + 1}
                  </div>
                </div>
             </div>

             {/* Right Page (Text) */}
             <div className="flex-1 bg-[#fffbf0] p-6 md:p-12 flex flex-col justify-center relative">
                <div className="prose prose-slate">
                   {currentPage === 0 && (
                     <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-6 border-b border-amber-900/10 pb-4">
                       {bookData.title}
                     </h1>
                   )}
                   <p className="text-lg md:text-xl font-serif leading-relaxed text-slate-800">
                     {bookData.pages[currentPage].text}
                   </p>
                </div>
                <div className="absolute bottom-4 right-6 text-xs text-slate-400 font-mono">
                   {currentPage + 1} / {bookData.pages.length}
                </div>
             </div>

             {/* Binding Effect */}
             <div className="absolute left-1/2 top-0 bottom-0 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none"></div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 pb-6">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white p-4 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex gap-2">
              {bookData.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentPage === i ? 'bg-amber-500 scale-125' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === bookData.pages.length - 1}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white p-4 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
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
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-2xl">
                <div className="flex items-center gap-2 text-white font-bold text-xl">
                  <Settings className="w-5 h-5 text-amber-500" />
                  Character Manager
                </div>
                <button onClick={() => setShowCharManager(false)} className="text-slate-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {savedCharacters.length === 0 ? (
                  <div className="text-center py-20 text-slate-500">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No saved characters yet.</p>
                  </div>
                ) : (
                  savedCharacters.map(char => (
                    <div key={char.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-4 items-start">
                      <div className="w-20 h-20 rounded-lg bg-slate-900 overflow-hidden border border-slate-700 flex-shrink-0">
                        {char.previewImage ? (
                          <img src={char.previewImage} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">No Img</div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                         <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Name</label>
                            <input 
                              value={char.name}
                              onChange={(e) => handleUpdateCharacter(char.id, 'name', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm focus:border-amber-500 focus:outline-none"
                            />
                         </div>
                         <div>
                            <label className="text-xs text-slate-500 font-bold uppercase">Description</label>
                            <textarea 
                              value={char.description}
                              onChange={(e) => handleUpdateCharacter(char.id, 'description', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-amber-500 focus:outline-none h-16 resize-none"
                            />
                         </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteCharacter(char.id)}
                        className="text-red-500 hover:text-red-400 p-2 hover:bg-slate-900 rounded-lg transition-colors"
                        title="Delete Character"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default StorybookTool;
