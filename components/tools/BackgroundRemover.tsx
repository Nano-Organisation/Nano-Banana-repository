
import React, { useState, useRef } from 'react';
import { Upload, Eraser, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { editImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const BackgroundRemover: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setResultImage(null);
        setStatus('idle');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = async () => {
    if (!originalImage) return;

    setStatus('loading');
    try {
      // Prompt specifically tuned for background removal/replacement
      const prompt = "Remove the background completely and replace it with a clean, solid white background. Keep the main subject sharp and isolated.";
      const editedImage = await editImageWithGemini(originalImage, prompt);
      setResultImage(editedImage);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    const watermarked = await addWatermarkToImage(resultImage);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `ai-remove-result.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Eraser className="w-8 h-8 text-rose-500" />
          AI Remove
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Isolate your subject with AI-powered background removal.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash-image
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
           <div 
            className={`
              relative aspect-square rounded-2xl border-2 border-dashed 
              flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
              ${originalImage ? 'border-slate-700 bg-slate-900' : 'border-slate-700 hover:border-rose-500 hover:bg-slate-800'}
            `}
            onClick={() => !originalImage && fileInputRef.current?.click()}
          >
            {originalImage ? (
              <>
                <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOriginalImage(null);
                    setResultImage(null);
                    if(fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-300">Upload Image</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>

          <button
            onClick={handleRemove}
            disabled={!originalImage || status === 'loading'}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/20"
          >
            {status === 'loading' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Eraser className="w-4 h-4" />
            )}
            Remove Background
          </button>
        </div>

        {/* Output */}
        <div className="relative aspect-square rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center overflow-hidden">
          {status === 'loading' ? (
            <div className="text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-rose-500 font-medium">Isolating subject...</p>
            </div>
          ) : resultImage ? (
            <>
              <img src={resultImage} alt="No Background" className="w-full h-full object-contain bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] bg-slate-800" />
              <button 
                onClick={handleDownload}
                className="absolute bottom-4 right-4 bg-slate-950/80 hover:bg-black text-white px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 font-medium border border-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Save
              </button>
            </>
          ) : (
            <div className="text-center p-6 text-slate-600 space-y-2">
              <ImageIcon className="w-12 h-12 mx-auto opacity-20" />
              <p>Result will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemover;
