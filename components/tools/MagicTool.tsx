
import React, { useState } from 'react';
import { Wand2, RefreshCw, Eye, EyeOff, Type, Lock } from 'lucide-react';
import { generateHiddenMessage } from '../../services/geminiService';
import { LoadingState } from '../../types';

const MagicTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dance' | 'reveal'>('dance');
  
  // Dance State
  const [danceText, setDanceText] = useState('Hover over me to see me dance!');
  
  // Reveal State
  const [secretMessage, setSecretMessage] = useState('');
  const [coverTopic, setCoverTopic] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleGenerateSecret = async () => {
    if (!secretMessage.trim() || !coverTopic.trim()) return;
    setStatus('loading');
    setGeneratedText('');
    setIsRevealed(false);
    
    try {
      const result = await generateHiddenMessage(secretMessage, coverTopic);
      setGeneratedText(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  // Parsing the result from Gemini which contains {{word}}
  const renderHiddenText = () => {
    if (!generatedText) return null;
    
    // Split by double curly braces
    const parts = generatedText.split(/(\{\{.*?\}\})/g);
    
    return (
      <p className="text-lg md:text-xl font-serif leading-relaxed text-slate-300">
        {parts.map((part, i) => {
          if (part.startsWith('{{') && part.endsWith('}}')) {
            const word = part.slice(2, -2);
            return (
              <span 
                key={i} 
                className={`transition-all duration-700 font-bold px-1 rounded
                  ${isRevealed 
                    ? 'text-pink-500 bg-pink-500/10 scale-110 inline-block shadow-[0_0_10px_rgba(236,72,153,0.5)]' 
                    : 'text-slate-300 bg-transparent'
                  }`}
              >
                {word}
              </span>
            );
          } else {
            return (
              <span 
                key={i} 
                className={`transition-opacity duration-700 ${isRevealed ? 'opacity-20 blur-[0.5px]' : 'opacity-100'}`}
              >
                {part}
              </span>
            );
          }
        })}
      </p>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Wand2 className="w-8 h-8 text-indigo-500" />
          Nano Magic
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Interactive text effects and hidden message generation.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setActiveTab('dance')}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'dance' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Type className="w-4 h-4" />
          Kinetic Type
        </button>
        <button
          onClick={() => setActiveTab('reveal')}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reveal' ? 'bg-pink-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Lock className="w-4 h-4" />
          Hidden Message
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl min-h-[400px] flex flex-col items-center justify-center">
        
        {/* DANCE MODE */}
        {activeTab === 'dance' && (
          <div className="w-full space-y-8 text-center">
             <input 
                value={danceText}
                onChange={(e) => setDanceText(e.target.value)}
                placeholder="Type something..."
                className="bg-transparent border-b-2 border-indigo-500 text-center text-slate-400 focus:outline-none focus:border-indigo-400 w-full max-w-md mx-auto py-2"
             />
             
             <div className="flex flex-wrap justify-center gap-1 min-h-[100px] items-center perspective-1000">
                {danceText.split('').map((char, i) => (
                   <span 
                      key={i} 
                      className={`
                        text-6xl md:text-8xl font-black text-white cursor-default inline-block transition-transform duration-200 hover:text-indigo-400
                        ${char === ' ' ? 'w-8' : ''}
                      `}
                      style={{ transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                      onMouseEnter={(e) => {
                         const target = e.target as HTMLSpanElement;
                         const rotate = Math.random() * 40 - 20;
                         const scale = 1.2 + Math.random() * 0.3;
                         const y = Math.random() * -20;
                         target.style.transform = `translateY(${y}px) rotate(${rotate}deg) scale(${scale})`;
                      }}
                      onMouseLeave={(e) => {
                         const target = e.target as HTMLSpanElement;
                         target.style.transform = 'none';
                      }}
                   >
                      {char}
                   </span>
                ))}
             </div>
             <p className="text-sm text-slate-500">Move your mouse over the letters!</p>
          </div>
        )}

        {/* REVEAL MODE */}
        {activeTab === 'reveal' && (
          <div className="w-full max-w-2xl space-y-8">
             {/* Input Form */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Secret Message</label>
                   <input 
                      value={secretMessage}
                      onChange={(e) => setSecretMessage(e.target.value)}
                      placeholder="e.g. I actually love you"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase">Cover Topic</label>
                   <input 
                      value={coverTopic}
                      onChange={(e) => setCoverTopic(e.target.value)}
                      placeholder="e.g. Gardening, Coffee, Space..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                   />
                </div>
             </div>
             
             <button
                onClick={handleGenerateSecret}
                disabled={!secretMessage || !coverTopic || status === 'loading'}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2"
             >
                {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Wand2 />}
                Generate Magic Text
             </button>

             {/* Result Display */}
             {generatedText && (
                <div className="relative bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-inner animate-fade-in-up">
                   <div className="mb-6">
                      {renderHiddenText()}
                   </div>
                   
                   <div className="flex justify-center">
                      <button
                         onMouseDown={() => setIsRevealed(true)}
                         onMouseUp={() => setIsRevealed(false)}
                         onTouchStart={() => setIsRevealed(true)}
                         onTouchEnd={() => setIsRevealed(false)}
                         className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 select-none
                            ${isRevealed ? 'bg-pink-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-200'}`}
                      >
                         {isRevealed ? <Eye /> : <EyeOff />}
                         {isRevealed ? 'REVEALED!' : 'Hold to Reveal'}
                      </button>
                   </div>
                </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MagicTool;
