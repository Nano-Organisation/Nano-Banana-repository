
import React, { useState, useRef } from 'react';
import { Upload, Wand2, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { editImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const ImageEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
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

  const handleEdit = async () => {
    if (!originalImage || !prompt.trim()) return;

    setStatus('loading');
    try {
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
    link.download = `nano-edit-result.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Nano Edit</h2>
        <p className="text-slate-600 dark:text-slate-400">Modify images with natural language using Gemini 2.5 Flash Image.</p>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Input Section */}
        <div className="space-y-4">
          <div 
            className={`
              relative aspect-square rounded-2xl border-2 border-dashed 
              flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
              ${originalImage ? 'border-slate-700 bg-slate-900' : 'border-slate-700 hover:border-amber-500 hover:bg-slate-800'}
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
                <p className="font-medium text-slate-300">Upload an image</p>
                <p className="text-sm text-slate-500">PNG, JPG up to 5MB</p>
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

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how to edit this image (e.g., 'Make it look like a vintage postcard' or 'Add a neon glow')"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none h-32"
            />
            <button
              onClick={handleEdit}
              disabled={!originalImage || !prompt || status === 'loading'}
              className="absolute bottom-4 right-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              {status === 'loading' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Generate
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="relative aspect-square rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center overflow-hidden">
          {status === 'loading' ? (
            <div className="text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-amber-500 font-medium">Gemini is reimagining your image...</p>
            </div>
          ) : resultImage ? (
            <>
              <img src={resultImage} alt="Edited result" className="w-full h-full object-contain" />
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
              <p>Your creation will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
