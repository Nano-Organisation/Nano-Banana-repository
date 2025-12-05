
import React, { useState } from 'react';
import { Pin, Download, RefreshCw, Palette, Camera, Scissors, Utensils, Home, Map, Smartphone } from 'lucide-react';
import { generateImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const STYLES = [
  { 
    id: 'aesthetic', 
    label: 'Aesthetic', 
    icon: Palette,
    promptSuffix: 'soft pastel colors, cozy aesthetic, warm lighting, pinterest style, high quality, minimalistic composition' 
  },
  { 
    id: 'diy', 
    label: 'DIY & Craft', 
    icon: Scissors,
    promptSuffix: 'diy craft tutorial style, overhead shot, organized workspace, bright lighting, sharp focus, creative' 
  },
  { 
    id: 'fashion', 
    label: 'Fashion', 
    icon: Camera,
    promptSuffix: 'ootd, street style photography, trendy outfit, full body shot, fashion influencer aesthetic, high resolution' 
  },
  { 
    id: 'food', 
    label: 'Food', 
    icon: Utensils,
    promptSuffix: 'gourmet food photography, delicious plating, macro depth of field, appetizing, vibrant colors, recipe blog style' 
  },
  { 
    id: 'decor', 
    label: 'Home Decor', 
    icon: Home,
    promptSuffix: 'interior design photography, modern home decor, natural light, wide angle, stylish furniture, cozy atmosphere' 
  },
  { 
    id: 'travel', 
    label: 'Travel', 
    icon: Map,
    promptSuffix: 'scenic travel photography, wanderlust, vibrant landscapes, golden hour, breathtaking view, adventure' 
  }
];

const RATIOS = [
  { id: '3:4', label: 'Standard (3:4)', desc: 'Best for Feed' },
  { id: '9:16', label: 'Mobile (9:16)', desc: 'Best for Stories' }
];

const PinterestTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState(STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState('3:4');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const selectedStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus('loading');
    try {
      const finalPrompt = `Pinterest image of ${prompt}. ${selectedStyle.promptSuffix}`;
      const img = await generateImageWithGemini(finalPrompt, aspectRatio);
      setResultImage(img);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    const watermarked = await addWatermarkToImage(resultImage);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `nano-pin-${selectedStyle.id}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Pin className="w-8 h-8 text-red-500" />
          Nano Pinterest
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Generate viral-worthy, vertical images tailored for Pinterest.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Controls */}
        <div className="space-y-6">
          
          {/* Style Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Select Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all text-center h-24 ${
                    selectedStyleId === style.id 
                      ? 'bg-red-600/20 border-red-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <style.icon className={`w-6 h-6 ${selectedStyleId === style.id ? 'text-red-400' : ''}`} />
                  <span className="text-xs font-medium">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ratio Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-3">
              {RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between px-4 transition-all ${
                    aspectRatio === ratio.id 
                      ? 'bg-red-600/20 border-red-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                     <div className={`border-2 border-current rounded-sm ${ratio.id === '3:4' ? 'w-3 h-4' : 'w-3 h-5'}`}></div>
                     <span className="font-medium text-sm">{ratio.label}</span>
                  </div>
                  <span className="text-xs opacity-60">{ratio.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Describe your pin</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g., A cozy reading nook with fairy lights...`}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt || status === 'loading'}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20"
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Pin />}
            Generate Pin
          </button>
        </div>

        {/* Preview & Download */}
        <div className="space-y-4">
          <div className={`
             relative bg-slate-900 rounded-2xl border border-slate-700 flex flex-col items-center justify-center overflow-hidden group transition-all mx-auto
             ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm' : 'aspect-[3/4] max-w-md'}
          `}>
            {status === 'loading' ? (
               <div className="text-center space-y-4 px-6">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-red-400 text-sm animate-pulse">Creating {selectedStyle.label} pin...</p>
              </div>
            ) : resultImage ? (
              <>
                <img src={resultImage} alt="Generated Pin" className="w-full h-full object-cover" />
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
                  <Smartphone className="w-10 h-10 opacity-20" />
                </div>
                <p>Select a style and ratio to generate perfect pins.</p>
              </div>
            )}
          </div>

          {/* Persistent Download Button */}
          {resultImage && (
            <button 
              onClick={handleDownload}
              className="w-full max-w-md mx-auto bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-500 shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download Pin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PinterestTool;
