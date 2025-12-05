
import React, { useState, useRef } from 'react';
import { Eye, Send, Upload, RefreshCw, Copy, Check } from 'lucide-react';
import { analyzeImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

const VisualQA: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnswer('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAsk = async () => {
    if (!image || !question || status === 'loading') return;
    setStatus('loading');
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Nano Lens</h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Upload an image and ask Gemini anything about it.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
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
               <button 
                 onClick={handleCopy} 
                 className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700"
                 title="Copy to clipboard"
               >
                 {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
               </button>
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
