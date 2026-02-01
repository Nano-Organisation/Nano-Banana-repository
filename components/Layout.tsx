
import React, { ReactNode, useState } from 'react';
import { Sparkles, ArrowLeft, Shield, User, LogOut, LogIn, CreditCard, Mail, FileText } from 'lucide-react';
import SettingsModal from './SettingsModal';
import ThemeSwitcher from './ThemeSwitcher';
import PricingModal from './PricingModal';
import ContactModal from './ContactModal';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';

interface LayoutProps {
  children: ReactNode;
  onBack?: () => void;
  title?: string;
  onGoHome?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
  isAuthenticated?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onBack, 
  title, 
  onGoHome, 
  onProfileClick, 
  onLogout,
  onLogin,
  isAuthenticated 
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-2"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            )}
            <button 
              onClick={onGoHome} 
              disabled={!onGoHome}
              className={`flex items-center gap-3 ${onGoHome ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            >
              <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-2 rounded-lg shadow-sm">
                 <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-200 dark:to-amber-500">
                {title || "Digital Gentry AI"}
              </h1>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
             <ThemeSwitcher />
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
             
             {onProfileClick && (
               <button 
                 onClick={onProfileClick}
                 className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                 title="User Profile"
               >
                 <User className="w-5 h-5" />
               </button>
             )}
             
             {isAuthenticated ? (
               <button 
                 onClick={onLogout}
                 className="flex items-center gap-2 p-2 px-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-bold uppercase"
                 title="Sign Out"
               >
                 <LogOut className="w-4 h-4" />
                 <span className="hidden sm:inline">Sign Out</span>
               </button>
             ) : (
               <button 
                 onClick={onLogin}
                 className="flex items-center gap-2 p-2 px-3 text-emerald-600 dark:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-bold uppercase"
                 title="Sign In"
               >
                 <LogIn className="w-4 h-4" />
                 <span className="hidden sm:inline">Sign In</span>
               </button>
             )}

             <button
               onClick={() => setIsPricingOpen(true)}
               className="ml-2 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
             >
               <CreditCard className="w-3 h-3" />
               Buy Credits
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 relative">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-slate-500 text-sm bg-white/50 dark:bg-slate-950/50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} Digital Gentry AI Suite. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsContactOpen(true)}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Contact Us
            </button>
            <button 
              onClick={() => setIsPrivacyOpen(true)}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Privacy
            </button>
            <button 
              onClick={() => setIsTermsOpen(true)}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Terms & Conditions
            </button>
          </div>
        </div>
      </footer>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};

export default Layout;
