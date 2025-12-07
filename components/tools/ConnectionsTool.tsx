
import React, { useState } from 'react';
import { Network, RefreshCw, Search } from 'lucide-react';
import { generateConnectionFact } from '../../services/geminiService';

const ConnectionsTool: React.FC = () => {
  const [person, setPerson] = useState('');
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setFact('');
    try {
      const res = await generateConnectionFact(person);
      setFact(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in text-center py-12">
       <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
             <Network className="w-10 h-10 text-violet-500" />
             Did You Know?
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Discover surprising connections between famous people.</p>
       </div>

       <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex gap-4">
             <input 
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="Enter a famous person (Optional)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
             />
             <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
             >
                {loading ? <RefreshCw className="animate-spin" /> : <Search />}
             </button>
          </div>

          <div className="min-h-[150px] flex items-center justify-center">
             {loading ? (
                <div className="flex flex-col items-center gap-2">
                   <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-violet-400 font-medium">Connecting the dots...</p>
                </div>
             ) : fact ? (
                <div className="text-left bg-slate-950 p-6 rounded-xl border border-slate-800 w-full">
                   <p className="text-lg text-slate-300 leading-relaxed">
                      {fact}
                   </p>
                </div>
             ) : (
                <p className="text-slate-500">Enter a name or just click search for a random fact!</p>
             )}
          </div>
       </div>
    </div>
  );
};

export default ConnectionsTool;
