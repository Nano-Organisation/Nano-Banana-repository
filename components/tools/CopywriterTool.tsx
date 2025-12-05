
import React, { useState } from 'react';
import { Pen, RefreshCw, Copy, Check, FileText, Target, Users, Sparkles } from 'lucide-react';
import { generateTextWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

const PROJECT_TYPES = [
  'Blog Post',
  'Sales Email',
  'Facebook Ad',
  'Google Ad',
  'Landing Page Headline & Hero',
  'Product Description',
  'Press Release',
  'Video Script',
  'Newsletter Issue',
  'Website About Page'
];

const TONES = [
  'Persuasive',
  'Professional',
  'Witty & Fun',
  'Luxury / Elegant',
  'Urgent / Sales',
  'Empathetic',
  'Technical / Authoritative'
];

const CopywriterTool: React.FC = () => {
  // Inputs
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [keyPoints, setKeyPoints] = useState('');
  
  // Output
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!productName.trim() || !keyPoints.trim()) return;
    setStatus('loading');
    setOutput('');

    try {
      const systemPrompt = `You are a world-class copywriter and marketing strategist. 
      Your goal is to write high-converting, engaging content that perfectly fits the specified format and tone.
      Use formatting (Markdown, headers, bullet points) where appropriate to make the copy readable and effective.
      Do not include meta-commentary like "Here is your copy", just write the copy itself.`;

      const userPrompt = `
      Write a ${projectType} for: "${productName}".
      
      Target Audience: ${targetAudience || 'General Audience'}
      Tone: ${tone}
      
      Key Selling Points / Context:
      ${keyPoints}
      
      Requirements:
      - Maximize engagement and conversion.
      - Use the specified tone strictly.
      - Format clearly.
      `;

      const result = await generateTextWithGemini(userPrompt, systemPrompt);
      setOutput(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Pen className="w-8 h-8 text-emerald-500" />
          Nano Copy
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate professional, high-converting copy for any project.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
            
            {/* Project Type & Tone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Project Type</label>
                <div className="relative">
                   <select 
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                   >
                      {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <FileText className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Tone</label>
                <div className="relative">
                   <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                   >
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                   <Sparkles className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Product & Audience */}
            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Product / Brand Name</label>
                  <input
                     value={productName}
                     onChange={(e) => setProductName(e.target.value)}
                     placeholder="e.g. Nano Banana AI"
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                     <Users className="w-3 h-3" /> Target Audience
                  </label>
                  <input
                     value={targetAudience}
                     onChange={(e) => setTargetAudience(e.target.value)}
                     placeholder="e.g. Small business owners, tech enthusiasts..."
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
               </div>
            </div>

            {/* Key Points */}
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Target className="w-3 h-3" /> Key Selling Points / Context
               </label>
               <textarea
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="What makes it special? What problem does it solve? List features or benefits here..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-40 resize-none text-sm leading-relaxed"
               />
            </div>

            <button
               onClick={handleGenerate}
               disabled={!productName || !keyPoints || status === 'loading'}
               className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Pen className="w-5 h-5" />}
               Write Copy
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col relative h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
               Generated Content
            </h3>
            {output && (
               <button 
                 onClick={handleCopy} 
                 className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
               >
                 {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                 Copy
               </button>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {status === 'loading' ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                 <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-emerald-400 animate-pulse">Crafting perfect words...</p>
              </div>
            ) : output ? (
              <div className="prose prose-invert prose-sm max-w-none">
                 <div className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans">{output}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                 <FileText className="w-16 h-16 opacity-20 mb-4" />
                 <p>Fill out the brief to generate professional copy.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopywriterTool;
