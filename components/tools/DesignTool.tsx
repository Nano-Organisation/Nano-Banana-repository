
import React, { useState } from 'react';
import { PenTool, Download, RefreshCw, Layout, Smartphone, Sticker, Hexagon, Layers, Image as ImageIcon } from 'lucide-react';
import { generateBatchImages } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const STYLES = [
  { 
    id: 'logo', 
    label: 'Logo', 
    icon: Hexagon,
    promptSuffix: 'minimalist vector logo, clean lines, professional brand identity, white background, high quality' 
  },
  { 
    id: 'icon', 
    label: 'App Icon', 
    icon: Smartphone,
    promptSuffix: 'ios app icon, rounded corners, squircle, high fidelity, 3d render style, vibrant, detailed' 
  },
  { 
    id: 'ui', 
    label: 'Web Mockup', 
    icon: Layout,
    promptSuffix: 'modern website ui design, landing page, dribbble style, clean ux, high resolution, professional layout' 
  },
  { 
    id: 'sticker', 
    label: 'Sticker', 
    icon: Sticker,
    promptSuffix: 'die-cut sticker design, white border, cute and vibrant, flat vector style, isolated on dark background' 
  }
];

const DesignTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState(STYLES[0].id);
  const [quantity, setQuantity] = useState(1);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');

  const selectedStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus('loading');
    setResultImages([]);
    
    try {
      // enhance prompt with style instructions
      const finalPrompt = `Design a ${selectedStyle.label}: ${prompt}. Style details: ${selectedStyle.promptSuffix}`;
      const imgs = await generateBatchImages(finalPrompt, quantity);
      setResultImages(imgs);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleDownload = async (imgUrl: string, index: number) => {
    const watermarked = await addWatermarkToImage(imgUrl);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `nano-design-${selectedStyle.id}-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <PenTool className="w-8 h-8 text-fuchsia-500" />
          Nano Design
          <span className="text-xs font-normal bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 px-2 py-1 rounded-full border border-fuchsia-200 dark:border-fuchsia-800 ml-2">
             Model: gemini-2.5-flash-image
          </span>
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Create professional logos, icons, and UI concepts in seconds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
             {/* Style Selector */}
             <div className="space-y-3">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Type</label>
               <div className="grid grid-cols-2 gap-3">
                 {STYLES.map((style) => (
                   <button
                     key={style.id}
                     onClick={() => setSelectedStyleId(style.id)}
                     className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                       selectedStyleId === style.id 
                         ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white' 
                         : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                     }`}
                   >
                     <style.icon className={`w-5 h-5 ${selectedStyleId === style.id ? 'text-fuchsia-400' : ''}`} />
                     <span className="font-medium text-sm">{style.label}</span>
                   </button>
                 ))}
               </div>
             </div>

             {/* Quantity Selector */}
             <div className="space-y-3">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Variations</label>
               <div className="flex gap-2">
                  {[1, 2, 3].map(num => (
                     <button
                        key={num}
                        onClick={() => setQuantity(num)}
                        className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
                           quantity === num 
                           ? 'bg-fuchsia-600 text-white border-fuchsia-500' 
                           : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                     >
                        {num} {num === 1 ? 'Image' : 'Images'}
                     </button>
                  ))}
               </div>
             </div>

             {/* Prompt Input */}
             <div className="space-y-3">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concept</label>
               <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder={`Describe your ${selectedStyle.label.toLowerCase()} idea...`}
                 className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 h-32 resize-none"
               />
             </div>

             <button
               onClick={handleGenerate}
               disabled={!prompt || status === 'loading'}
               className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-900/20"
             >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <PenTool />}
               Generate Design
             </button>
          </div>
        </div>

        {/* Preview & Download */}
        <div className="lg:col-span-2">
          {status === 'loading' ? (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
               <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-fuchsia-400 font-medium animate-pulse">Designing {quantity} variation{quantity > 1 ? 's' : ''}...</p>
             </div>
          ) : resultImages.length > 0 ? (
             <div className={`grid gap-6 ${resultImages.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                {resultImages.map((img, idx) => (
                   <div key={idx} className="group relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-fuchsia-500/50 transition-colors">
                      <div className="aspect-square p-8 flex items-center justify-center">
                         <img src={img} alt={`Design variant ${idx+1}`} className="w-full h-full object-contain" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                         <button 
                           onClick={() => handleDownload(img, idx)}
                           className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                         >
                           <Download className="w-5 h-5" />
                           Download
                         </button>
                      </div>
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
                         Variant {idx + 1}
                      </div>
                   </div>
                ))}
             </div>
          ) : (
             <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <PenTool className="w-10 h-10 opacity-20" />
               </div>
               <p>Select a style and describe your idea.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignTool;
