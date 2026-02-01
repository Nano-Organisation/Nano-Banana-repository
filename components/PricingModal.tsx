
import React from 'react';
import { X, Check, Star, Zap, Shield, Video, Image, MessageSquare, Sparkles } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSelect = (tier: string) => {
    if (tier === 'standard') {
      window.open('https://buy.stripe.com/eVqbJ2feFd5tg0M7ECdIA01', '_blank');
    } else {
      window.open('https://buy.stripe.com/14A14ofeFd5t01Ogb8dIA02', '_blank');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
              Platform Access Tiers
            </h3>
            <p className="text-slate-400 text-sm">Select a compute package to power your creative suite.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Standard Tier */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col relative group hover:border-slate-600 transition-all">
              <div className="mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 text-slate-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-1">Standard</h4>
                <p className="text-slate-400 text-sm italic">"Essential Creation"</p>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" /> Access to 50+ Core AI Tools
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" /> 500 Compute Credits Included
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" /> High-Speed Text & Image Gen
                </li>
                <li className="flex items-center gap-3 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-emerald-500" /> Standard Email Support
                </li>
              </ul>

              <button 
                onClick={() => handleSelect('standard')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all border border-slate-700"
              >
                Select Standard
              </button>
            </div>

            {/* Premium Tier */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/50 rounded-2xl p-8 flex flex-col relative group hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all">
              <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
              
              <div className="mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white mb-1">Premium Access</h4>
                <p className="text-indigo-200 text-sm italic">"Advanced Studio Power"</p>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-white text-sm font-medium">
                  <Star className="w-4 h-4 text-amber-400 fill-current" /> Everything in Standard
                </li>
                <li className="flex items-center gap-3 text-indigo-100 text-sm">
                  <Check className="w-4 h-4 text-indigo-400" /> <span className="font-bold">2,500 Compute Credits Included</span>
                </li>
                <li className="flex items-center gap-3 text-indigo-100 text-sm">
                  <Check className="w-4 h-4 text-indigo-400" /> Unlocks Veo 3.1 & Live Voice
                </li>
                <li className="flex items-center gap-3 text-indigo-100 text-sm">
                  <Check className="w-4 h-4 text-indigo-400" /> Pro-Level Image Consistency Tools
                </li>
                <li className="flex items-center gap-3 text-indigo-100 text-sm">
                  <Check className="w-4 h-4 text-indigo-400" /> Priority Processing Bandwidth
                </li>
              </ul>

              <button 
                onClick={() => handleSelect('pro')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 uppercase tracking-widest"
              >
                Get Premium
              </button>
            </div>
          </div>

          {/* Credit Usage Guide */}
          <div className="mt-10 pt-10 border-t border-slate-800">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Compute Unit (CU) Guide</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Video Card */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Pro Video / Veo</p>
                  <p className="text-slate-500 text-xs font-mono font-bold">50 Credits</p>
                </div>
              </div>

              {/* Image Card */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">High-Res Image</p>
                  <p className="text-slate-500 text-xs font-mono font-bold">5 Credits</p>
                </div>
              </div>

              {/* Chat Card */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Standard AI Task</p>
                  <p className="text-slate-500 text-xs font-mono font-bold">1 Credit</p>
                </div>
              </div>
            </div>
            
            <p className="text-center text-slate-600 text-[10px] mt-6 uppercase tracking-wider font-bold">
              Credits roll over annually • Usage is based on active model compute power.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PricingModal;
