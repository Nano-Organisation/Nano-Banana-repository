
import React, { useState, useEffect } from 'react';
import { Palette, Download, RefreshCw, Lock, Star } from 'lucide-react';
import { generateImageWithGemini, generateProImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  
  // Pro Settings
  const [isPro, setIsPro] = useState(false);
  const [size, setSize] = useState('1K');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

  const getAIStudio = () => (window as any).aistudio;

  const checkKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      const selected = await aiStudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
        setHasKey(true);
    }
  };

  const handleSelectKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      await aiStudio.openSelectKey();
      await checkKey();
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus('loading');
    setResultImage(null);

    try {
      if (isPro) {
        // Enforce key check for Pro
        if (!(await getAIStudio()?.hasSelectedApiKey())) {
           setStatus('error');
           alert("Please select a paid API key to use Nano Banana Pro.");
           handleSelectKey();
           setStatus('idle');
           return;
        }
        const img = await generateProImageWithGemini(prompt, size);
        setResultImage(img);
      } else {
        const img = await generateImageWithGemini(prompt);
        setResultImage(img);
      }
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">Nano Create</h2>
        <p className="text-slate-400">Generate stunning visuals from text descriptions.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800">
             <div className="flex gap-2">
                <button
                   onClick={() => setIsPro(false)}
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${!isPro ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                   Standard
                </button>
                <button
                   onClick={() => setIsPro(true)}
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1 ${isPro ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                   <Star className="w-3 h-3 fill-white" /> Pro
                </button>
             </div>
             {isPro && (
                <select 
                   value={size}
                   onChange={(e) => setSize(e.target.value)}
                   className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 outline-none"
                >
                   <option value="1K">1K</option>
                   <option value="2K">2K</option>
                   <option value="4K">4K</option>
                </select>
             )}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isPro ? "A highly detailed photorealistic masterpiece..." : "A futuristic city on Mars..."}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 h-48 resize-none"
          />
          
          <button
            onClick={handleGenerate}
            disabled={!prompt || status === 'loading'}
            className={`w-full text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg 
                ${isPro ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-orange-900/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/20'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Palette />}
            {isPro ? 'Generate Pro Artwork' : 'Generate Artwork'}
          </button>

          {isPro && !hasKey && (
             <div className="text-xs text-center text-amber-500 flex items-center justify-center gap-1 cursor-pointer hover:underline" onClick={handleSelectKey}>
                <Lock className="w-3 h-3" /> Paid API Key required for Pro
             </div>
          )}
        </div>

        <div className="flex-1 aspect-square bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex items-center justify-center relative group">
          {status === 'loading' ? (
             <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-purple-400 text-sm animate-pulse">Dreaming up pixels...</p>
            </div>
          ) : resultImage ? (
            <>
              <img src={resultImage} alt="Generated" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <a 
                  href={resultImage} 
                  download="nano-create-art.png"
                  className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
              </div>
            </>
          ) : (
            <div className="text-slate-600 flex flex-col items-center">
              <Palette className="w-16 h-16 opacity-20 mb-4" />
              <p>Art canvas ready</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
