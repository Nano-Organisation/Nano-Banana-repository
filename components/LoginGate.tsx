
import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle, ShoppingCart, Sparkles, CheckCircle, Zap, RefreshCw, HelpCircle, Mail, KeyRound, LogIn, UserPlus } from 'lucide-react';
import ActivationGuide from './ActivationGuide';
import { supabase, createInitialProfile } from '../utils/supabase';

interface LoginGateProps {
  onLogin: () => void;
}

const LoginGate: React.FC<LoginGateProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'license' | 'login' | 'register'>('license');
  const [accessCode, setAccessCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setError(null);

    if (mode === 'license') {
      // PRIMARY ACCESS: Your official list
      const VALID_CODES = [
        "digital-gentry-2025",
        "digital-gentry-2025-p1",
        "digital-gentry-2025-x9",
        "dg-pro-suite-8821-990"
      ];

      setTimeout(() => {
        if (VALID_CODES.includes(accessCode.trim())) {
          localStorage.setItem('nano_access_granted', 'true');
          // Admin session flag lets the app know to bypass credit checks for you
          if (accessCode.trim() === 'digital-gentry-2025') {
            localStorage.setItem('is_admin_session', 'true');
          }
          onLogin();
        } else {
          setError("Invalid Access Code");
          setShake(true);
          setIsValidating(false);
          setTimeout(() => setShake(false), 500);
        }
      }, 800);
    } else {
      if (!supabase) {
        setError("Cloud Sync Unavailable: Supabase keys missing.");
        setShake(true);
        setIsValidating(false);
        setTimeout(() => setShake(false), 500);
        return;
      }

      try {
        if (mode === 'register') {
          const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (authError) throw authError;

          if (data.user) {
            const { error: profileError } = await createInitialProfile(data.user.id, email);
            if (profileError) throw profileError;

            localStorage.setItem('nano_access_granted', 'true');
            localStorage.setItem('supabase_user_id', data.user.id);
            onLogin();
          }
        } else if (mode === 'login') {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) throw authError;

          if (data.user) {
            localStorage.setItem('nano_access_granted', 'true');
            localStorage.setItem('supabase_user_id', data.user.id);
            onLogin();
          }
        }
      } catch (err: any) {
        setError(err.message || "Authentication failed. Check credentials.");
        setShake(true);
        setIsValidating(false);
        setTimeout(() => setShake(false), 500);
      }
    }
  };

  if (showGuide) {
    return <ActivationGuide onBack={() => setShowGuide(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        
        {/* Left Side: Branding/Marketing */}
        <div className="p-8 lg:p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col justify-between space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-xl">
                 <Sparkles className="w-6 h-6 text-slate-900" />
              </div>
              <span className="text-xl font-black text-white tracking-tighter uppercase">Digital Gentry AI</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                Unlock the <span className="text-amber-500">Future</span> of Creation.
              </h1>
              <p className="text-slate-400 leading-relaxed">
                Gain exclusive access to our premium suite of over 60 AI-powered tools. From cinematic video synthesis to architectural design and real-time live interaction.
              </p>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Veo 3.1 Pro Video Engine
               </div>
               <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Character Consistency Forge
               </div>
               <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Real-time Multimodal Live AI
               </div>
               <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Compute Unit (CU) Cloud Sync <span className="text-[10px] opacity-40 ml-1">(v3.1.0-PRO)</span>
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium Plan</p>
                   <h4 className="text-white font-bold">Monthly Access</h4>
                </div>
                <button 
                  onClick={() => window.open('https://buy.stripe.com/dRmeVe0jL1mL6qc4sqdIA00', '_blank')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 group shadow-lg shadow-amber-500/20"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Get Access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>

        {/* Right Side: Portal */}
        <div className={`
          p-8 lg:p-12 flex flex-col items-center justify-center space-y-8 transition-transform duration-100
          ${shake ? 'translate-x-[-4px]' : ''}
        `}>
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-700 shadow-inner group transition-all text-amber-500">
            <Lock className="w-10 h-10 group-hover:scale-110 transition-transform" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight text-center">
                {mode === 'license' ? 'License Portal' : mode === 'register' ? 'Register Account' : 'Member Login'}
            </h3>
            <p className="text-slate-500 text-sm text-center">
                {mode === 'license' ? 'Enter your unique access code below.' : mode === 'register' ? 'Create a profile to sync credits.' : 'Welcome back to Digital Gentry.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-sm space-y-4">
            {mode === 'license' ? (
              <div className="relative">
                <input 
                  type="text" 
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setError(null);
                  }}
                  disabled={isValidating}
                  placeholder="••••••••••••"
                  className={`w-full bg-slate-950 border rounded-2xl px-4 py-4 text-white text-center text-lg font-mono focus:outline-none focus:ring-2 transition-all ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-800 focus:ring-amber-500/20'}`}
                />
                <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                   <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                </div>
                <div className="relative">
                   <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest animate-fade-in text-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isValidating}
              className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              {isValidating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  {mode === 'license' ? 'Unlock Suite' : mode === 'register' ? 'Finalize Registration' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col items-center gap-4 w-full">
              {mode === 'license' ? (
                <div className="grid grid-cols-2 gap-4 w-full">
                   <button 
                      onClick={() => { setMode('login'); setError(null); }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                   >
                      <LogIn className="w-4 h-4" /> Login
                   </button>
                   <button 
                      onClick={() => { setMode('register'); setError(null); }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                   >
                      <UserPlus className="w-4 h-4" /> Register
                   </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setMode('license'); setError(null); }}
                  className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Return to License Portal
                </button>
              )}

              <button 
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-600 hover:text-amber-500 transition-colors uppercase tracking-[0.2em]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Activation Instructions
              </button>
          </div>

          <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em] text-center mt-4">
            Digital Gentry Secure Gateway v3.1<br/>
            E2E Encrypted Session
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginGate;
