import React, { useState, useRef } from 'react';
import { Layout, RefreshCw, Upload, X, Download, Image as ImageIcon, MessageSquare, Palette, Columns, Rows } from 'lucide-react';
import { generateComicScriptFromImages, generateImageWithGemini } from '../../services/geminiService';
import { LoadingState, StorybookData } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const COMIC_STYLES = [
  { 
    id: 'graphic_novel', 
    label: 'Graphic Novel', 
    desc: 'Vibrant colors, dynamic lighting, detailed modern digital art style, cinematic composition.' 
  },
  { 
    id: 'sunday_strip', 
    label: 'Sunday Strip', 
    desc: 'Bold outlines, flat colors, classic newspaper cartoon aesthetic, expressive caricatures.' 
  },
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
  }
];

const ComicStripTool: React.FC = () => {
  const [seedImages, setSeedImages] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState(COMIC_STYLES[0].id);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [comicData, setComicData] = useState<StorybookData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            newImages.push(result);
        } catch(err) {
            console.error("Skipping invalid file");
        }
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
    setProgressMsg('Scripting comic narrative...');

    const selectedStyle = COMIC_STYLES.find(s => s.id === selectedStyleId) || COMIC_STYLES[0];

    try {
      // 1. Generate Script
      const script = await generateComicScriptFromImages(seedImages, topic);
      script.style = selectedStyle.label;
      setComicData(script);

      // 2. Generate Panels
      const refImage = seedImages[0];
      const newPages = [...script.pages];

      for (let i = 0; i < newPages.length; i++) {
         // Buffer delay to prevent rate limits
         if (i > 0) await new Promise(r => setTimeout(r, 3500));

         setProgressMsg(`Drawing Panel ${i + 1}/${newPages.length}...`);
         try {
            const panelPrompt = `Comic book panel. ${script.characterDescription}. Action: ${newPages[i].imagePrompt}. 
            Style: ${selectedStyle.label} - ${selectedStyle.desc}.
            Do NOT include speech bubbles or text.`;
            
            const imageUrl = await generateImageWithGemini(panelPrompt, '1:1', refImage);
            newPages[i] = { ...newPages[i], imageUrl };
            
            setComicData(prev => prev ? { ...prev, pages: [...newPages] } : null);
         } catch (e) {
            console.error(`Failed panel ${i+1}. Continuing to next panel...`, e);
         }
      }

      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!comicData) return;
    const isHorizontal = orientation === 'horizontal';
    const doc = new jsPDF({
      orientation: isHorizontal ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let y = 20;

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(comicData.title, pageWidth / 2, y, { align: 'center' });
    y += 15;

    if (isHorizontal) {
      // For horizontal, we fit panels in 1 or 2 rows
      const panelSize = 65;
      const spacing = 5;
      let x = margin;
      y += 10;

      comicData.pages.forEach((page, i) => {
        if (x + panelSize > pageWidth - margin) {
          x = margin;
          y += panelSize + 30;
        }

        // Image
        if (page.imageUrl) {
          try {
            doc.addImage(page.imageUrl, 'PNG', x, y, panelSize, panelSize);
            doc.rect(x, y, panelSize, panelSize);
          } catch(e) {}
        } else {
          doc.rect(x, y, panelSize, panelSize);
        }

        // Text
        doc.setFontSize(10);
        doc.setFont('courier', 'bold');
        const splitText = doc.splitTextToSize(page.text, panelSize);
        doc.setFillColor(255, 255, 224);
        doc.roundedRect(x, y + panelSize + 2, panelSize, (splitText.length * 5) + 5, 2, 2, 'FD');
        doc.text(splitText, x + 2, y + panelSize + 7);

        x += panelSize + spacing;
      });
    } else {
      // Vertical stacked (1 column)
      comicData.pages.forEach((page, i) => {
        if (y > 250) {
           doc.addPage();
           y = 20;
        }

        // Image
        if (page.imageUrl) {
           try {
              doc.addImage(page.imageUrl, 'PNG', margin, y, 90, 90);
              doc.rect(margin, y, 90, 90); 
           } catch(e) {}
        } else {
           doc.rect(margin, y, 90, 90);
           doc.setFontSize(8);
           doc.text("Image failed to generate", margin + 25, y + 45);
        }

        doc.setFontSize(12);
        doc.setFont('courier', 'bold');
        const textX = margin + 100;
        const splitText = doc.splitTextToSize(page.text, pageWidth - textX - margin);
        doc.setDrawColor(0);
        doc.setFillColor(255, 255, 224);
        doc.roundedRect(textX - 5, y + 10, pageWidth - textX - margin + 5, (splitText.length * 7) + 10, 3, 3, 'FD');
        doc.text(splitText, textX, y + 20);

        y += 100;
      });
    }

    // Watermark
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(WATERMARK_TEXT, pageWidth / 2, pageHeight - 5, { align: 'center' });

    doc.save(`comic-strip-${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Layout className="w-8 h-8 text-yellow-500" />
          AI Comic Strip
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Turn your images into a structured comic strip narrative.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Controls */}
         <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">1. Seed Images (Max 4)</label>
                  <div className="grid grid-cols-2 gap-2">
                     {seedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 group">
                           <img src={img} className="w-full h-full object-cover" />
                           <button onClick={() => removeSeedImage(idx)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                              <X className="w-5 h-5" />
                           </button>
                        </div>
                     ))}
                     {seedImages.length < 4 && (
                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="aspect-square rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-yellow-500 hover:border-yellow-500 transition-colors"
                        >
                           <Upload className="w-6 h-6 mb-1" />
                           <span className="text-[10px] font-bold">Upload</span>
                        </button>
                     )}
                     <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleSeedImageUpload} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                     <Columns className="w-3 h-3" /> 2. Strip Orientation
                  </label>
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setOrientation('vertical')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${orientation === 'vertical' ? 'bg-yellow-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Rows className="w-3.5 h-3.5" /> Vertical
                    </button>
                    <button 
                      onClick={() => setOrientation('horizontal')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${orientation === 'horizontal' ? 'bg-yellow-500 text-black shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Columns className="w-3.5 h-3.5" /> Horizontal
                    </button>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                     <Palette className="w-3 h-3" /> 3. Visual Style
                  </label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                     {COMIC_STYLES.map(style => (
                        <button
                           key={style.id}
                           onClick={() => setSelectedStyleId(style.id)}
                           className={`p-3 rounded-xl border text-left transition-all ${
                              selectedStyleId === style.id 
                              ? 'bg-yellow-500/20 border-yellow-500 text-white' 
                              : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'
                           }`}
                        >
                           <div className="text-sm font-bold">{style.label}</div>
                           <div className="text-[10px] opacity-70 leading-tight mt-1">{style.desc}</div>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">4. Comic Context</label>
                  <textarea 
                     value={topic}
                     onChange={(e) => setTopic(e.target.value)}
                     placeholder="e.g. A heist goes wrong... (Optional)"
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500 h-20 resize-none"
                  />
               </div>

               <button
                  onClick={handleGenerate}
                  disabled={seedImages.length === 0 || status === 'loading'}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
               >
                  {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Layout className="w-4 h-4" />}
                  {status === 'loading' ? 'Creating...' : 'Generate Strip'}
               </button>
            </div>
            
            {status === 'loading' && (
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
                  <p className="text-yellow-500 font-bold text-sm animate-pulse">{progressMsg}</p>
               </div>
            )}
         </div>

         {/* Preview Area */}
         <div className="md:col-span-2 space-y-6 overflow-hidden">
            {!comicData && status !== 'loading' && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 min-h-[400px]">
                  <ImageIcon className="w-16 h-16 opacity-20 mb-4" />
                  <p>Upload images to create your comic.</p>
               </div>
            )}

            {comicData && (
               <div className="space-y-6 animate-fade-in-up">
                  <div className={`bg-white p-8 rounded-sm shadow-2xl border-4 border-black w-full mx-auto ${orientation === 'horizontal' ? 'overflow-x-auto custom-scrollbar' : ''}`}>
                     {/* Title Block */}
                     <div className="bg-yellow-300 border-2 border-black p-4 mb-6 text-center shadow-[4px_4px_0px_rgba(0,0,0,1)] sticky left-0">
                        <h1 className="text-3xl font-black text-black uppercase tracking-tighter">{comicData.title}</h1>
                     </div>

                     <div className={`flex ${orientation === 'horizontal' ? 'flex-row gap-8 pb-4 min-w-max' : 'flex-col gap-8'}`}>
                        {comicData.pages.map((panel, idx) => (
                           <div key={idx} className={`flex ${orientation === 'horizontal' ? 'flex-col w-64' : 'flex-row gap-4'}`}>
                              {/* Panel Image */}
                              <div className={`${orientation === 'horizontal' ? 'w-full mb-4' : 'w-1/2'} aspect-square border-2 border-black bg-slate-100 relative overflow-hidden`}>
                                 {panel.imageUrl ? (
                                    <img src={panel.imageUrl} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                       {status === 'loading' ? (
                                          <RefreshCw className="w-8 h-8 text-slate-300 animate-spin"/>
                                       ) : (
                                          <ImageIcon className="w-8 h-8 text-slate-200" />
                                       )}
                                    </div>
                                 )}
                                 <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5">{idx + 1}</div>
                              </div>
                              
                              {/* Speech Bubble */}
                              <div className={`${orientation === 'horizontal' ? 'w-full' : 'w-1/2'} flex items-center`}>
                                 <div className="bg-white border-2 border-black p-4 rounded-[20px] relative shadow-[2px_2px_0px_rgba(0,0,0,0.2)] text-black font-mono text-sm leading-snug w-full">
                                    {/* Bubble Tail - Only for vertical */}
                                    {orientation === 'vertical' && (
                                      <div className="absolute top-1/2 -left-3 w-4 h-4 bg-white border-b-2 border-l-2 border-black transform rotate-45"></div>
                                    )}
                                    {/* Bubble Tail - For horizontal */}
                                    {orientation === 'horizontal' && (
                                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-black transform rotate-45"></div>
                                    )}
                                    {panel.text}
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     
                     <div className="mt-8 pt-4 border-t-2 border-black text-center text-xs font-bold font-mono text-black sticky left-0">
                        Written & Directed by AI • Illustrated by Gemini
                     </div>
                  </div>

                  <div className="flex justify-center gap-4">
                     <button 
                        onClick={handleDownload}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-700"
                     >
                        <Download className="w-5 h-5" /> Download PDF Strip
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ComicStripTool;
