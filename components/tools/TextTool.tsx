import React, { useState } from 'react';
import { FileText, Feather, Code, Play, Copy, Check, GraduationCap, ShieldAlert, ArrowLeft, Puzzle, FileSpreadsheet, ThumbsUp, ThumbsDown } from 'lucide-react';
import { generateTextWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

interface TextToolProps {
  mode: 'summarizer' | 'story' | 'code' | 'tutor' | 'security' | 'browser_extension' | 'excel_automation';
  onBack?: () => void;
}

const CONFIG = {
  summarizer: {
    title: 'AI Sum',
    desc: 'Condense articles and text into concise summaries.',
    placeholder: 'Paste the article or text you want to summarize here...',
    action: 'Summarize',
    icon: FileText,
    color: 'emerald',
    systemPrompt: 'You are an expert summarizer. Provide a concise, bulleted summary of the provided text. Focus on key takeaways.'
  },
  story: {
    title: 'AI Tales',
    desc: 'Generate creative stories from simple prompts.',
    placeholder: 'Enter a topic, genre, or starting sentence...',
    action: 'Write Story',
    icon: Feather,
    color: 'pink',
    systemPrompt: 'You are a creative writing assistant. Write an engaging short story based on the user\'s prompt.'
  },
  code: {
    title: 'AI Coder',
    desc: 'Get coding help, snippets, and debugging advice.',
    placeholder: 'Describe the function you need or paste code to debug...',
    action: 'Generate Code',
    icon: Code,
    color: 'cyan',
    systemPrompt: 'You are an expert senior software engineer. Provide clean, well-commented code solutions and explanations.'
  },
  tutor: {
    title: 'AI Tutor',
    desc: 'Expert guidance on using popular AI platforms.',
    placeholder: 'Ask how to use a specific AI tool (e.g., "How do I use Midjourney?" or "Explain the OpenAI API")...',
    action: 'Get Guide',
    icon: GraduationCap,
    color: 'indigo',
    systemPrompt: 'You are an expert AI tutor. Provide comprehensive, step-by-step guides on how to use specific AI tools, platforms, and models. Be clear, beginner-friendly, and practical. Format your response with clear headings and bullet points.'
  },
  security: {
    title: 'AI Security',
    desc: 'Analyze code for vulnerabilities and get security advice.',
    placeholder: 'Paste code to analyze for vulnerabilities or ask a security question...',
    action: 'Analyze Security',
    icon: ShieldAlert,
    color: 'red',
    systemPrompt: 'You are an expert cybersecurity analyst and code auditor. Analyze the provided code for security vulnerabilities (OWASP Top 10, etc.), suggest fixes, and explain best practices. If asked a question, provide secure, industry-standard advice.'
  },
  browser_extension: {
    title: 'AI Ext',
    desc: 'Generate code for Chrome/Firefox browser extensions.',
    placeholder: 'Describe what the extension should do (e.g., "Block ads on specific sites" or "Change background color to pink")...',
    action: 'Generate Extension',
    icon: Puzzle,
    color: 'violet',
    systemPrompt: 'You are an expert browser extension developer. Generate complete code for a Chrome Extension (Manifest V3). Provide the content for manifest.json, background scripts, content scripts, and popup HTML/CSS/JS as needed. Use clear headers for each file so the user can copy them easily.'
  },
  excel_automation: {
    title: 'AI Excel',
    desc: 'Create VBA macros and scripts for Excel automation.',
    placeholder: 'Describe the automation task (e.g., "Combine data from all sheets" or "Highlight duplicates in red")...',
    action: 'Generate Macro',
    icon: FileSpreadsheet,
    color: 'green',
    systemPrompt: 'You are an expert in Excel automation using VBA. Provide efficient, well-commented VBA code to solve the user\'s request. Briefly explain how to insert the macro into the workbook.'
  }
};

const TextTool: React.FC<TextToolProps> = ({ mode, onBack }) => {
  const config = CONFIG[mode];
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleRun = async () => {
    if (!input.trim()) return;
    setStatus('loading');
    setFeedback(null);
    try {
      const result = await generateTextWithGemini(input, config.systemPrompt);
      setOutput(result);
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFeedback = (type: 'up' | 'down') => {
    if (feedback === type) setFeedback(null);
    else setFeedback(type);
  };

  const Icon = config.icon;
  const colorClass = `text-${config.color}-500`;
  const bgClass = `bg-${config.color}-600`;
  const hoverClass = `hover:bg-${config.color}-700`;
  const ringClass = `focus:ring-${config.color}-500`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-center relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute left-0 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="text-center space-y-2">
          <h2 className={`text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3`}>
            <Icon className={`w-8 h-8 ${colorClass}`} />
            {config.title}
          </h2>
          <div className="flex flex-col items-center gap-1">
             <p className="text-slate-600 dark:text-slate-400">{config.desc}</p>
             <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {/* Updated label to match the actual model used (gemini-3-flash-preview). */}
                Model: gemini-3-flash-preview
             </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        <div className="flex flex-col gap-4 h-full">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={config.placeholder}
            className={`flex-1 bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 ${ringClass} resize-none`}
          />
          <button
            onClick={handleRun}
            disabled={!input || status === 'loading'}
            className={`w-full ${bgClass} ${hoverClass} disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg`}
          >
            {status === 'loading' ? 'Thinking...' : (
              <>
                <Play className="w-4 h-4 fill-current" />
                {config.action}
              </>
            )}
          </button>
        </div>

        <div className="h-full bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden relative shadow-inner">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
             <span className="text-xs font-mono text-slate-500 uppercase">Output</span>
             {output && (
               <div className="flex items-center gap-2">
                 <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 mr-2">
                    <button 
                      onClick={() => toggleFeedback('up')} 
                      className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback === 'up' ? 'text-green-500' : 'text-slate-500'}`}
                    >
                       <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px bg-slate-800 mx-0.5"></div>
                    <button 
                      onClick={() => toggleFeedback('down')} 
                      className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback === 'down' ? 'text-red-500' : 'text-slate-500'}`}
                    >
                       <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                 </div>
                 <button onClick={handleCopy} className="text-slate-400 hover:text-white transition-colors">
                   {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                 </button>
               </div>
             )}
          </div>
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {status === 'loading' ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-2 bg-slate-800 rounded w-3/4"></div>
                <div className="h-2 bg-slate-800 rounded w-1/2"></div>
                <div className="h-2 bg-slate-800 rounded w-5/6"></div>
              </div>
            ) : output ? (
              <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed text-sm">
                {output}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-sm italic">
                Result will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextTool;