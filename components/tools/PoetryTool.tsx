
import React, { useState } from 'react';
import { Feather, RefreshCw, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { generatePoem } from '../../services/geminiService';
import { LoadingState } from '../../types';

const STYLES = [
  'Rhyming Couplets',
  'Haiku',
  'Limerick',
  'Sonnet',
  'Free Verse',
  'Acrostic',
  'In the style of Shakespeare',
  'In the style of Dr. Seuss',
  'In the style of Emily Dickinson',
  'Rap Lyrics'
];

const PoetryTool: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState(STYLES[0]);
  const [poem, setPoem] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setPoem('');
    setFeedback(null);
    try {
      const result = await generatePoem(topic, style);
      setPoem(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(poem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFeedback = (type: 'up' | 'down') => {
    if (feedback === type) setFeedback(null);
    else setFeedback(type);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Feather className="w-8 h-8 text-fuchsia-500" />
          AI Poetry
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate beautiful poems in any style.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Topic</label>
              <input 
                 value={topic}
                 onChange={(e) => setTopic(e.target.value)}
                 placeholder="e.g. A rainy day in London"
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
           </div>
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Style</label>
              <select 
                 value={style}
                 onChange={(e) => setStyle(e.target.value)}
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              >
                 {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>
        </div>

        <button
           onClick={handleGenerate}
           disabled={!topic.trim() || status === 'loading'}
           className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-fuchsia-900/20 flex items-center justify-center gap-2"
        >
           {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Feather />}
           Write Poem
        </button>
      </div>

      {status === 'loading' && (
         <div className="text-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-fuchsia-500 font-bold animate-pulse">Composing verses...</p>
         </div>
      )}

      {poem && (
         <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl relative animate-fade-in-up">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
                    <button 
                      onClick={() => toggleFeedback('up')} 
                      className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${feedback === 'up' ? 'text-green-500' : 'text-slate-500'}`}
                    >
                       <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px bg-slate-300 dark:bg-slate-800 mx-0.5"></div>
                    <button 
                      onClick={() => toggleFeedback('down')} 
                      className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ${feedback === 'down' ? 'text-red-500' : 'text-slate-500'}`}
                    >
                       <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                 </div>
               <button 
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg transition-colors"
                  title="Copy"
               >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
               </button>
            </div>
            <pre className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-800 dark:text-slate-200 text-center">
               {poem}
            </pre>
         </div>
      )}
    </div>
  );
};

export default PoetryTool;
