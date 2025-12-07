
import React, { useState } from 'react';
import { BookOpen, Mic, Play, RefreshCw, FileText } from 'lucide-react';
import { generateLearnerBrief, generateSpeechWithGemini } from '../../services/geminiService';
import { LoadingState, LearnerBrief } from '../../types';

const LearnerTool: React.FC = () => {
  const [text, setText] = useState('');
  const [data, setData] = useState<LearnerBrief | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [audioStatus, setAudioStatus] = useState<LoadingState>('idle');

  const handleProcess = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    setData(null);
    setAudioUrl(null);
    try {
      const result = await generateLearnerBrief(text);
      setData(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handlePlayAudio = async () => {
    if (!data?.podcastScript) return;
    setAudioStatus('loading');
    try {
      // Using 'Zephyr' for a calm, educational voice
      const url = await generateSpeechWithGemini(data.podcastScript, 'Zephyr', 1.0, 0);
      setAudioUrl(url);
      setAudioStatus('success');
    } catch (e) {
      console.error(e);
      setAudioStatus('error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-500" />
          AI Learner
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Summarize papers and convert them into audio lessons.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUT */}
        <div className="space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <label className="text-sm font-bold text-slate-500 uppercase">Paste Text or Paper Content</label>
              <textarea 
                 value={text}
                 onChange={(e) => setText(e.target.value)}
                 placeholder="Paste the abstract or full text of the research paper here..."
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-96 resize-none custom-scrollbar"
              />
              <button
                 onClick={handleProcess}
                 disabled={!text.trim() || status === 'loading'}
                 className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
              >
                 {status === 'loading' ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
                 Analyze & Create Podcast
              </button>
           </div>
        </div>

        {/* OUTPUT */}
        <div className="space-y-6">
           {status === 'loading' && (
              <div className="h-full flex flex-col items-center justify-center space-y-4 bg-slate-900 border border-slate-800 rounded-2xl min-h-[400px]">
                 <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-emerald-400 font-bold animate-pulse">Reading and Scripting...</p>
              </div>
           )}

           {!data && status !== 'loading' && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl p-12 min-h-[400px]">
                 <FileText className="w-16 h-16 opacity-20 mb-4" />
                 <p>Paste text to generate your learning brief.</p>
              </div>
           )}

           {data && (
              <div className="space-y-6 animate-fade-in-up">
                 {/* Summary Card */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                       <FileText className="w-5 h-5 text-emerald-500" /> Key Takeaways
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                       {data.summary}
                    </div>
                 </div>

                 {/* Podcast Card */}
                 <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                       <Mic className="w-5 h-5 text-emerald-500" /> Audio Lesson
                    </h3>
                    
                    {!audioUrl ? (
                       <button 
                          onClick={handlePlayAudio}
                          disabled={audioStatus === 'loading'}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors border border-slate-700"
                       >
                          {audioStatus === 'loading' ? <RefreshCw className="animate-spin" /> : <Play className="fill-current" />}
                          Generate Audio
                       </button>
                    ) : (
                       <div className="space-y-4">
                          <audio controls src={audioUrl} className="w-full" autoPlay />
                          <div className="p-4 bg-black/30 rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                             <p className="text-xs font-mono text-slate-500 uppercase mb-2">Script Preview</p>
                             <p className="text-sm text-slate-400">{data.podcastScript}</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LearnerTool;
