
import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginGateProps {
  onLogin: () => void;
}

// CHANGE THIS PASSWORD TO WHATEVER YOU WANT YOUR CUSTOMERS TO USE
const ACCESS_CODE = "digital-gentry-2025"; 

const LoginGate: React.FC<LoginGateProps> = ({ onLogin }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ACCESS_CODE) {
      localStorage.setItem('nano_access_granted', 'true');
      onLogin();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className={`
        relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl transition-transform duration-100
        ${shake ? 'translate-x-[-10px]' : ''}
        ${shake ? 'translate-x-[10px]' : ''}
      `}>
        <div className="text-center space-y-6">
          
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto border border-slate-700 shadow-inner">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Digital Gentry AI</h1>
            <p className="text-slate-400 text-sm">Enter your access code to unlock the suite.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <input 
                type="password" 
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(false);
                }}
                placeholder="Access Code"
                className={`w-full bg-slate-950 border rounded-xl px-4 py-4 text-center text-white text-lg tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-700 focus:ring-amber-500/50'}`}
                autoFocus
              />
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-medium animate-fade-in">
                  <AlertCircle className="w-3 h-3" />
                  Invalid Access Code
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <ShieldCheck className="w-5 h-5" />
              Unlock Access
            </button>
          </form>

          <div className="pt-6 border-t border-slate-800">
            <a href="#" className="text-xs text-slate-500 hover:text-amber-500 transition-colors">
              Don't have a code? Get one here.
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
