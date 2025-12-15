
import React, { useState, useRef } from 'react';
import { GalleryHorizontal, RefreshCw, Download, Palette, Type, User, Layers, Smartphone, FileText, Upload, X, Image as ImageIcon, Monitor, Square, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { generateCarouselContent } from '../../services/geminiService';
import { LoadingState, CarouselData, CarouselSlide } from '../../types';
import jsPDF from 'jspdf';
import { runFileSecurityChecks } from '../../utils/security';

const THEMES = [
  { id: 'corporate', label: 'Corporate Blue', bg: '#0077b5', text: '#ffffff', accent: '#ffffff' },
  { id: 'minimal', label: 'Clean Minimal', bg: '#ffffff', text: '#1e293b', accent: '#0077b5' },
  { id: 'dark', label: 'Bold Dark', bg: '#0f172a', text: '#f8fafc', accent: '#fbbf24' },
  { id: 'forest', label: 'Forest Green', bg: '#064e3b', text: '#ecfdf5', accent: '#34d399' }
];

const ASPECT_RATIOS = [
  { id: 'portrait', label: 'Portrait (4:5)', width: 108, height: 135, icon: Smartphone },
  { id: 'square', label: 'Square (1:1)', width: 108, height: 108, icon: Square },
  { id: 'landscape', label: 'Landscape (16:9)', width: 192, height: 108, icon: Monitor }
];

const CarouselMaker: React.FC = () => {
  // Config State
  const [creationMode, setCreationMode] = useState<'ai' | 'images'>('ai');
  const [includeHandle, setIncludeHandle] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(false);

  // Input State
  const [topic, setTopic] = useState('');
  const [authorHandle, setAuthorHandle] = useState('@yourname');
  const [footerText, setFooterText] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [themeId, setThemeId] = useState('corporate');
  const [aspectRatioId, setAspectRatioId] = useState('portrait');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // Data State
  const [carouselData, setCarouselData] = useState<CarouselData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatioId) || ASPECT_RATIOS[0];

  const handleGenerate = async () => {
    setStatus('loading');
    setCarouselData(null);

    // MODE: IMAGES ONLY
    if (creationMode === 'images') {
        if (uploadedImages.length === 0) {
            setStatus('idle');
            alert("Please upload at least one image.");
            return;
        }
        
        // Create slides based solely on images
        const slides: CarouselSlide[] = uploadedImages.map(() => ({
            title: '',
            content: '',
            type: 'content'
        }));

        setCarouselData({
            topic: 'Image Gallery',
            authorHandle: includeHandle ? authorHandle : '',
            slides: slides
        });
        setStatus('success');
        return;
    }

    // MODE: AI GENERATION
    if (!topic.trim()) {
        setStatus('idle');
        return;
    }
    
    try {
      const result = await generateCarouselContent(topic, slideCount, includeHandle ? authorHandle : '');
      setCarouselData(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await runFileSecurityChecks(file, 'image');
        const reader = new FileReader();
        const result = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(result);
      } catch (err) {
        console.error("Skipping invalid file:", file.name);
      }
    }

    setUploadedImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = () => {
    if (!carouselData) return;

    const width = selectedRatio.width;
    const height = selectedRatio.height;
    const doc = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    // We no longer add the URL watermark at the bottom.

    carouselData.slides.forEach((slide, index) => {
      if (index > 0) doc.addPage([width, height]);
      
      // Background
      doc.setFillColor(selectedTheme.bg);
      doc.rect(0, 0, width, height, 'F');

      // Accent Stripe (Decorative)
      doc.setFillColor(selectedTheme.accent);
      doc.rect(0, 0, width, 2, 'F'); 

      // Footer Area (Handle, Footer Text, Pagination)
      doc.setFontSize(8);
      doc.setTextColor(selectedTheme.text);
      
      const bottomY = height - 5;

      // 1. Handle (Left)
      if (includeHandle) {
         doc.text(carouselData.authorHandle || authorHandle, 5, bottomY);
      }

      // 2. Footer Text (Center)
      if (includeFooter && footerText) {
         doc.text(footerText, width / 2, bottomY, { align: 'center' });
      }
      
      // 3. Pagination (Right)
      const pageText = `${index + 1} / ${carouselData.slides.length}`;
      doc.text(pageText, width - 15, bottomY);
      if (index < carouselData.slides.length - 1) {
         doc.text("→", width - 5, bottomY);
      }

      // Image Handling
      const slideImage = uploadedImages[index];
      let contentStartY = 20; // Default start Y for text

      if (slideImage) {
        // Place image in the top/middle section
        // Max image height: 45% of page height to leave room for text
        // If "Images Only" mode, we can use more space (e.g., 80%) if there is no text
        const isImageOnlyMode = creationMode === 'images';
        const maxImgHeight = isImageOnlyMode ? height * 0.8 : height * 0.45;
        const imgY = isImageOnlyMode ? (height - maxImgHeight) / 2 : 15;
        const imgMargin = 10;
        
        try {
          doc.addImage(slideImage, 'PNG', imgMargin, imgY, width - (imgMargin * 2), maxImgHeight, undefined, 'FAST');
          contentStartY = imgY + maxImgHeight + 10;
        } catch (e) {
          console.error("Error adding image to PDF", e);
        }
      } else {
        // Vertically center text if no image
        contentStartY = height / 3;
      }

      // Slide Text Content (Only if AI mode or manually populated)
      if (creationMode === 'ai' && slide.title) {
          if (slide.type === 'intro') {
             doc.setFont('helvetica', 'bold');
             doc.setFontSize(24);
             const splitTitle = doc.splitTextToSize(slide.title.toUpperCase(), width - 20);
             doc.text(splitTitle, width / 2, contentStartY, { align: 'center' });
             
             doc.setFont('helvetica', 'normal');
             doc.setFontSize(12);
             const splitContent = doc.splitTextToSize(slide.content, width - 30);
             const titleHeight = splitTitle.length * 10;
             doc.text(splitContent, width / 2, contentStartY + titleHeight + 10, { align: 'center' });

          } else if (slide.type === 'content') {
             doc.setFont('helvetica', 'bold');
             doc.setFontSize(16);
             doc.text(slide.title, 10, contentStartY);
             
             doc.setFont('helvetica', 'normal');
             doc.setFontSize(12);
             const splitContent = doc.splitTextToSize(slide.content, width - 20);
             const titleHeight = 10;
             doc.text(splitContent, 10, contentStartY + titleHeight + 5);

          } else {
             doc.setFont('helvetica', 'bold');
             doc.setFontSize(18);
             doc.setTextColor(selectedTheme.accent);
             const splitTitle = doc.splitTextToSize(slide.title, width - 20);
             doc.text(splitTitle, width / 2, contentStartY, { align: 'center' });
             
             doc.setFont('helvetica', 'normal');
             doc.setFontSize(12);
             doc.setTextColor(selectedTheme.text);
             const splitContent = doc.splitTextToSize(slide.content, width - 30);
             const titleHeight = splitTitle.length * 8;
             doc.text(splitContent, width / 2, contentStartY + titleHeight + 10, { align: 'center' });
          }
      }
    });

    doc.save(`linkedin-carousel-${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <GalleryHorizontal className="w-8 h-8 text-blue-600" />
          AI Carousel
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Create viral LinkedIn PDF carousels.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
             
             {/* Creation Mode Toggle */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Settings className="w-3 h-3" /> Creation Mode
                </label>
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                   <button
                      onClick={() => setCreationMode('ai')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                         creationMode === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                   >
                      AI Generator
                   </button>
                   <button
                      onClick={() => setCreationMode('images')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                         creationMode === 'images' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                   >
                      Images Only
                   </button>
                </div>
             </div>

             {/* Aspect Ratio Selector */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Monitor className="w-3 h-3" /> Aspect Ratio
                </label>
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                   {ASPECT_RATIOS.map(ratio => (
                      <button
                         key={ratio.id}
                         onClick={() => setAspectRatioId(ratio.id)}
                         className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                            aspectRatioId === ratio.id 
                            ? 'bg-blue-600 text-white' 
                            : 'text-slate-400 hover:text-white'
                         }`}
                         title={ratio.label}
                      >
                         <ratio.icon className="w-3 h-3" />
                      </button>
                   ))}
                </div>
                <div className="text-right text-[10px] text-slate-500">{selectedRatio.label}</div>
             </div>

             {/* AI Mode: Topic & Slide Count */}
             {creationMode === 'ai' && (
                <>
                   <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                         <FileText className="w-3 h-3" /> Topic / Content
                      </label>
                      <textarea
                         value={topic}
                         onChange={(e) => setTopic(e.target.value)}
                         placeholder="e.g. 5 Habits of Highly Effective Developers..."
                         className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm"
                      />
                   </div>

                   <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                         <Layers className="w-3 h-3" /> Slides
                      </label>
                      <input 
                         type="range" 
                         min="3" 
                         max="10" 
                         value={slideCount} 
                         onChange={(e) => setSlideCount(Number(e.target.value))}
                         className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="text-right text-xs text-blue-400 font-bold">{slideCount} Slides</div>
                   </div>
                </>
             )}

             {/* Branding Controls */}
             <div className="space-y-3 pt-2 border-t border-slate-800">
                {/* Handle Toggle */}
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                         <User className="w-3 h-3" /> Include Handle
                      </label>
                      <button onClick={() => setIncludeHandle(!includeHandle)} className="text-slate-400 hover:text-white">
                         {includeHandle ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                   </div>
                   {includeHandle && (
                      <input 
                         value={authorHandle}
                         onChange={(e) => setAuthorHandle(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in"
                         placeholder="@yourhandle"
                      />
                   )}
                </div>

                {/* Footer Toggle */}
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                         <Type className="w-3 h-3" /> Include Footer
                      </label>
                      <button onClick={() => setIncludeFooter(!includeFooter)} className="text-slate-400 hover:text-white">
                         {includeFooter ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                   </div>
                   {includeFooter && (
                      <input 
                         value={footerText}
                         onChange={(e) => setFooterText(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in"
                         placeholder="e.g. www.website.com"
                      />
                   )}
                </div>
             </div>

             {/* Image Upload */}
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
                   <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> {creationMode === 'images' ? 'Upload Slides (Images)' : 'Custom Images (Optional)'}</span>
                   <span className="text-[10px] normal-case opacity-60">Sequence: Slide 1, 2, ...</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                   {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 group">
                         <img src={img} className="w-full h-full object-cover" />
                         <button 
                           onClick={() => removeImage(idx)}
                           className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                         >
                            <X className="w-4 h-4" />
                         </button>
                         <div className="absolute bottom-0 right-0 bg-black/70 text-[8px] text-white px-1">{idx+1}</div>
                      </div>
                   ))}
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-12 h-12 rounded-lg border border-slate-700 border-dashed flex items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500 transition-colors"
                   >
                      <Upload className="w-5 h-5" />
                   </button>
                   <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleImageUpload}
                   />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Palette className="w-3 h-3" /> Visual Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                   {THEMES.map(t => (
                      <button
                         key={t.id}
                         onClick={() => setThemeId(t.id)}
                         className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${
                            themeId === t.id 
                            ? 'bg-slate-800 border-blue-500 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                         }`}
                      >
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.bg, border: '1px solid #ffffff55' }}></div>
                         {t.label}
                      </button>
                   ))}
                </div>
             </div>

             <button
                onClick={handleGenerate}
                disabled={(creationMode === 'ai' && !topic.trim()) || (creationMode === 'images' && uploadedImages.length === 0) || status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
             >
                {status === 'loading' ? <RefreshCw className="animate-spin" /> : <GalleryHorizontal />}
                {creationMode === 'ai' ? 'Generate Carousel' : 'Create from Images'}
             </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
           {status === 'loading' && (
              <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl">
                 <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-blue-400 font-bold animate-pulse">Structuring content...</p>
              </div>
           )}

           {!carouselData && status !== 'loading' && (
              <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
                 <Smartphone className="w-16 h-16 opacity-20 mb-4" />
                 <p>Configure and generate to see preview.</p>
              </div>
           )}

           {carouselData && (
              <div className="space-y-6 animate-fade-in-up">
                 
                 {/* Horizontal Scroll Preview */}
                 <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex gap-4 min-w-max px-2">
                       {carouselData.slides.map((slide, idx) => {
                          const slideImage = uploadedImages[idx];
                          const isImageOnly = creationMode === 'images';
                          
                          return (
                            <div 
                               key={idx} 
                               className="rounded-xl shadow-xl flex flex-col justify-between relative flex-shrink-0 transition-transform hover:-translate-y-2 duration-300 overflow-hidden"
                               style={{ 
                                  backgroundColor: selectedTheme.bg, 
                                  color: selectedTheme.text,
                                  width: `${selectedRatio.width * 2}px`, 
                                  height: `${selectedRatio.height * 2}px` 
                               }}
                            >
                               {/* Decorative Top Bar */}
                               <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: selectedTheme.accent }}></div>
                               
                               {/* Image Preview */}
                               {slideImage && (
                                  <div className={`w-full bg-black/10 overflow-hidden flex items-center justify-center ${isImageOnly ? 'h-[80%]' : 'h-[45%]'}`}>
                                     <img src={slideImage} className="w-full h-full object-cover" />
                                  </div>
                               )}

                               {/* Content (Scrollable to prevent truncation) */}
                               {!isImageOnly && (
                                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                                     {slide.type === 'intro' ? (
                                        <div className="text-center space-y-2">
                                           <h3 className="text-lg font-bold leading-tight">{slide.title}</h3>
                                           <p className="text-xs opacity-80 whitespace-pre-wrap">{slide.content}</p>
                                        </div>
                                     ) : slide.type === 'content' ? (
                                        <div className="space-y-2">
                                           <h4 className="text-md font-bold" style={{ color: selectedTheme.accent }}>{slide.title}</h4>
                                           <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap">{slide.content}</p>
                                        </div>
                                     ) : (
                                        <div className="text-center space-y-2">
                                           <h3 className="text-md font-bold" style={{ color: selectedTheme.accent }}>{slide.title}</h3>
                                           <p className="text-xs opacity-80 whitespace-pre-wrap">{slide.content}</p>
                                        </div>
                                     )}
                                  </div>
                               )}

                               {/* Footer */}
                               <div className="flex justify-between items-end p-4 pt-0 text-[10px] font-bold opacity-60 h-8 flex-shrink-0">
                                  <span>{includeHandle ? (carouselData.authorHandle || authorHandle) : ''}</span>
                                  {includeFooter && footerText && <span className="absolute left-1/2 -translate-x-1/2 opacity-80">{footerText}</span>}
                                  <span>{idx + 1} / {carouselData.slides.length}</span>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>

                 {/* Actions */}
                 <div className="flex justify-end p-4">
                    <button 
                       onClick={generatePDF}
                       className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                    >
                       <Download className="w-5 h-5" />
                       Download PDF
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CarouselMaker;
