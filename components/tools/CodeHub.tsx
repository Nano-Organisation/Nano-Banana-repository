import React, { useState } from 'react';
import { Code, ShieldAlert, Terminal } from 'lucide-react';
import TextTool from './TextTool';

const CodeHub: React.FC = () => {
  const [subTool, setSubTool] = useState<'menu' | 'coder' | 'security'>('menu');

  if (subTool === 'coder') {
    return <TextTool mode="code" onBack={() => setSubTool('menu')} />;
  }

  if (subTool === 'security') {
    return <TextTool mode="security" onBack={() => setSubTool('menu')} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
      <div className="text-center space-y-4 py-8">
        <h2 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Terminal className="w-10 h-10 text-cyan-500" />
          Nano Dev
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Advanced developer tools for generating clean code and auditing security vulnerabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button
          onClick={() => setSubTool('coder')}
          className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 p-8 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-24 opacity-5 bg-gradient-to-br from-cyan-500 to-blue-600 blur-3xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform">
            <Code className="w-7 h-7" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">Nano Coder</h3>
          <p className="text-slate-400 leading-relaxed">
            Generate boilerplate, debug issues, and refactor code in any language.
          </p>
        </button>

        <button
          onClick={() => setSubTool('security')}
          className="group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-500/50 p-8 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-24 opacity-5 bg-gradient-to-br from-red-500 to-rose-600 blur-3xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity"></div>
          
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-7 h-7" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">Nano Security</h3>
          <p className="text-slate-400 leading-relaxed">
            Scan for vulnerabilities, analyze risks, and apply security best practices.
          </p>
        </button>
      </div>
    </div>
  );
};

export default CodeHub;