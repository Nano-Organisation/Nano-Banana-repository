import React, { useState } from 'react';
import { Lightbulb, RefreshCw, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { generateRiddleContent } from '../../services/geminiService';
import { LoadingState, RiddleData } from '../../types';

const RiddleGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [riddleData, setRiddleData] = useState<RiddleData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [showAnswer, setShowAnswer] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setRiddleData(null);
    setShowAnswer(false);
    try {
      const data = await generateRiddleContent(topic);
      setRiddleData(data);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleCopy = () => {
    if (!riddleData) return;
    const text = `RIDDLE:\n${riddleData.riddle}\n\nANSWER:\n${riddleData.answer}\n(${riddleData.explanation})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Lightbulb className="w-8 h-8 text-amber-400" />
          Nano Riddle
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate clever riddles on any subject.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              /* Fix: Updated label to match the actual model used (gemini-3-flash-preview). */
              Model: gemini-3-flash-preview
           </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
         {/* Input */}
         <div className="flex flex-col sm:flex-row gap-4">
            <input
               value={topic}
               onChange={(e) => setTopic(e.target.value)}
               placeholder="Enter a topic (e.g. The Moon, Time, Silence...)"
               className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
               onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
               onClick={handleGenerate}
               disabled={!topic.trim() || status === 'loading'}
               className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Lightbulb />}
               Generate
            </button>
         </div>

         {/* Output */}
         <div className="min-h-[300px] flex items-center justify-center">
            {status === 'loading' ? (
               <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-amber-500 animate-pulse">Crafting a mystery...</p>
               </div>
            ) : riddleData ? (
               <div className="w-full space-y-8 text-center animate-fade-in-up">
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">The Riddle</h3>
                     <p className="text-2xl md:text-3xl font-serif text-white leading-relaxed italic max-w-2xl mx-auto">
                        "{riddleData.riddle}"
                     </p>
                  </div>

                  <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 inline-block w-full max-w-md mx-auto relative overflow-hidden group">
                     {showAnswer ? (
                        <div className="space-y-2 animate-fade-in">
                           <h4 className="text-xl font-bold text-amber-400">{riddleData.answer}</h4>
                           <p className="text-sm text-slate-400">{riddleData.explanation}</p>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full space-y-2 py-4">
                           <p className="text-slate-500 font-bold">Answer Hidden</p>
                           <button 
                              onClick={() => setShowAnswer(true)}
                              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                           >
                              Reveal Answer
                           </button>
                        </div>
                     )}
                     <div className="absolute top-2 right-2">
                        <button onClick={() => setShowAnswer(!showAnswer)} className="text-slate-600 hover:text-white p-1">
                           {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                     </div>
                  </div>

                  <div>
                     <button 
                        onClick={handleCopy}
                        className="text-slate-400 hover:text-white flex items-center gap-2 mx-auto text-sm font-medium transition-colors"
                     >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        Copy Riddle & Answer
                     </button>
                  </div>
               </div>
            ) : (
               <div className="text-slate-600 text-center">
                  <p>Your generated riddle will appear here.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default RiddleGenerator;