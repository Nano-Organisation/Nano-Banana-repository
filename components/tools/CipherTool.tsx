
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, RefreshCw, Key, Shield, ArrowRight, BookOpen } from 'lucide-react';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const CipherTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'caesar' | 'game'>('caesar');
  
  // Caesar State
  const [inputText, setInputText] = useState('HELLO WORLD');
  const [shift, setShift] = useState(3);
  const [outputText, setOutputText] = useState('');

  // Game State
  const [gameMessage, setGameMessage] = useState('');
  const [gameCipher, setGameCipher] = useState('');
  const [gameShift, setGameShift] = useState(0);
  const [userGuess, setUserGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');

  // Caesar Logic
  useEffect(() => {
    const result = inputText.toUpperCase().split('').map(char => {
      const idx = ALPHABET.indexOf(char);
      if (idx === -1) return char;
      const newIdx = (idx + shift) % 26;
      return ALPHABET[newIdx];
    }).join('');
    setOutputText(result);
  }, [inputText, shift]);

  // Game Logic
  const startNewGame = () => {
    const messages = ["SECRET", "ATTACK", "GEMINI", "CIPHER", "BANANA", "ENIGMA", "VICTORY", "ESCAPE"];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    const randomShift = Math.floor(Math.random() * 25) + 1;
    
    const encrypted = randomMsg.split('').map(char => {
      const idx = ALPHABET.indexOf(char);
      const newIdx = (idx + randomShift) % 26;
      return ALPHABET[newIdx];
    }).join('');

    setGameMessage(randomMsg);
    setGameCipher(encrypted);
    setGameShift(randomShift);
    setUserGuess('');
    setGameStatus('playing');
  };

  useEffect(() => {
    if (activeTab === 'game') startNewGame();
  }, [activeTab]);

  const checkGuess = () => {
    if (userGuess.toUpperCase().trim() === gameMessage) {
      setGameStatus('won');
    } else {
      alert("Incorrect! Keep trying.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Lock className="w-8 h-8 text-sky-500" />
          Nano Cipher
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Master the basics of encryption and code-breaking.</p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setActiveTab('caesar')}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'caesar' ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Key className="w-4 h-4" />
          Caesar Shift
        </button>
        <button
          onClick={() => setActiveTab('game')}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'game' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Crack the Code
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        {/* CAESAR SHIFT MODE */}
        {activeTab === 'caesar' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                   <label className="text-sm font-bold text-slate-400 uppercase">Input Text</label>
                   <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-sky-500 h-32 resize-none font-mono uppercase"
                   />
                </div>
                
                <div className="space-y-6">
                   <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-center space-y-4">
                      <label className="text-sm font-bold text-sky-400 uppercase">Shift Key: {shift}</label>
                      <input 
                         type="range" 
                         min="0" 
                         max="25" 
                         value={shift} 
                         onChange={(e) => setShift(Number(e.target.value))}
                         className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 font-mono">
                         <span>A → A</span>
                         <span>A → Z</span>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex flex-col items-center gap-2">
                <ArrowRight className="w-6 h-6 text-slate-600 rotate-90 md:rotate-0" />
             </div>

             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase">Encrypted Output</label>
                <div className="w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-sky-300 font-mono text-xl tracking-widest break-all">
                   {outputText}
                </div>
             </div>

             <div className="bg-sky-900/10 border border-sky-900/30 p-4 rounded-xl flex gap-3 items-start">
                <BookOpen className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-sky-200">
                   <strong>How it works:</strong> The Caesar Cipher shifts every letter in your message by a fixed number (the key) down the alphabet. It is one of the simplest and oldest forms of encryption, used by Julius Caesar!
                </div>
             </div>
          </div>
        )}

        {/* GAME MODE */}
        {activeTab === 'game' && (
          <div className="space-y-8 text-center max-w-lg mx-auto">
             <div className="space-y-4">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto border-4 border-slate-700">
                   {gameStatus === 'won' ? <Unlock className="w-10 h-10 text-emerald-500" /> : <Lock className="w-10 h-10 text-red-500" />}
                </div>
                <h3 className="text-2xl font-bold text-white">Crack the Code</h3>
                <p className="text-slate-400">
                   The message below is encrypted with a random shift. Can you figure out the original word?
                </p>
             </div>

             <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl">
                <p className="text-4xl font-mono font-bold text-white tracking-[0.5em]">{gameCipher}</p>
             </div>

             {gameStatus === 'playing' ? (
                <div className="space-y-4">
                   <input 
                      value={userGuess}
                      onChange={(e) => setUserGuess(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && checkGuess()}
                      placeholder="Type your guess..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-center text-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                   />
                   <div className="flex gap-4">
                      <button 
                         onClick={() => alert(`Hint: Try shifting back by ${gameShift}!`)}
                         className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
                      >
                         Hint?
                      </button>
                      <button 
                         onClick={checkGuess}
                         className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                         Submit
                      </button>
                   </div>
                </div>
             ) : (
                <div className="space-y-6 animate-fade-in-up">
                   <div className="text-emerald-400 font-bold text-xl">Access Granted! Code Broken.</div>
                   <button 
                      onClick={startNewGame}
                      className="bg-white text-slate-900 font-bold px-8 py-3 rounded-xl flex items-center gap-2 mx-auto hover:bg-slate-200 transition-colors"
                   >
                      <RefreshCw className="w-5 h-5" />
                      Play Again
                   </button>
                </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CipherTool;
