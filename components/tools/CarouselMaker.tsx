
import React, { useState, useRef, useEffect } from 'react';
import { GalleryHorizontal, RefreshCw, Download, Palette, Type, User, Layers, Smartphone, FileText, Upload, X, Image as ImageIcon, Monitor, Square, Settings, ToggleLeft, ToggleRight, PaintBucket, Flower, Grid, Circle, Box, Image } from 'lucide-react';
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
  // New Themes
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

const DECORATIONS = [
  { id: 'none', label: 'None', icon: Box },
  { id: 'border', label: 'Simple Border', icon: Square },
  { id: 'corners', label: 'Corner Accents', icon: Box },
  { id: 'flowers', label: 'Floral Borders', icon: Flower },
  { id: 'circles', label: 'Modern Circles', icon: Circle },
  { id: 'geometric', label: 'Geometric Grid', icon: Grid }
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  // Style State
  const [themeId, setThemeId] = useState('corporate');
  const [aspectRatioId, setAspectRatioId] = useState('portrait');
  const [fontId, setFontId] = useState('helvetica');
  const [decorationId, setDecorationId] = useState('none');
  const [customTitleColor, setCustomTitleColor] = useState('');
  const [customBodyColor, setCustomBodyColor] = useState('');
  const [showAdvancedStyle, setShowAdvancedStyle] = useState(false);

  // Data State
  const [carouselData, setCarouselData] = useState<CarouselData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [imageDownloadStatus, setImageDownloadStatus] = useState<LoadingState>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For image generation

  const selectedTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatioId) || ASPECT_RATIOS[0];
  const selectedFont = FONTS.find(f => f.id === fontId) || FONTS[0];

  // Reset custom colors when theme changes
  useEffect(() => {
    setCustomTitleColor(selectedTheme.text);
    setCustomBodyColor(selectedTheme.text);
  }, [themeId]);

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

  // --- Rendering Helpers ---

  const drawDecorationPDF = (doc: jsPDF, width: number, height: number, color: string) => {
    doc.setDrawColor(color);
    doc.setFillColor(color);
    doc.setLineWidth(0.5);

    if (decorationId === 'border') {
      doc.rect(5, 5, width - 10, height - 10);
    } else if (decorationId === 'corners') {
      const size = 20;
      // Top Left
      doc.line(5, 5, 5 + size, 5);
      doc.line(5, 5, 5, 5 + size);
      // Top Right
      doc.line(width - 5, 5, width - 5 - size, 5);
      doc.line(width - 5, 5, width - 5, 5 + size);
      // Bottom Left
      doc.line(5, height - 5, 5 + size, height - 5);
      doc.line(5, height - 5, 5, height - 5 - size);
      // Bottom Right
      doc.line(width - 5, height - 5, width - 5 - size, height - 5);
      doc.line(width - 5, height - 5, width - 5, height - 5 - size);
    } else if (decorationId === 'flowers') {
      const drawFlower = (x: number, y: number) => {
         doc.circle(x, y, 2, 'F');
         doc.circle(x+2, y, 2, 'S');
         doc.circle(x-2, y, 2, 'S');
         doc.circle(x, y+2, 2, 'S');
         doc.circle(x, y-2, 2, 'S');
      };
      drawFlower(10, 10);
      drawFlower(width - 10, 10);
      drawFlower(10, height - 10);
      drawFlower(width - 10, height - 10);
    } else if (decorationId === 'circles') {
       doc.circle(0, 0, 30, 'S');
       doc.circle(width, height, 40, 'S');
       doc.circle(width, 0, 20, 'F');
    } else if (decorationId === 'geometric') {
       doc.rect(0, 0, 10, height, 'F');
       doc.rect(width - 10, 0, 10, height, 'F');
    }
  };

  const drawDecorationCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    if (decorationId === 'border') {
      ctx.strokeRect(20, 20, width - 40, height - 40);
    } else if (decorationId === 'corners') {
      const size = 60;
      const m = 20;
      ctx.beginPath();
      // TL
      ctx.moveTo(m, m + size); ctx.lineTo(m, m); ctx.lineTo(m + size, m);
      // TR
      ctx.moveTo(width - m - size, m); ctx.lineTo(width - m, m); ctx.lineTo(width - m, m + size);
      // BL
      ctx.moveTo(m, height - m - size); ctx.lineTo(m, height - m); ctx.lineTo(m + size, height - m);
      // BR
      ctx.moveTo(width - m - size, height - m); ctx.lineTo(width - m, height - m); ctx.lineTo(width - m, height - m - size);
      ctx.stroke();
    } else if (decorationId === 'flowers') {
       const drawFlower = (cx: number, cy: number) => {
          ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx+10, cy, 8, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx-10, cy, 8, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy+10, 8, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy-10, 8, 0, Math.PI * 2); ctx.stroke();
       };
       drawFlower(40, 40);
       drawFlower(width - 40, 40);
       drawFlower(40, height - 40);
       drawFlower(width - 40, height - 40);
    } else if (decorationId === 'circles') {
       ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.stroke();
       ctx.beginPath(); ctx.arc(width, height, 150, 0, Math.PI * 2); ctx.stroke();
       ctx.beginPath(); ctx.arc(width, 0, 80, 0, Math.PI * 2); ctx.fill();
    } else if (decorationId === 'geometric') {
       ctx.fillRect(0, 0, 30, height);
       ctx.fillRect(width - 30, 0, 30, height);
    }
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

    carouselData.slides.forEach((slide, index) => {
      if (index > 0) doc.addPage([width, height]);
      
      // Background
      doc.setFillColor(selectedTheme.bg);
      doc.rect(0, 0, width, height, 'F');

      // Decoration
      drawDecorationPDF(doc, width, height, selectedTheme.accent);

      // Footer
      doc.setFont(fontId, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(selectedTheme.text);
      
      const bottomY = height - 5;
      if (includeHandle) doc.text(carouselData.authorHandle || authorHandle, 5, bottomY);
      if (includeFooter && footerText) doc.text(footerText, width / 2, bottomY, { align: 'center' });
      
      const pageText = `${index + 1} / ${carouselData.slides.length}`;
      doc.text(pageText, width - 15, bottomY);
      if (index < carouselData.slides.length - 1) doc.text(">", width - 5, bottomY);

      // Image
      const slideImage = uploadedImages[index];
      let contentStartY = 20;

      if (slideImage) {
        const isImageOnlyMode = creationMode === 'images';
        const maxImgHeight = isImageOnlyMode ? height * 0.8 : height * 0.45;
        const imgY = isImageOnlyMode ? (height - maxImgHeight) / 2 : 15;
        const imgMargin = 10;
        try {
          doc.addImage(slideImage, 'PNG', imgMargin, imgY, width - (imgMargin * 2), maxImgHeight, undefined, 'FAST');
          contentStartY = imgY + maxImgHeight + 10;
        } catch (e) { console.error(e); }
      } else {
        contentStartY = height / 3;
      }

      // Text
      if (creationMode === 'ai' && slide.title) {
          doc.setFont(fontId, 'bold');
          if (slide.type === 'intro') {
             doc.setFontSize(24);
             doc.setTextColor(customTitleColor || selectedTheme.text);
             const splitTitle = doc.splitTextToSize(slide.title.toUpperCase(), width - 20);
             doc.text(splitTitle, width / 2, contentStartY, { align: 'center' });
             
             doc.setFont(fontId, 'normal');
             doc.setFontSize(12);
             doc.setTextColor(customBodyColor || selectedTheme.text);
             const splitContent = doc.splitTextToSize(slide.content, width - 30);
             const titleHeight = splitTitle.length * 10;
             doc.text(splitContent, width / 2, contentStartY + titleHeight + 10, { align: 'center' });

          } else if (slide.type === 'content') {
             doc.setFontSize(16);
             doc.setTextColor(selectedTheme.accent); // Accent for titles in content
             doc.text(slide.title, 10, contentStartY);
             
             doc.setFont(fontId, 'normal');
             doc.setFontSize(12);
             doc.setTextColor(customBodyColor || selectedTheme.text);
             const splitContent = doc.splitTextToSize(slide.content, width - 20);
             const titleHeight = 10;
             doc.text(splitContent, 10, contentStartY + titleHeight + 5);

          } else {
             doc.setFontSize(18);
             doc.setTextColor(selectedTheme.accent);
             const splitTitle = doc.splitTextToSize(slide.title, width - 20);
             doc.text(splitTitle, width / 2, contentStartY, { align: 'center' });
             
             doc.setFont(fontId, 'normal');
             doc.setFontSize(12);
             doc.setTextColor(customBodyColor || selectedTheme.text);
             const splitContent = doc.splitTextToSize(slide.content, width - 30);
             const titleHeight = splitTitle.length * 8;
             doc.text(splitContent, width / 2, contentStartY + titleHeight + 10, { align: 'center' });
          }
      }
    });

    doc.save(`linkedin-carousel-${Date.now()}.pdf`);
  };

  const generateImages = async () => {
    if (!carouselData || !canvasRef.current) return;
    setImageDownloadStatus('loading');

    const zip = new JSZip();
    const scale = 3; // High res
    const width = selectedRatio.width * scale * 3.78; // approx px conversion
    const height = selectedRatio.height * scale * 3.78;
    const ctx = canvasRef.current.getContext('2d');
    
    if (!ctx) return;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Helper to load image
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve) => {
        // Fixed: replaced 'new Image()' with 'document.createElement("img")' to prevent Illegal constructor errors
        const img = document.createElement('img');
        img.onload = () => resolve(img);
        img.src = src;
    });

    for (let i = 0; i < carouselData.slides.length; i++) {
        const slide = carouselData.slides[i];
        
        // Background
        ctx.fillStyle = selectedTheme.bg;
        ctx.fillRect(0, 0, width, height);

        // Decoration
        drawDecorationCanvas(ctx, width, height, selectedTheme.accent);

        // Image
        const slideImage = uploadedImages[i];
        let contentStartY = height * 0.2;

        if (slideImage) {
            const img = await loadImage(slideImage);
            const isImageOnly = creationMode === 'images';
            const imgH = isImageOnly ? height * 0.8 : height * 0.45;
            const imgW = width - (80); // margin
            const imgY = isImageOnly ? (height - imgH) / 2 : 60;
            
            // Draw image preserving aspect ratio fit
            const scale = Math.min(imgW / img.width, imgH / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (width - w) / 2;
            
            ctx.drawImage(img, x, imgY, w, h);
            contentStartY = imgY + h + 40;
        } else {
            contentStartY = height * 0.35;
        }

        // Text
        if (creationMode === 'ai' && slide.title) {
            ctx.textAlign = 'center';
            ctx.fillStyle = customTitleColor || selectedTheme.text;
            ctx.font = `bold ${slide.type === 'intro' ? '80px' : '50px'} ${fontId === 'times' ? 'serif' : fontId === 'courier' ? 'monospace' : 'sans-serif'}`;
            
            if (slide.type === 'content') {
               ctx.textAlign = 'left';
               ctx.fillStyle = selectedTheme.accent;
               ctx.fillText(slide.title, 40, contentStartY);
               contentStartY += 60;
               ctx.fillStyle = customBodyColor || selectedTheme.text;
               ctx.font = `40px ${fontId === 'times' ? 'serif' : fontId === 'courier' ? 'monospace' : 'sans-serif'}`;
               wrapText(ctx, slide.content, 40, contentStartY, width - 80, 50);
            } else {
               ctx.fillText(slide.title.toUpperCase(), width/2, contentStartY);
               contentStartY += slide.type === 'intro' ? 100 : 80;
               ctx.fillStyle = customBodyColor || selectedTheme.text;
               ctx.font = `40px ${fontId === 'times' ? 'serif' : fontId === 'courier' ? 'monospace' : 'sans-serif'}`;
               wrapText(ctx, slide.content, width/2, contentStartY, width - 100, 50);
            }
        }

        // Footer
        ctx.fillStyle = selectedTheme.text;
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'left';
        if (includeHandle) ctx.fillText(carouselData.authorHandle || authorHandle, 20, height - 20);
        ctx.textAlign = 'right';
        ctx.fillText(`${i+1} / ${carouselData.slides.length}`, width - 20, height - 20);

        // Add to Zip
        const dataUrl = canvasRef.current.toDataURL('image/png');
        zip.file(`slide-${i+1}.png`, dataUrl.split(',')[1], {base64: true});
    }

    const content = await zip.generateAsync({type: "blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "carousel-images.zip";
    link.click();
    setImageDownloadStatus('idle');
  };

  // Basic canvas text wrap
  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

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
             
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Settings className="w-3 h-3" /> Creation Mode
                </label>
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                   <button onClick={() => setCreationMode('ai')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${creationMode === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>AI Generator</button>
                   <button onClick={() => setCreationMode('images')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${creationMode === 'images' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Images Only</button>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Monitor className="w-3 h-3" /> Aspect Ratio</label>
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                   {ASPECT_RATIOS.map(ratio => (
                      <button key={ratio.id} onClick={() => setAspectRatioId(ratio.id)} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${aspectRatioId === ratio.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                         <ratio.icon className="w-3 h-3" />
                      </button>
                   ))}
                </div>
             </div>

             {creationMode === 'ai' && (
                <>
                   <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><FileText className="w-3 h-3" /> Topic / Content</label>
                      <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. 5 Habits of Highly Effective Developers..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none text-sm" />
                   </div>
                   <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Layers className="w-3 h-3" /> Slides: {slideCount}</label>
                      <input type="range" min="3" max="10" value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                   </div>
                </>
             )}

             <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><User className="w-3 h-3" /> Include Handle</label>
                      <button onClick={() => setIncludeHandle(!includeHandle)} className="text-slate-400 hover:text-white">{includeHandle ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}</button>
                   </div>
                   {includeHandle && <input value={authorHandle} onChange={(e) => setAuthorHandle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in" placeholder="@yourhandle" />}
                </div>
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Type className="w-3 h-3" /> Include Footer</label>
                      <button onClick={() => setIncludeFooter(!includeFooter)} className="text-slate-400 hover:text-white">{includeFooter ? <ToggleRight className="w-5 h-5 text-blue-500" /> : <ToggleLeft className="w-5 h-5" />}</button>
                   </div>
                   {includeFooter && <input value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in" placeholder="e.g. www.website.com" />}
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
                   <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> {creationMode === 'images' ? 'Upload Slides (Images)' : 'Custom Images (Optional)'}</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                   {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 group">
                         <img src={img} className="w-full h-full object-cover" />
                         <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"><X className="w-4 h-4" /></button>
                         <div className="absolute bottom-0 right-0 bg-black/70 text-[8px] text-white px-1">{idx+1}</div>
                      </div>
                   ))}
                   <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-lg border border-slate-700 border-dashed flex items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500 transition-colors"><Upload className="w-5 h-5" /></button>
                   <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                </div>
             </div>

             {/* Styling Section */}
             <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Palette className="w-3 h-3" /> Visual Theme</label>
                   <div className="grid grid-cols-2 gap-2 h-32 overflow-y-auto custom-scrollbar pr-1">
                      {THEMES.map(t => (
                         <button key={t.id} onClick={() => setThemeId(t.id)} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-2 ${themeId === t.id ? 'bg-slate-800 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'}`}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.bg, border: '1px solid #ffffff55' }}></div> {t.label}
                         </button>
                      ))}
                   </div>
                </div>

                <button onClick={() => setShowAdvancedStyle(!showAdvancedStyle)} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                   <Settings className="w-3 h-3" /> {showAdvancedStyle ? 'Hide Advanced Styles' : 'Show Advanced Styles (Fonts, Colors, Deco)'}
                </button>

                {showAdvancedStyle && (
                   <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800 animate-fade-in">
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Font</label>
                         <div className="flex gap-1">
                            {FONTS.map(f => (
                               <button key={f.id} onClick={() => setFontId(f.id)} className={`flex-1 py-1 rounded text-xs ${fontId === f.id ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>{f.label.split(' ')[0]}</button>
                            ))}
                         </div>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Background Decoration</label>
                         <div className="grid grid-cols-3 gap-2">
                            {DECORATIONS.map(d => (
                               <button key={d.id} onClick={() => setDecorationId(d.id)} className={`py-1 rounded text-[10px] flex items-center justify-center gap-1 border ${decorationId === d.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 text-slate-500'}`}>
                                  <d.icon className="w-3 h-3"/> {d.label}
                               </button>
                            ))}
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><PaintBucket className="w-3 h-3"/> Title Color</label>
                            <input type="color" value={customTitleColor} onChange={(e) => setCustomTitleColor(e.target.value)} className="w-full h-6 rounded bg-transparent cursor-pointer" />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><PaintBucket className="w-3 h-3"/> Body Color</label>
                            <input type="color" value={customBodyColor} onChange={(e) => setCustomBodyColor(e.target.value)} className="w-full h-6 rounded bg-transparent cursor-pointer" />
                         </div>
                      </div>
                   </div>
                )}
             </div>

             <button onClick={handleGenerate} disabled={(creationMode === 'ai' && !topic.trim()) || (creationMode === 'images' && uploadedImages.length === 0) || status === 'loading'} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">
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
                               className={`rounded-xl shadow-xl flex flex-col justify-between relative flex-shrink-0 transition-transform hover:-translate-y-2 duration-300 overflow-hidden ${selectedFont.css}`}
                               style={{ 
                                  backgroundColor: selectedTheme.bg, 
                                  color: selectedTheme.text,
                                  width: `${selectedRatio.width * 2}px`, 
                                  height: `${selectedRatio.height * 2}px` 
                               }}
                            >
                               {/* Decoration Overlay (Preview Only - simplified) */}
                               {decorationId === 'border' && <div className="absolute inset-2 border-2" style={{ borderColor: selectedTheme.accent }}></div>}
                               {decorationId === 'corners' && (
                                  <>
                                     <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4" style={{ borderColor: selectedTheme.accent }}></div>
                                     <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4" style={{ borderColor: selectedTheme.accent }}></div>
                                  </>
                               )}
                               {decorationId === 'flowers' && (
                                  <>
                                     <Flower className="absolute top-2 left-2 w-6 h-6" style={{ color: selectedTheme.accent }} />
                                     <Flower className="absolute bottom-2 right-2 w-6 h-6" style={{ color: selectedTheme.accent }} />
                                  </>
                               )}
                               {decorationId === 'geometric' && (
                                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(${selectedTheme.accent} 2px, transparent 2px)`, backgroundSize: '20px 20px' }}></div>
                               )}

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
                                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative z-10">
                                     {slide.type === 'intro' ? (
                                        <div className="text-center space-y-2">
                                           <h3 className="text-lg font-bold leading-tight" style={{ color: customTitleColor }}>{slide.title}</h3>
                                           <p className="text-xs opacity-80 whitespace-pre-wrap" style={{ color: customBodyColor }}>{slide.content}</p>
                                        </div>
                                     ) : slide.type === 'content' ? (
                                        <div className="space-y-2">
                                           <h4 className="text-md font-bold" style={{ color: selectedTheme.accent }}>{slide.title}</h4>
                                           <p className="text-xs leading-relaxed opacity-90 whitespace-pre-wrap" style={{ color: customBodyColor }}>{slide.content}</p>
                                        </div>
                                     ) : (
                                        <div className="text-center space-y-2">
                                           <h3 className="text-md font-bold" style={{ color: selectedTheme.accent }}>{slide.title}</h3>
                                           <p className="text-xs opacity-80 whitespace-pre-wrap" style={{ color: customBodyColor }}>{slide.content}</p>
                                        </div>
                                     )}
                                  </div>
                               )}

                               {/* Footer */}
                               <div className="flex justify-between items-end p-4 pt-0 text-[10px] font-bold opacity-60 h-8 flex-shrink-0 relative z-10">
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
                 <div className="flex justify-end p-4 gap-4">
                    <button 
                       onClick={generateImages}
                       disabled={imageDownloadStatus === 'loading'}
                       className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-700"
                    >
                       {imageDownloadStatus === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5" />}
                       Download Images
                    </button>
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
      
      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CarouselMaker;
