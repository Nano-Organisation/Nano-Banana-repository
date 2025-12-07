
import React, { useState } from 'react';
import { Baby, RefreshCw, Star, Globe, BookOpen, Wand2 } from 'lucide-react';
import { generateBabyNames } from '../../services/geminiService';
import { LoadingState, BabyName } from '../../types';

const BabyNameTool: React.FC = () => {
  const [gender, setGender] = useState('Neutral');
  const [style, setStyle] = useState('Modern');
  const [origin, setOrigin] = useState('Global');
  const [names, setNames] = useState<BabyName[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleGenerate = async (invent: boolean) => {
    setStatus('loading');
    setNames([]);
    try {
      const results = await generateBabyNames(gender, style, origin, invent);
      setNames(results);
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
          <Baby className="w-8 h-8 text-pink-400" />
          AI Names
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Discover names with deep history or invent entirely new ones.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Gender</label>
               <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
               >
                  <option>Neutral</option>
                  <option>Female</option>
                  <option>Male</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Style</label>
               <select 
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
               >
                  <option>Modern</option>
                  <option>Traditional</option>
                  <option>Unique</option>
                  <option>Nature-inspired</option>
                  <option>Vintage</option>
                  <option>Royal</option>
               </select>
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Origin / Sound</label>
               <input 
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Celtic, Sci-Fi, Soft vowels"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
               />
            </div>
         </div>

         <div className="flex gap-4">
            <button
               onClick={() => handleGenerate(false)}
               disabled={status === 'loading'}
               className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Star />}
               Suggest Existing
            </button>
            <button
               onClick={() => handleGenerate(true)}
               disabled={status === 'loading'}
               className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Wand2 />}
               Invent New Name
            </button>
         </div>
      </div>

      {names.length > 0 && (
         <div className="space-y-6 animate-fade-in-up">
            {names.map((n, i) => (
               <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md hover:border-pink-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-2xl font-bold text-white">{n.name}</h3>
                     <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">{n.gender} • {n.origin}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                     <div>
                        <div className="flex items-center gap-2 text-pink-400 font-bold mb-1">
                           <BookOpen className="w-4 h-4" /> Meaning
                        </div>
                        <p className="text-slate-300">{n.meaning}</p>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                           <Globe className="w-4 h-4" /> Lineage / History
                        </div>
                        <p className="text-slate-300">{n.lineage}</p>
                     </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800">
                     <p className="text-xs text-slate-500 italic">Why: {n.reason}</p>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default BabyNameTool;
