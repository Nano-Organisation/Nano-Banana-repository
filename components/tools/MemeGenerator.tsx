
import React, { useState, useRef, useEffect } from 'react';
import { Laugh, RefreshCw, Download, Layers } from 'lucide-react';
import { generateMemeConcept, generateImageWithGemini } from '../../services/geminiService';
import { LoadingState, MemeData } from '../../types';
import { drawWatermarkOnCanvas } from '../../utils/watermark';

const MemeGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [memeData, setMemeData] = useState<MemeData | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setMemeData(null);
    setImageBase64(null);

    try {
      // Step 1: Think of the joke
      const concept = await generateMemeConcept(topic);
      setMemeData(concept);

      // Step 2: Generate the base image
      const img = await generateImageWithGemini(concept.visualPrompt, '1:1');
      setImageBase64(img);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  // Draw meme to canvas whenever data changes
  useEffect(() => {
    if (status === 'success' && memeData && imageBase64 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = imageBase64;
      img.onload = () => {
        // Set canvas size
        canvas.width = 1024;
        canvas.height = 1024;

        // Draw Image
        ctx.drawImage(img, 0, 0, 1024, 1024);

        // Configure Text
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.font = '900 100px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw Top Text
        if (memeData.topText) {
          ctx.strokeText(memeData.topText.toUpperCase(), 512, 40, 960);
          ctx.fillText(memeData.topText.toUpperCase(), 512, 40, 960);
        }

        // Draw Bottom Text
        if (memeData.bottomText) {
          ctx.textBaseline = 'bottom';
          ctx.strokeText(memeData.bottomText.toUpperCase(), 512, 984, 960);
          ctx.fillText(memeData.bottomText.toUpperCase(), 512, 984, 960);
        }

        // DRAW WATERMARK (Mandatory)
        drawWatermarkOnCanvas(ctx, 1024, 1024);
      };
    }
  }, [status, memeData, imageBase64]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `nano-meme-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Laugh className="w-8 h-8 text-yellow-400" />
          Nano Meme
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Become a meme lord with zero effort.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Controls */}
        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Meme Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Monday Mornings, Programmers vs Bugs, Cats..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 h-32 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic || status === 'loading'}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-yellow-900/20"
          >
            {status === 'loading' ? (
              <>
                <RefreshCw className="animate-spin" />
                Cooking up a joke...
              </>
            ) : (
              <>
                <Laugh />
                Generate Meme
              </>
            )}
          </button>
          
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-sm text-slate-400">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
               <Layers className="w-4 h-4" />
               How it works
            </h3>
            <ol className="list-decimal list-inside space-y-1">
               <li>Gemini Flash writes the joke (Setup & Punchline).</li>
               <li>Gemini Flash Image creates the visual context.</li>
               <li>Nano combines them instantly.</li>
            </ol>
          </div>
        </div>

        {/* Output */}
        <div className="flex-1">
          <div className="aspect-square bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center overflow-hidden relative shadow-2xl">
            {/* Hidden Canvas for rendering */}
            <canvas ref={canvasRef} className="hidden" />
            
            {status === 'loading' ? (
               <div className="text-center space-y-4">
                 <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-yellow-500 font-bold animate-pulse">Generating Laughter...</p>
               </div>
            ) : imageBase64 ? (
               <div className="relative w-full h-full group">
                  {/* Live Preview using standard img/text overlays for responsiveness, 
                      though download uses canvas for accuracy */}
                  <img src={imageBase64} alt="Meme Base" className="w-full h-full object-cover" />
                  
                  {memeData && (
                    <>
                      <div className="absolute top-4 left-4 right-4 text-center">
                        <span className="font-impact text-3xl md:text-4xl text-white uppercase tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                           {memeData.topText}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <span className="font-impact text-3xl md:text-4xl text-white uppercase tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}>
                           {memeData.bottomText}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <button 
                      onClick={handleDownload}
                      className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Download className="w-5 h-5" />
                      Download Meme
                    </button>
                  </div>
               </div>
            ) : (
               <div className="text-slate-600 flex flex-col items-center">
                 <Laugh className="w-20 h-20 opacity-20 mb-4" />
                 <p>Meme canvas ready</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeGenerator;
