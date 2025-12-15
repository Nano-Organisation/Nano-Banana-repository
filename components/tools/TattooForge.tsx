
import React, { useState } from 'react';
import { PenTool, Download, RefreshCw, Layers } from 'lucide-react';
import { generateImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const STYLES = ['Fine Line', 'Tribal', 'Traditional', 'Watercolor', 'Geometric', 'Blackwork', 'Dotwork'];

const TattooForge: React.FC = () => {
  const [concept, setConcept] = useState('');
  const [style, setStyle] = useState(STYLES[0]);
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setStatus('loading');
    setImage(null);
    try {
      const prompt = `Tattoo design stencil of ${concept}. Style: ${style}. High contrast black ink on white background. Clean lines, professional tattoo flash art.`;
      const result = await generateImageWithGemini(prompt, '1:1');
      setImage(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!image) return;
    const watermarked = await addWatermarkToImage(image);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `tattoo-forge-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <PenTool className="w-8 h-8 text-slate-800 dark:text-slate-200" />
          Tattoo Forge
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Design your next ink with AI precision.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Concept</label>
              <textarea 
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. A wolf howling at the moon with geometric shapes..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-slate-500 h-32 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Style</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {STYLES.map(s => (
                  <button 
                    key={s} 
                    onClick={() => setStyle(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${style === s ? 'bg-white text-black' : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!concept.trim() || status === 'loading'}
              className="w-full bg-slate-100 hover:bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Layers />}
              Generate Stencil
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          {status === 'loading' ? (
             <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400 animate-pulse">Inking design...</p>
             </div>
          ) : image ? (
             <div className="space-y-4 w-full">
                <div className="bg-white p-4 rounded-xl shadow-xl transform rotate-1 transition-transform hover:rotate-0">
                   <img src={image} alt="Tattoo Design" className="w-full h-auto rounded-lg" />
                </div>
                <button 
                   onClick={handleDownload}
                   className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                   <Download className="w-4 h-4" /> Download Design
                </button>
             </div>
          ) : (
             <div className="text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 w-full h-full flex flex-col items-center justify-center">
                <PenTool className="w-16 h-16 opacity-20 mb-4" />
                <p>Enter a concept to forge a design.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TattooForge;
