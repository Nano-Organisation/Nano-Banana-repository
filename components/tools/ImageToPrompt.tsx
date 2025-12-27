import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, RefreshCw, Copy, Check, Scan, Eye } from 'lucide-react';
import { generateImagePrompt } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const PLATFORMS = ['Description', 'Midjourney', 'Stable Diffusion', 'DALL-E 3'];

const ImageToPrompt: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [platform, setPlatform] = useState<any>(PLATFORMS[0]);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await runFileSecurityChecks(file, 'image');
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
          setOutput('');
          setStatus('idle');
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        alert(err.message);
        e.target.value = '';
      }
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    setStatus('loading');
    try {
      const result = await generateImagePrompt(image, platform);
      setOutput(result);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Scan className="w-8 h-8 text-fuchsia-500" />
          Nano Vision
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Convert images into text descriptions or AI prompts.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {/* Updated label to match the actual model used (gemini-3-flash-preview). */}
              Model: gemini-3-flash-preview
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div 
            onClick={() => fileRef.current?.click()}
            className={`
              aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all
              ${image ? 'border-fuchsia-500 bg-slate-900' : 'border-slate-700 hover:border-fuchsia-500 hover:bg-slate-800'}
            `}
          >
            {image ? (
              <>
                <img src={image} alt="Target" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                   <div className="flex flex-col items-center text-white">
                      <RefreshCw className="w-8 h-8 mb-2" />
                      <span className="font-bold">Change Image</span>
                   </div>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-medium text-slate-300">Upload Image</p>
                <p className="text-xs text-slate-500">JPG, PNG</p>
              </div>
            )}
            <input type="file" ref={fileRef} className="hidden" onChange={handleUpload} accept="image/*" />
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Output Format</label>
             <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                   <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                         platform === p 
                         ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white' 
                         : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                   >
                      {p}
                   </button>
                ))}
             </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={!image || status === 'loading'}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-900/20"
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Eye />}
            Generate Text
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col relative">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
               <ImageIcon className="w-5 h-5 text-fuchsia-500" />
               Generated Result
            </h3>
            {output && (
               <button 
                 onClick={handleCopy} 
                 className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
               >
                 {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                 Copy
               </button>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {status === 'loading' ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                 <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-fuchsia-400 animate-pulse">Analyzing visual data...</p>
              </div>
            ) : output ? (
              <div className="prose prose-invert prose-sm max-w-none">
                 <p className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-sm">{output}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                 <Scan className="w-16 h-16 opacity-20 mb-4" />
                 <p>Upload an image to extract text or prompts.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToPrompt;