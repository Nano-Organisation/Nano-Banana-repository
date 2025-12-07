
import React, { useState } from 'react';
import { Quote, RefreshCw } from 'lucide-react';
import { generateQuote } from '../../services/geminiService';

const CATEGORIES = ['Inspiration', 'Success', 'Love', 'Wisdom', 'Funny', 'Life'];

const QuoteTool: React.FC = () => {
  const [quote, setQuote] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await generateQuote(category);
      setQuote(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in text-center py-12">
       <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
             <Quote className="w-10 h-10 text-cyan-500" />
             AI Quotes
          </h2>
       </div>

       <div className="flex justify-center gap-2 mb-8">
          {CATEGORIES.map(cat => (
             <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                   category === cat 
                   ? 'bg-cyan-600 text-white' 
                   : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
             >
                {cat}
             </button>
          ))}
       </div>

       <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-xl min-h-[200px] flex items-center justify-center relative">
          {loading ? (
             <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
          ) : quote ? (
             <p className="text-xl md:text-2xl font-serif italic text-slate-800 dark:text-slate-200">
                {quote}
             </p>
          ) : (
             <p className="text-slate-400">Click below to find wisdom.</p>
          )}
       </div>

       <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-cyan-900/20 transition-all"
       >
          Inspire Me
       </button>
    </div>
  );
};

export default QuoteTool;
