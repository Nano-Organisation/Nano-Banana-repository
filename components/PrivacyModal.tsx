
import React from 'react';
import { X, Shield, Lock, Eye, Server } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
              Privacy Protocol
            </h3>
            <p className="text-slate-400 text-sm">How we handle your data and creative assets.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 bg-slate-900/50">
          <section className="space-y-3">
            <h4 className="text-indigo-400 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
              <Lock className="w-4 h-4" /> Data Sovereignty
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              Digital Gentry AI operates primarily on a "local-first" architecture. Your saved characters, preferences, and temporary project history are stored exclusively in your browser's Local Storage or IndexedDB. We do not maintain a permanent server-side database of your personal creative outputs unless specified by enterprise cloud sync features.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-indigo-400 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
              <Server className="w-4 h-4" /> AI Processing
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              To provide advanced AI capabilities, your inputs are transmitted securely to Google Gemini API nodes. This data is used solely to generate your requested content. By using the suite, you acknowledge that your inputs are subject to Google's Enterprise Privacy commitments, which generally exclude data from being used to train foundation models for other users.
            </p>
          </section>

          <section className="space-y-3">
            <h4 className="text-indigo-400 font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
              <Eye className="w-4 h-4" /> Usage Analytics
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              We collect minimal, anonymized telemetry (e.g., tool usage frequency, error logs) to improve system performance. We do not sell user data to third-party advertisers. Your email address is used strictly for authentication and credit balance management.
            </p>
          </section>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Digital Gentry Privacy Compliance v3.1</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
