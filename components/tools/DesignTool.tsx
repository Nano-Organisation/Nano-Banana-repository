
import React, { useState } from 'react';
import { PenTool, Download, RefreshCw, Layout, Smartphone, Sticker, Hexagon } from 'lucide-react';
import { generateImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

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
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const selectedStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus('loading');
    try {
      // enhance prompt with style instructions
      const finalPrompt = `Design a ${selectedStyle.label}: ${prompt}. Style details: ${selectedStyle.promptSuffix}`;
      const img = await generateImageWithGemini(finalPrompt);
      setResultImage(img);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <PenTool className="w-8 h-8 text-fuchsia-500" />
          Nano Design
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Create professional logos, icons, and UI concepts in seconds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Controls */}
        <div className="space-y-6">
          
          {/* Style Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Select Asset Type</label>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    selectedStyleId === style.id 
                      ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <style.icon className={`w-5 h-5 ${selectedStyleId === style.id ? 'text-fuchsia-400' : ''}`} />
                  <span className="font-medium">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Describe your design</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g., A futuristic electric car company branding...`}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 h-32 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt || status === 'loading'}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-900/20"
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <PenTool />}
            Generate Design
          </button>
        </div>

        {/* Preview & Download */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-slate-900 rounded-2xl border border-slate-700 flex flex-col items-center justify-center overflow-hidden group">
            {status === 'loading' ? (
               <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-fuchsia-400 text-sm animate-pulse">Designing asset...</p>
              </div>
            ) : resultImage ? (
              <>
                <img src={resultImage} alt="Generated Design" className="w-full h-full object-contain p-4" />
                {/* Hover overlay remains for quick access or aesthetic preference */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none md:pointer-events-auto">
                   <div className="text-white font-bold flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Preview
                   </div>
                </div>
              </>
            ) : (
              <div className="text-slate-600 flex flex-col items-center p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                  <PenTool className="w-10 h-10 opacity-20" />
                </div>
                <p>Select a style and describe your idea to generate professional assets.</p>
              </div>
            )}
          </div>

          {/* Persistent Download Button */}
          {resultImage && (
            <a 
              href={resultImage} 
              download={`nano-design-${selectedStyle.id}.png`}
              className="w-full bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-500 shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download {selectedStyle.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignTool;
