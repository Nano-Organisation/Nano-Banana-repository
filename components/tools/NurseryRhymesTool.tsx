
import React, { useState } from 'react';
import { Music, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Download, ImageIcon, PlayCircle, Star } from 'lucide-react';
import { generateNurseryRhymeStoryboard, generateImageWithGemini } from '../../services/geminiService';
import { LoadingState, RhymeData } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const RHYMES = [
  "Twinkle Twinkle Little Star",
  "Humpty Dumpty",
  "The Itsy Bitsy Spider",
  "Mary Had a Little Lamb",
  "The Wheels on the Bus",
  "Old MacDonald Had a Farm",
  "Baa Baa Black Sheep",
  "Row Row Row Your Boat"
];

const NurseryRhymesTool: React.FC = () => {
  const [selectedRhyme, setSelectedRhyme] = useState(RHYMES[0]);
  const [rhymeData, setRhymeData] = useState<RhymeData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [viewIndex, setViewIndex] = useState(0);

  const handleGenerate = async () => {
    setStatus('loading');
    setRhymeData(null);
    setViewIndex(0);
    setProgressMsg('Drafting storyboard...');

    try {
      // 1. Generate Storyboard Script
      const data = await generateNurseryRhymeStoryboard(selectedRhyme);
      setRhymeData(data);

      // 2. Generate Images Sequentially
      const panelsWithImages = [...data.panels];
      for (let i = 0; i < panelsWithImages.length; i++) {
        setProgressMsg(`Illustrating Panel ${i + 1}/${panelsWithImages.length}...`);
        
        // Use a consistent style instruction
        const prompt = `Children's book illustration for "${data.title}". Scene: ${panelsWithImages[i].imagePrompt}. Style: Soft, vibrant, whimsical, digital painting, storybook aesthetic.`;
        
        const imageUrl = await generateImageWithGemini(prompt, '1:1');
        panelsWithImages[i] = { ...panelsWithImages[i], imageUrl };

        // Update state progressively
        setRhymeData({ ...data, panels: panelsWithImages });
        
        // Slight delay to avoid heavy burst
        if (i < panelsWithImages.length - 1) await new Promise(r => setTimeout(r, 2000));
      }

      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDownloadImage = async (url: string, index: number) => {
    const watermarked = await addWatermarkToImage(url);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `nursery-rhyme-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Music className="w-8 h-8 text-pink-500" />
          AI Nursery Rhymes
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Bring classic childhood rhymes to life with custom AI illustrations.</p>
      </div>

      {!rhymeData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl space-y-8">
           <div className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block text-center">Select a Nursery Rhyme</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {RHYMES.map(rhyme => (
                    <button
                       key={rhyme}
                       onClick={() => setSelectedRhyme(rhyme)}
                       className={`p-4 rounded-2xl border text-sm font-bold transition-all text-center h-24 flex items-center justify-center ${
                          selectedRhyme === rhyme 
                          ? 'bg-pink-600 border-pink-500 text-white shadow-lg scale-105' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                       }`}
                    >
                       {rhyme}
                    </button>
                 ))}
              </div>
           </div>

           <button
              onClick={handleGenerate}
              disabled={status === 'loading'}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-pink-900/20"
           >
              {status === 'loading' ? (
                <>
                   <RefreshCw className="animate-spin w-5 h-5" />
                   {progressMsg}
                </>
              ) : (
                <>
                   <Sparkles className="w-5 h-5 fill-current" />
                   Generate Images
                </>
              )}
           </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
           <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <h3 className="text-lg font-bold text-white px-2">{rhymeData.title}</h3>
              <button 
                onClick={() => setRhymeData(null)}
                className="text-slate-500 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors text-sm font-bold"
              >
                 New Rhyme
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Image Preview */}
              <div className="aspect-square bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative group shadow-2xl">
                 {rhymeData.panels[viewIndex]?.imageUrl ? (
                    <>
                       <img src={rhymeData.panels[viewIndex].imageUrl} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => handleDownloadImage(rhymeData.panels[viewIndex].imageUrl!, viewIndex)}
                            className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                             <Download className="w-4 h-4" /> Download
                          </button>
                       </div>
                    </>
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                       <RefreshCw className="w-12 h-12 animate-spin text-pink-500" />
                       <p className="font-bold animate-pulse">Illustrating Panel {viewIndex + 1}...</p>
                    </div>
                 )}
                 <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase">
                    Panel {viewIndex + 1} / {rhymeData.panels.length}
                 </div>
              </div>

              {/* Lyrics Card */}
              <div className="bg-pink-50 dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-pink-200 dark:border-pink-900/30 flex flex-col justify-center min-h-[300px] shadow-inner">
                 <div className="relative">
                    <Star className="absolute -top-6 -left-6 w-8 h-8 text-yellow-400 opacity-50 animate-pulse" />
                    <p className="text-2xl md:text-3xl font-serif text-slate-800 dark:text-pink-100 leading-relaxed italic text-center">
                       "{rhymeData.panels[viewIndex]?.lyrics}"
                    </p>
                    <Star className="absolute -bottom-6 -right-6 w-8 h-8 text-yellow-400 opacity-50 animate-pulse" style={{ animationDelay: '500ms' }} />
                 </div>
              </div>
           </div>

           {/* Navigation */}
           <div className="flex items-center justify-center gap-6">
              <button 
                 disabled={viewIndex === 0}
                 onClick={() => setViewIndex(v => v - 1)}
                 className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-white rounded-full transition-all"
              >
                 <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2">
                 {rhymeData.panels.map((_, i) => (
                    <button 
                       key={i} 
                       onClick={() => setViewIndex(i)}
                       className={`h-2 rounded-full transition-all ${viewIndex === i ? 'w-8 bg-pink-500' : 'w-2 bg-slate-700'}`}
                    />
                 ))}
              </div>

              <button 
                 disabled={viewIndex === rhymeData.panels.length - 1}
                 onClick={() => setViewIndex(v => v + 1)}
                 className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-white rounded-full transition-all"
              >
                 <ChevronRight className="w-6 h-6" />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default NurseryRhymesTool;
