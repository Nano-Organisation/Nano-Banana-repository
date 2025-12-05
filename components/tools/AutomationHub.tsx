
import React, { useState } from 'react';
import { Bot, Puzzle, FileSpreadsheet } from 'lucide-react';
import TextTool from './TextTool';

const AutomationHub: React.FC = () => {
  const [subTool, setSubTool] = useState<'menu' | 'extension' | 'excel'>('menu');

  if (subTool === 'extension') {
    return <TextTool mode="browser_extension" onBack={() => setSubTool('menu')} />;
  }

  if (subTool === 'excel') {
    return <TextTool mode="excel_automation" onBack={() => setSubTool('menu')} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
      <div className="text-center space-y-4 py-8">
        <h2 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Bot className="w-10 h-10 text-violet-500" />
          Nano Automate
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Build powerful automation scripts and browser extensions in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button
          onClick={() => setSubTool('extension')}
          className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/50 p-8 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-24 opacity-5 bg-gradient-to-br from-violet-500 to-indigo-600 blur-3xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-6 border border-violet-500/20 group-hover:scale-110 transition-transform">
            <Puzzle className="w-7 h-7" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">Nano Ext</h3>
          <p className="text-slate-400 leading-relaxed">
            Generate Manifest V3 browser extensions for Chrome and Firefox.
          </p>
        </button>

        <button
          onClick={() => setSubTool('excel')}
          className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/50 p-8 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-24 opacity-5 bg-gradient-to-br from-green-500 to-emerald-600 blur-3xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center mb-6 border border-green-500/20 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">Nano Excel</h3>
          <p className="text-slate-400 leading-relaxed">
            Automate spreadsheets with custom VBA macros and scripts.
          </p>
        </button>
      </div>
    </div>
  );
};

export default AutomationHub;
