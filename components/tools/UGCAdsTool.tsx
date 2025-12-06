
import React, { useState } from 'react';
import { Video, RefreshCw, Copy, Check, Target, Clock, FileText, PlayCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { generateUGCScript } from '../../services/geminiService';
import { LoadingState, UGCScript } from '../../types';

const UGCAdsTool: React.FC = () => {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [script, setScript] = useState<UGCScript | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleGenerate = async () => {
    if (!product.trim() || !painPoint.trim()) return;
    setStatus('loading');
    setScript(null);
    setFeedback(null);
    try {
      const result = await generateUGCScript(product, audience, painPoint);
      setScript(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleCopy = () => {
    if (!script) return;
    const text = script.sections.map(s => `[${s.section} - ${s.duration}]\nVISUAL: ${s.visual}\nAUDIO: ${s.audio}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFeedback = (type: 'up' | 'down') => {
    if (feedback === type) setFeedback(null);
    else setFeedback(type);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Video className="w-8 h-8 text-pink-500" />
          Nano UGC
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate high-converting video scripts for TikTok & Reels.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
              <input 
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. GlowUp Serum"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Target Audience</label>
              <input 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Busy moms, College students"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Main Pain Point</label>
              <textarea 
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
                placeholder="e.g. Tired looking skin, no time for skincare routine..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 h-24 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!product || !painPoint || status === 'loading'}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-900/20"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin" /> : <PlayCircle />}
              Write Script
            </button>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="lg:col-span-2 space-y-6">
          {!script && status !== 'loading' && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 min-h-[400px]">
                <FileText className="w-16 h-16 opacity-20 mb-4" />
                <p>Enter product details to generate a script.</p>
             </div>
          )}

          {status === 'loading' && (
             <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[400px]">
                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-pink-400 font-bold animate-pulse">Structuring viral hook...</p>
             </div>
          )}

          {script && (
            <div className="space-y-6 animate-fade-in-up">
               {/* Script Header */}
               <div className="flex justify-between items-start bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <div>
                     <h3 className="text-2xl font-bold text-white mb-1">{script.title}</h3>
                     <div className="flex gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {script.targetAudience}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {script.totalDuration}</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                        <button 
                           onClick={() => toggleFeedback('up')} 
                           className={`p-1.5 rounded hover:bg-slate-900 transition-colors ${feedback === 'up' ? 'text-green-500' : 'text-slate-500'}`}
                        >
                           <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px bg-slate-800 mx-0.5"></div>
                        <button 
                           onClick={() => toggleFeedback('down')} 
                           className={`p-1.5 rounded hover:bg-slate-900 transition-colors ${feedback === 'down' ? 'text-red-500' : 'text-slate-500'}`}
                        >
                           <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                     </div>
                     <button 
                        onClick={handleCopy} 
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
                     >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        Copy Script
                     </button>
                  </div>
               </div>

               {/* Script Table */}
               <div className="space-y-4">
                  {script.sections.map((section, idx) => (
                     <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                           <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">{section.section}</span>
                           <span className="text-xs font-mono text-slate-500">{section.duration}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                           <div className="p-4 border-b md:border-b-0 md:border-r border-slate-800">
                              <span className="text-xs font-bold text-slate-500 block mb-2">VISUAL</span>
                              <p className="text-sm text-slate-300 italic">{section.visual}</p>
                           </div>
                           <div className="p-4 bg-slate-900/50">
                              <span className="text-xs font-bold text-slate-500 block mb-2">AUDIO / SCRIPT</span>
                              <p className="text-sm text-white font-medium">{section.audio}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UGCAdsTool;
