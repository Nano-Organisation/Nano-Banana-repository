
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, RefreshCw, StopCircle, Play, CheckCircle, ClipboardList, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import { generateTextWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';

const LiveNotetaker: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          // let interimTranscript = ''; // Can display interim if needed

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          
          if (finalTranscript) {
             setTranscript(prev => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
        if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      handleSummarize();
    } else {
      setSummary(''); // Clear old summary if starting fresh, or keep? Let's keep for now but maybe clear if user clears.
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) return;
    setStatus('loading');
    setFeedback(null);
    try {
        const prompt = `You are an expert Notetaker. Analyze the following transcript and provide a structured summary.
        
        Format Requirements:
        1. Brief Overview (1-2 sentences)
        2. Key Points (Bulleted list)
        3. Action Items (if any detected, otherwise skip)
        4. Structured & Professional Tone.
        
        Transcript:
        "${transcript}"`;
        
        const result = await generateTextWithGemini(prompt);
        setSummary(result);
        setStatus('success');
    } catch (e) {
        setStatus('error');
    }
  };

  const handleClear = () => {
    setTranscript('');
    setSummary('');
    setStatus('idle');
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }
  };

  const handleCopy = () => {
    const text = `TRANSCRIPT:\n${transcript}\n\nSUMMARY:\n${summary}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFeedback = (type: 'up' | 'down') => {
    if (feedback === type) setFeedback(null);
    else setFeedback(type);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <ClipboardList className="w-8 h-8 text-teal-500" />
          AI Note Taker
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Live dictation with instant structured summaries.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TRANSCRIPT SECTION */}
        <div className="flex flex-col gap-4 h-[600px]">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <Mic className="w-4 h-4" /> Live Transcript
              </h3>
              {isListening && <span className="text-xs text-red-500 font-bold animate-pulse">● Recording...</span>}
           </div>
           
           <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto custom-scrollbar shadow-inner relative">
              {transcript ? (
                 <p className="whitespace-pre-wrap text-slate-300 leading-relaxed font-mono text-sm">
                    {transcript}
                 </p>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                    <p>Press the microphone to start dictating...</p>
                 </div>
              )}
              <div ref={transcriptEndRef} />
           </div>

           <div className="flex gap-3">
              <button
                 onClick={toggleListening}
                 className={`flex-1 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isListening 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                 }`}
              >
                 {isListening ? (
                    <>
                       <StopCircle className="w-5 h-5" /> Stop & Summarize
                    </>
                 ) : (
                    <>
                       <Mic className="w-5 h-5" /> Start Recording
                    </>
                 )}
              </button>
              
              <button
                 onClick={handleClear}
                 className="px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
                 title="Clear All"
              >
                 <RefreshCw className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* SUMMARY SECTION */}
        <div className="flex flex-col gap-4 h-[600px]">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <FileText className="w-4 h-4" /> Structured Summary
              </h3>
              {summary && (
                 <div className="flex items-center gap-3">
                    <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
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
                     <button 
                        onClick={handleCopy} 
                        className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded transition-colors"
                     >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Copy
                     </button>
                 </div>
              )}
           </div>

           <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-6 overflow-y-auto custom-scrollbar shadow-xl relative">
              {status === 'loading' ? (
                 <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-teal-400 animate-pulse">Organizing thoughts...</p>
                 </div>
              ) : summary ? (
                 <div className="prose prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans">
                       {summary}
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center p-8">
                    <ClipboardList className="w-16 h-16 opacity-20 mb-4" />
                    <p>Summary will appear here after recording stops.</p>
                 </div>
              )}
           </div>
           
           {!isListening && transcript && !summary && (
              <button
                 onClick={handleSummarize}
                 className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                 <RefreshCw className="w-4 h-4" /> Summarize Now
              </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default LiveNotetaker;
