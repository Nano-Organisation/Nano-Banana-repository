import React, { useState, useRef, useEffect } from 'react';
import { GalleryHorizontal, RefreshCw, Download, Palette, Type, User, Layers, Smartphone, FileText, Upload, X, Image as ImageIcon, Monitor, Square, Settings, ToggleLeft, ToggleRight, PaintBucket, Flower, Grid, Circle, Box, Play } from 'lucide-react';
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
  { id: 'helvetica', label: 'Helvetica (Sans)', css: 'font-sans' },
  { id: 'times', label: 'Times New Roman (Serif)', css: 'font-serif' },
  { id: 'courier', label: 'Courier (Mono)', css: 'font-mono' }
];

const ASPECT_RATIOS = [
  { id: 'portrait', label: 'Portrait (4:5)', width: 108, height: 135, icon: Smartphone },
  { id: 'square', label: 'Square (1:1)', width: 108, height: 108, icon: Square },
  { id: 'landscape', label: 'Landscape (16:9)', width: 192, height: 108, icon: Monitor }
];

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
  const [fontId, setFontId] = useState('helvetica');
  const [decorationId, setDecorationId] = useState('none');
  const [carouselData, setCarouselData] = useState<CarouselData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatioId) || ASPECT_RATIOS[0];

  const handleGenerate = async () => {
    if (creationMode === 'ai' && !topic.trim()) return;
    setStatus('loading');
    try {
      if (creationMode === 'images') {
        const slides = uploadedImages.map((_, i) => ({ title: `Slide ${i+1}`, content: '', type: 'content' as any }));
        setCarouselData({ topic: 'Gallery', authorHandle, slides });
      } else {
        const result = await generateCarouselContent(topic, slideCount, authorHandle);
        setCarouselData(result);
      }
      setStatus('success');
    } catch (e) { setStatus('error'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        await runFileSecurityChecks(files[i], 'image');
        const reader = new FileReader();
        const b64 = await new Promise<string>(res => { reader.onload = () => res(reader.result as string); reader.readAsDataURL(files[i]); });
        newImages.push(b64);
      } catch (err) {}
    }
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const generatePDF = () => {
    if (!carouselData) return;
    const doc = new jsPDF({ orientation: selectedRatio.width > selectedRatio.height ? 'l' : 'p', unit: 'mm', format: [selectedRatio.width, selectedRatio.height] });
    carouselData.slides.forEach((slide, i) => {
      if (i > 0) doc.addPage([selectedRatio.width, selectedRatio.height]);
      doc.setFillColor(selectedTheme.bg);
      doc.rect(0, 0, selectedRatio.width, selectedRatio.height, 'F');
      doc.setTextColor(selectedTheme.text);
      doc.setFontSize(16);
      doc.text(slide.title, selectedRatio.width / 2, 40, { align: 'center' });
      doc.setFontSize(10);
      const split = doc.splitTextToSize(slide.content, selectedRatio.width - 20);
      doc.text(split, selectedRatio.width / 2, 60, { align: 'center' });
    });
    doc.save(`carousel-${Date.now()}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <GalleryHorizontal className="w-8 h-8 text-blue-600" />
          AI Carousel Maker
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Create professional LinkedIn carousels instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
             <textarea 
               value={topic} 
               onChange={e => setTopic(e.target.value)} 
               placeholder="Enter topic for carousel..." 
               className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white h-24 resize-none"
             />
             <div className="grid grid-cols-2 gap-2">
                {THEMES.slice(0,4).map(t => (
                  <button key={t.id} onClick={() => setThemeId(t.id)} className={`p-2 rounded border text-[10px] uppercase font-bold transition-all ${themeId === t.id ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{t.label}</button>
                ))}
             </div>
             {/* Fix: Added Play icon to imports to resolve compilation error */}
             <button onClick={handleGenerate} disabled={status === 'loading'} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />} Generate
             </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {carouselData ? (
             <div className="space-y-6">
                <div className="aspect-[4/5] max-w-sm mx-auto bg-slate-800 rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl relative">
                   <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: selectedTheme.bg }}>
                      <h3 className="text-2xl font-bold uppercase tracking-tighter" style={{ color: selectedTheme.text }}>{carouselData.slides[0].title}</h3>
                      <p className="mt-4 text-sm opacity-80" style={{ color: selectedTheme.text }}>{carouselData.slides[0].content}</p>
                   </div>
                </div>
                <div className="flex justify-center gap-4">
                   <button onClick={generatePDF} className="bg-slate-100 hover:bg-white text-slate-900 font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all">
                      <Download className="w-5 h-5" /> Download PDF
                   </button>
                </div>
             </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-600">
               <ImageIcon className="w-12 h-12 opacity-10 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest opacity-30">Awaiting Generation</p>
            </div>
          )}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CarouselMaker;