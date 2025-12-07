
import React, { useState } from 'react';
import { DollarSign, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { analyzeWealthPath } from '../../services/geminiService';
import { WealthAnalysis } from '../../types';

const WealthCalculator: React.FC = () => {
  const [name, setName] = useState('');
  const [data, setData] = useState<WealthAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const result = await analyzeWealthPath(name);
      setData(result);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <DollarSign className="w-8 h-8 text-green-500" />
          Wealth Path
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Analyze how the rich got rich, and what you can learn.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-4">
         <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Elon Musk, Oprah Winfrey, Jeff Bezos"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
         />
         <button
            onClick={handleAnalyze}
            disabled={!name.trim() || loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
         >
            {loading ? <RefreshCw className="animate-spin" /> : <TrendingUp />}
            Analyze Path
         </button>
      </div>

      {loading && (
         <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-green-500 font-bold">Researching financial history...</p>
         </div>
      )}

      {data && (
         <div className="space-y-6 animate-fade-in-up">
            {/* Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
               <h3 className="text-3xl font-bold text-white">{data.personName}</h3>
               <div className="inline-block bg-green-900/30 text-green-400 px-4 py-1 rounded-full text-sm font-bold border border-green-500/30">
                  Est. Net Worth: {data.estimatedNetWorth}
               </div>
            </div>

            {/* Privilege Check */}
            <div className={`p-6 rounded-2xl border ${
               data.originStart === 'Wealthy' || data.originStart === 'Upper Middle Class' 
               ? 'bg-amber-900/10 border-amber-500/30' 
               : 'bg-slate-800 border-slate-700'
            }`}>
               <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  {data.originStart === 'Wealthy' ? <AlertTriangle className="text-amber-500" /> : <CheckCircle className="text-slate-400" />}
                  Origin: {data.originStart}
               </h4>
               <p className="text-slate-300 leading-relaxed">{data.privilegeAnalysis}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Key Success Factors</h4>
                  <ul className="space-y-3">
                     {data.keySuccessFactors.map((factor, i) => (
                        <li key={i} className="flex gap-3 text-slate-300 text-sm">
                           <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                           {factor}
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Actionable Steps for You</h4>
                  <ul className="space-y-3">
                     {data.actionableSteps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-slate-300 text-sm">
                           <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0" />
                           {step}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl">
               <h4 className="text-blue-400 font-bold mb-2">Reality Check</h4>
               <p className="text-blue-100 text-sm">{data.realityCheck}</p>
            </div>
         </div>
      )}
    </div>
  );
};

export default WealthCalculator;
