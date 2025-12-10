
import React, { useState } from 'react';
import { GalleryHorizontal, RefreshCw, Download, Palette, Type, User, Layers, Smartphone, FileText } from 'lucide-react';
import { generateCarouselContent } from '../../services/geminiService';
import { LoadingState, CarouselData, CarouselSlide } from '../../types';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const THEMES = [
  { id: 'corporate', label: 'Corporate Blue', bg: '#0077b5', text: '#ffffff', accent: '#ffffff' },
  { id: 'minimal', label: 'Clean Minimal', bg: '#ffffff', text: '#1e293b', accent: '#0077b5' },
  { id: 'dark', label: 'Bold Dark', bg: '#0f172a', text: '#f8fafc', accent: '#fbbf24' },
  { id: 'forest', label: 'Forest Green', bg: '#064e3b', text: '#ecfdf5', accent: '#34d399' }
];

const CarouselMaker: React.FC = () => {
  // Input State
  const [topic, setTopic] = useState('');
  const [authorHandle, setAuthorHandle] = useState('@yourname');
  const [slideCount, setSlideCount] = useState(5);
  const [themeId, setThemeId] = useState('corporate');
  
  // Data State
  const [carouselData, setCarouselData] = useState<CarouselData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setCarouselData(null);
    try {
      const result = await generateCarouselContent(topic, slideCount, authorHandle);
      setCarouselData(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const generatePDF = () => {
    if (!carouselData) return;

    // A4 Portrait dimensions approximately, but we want 4:5 ratio (1080x1350 px equivalent)
    // jsPDF uses mm usually. Let's use 108mm x 135mm for easy math
    const width = 108;
    const height = 135;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    const addWatermark = () => {
       doc.setFontSize(6);
       doc.setTextColor(selectedTheme.text);
       doc.text(WATERMARK_TEXT, width / 2, height - 2, { align: 'center' });
    };

    carouselData.slides.forEach((slide, index) => {
      if (index > 0) doc.addPage([width, height]);
      
      // Background
      doc.setFillColor(selectedTheme.bg);
      doc.rect(0, 0, width, height, 'F');

      // Accent Stripe (Decorative)
      doc.setFillColor(selectedTheme.accent);
      doc.rect(0, 0, width, 2, 'F'); // Top bar

      // Footer: Author & Pagination
      doc.setFontSize(8);
      doc.setTextColor(selectedTheme.text);
      doc.text(carouselData.authorHandle, 5, height - 5);
      
      // Pagination Arrow
      const pageText = `${index + 1} / ${carouselData.slides.length}`;
      doc.text(pageText, width - 15, height - 5);
      if (index < carouselData.slides.length - 1) {
         doc.text("→", width - 5, height - 5);
      }

      // Slide Content
      if (slide.type === 'intro') {
         // Big Title
         doc.setFont('helvetica', 'bold');
         doc.setFontSize(24);
         const splitTitle = doc.splitTextToSize(slide.title.toUpperCase(), width - 20);
         doc.text(splitTitle, width / 2, height / 3, { align: 'center' });
         
         // Subtitle
         doc.setFont('helvetica', 'normal');
         doc.setFontSize(12);
         const splitContent = doc.splitTextToSize(slide.content, width - 30);
         doc.text(splitContent, width / 2, height / 2 + 10, { align: 'center' });

      } else if (slide.type === 'content') {
         // Header
         doc.setFont('helvetica', 'bold');
         doc.setFontSize(16);
         doc.text(slide.title, 10, 20);
         
         // Body
         doc.setFont('helvetica', 'normal');
         doc.setFontSize(12);
         const splitContent = doc.splitTextToSize(slide.content, width - 20);
         doc.text(splitContent, 10, 40);

      } else {
         // Outro / CTA
         doc.setFont('helvetica', 'bold');
         doc.setFontSize(18);
         doc.setTextColor(selectedTheme.accent);
         const splitTitle = doc.splitTextToSize(slide.title, width - 20);
         doc.text(splitTitle, width / 2, height / 3, { align: 'center' });
         
         doc.setFont('helvetica', 'normal');
         doc.setFontSize(12);
         doc.setTextColor(selectedTheme.text);
         const splitContent = doc.splitTextToSize(slide.content, width - 30);
         doc.text(splitContent, width / 2, height / 2, { align: 'center' });
      }
      
      addWatermark();
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
           <p className="text-slate-600 dark:text-slate-400">Create viral LinkedIn PDF carousels in seconds.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
             
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <FileText className="w-3 h-3" /> Topic / Content
                </label>
                <textarea
                   value={topic}
                   onChange={(e) => setTopic(e.target.value)}
                   placeholder="e.g. 5 Habits of Highly Effective Developers..."
                   className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none text-sm"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <User className="w-3 h-3" /> Handle
                   </label>
                   <input 
                      value={authorHandle}
                      onChange={(e) => setAuthorHandle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={!topic.trim() || status === 'loading'}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
             >
                {status === 'loading' ? <RefreshCw className="animate-spin" /> : <GalleryHorizontal />}
                Generate Carousel
             </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
           {status === 'loading' && (
              <div className="h-96 flex flex-col items-center justify-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl">
                 <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-blue-400 font-bold animate-pulse">Structuring narrative...</p>
              </div>
           )}

           {!carouselData && status !== 'loading' && (
              <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl">
                 <Smartphone className="w-16 h-16 opacity-20 mb-4" />
                 <p>Enter a topic to generate slides.</p>
              </div>
           )}

           {carouselData && (
              <div className="space-y-6 animate-fade-in-up">
                 
                 {/* Horizontal Scroll Preview */}
                 <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div className="flex gap-4 min-w-max px-2">
                       {carouselData.slides.map((slide, idx) => (
                          <div 
                             key={idx} 
                             className="w-[240px] aspect-[4/5] rounded-xl shadow-xl flex flex-col justify-between p-6 relative flex-shrink-0 transition-transform hover:-translate-y-2 duration-300"
                             style={{ backgroundColor: selectedTheme.bg, color: selectedTheme.text }}
                          >
                             {/* Decorative Top Bar */}
                             <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: selectedTheme.accent }}></div>
                             
                             {/* Content */}
                             <div className="flex-1 flex flex-col justify-center">
                                {slide.type === 'intro' ? (
                                   <div className="text-center space-y-4">
                                      <h3 className="text-2xl font-bold leading-tight">{slide.title}</h3>
                                      <p className="text-sm opacity-80">{slide.content}</p>
                                   </div>
                                ) : slide.type === 'content' ? (
                                   <div className="space-y-4">
                                      <h4 className="text-lg font-bold" style={{ color: selectedTheme.accent }}>{slide.title}</h4>
                                      <p className="text-sm leading-relaxed opacity-90">{slide.content}</p>
                                   </div>
                                ) : (
                                   <div className="text-center space-y-4">
                                      <h3 className="text-xl font-bold" style={{ color: selectedTheme.accent }}>{slide.title}</h3>
                                      <p className="text-sm opacity-80">{slide.content}</p>
                                   </div>
                                )}
                             </div>

                             {/* Footer */}
                             <div className="flex justify-between items-end mt-4 text-[10px] font-bold opacity-60">
                                <span>{carouselData.authorHandle}</span>
                                <span>{idx + 1} / {carouselData.slides.length}</span>
                             </div>
                          </div>
                       ))}
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