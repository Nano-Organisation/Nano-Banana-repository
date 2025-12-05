
import React, { useState, useEffect } from 'react';
import { Music, Download, RefreshCw, Lock, Radio, Film } from 'lucide-react';
import { generateVideoWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

const STYLES = [
  { id: 'foley', label: 'Realism / Foley', desc: 'Raw, realistic sound recording. No music.' },
  { id: 'cinematic', label: 'Cinematic', desc: 'Epic, movie-quality sound design' },
  { id: 'cartoon', label: 'Cartoon', desc: 'Exaggerated, funny, boing/crash sounds' },
  { id: 'horror', label: 'Horror', desc: 'Eerie, suspenseful, creepy ambience' },
  { id: 'nature', label: 'Nature', desc: 'Realistic rain, wind, animals' },
  { id: 'scifi', label: 'Sci-Fi', desc: 'Futuristic, laser, synth, glitch' }
];

const SoundFXTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    checkKey();
  }, []);

  const getAIStudio = () => (window as any).aistudio;

  const checkKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      const selected = await aiStudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true); 
    }
  };

  const handleSelectKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      await aiStudio.openSelectKey();
      await checkKey();
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // API Key Check
    const aiStudio = getAIStudio();
    if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
       handleSelectKey();
       return;
    }

    setStatus('loading');
    setVideoUrl(null);

    try {
      // Craft a prompt that strictly enforces SOUND EFFECT ONLY
      const styleDesc = STYLES.find(s => s.id === selectedStyle)?.desc;
      
      // We explicitly tell Veo "NO MUSIC" and "RAW AUDIO"
      const finalPrompt = `Sound Effect: ${prompt}. ${styleDesc}.
      AUDIO REQUIREMENTS: Raw foley sound only. NO MUSIC. NO BACKGROUND SCORE. NO SONGS. High fidelity audio.
      VISUAL: Abstract minimalist audio visualizer on black background.`;
      
      const url = await generateVideoWithGemini(finalPrompt, '16:9');
      setVideoUrl(url);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Radio className="w-8 h-8 text-rose-500" />
          Nano FX
          <span className="text-xs font-normal bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-full border border-rose-200 dark:border-rose-800 ml-2">
             Powered by Veo 3.1
          </span>
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Generate custom sound effects and audio-visualizers.</p>
      </div>

      {!hasKey ? (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-6">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
              <Lock className="w-8 h-8 text-amber-500" />
           </div>
           <div>
              <h3 className="text-xl font-bold text-white">Paid API Key Required</h3>
              <p className="text-slate-400 text-sm mt-2">
                 Nano FX uses the advanced Veo model to synthesize custom audio and video. Please connect a billing-enabled key.
              </p>
           </div>
           <button
             onClick={handleSelectKey}
             className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl w-full transition-colors"
           >
             Connect Key
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Controls */}
           <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                 
                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sound Style</label>
                    <div className="grid grid-cols-2 gap-2">
                       {STYLES.map((style) => (
                          <button
                             key={style.id}
                             onClick={() => setSelectedStyle(style.id)}
                             className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all text-left ${
                                selectedStyle === style.id 
                                ? 'bg-rose-600/20 border-rose-500 text-rose-400' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                             }`}
                          >
                             {style.label}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sound Prompt</label>
                    <textarea
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       placeholder="e.g. Car tyres screeching on asphalt, Thunder cracking, Glass breaking..."
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 h-32 resize-none"
                    />
                 </div>

                 <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || status === 'loading'}
                    className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/20"
                 >
                    {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Music />}
                    Generate FX
                 </button>
              </div>
           </div>

           {/* Preview */}
           <div className="flex flex-col justify-center">
              {status === 'loading' ? (
                 <div className="text-center space-y-4 p-8 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                    <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-rose-400 font-medium animate-pulse">Synthesizing sound & visual...</p>
                    <p className="text-xs text-slate-500">This uses Veo and takes about 30-60 seconds.</p>
                 </div>
              ) : videoUrl ? (
                 <div className="space-y-4 animate-fade-in-up">
                    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 relative group aspect-video">
                       <video 
                          src={videoUrl} 
                          controls 
                          className="w-full h-full object-contain" 
                       />
                    </div>
                    <a 
                       href={videoUrl} 
                       download={`nano-fx-${Date.now()}.mp4`}
                       className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    >
                       <Download className="w-5 h-5" />
                       Download FX Video
                    </a>
                    <p className="text-xs text-center text-slate-500">
                       Note: The sound is embedded in the video file. Use any video editor to extract the audio track.
                    </p>
                 </div>
              ) : (
                 <div className="text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 h-full flex flex-col items-center justify-center min-h-[400px]">
                    <Film className="w-16 h-16 opacity-20 mb-4" />
                    <p>Enter a prompt to generate a sound effect video.</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default SoundFXTool;
