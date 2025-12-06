
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Square, Download, RefreshCw, Volume2, Sliders } from 'lucide-react';
import { generateSpeechWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

const VOICES = [
  { name: 'Kore', label: 'Kore (Balanced)' },
  { name: 'Puck', label: 'Puck (Energetic)' },
  { name: 'Charon', label: 'Charon (Deep)' },
  { name: 'Fenrir', label: 'Fenrir (Intense)' },
  { name: 'Zephyr', label: 'Zephyr (Calm)' },
];

const SoundGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].name);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  
  // Customization
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    setAudioUrl(null);
    try {
      const url = await generateSpeechWithGemini(text, selectedVoice, speed, pitch);
      setAudioUrl(url);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Auto-play prevented"));
    }
  }, [audioUrl]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Volume2 className="w-8 h-8 text-sky-500" />
          AI Speech
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Transform text into lifelike speech using Gemini 2.5.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash-preview-tts
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Controls */}
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Select Voice</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VOICES.map((voice) => (
                <button
                  key={voice.name}
                  onClick={() => setSelectedVoice(voice.name)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedVoice === voice.name 
                      ? 'bg-sky-600/20 border border-sky-500 text-sky-400' 
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {voice.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
             <div className="flex items-center gap-2 text-sky-500 text-sm font-bold mb-2">
                <Sliders className="w-4 h-4" />
                Customization
             </div>
             
             {/* Speed Slider */}
             <div className="space-y-1">
               <div className="flex justify-between text-xs text-slate-400">
                  <span>Speed</span>
                  <span>{speed}x</span>
               </div>
               <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1" 
                  value={speed} 
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
               />
               <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Slow</span>
                  <span>Fast</span>
               </div>
             </div>

             {/* Pitch Slider */}
             <div className="space-y-1">
               <div className="flex justify-between text-xs text-slate-400">
                  <span>Pitch</span>
                  <span>{pitch === 0 ? 'Normal' : (pitch > 0 ? `+${pitch}` : pitch)}</span>
               </div>
               <input 
                  type="range" 
                  min="-2" 
                  max="2" 
                  step="1" 
                  value={pitch} 
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
               />
               <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Deep</span>
                  <span>High</span>
               </div>
             </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400">Enter Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want AI to speak..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 h-32 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!text || status === 'loading'}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-900/20"
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Mic />}
            Generate Speech
          </button>
        </div>

        {/* Player & Output */}
        <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
          {status === 'loading' ? (
             <div className="text-center space-y-4">
               <div className="flex items-center justify-center gap-1 h-12">
                 <div className="w-2 h-8 bg-sky-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                 <div className="w-2 h-12 bg-sky-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                 <div className="w-2 h-6 bg-sky-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                 <div className="w-2 h-10 bg-sky-500 rounded-full animate-[bounce_1s_infinite_100ms]"></div>
               </div>
               <p className="text-sky-400 font-medium animate-pulse">Synthesizing audio...</p>
             </div>
          ) : audioUrl ? (
            <div className="w-full space-y-6 text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-sky-500/20 text-sky-500 rounded-full flex items-center justify-center mx-auto ring-4 ring-sky-500/10">
                <Volume2 className="w-10 h-10" />
              </div>
              
              <div className="w-full bg-slate-950 rounded-xl p-4 border border-slate-800">
                <audio ref={audioRef} controls src={audioUrl} className="w-full h-10" />
              </div>

              <a 
                href={audioUrl} 
                download={`ai-speech-${selectedVoice}.wav`}
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-medium transition-colors border border-slate-700"
              >
                <Download className="w-5 h-5" />
                Download WAV
              </a>
            </div>
          ) : (
            <div className="text-slate-600 flex flex-col items-center">
              <Mic className="w-16 h-16 opacity-20 mb-4" />
              <p>Audio output will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundGenerator;
