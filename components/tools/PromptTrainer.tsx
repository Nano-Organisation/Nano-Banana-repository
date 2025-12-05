
import React, { useState } from 'react';
import { Brain, Zap, CheckCircle, AlertTriangle, ArrowRight, RefreshCw, ClipboardCheck } from 'lucide-react';
import { analyzePrompt } from '../../services/geminiService';
import { LoadingState, PromptAnalysis } from '../../types';

const PLATFORMS = [
  { id: 'Google Gemini', label: 'Google Gemini', color: 'blue' },
  { id: 'OpenAI ChatGPT', label: 'OpenAI ChatGPT', color: 'green' },
  { id: 'Anthropic Claude', label: 'Anthropic Claude', color: 'orange' },
  { id: 'Microsoft Copilot', label: 'Microsoft Copilot', color: 'cyan' },
  { id: 'Perplexity', label: 'Perplexity', color: 'teal' },
  { id: 'Midjourney', label: 'Midjourney (Image)', color: 'purple' }
];

const PromptTrainer: React.FC = () => {
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0].id);
  const [result, setResult] = useState<PromptAnalysis | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setStatus('loading');
    setResult(null);
    try {
      const analysis = await analyzePrompt(input, platform);
      setResult(analysis);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleRewrite = () => {
    if (result?.suggestion) {
      setInput(result.suggestion);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500 border-green-500';
    if (score >= 70) return 'text-yellow-500 border-yellow-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-pink-500" />
          Nano Prompt Trainer
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Master the art of prompting for any AI model.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* INPUT SECTION */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Target Platform</label>
              <select 
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              >
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Prompt</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter the prompt you want to test..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 h-64 resize-none text-sm leading-relaxed"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!input.trim() || status === 'loading'}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-900/20"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Zap />}
              Analyze Prompt
            </button>
          </div>
        </div>

        {/* OUTPUT SECTION */}
        <div className="space-y-6">
          {!result && status !== 'loading' && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 min-h-[400px]">
                <Brain className="w-16 h-16 opacity-20 mb-4" />
                <p>Enter a prompt to get expert feedback.</p>
             </div>
          )}

          {status === 'loading' && (
             <div className="h-full flex flex-col items-center justify-center space-y-4 bg-slate-900 rounded-2xl border border-slate-800 min-h-[400px]">
                <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-pink-500 font-bold animate-pulse">Reviewing against {platform} best practices...</p>
             </div>
          )}

          {result && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6 animate-fade-in-up">
              
              {/* Score Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                 <div>
                    <h3 className="text-xl font-bold text-white">Analysis Result</h3>
                    <p className="text-sm text-slate-400">Target: {platform}</p>
                 </div>
                 <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}
                 </div>
              </div>

              {/* Feedback Lists */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <h4 className="text-sm font-bold text-green-400 uppercase flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Strengths</h4>
                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                       {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-sm font-bold text-red-400 uppercase flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Weaknesses</h4>
                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                       {result.weaknesses.length > 0 ? result.weaknesses.map((w, i) => <li key={i}>{w}</li>) : <li className="text-slate-500 italic">None detected</li>}
                    </ul>
                 </div>
              </div>

              {/* Platform Advice */}
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                 <h4 className="text-blue-400 text-xs font-bold uppercase mb-1">Platform Insight</h4>
                 <p className="text-sm text-blue-100">{result.platformAdvice}</p>
              </div>

              {/* Improvement Section */}
              {!result.isOptimal && (
                 <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="space-y-2">
                       <h4 className="text-sm font-bold text-purple-400 uppercase flex items-center gap-2">
                          <Zap className="w-4 h-4" /> Suggested Improvement
                       </h4>
                       <div className="text-slate-300 text-sm italic bg-slate-900 p-3 rounded-lg border border-slate-800">
                          "{result.suggestion}"
                       </div>
                    </div>
                    
                    <div className="space-y-1">
                       <h4 className="text-xs font-bold text-slate-500 uppercase">Why this is better</h4>
                       <p className="text-sm text-slate-400">{result.reasoning}</p>
                    </div>

                    <button 
                      onClick={handleRewrite}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                       <ClipboardCheck className="w-4 h-4" />
                       Rewrite My Prompt
                    </button>
                 </div>
              )}

              {result.isOptimal && (
                 <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl text-center">
                    <h4 className="text-green-400 font-bold text-lg mb-2">Excellent Prompt!</h4>
                    <p className="text-green-100 text-sm">
                       This prompt is already highly optimized for {platform}. No rewrite needed.
                    </p>
                 </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptTrainer;
