
import React, { useState, useEffect } from 'react';
import { X, Key, Trash2, CheckCircle, AlertTriangle, Settings, CreditCard, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkKeyStatus();
    }
  }, [isOpen]);

  const checkKeyStatus = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      const selected = await aiStudio.hasSelectedApiKey();
      setHasKey(!!selected);
    }
  };

  const handleConnectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      await aiStudio.openSelectKey();
      await checkKeyStatus();
    }
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure? This will delete all saved characters, preferences, and local history. This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* API Connection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <CreditCard className="w-4 h-4 text-slate-400" />
               <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Subscription & Access</h4>
            </div>
            
            <div className={`p-4 rounded-xl border ${hasKey ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700'}`}>
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                     <div className="flex items-center gap-2 font-bold text-white">
                        {hasKey ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {hasKey ? 'AI Pro Active' : 'Free Tier / Restricted'}
                     </div>
                     <p className="text-xs text-slate-400 leading-relaxed">
                        {hasKey 
                           ? 'You are connected to your personal Gemini API key. All Pro features (Video, High-Res Image, Live Audio) are unlocked.' 
                           : 'Connect your Google Gemini API Key to unlock Video Generation, Live Audio, and Pro Image features.'}
                     </p>
                  </div>
               </div>
               
               <button 
                  onClick={handleConnectKey}
                  className={`mt-4 w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                     hasKey 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                        : 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-lg shadow-amber-900/20'
                  }`}
               >
                  <Key className="w-4 h-4" />
                  {hasKey ? 'Switch API Key' : 'Connect API Key'}
               </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <ShieldCheck className="w-4 h-4 text-slate-400" />
               <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Data & Privacy</h4>
            </div>
            
            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 space-y-4">
               <p className="text-xs text-slate-500">
                  Data (characters, scores, preferences) is stored locally on your device. We do not track your usage data.
               </p>
               <button 
                  onClick={handleClearData}
                  className="w-full py-2.5 rounded-lg font-bold text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center gap-2"
               >
                  <Trash2 className="w-4 h-4" />
                  Clear All Local Data
               </button>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
           <p className="text-xs text-slate-600">Digital Gentry AI Suite v2.5.0</p>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
