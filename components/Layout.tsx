
import React, { ReactNode, useState } from 'react';
import { Sparkles, ArrowLeft, MessageSquarePlus, Settings } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import SettingsModal from './SettingsModal';
import ThemeSwitcher from './ThemeSwitcher';

interface LayoutProps {
  children: ReactNode;
  onBack?: () => void;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onBack, title }) => {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-2 rounded-lg shadow-sm">
               <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-200 dark:to-amber-500">
              {title || "Digital Gentry AI"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <ThemeSwitcher />
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
             <button 
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
               title="Settings & API Key"
             >
               <Settings className="w-5 h-5" />
             </button>
             <div className="hidden sm:block text-slate-400 dark:text-slate-500 text-sm font-medium border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
               Powered by Gemini 2.5
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 relative z-0">
        {children}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-slate-500 text-sm bg-white/50 dark:bg-slate-950/50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} Digital Gentry AI Suite. All rights reserved.
          </div>
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Feedback
          </button>
        </div>
      </footer>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default Layout;
