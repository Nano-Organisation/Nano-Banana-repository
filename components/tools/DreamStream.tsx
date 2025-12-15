
import React, { useState } from 'react';
import { Cloud, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { analyzeDream, generateImageWithGemini } from '../../services/geminiService';
import { LoadingState, DreamAnalysis } from '../../types';

const DreamStream: React.FC = () => {
  const [dreamText, setDreamText] = useState('');
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(null);
  const [visualUrl, setVisualUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleInterpret = async () => {
    if (!dreamText.trim()) return;
    setStatus('loading');
    setAnalysis(null);
    setVisualUrl(null);

    try {
      const result = await analyzeDream(dreamText);
      setAnalysis(result);
      
      const img = await generateImageWithGemini(result.visualPrompt + " Surrealist dreamscape art style, ethereal, misty, detailed.", '16:9');
      setVisualUrl(img);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Cloud className="w-8 h-8 text-purple-400" />
          Dream Stream
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Unlock the hidden meaning of your dreams.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-6">
         <div className="flex-1 space-y-4">
            <textarea 
               value={dreamText}
               onChange={(e) => setDreamText(e.target.value)}
               placeholder="I was flying over a city made of glass..."
               className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-purple-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 h-40 resize-none custom-scrollbar"
            />
            <button
               onClick={handleInterpret}
               disabled={!dreamText.trim() || status === 'loading'}
               className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Sparkles />}
               Interpret Dream
            </button>
         </div>

         {status === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
               <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-purple-400 animate-pulse">Consulting the subconscious...</p>
            </div>
         )}

         {analysis && (
            <div className="flex-1 space-y-6 animate-fade-in">
               <div className="space-y-2">
                  <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                     <Eye className="w-4 h-4" /> Meaning
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{analysis.interpretation}</p>
               </div>
               
               {visualUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative group">
                     <img src={visualUrl} alt="Dream Visualization" className="w-full h-auto" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                        <p className="text-xs text-white/70 italic line-clamp-2">{analysis.visualPrompt}</p>
                     </div>
                  </div>
               )}

               <div className="flex flex-wrap gap-2">
                  {analysis.symbols.map((sym, i) => (
                     <span key={i} className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-xs text-purple-300">
                        {sym}
                     </span>
                  ))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default DreamStream;
