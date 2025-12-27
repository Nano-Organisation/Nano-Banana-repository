import React, { useState, useRef } from 'react';
import { Eye, Send, Upload, RefreshCw, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { analyzeImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const VisualQA: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await runFileSecurityChecks(file, 'image');
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
          setAnswer('');
          setStatus('idle');
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        alert(err.message);
        e.target.value = '';
      }
    }
  };

  const handleAsk = async () => {
    if (!image || !question || status === 'loading') return;
    setStatus('loading');
    setFeedback(null);
    try {
      const result = await analyzeImageWithGemini(image, question);
      setAnswer(result);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFeedback = (type: 'up' | 'down') => {
    if (feedback === type) setFeedback(null);
    else setFeedback(type);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">AI Lens</h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Upload an image and ask Gemini anything about it.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {/* Updated label to match the actual model used (gemini-3-flash-preview). */}
              Model: gemini-3-flash-preview
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div 
            onClick={() => fileRef.current?.click()}
            className={`
              aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative
              ${image ? 'border-blue-500' : 'border-slate-700 hover:border-blue-500 hover:bg-slate-800'}
            `}
          >
            {image ? (
              <img src={image} alt="To analyze" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <span className="text-slate-400 text-sm">Upload Image</span>
              </div>
            )}
            <input type="file" ref={fileRef} className="hidden" onChange={handleUpload} accept="image/*" />
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is in this image?"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAsk();
                }
              }}
            />
            <button 
              onClick={handleAsk}
              disabled={!image || !question || status === 'loading'}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-lg"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Eye className="w-5 h-5" />
              <h3 className="font-semibold">Analysis Result</h3>
            </div>
            {answer && (
               <div className="flex items-center gap-3">
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button 
                      onClick={() => toggleFeedback('up')} 
                      className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback === 'up' ? 'text-green-500' : 'text-slate-500'}`}
                    >
                       <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px bg-slate-800 mx-0.5"></div>
                    <button 
                      onClick={() => toggleFeedback('down')} 
                      className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback === 'down' ? 'text-red-500' : 'text-slate-500'}`}
                    >
                       <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                 </div>
                 <button 
                   onClick={handleCopy} 
                   className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
                   title="Copy to clipboard"
                 >
                   {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                 </button>
               </div>
             )}
          </div>
          <div className="text-slate-300 leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar max-h-[500px]">
            {status === 'loading' ? (
              <span className="animate-pulse">Analyzing visual data...</span>
            ) : answer ? (
              answer
            ) : (
              <span className="text-slate-600 italic">The answer will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualQA;