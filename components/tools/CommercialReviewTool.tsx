
import React, { useState, useRef } from 'react';
import { Briefcase, RefreshCw, TrendingUp, AlertTriangle, Target, DollarSign, Upload } from 'lucide-react';
import { analyzePaperCommercial } from '../../services/geminiService';
import { LoadingState, CommercialAnalysis } from '../../types';
import { extractTextFromPDF } from '../../utils/pdfParser';

const CommercialReviewTool: React.FC = () => {
  const [text, setText] = useState('');
  const [data, setData] = useState<CommercialAnalysis | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [isParsing, setIsParsing] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        alert('Please upload a valid PDF file.');
        return;
    }

    setIsParsing(true);
    try {
        const extracted = await extractTextFromPDF(file);
        setText(extracted);
    } catch (err) {
        console.error(err);
        alert('Failed to read PDF. Please try copying the text manually.');
    }
    setIsParsing(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    setData(null);
    try {
      const result = await analyzePaperCommercial(text);
      setData(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <DollarSign className="w-8 h-8 text-blue-500" />
          AI Commercial Review
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Evaluate research papers for business viability and market fit.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
         <div className="flex justify-between items-center">
             <label className="text-sm font-bold text-slate-500 uppercase">Paper Content</label>
             <button 
                onClick={() => fileRef.current?.click()}
                className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
                disabled={isParsing}
             >
                {isParsing ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3" />}
                {isParsing ? 'Reading...' : 'Upload PDF'}
             </button>
             <input type="file" ref={fileRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
         </div>

         <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste research paper abstract, upload PDF, or enter text here..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none"
         />
         <button
            onClick={handleAnalyze}
            disabled={!text.trim() || status === 'loading'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
         >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <TrendingUp />}
            Analyze Commercial Viability
         </button>
      </div>

      {status === 'loading' && (
         <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-500 font-bold">Consulting the market...</p>
         </div>
      )}

      {data && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            
            {/* Header / Pitch */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg">
               <h3 className="text-2xl font-bold text-white mb-2">{data.title || "Research Analysis"}</h3>
               <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl mt-4">
                  <span className="text-xs font-bold text-blue-400 uppercase block mb-2">Elevator Pitch</span>
                  <p className="text-blue-100 italic">"{data.elevatorPitch}"</p>
               </div>
            </div>

            {/* Market Potential */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
               <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" /> Market Potential
               </h4>
               <p className="text-slate-300 mb-4">{data.marketPotential}</p>
               
               <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Target Industries</h5>
               <div className="flex flex-wrap gap-2">
                  {data.targetIndustries.map((ind, i) => (
                     <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-700">
                        {ind}
                     </span>
                  ))}
               </div>
            </div>

            {/* Strategies & Hurdles */}
            <div className="space-y-6">
               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Briefcase className="w-5 h-5 text-blue-500" /> Monetization
                  </h4>
                  <ul className="space-y-2">
                     {data.monetizationStrategies.map((strat, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-300">
                           <span className="text-blue-500">•</span> {strat}
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-red-500" /> Commercial Hurdles
                  </h4>
                  <ul className="space-y-2">
                     {data.commercialHurdles.map((hurdle, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-300">
                           <span className="text-red-500">⚠</span> {hurdle}
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CommercialReviewTool;
