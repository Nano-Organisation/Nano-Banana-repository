
import React from 'react';
import { X, Mail, Globe, Shield } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
              Contact Center
            </h3>
            <p className="text-slate-400 text-sm">Reach out to the Digital Gentry team.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 flex flex-col items-center text-center space-y-8 bg-slate-900/50">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-2 rotate-3 hover:rotate-0 transition-transform">
            <Mail className="w-10 h-10" />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-3xl font-black text-white uppercase tracking-tighter">Direct Support Hub</h4>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              For enterprise licensing, custom AI style forging, or technical assistance, please contact our primary node.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-inner group">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Primary Node Address</span>
             <a 
               href="mailto:contact-us@thedigitalgentry.co.uk"
               className="text-xl md:text-2xl font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors break-all"
             >
               contact-us@thedigitalgentry.co.uk
             </a>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-slate-800">
             <div className="flex flex-col items-center gap-1 opacity-50">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500 uppercase">United Kingdom</span>
             </div>
             <div className="flex flex-col items-center gap-1 opacity-50">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-[9px] font-bold text-slate-500 uppercase">Secure Protocol</span>
             </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">Digital Gentry AI Infrastructure</p>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
