
import React, { useState, useRef, useEffect } from 'react';
import { Box, Upload, Send, RefreshCw, AlertTriangle, CheckCircle, HelpCircle, Copy, Video, Play, Lock } from 'lucide-react';
import { generate3DOrchestration, generateVideoWithGemini } from '../../services/geminiService';
import { LoadingState, AI360Response } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const AI360Tool: React.FC = () => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<AI360Response | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [videoStatus, setVideoStatus] = useState<LoadingState>('idle');
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const getAIStudio = () => (window as any).aistudio;

  const checkKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      const selected = await aiStudio.hasSelectedApiKey();
      setHasKey(!!selected);
    } else {
      // Fallback for dev environments without the wrapper
      setHasKey(true);
    }
  };

  const handleSelectKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      await aiStudio.openSelectKey();
      await checkKey();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await runFileSecurityChecks(file, 'image');
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        alert(err.message);
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() && !image) return;
    setStatus('loading');
    setResult(null);
    setPreviewVideoUrl(null);
    setVideoStatus('idle');
    setErrorMessage(null);

    try {
      const data = await generate3DOrchestration(input, image || undefined);
      setResult(data);
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMessage(e.message || "Failed to analyze request.");
    }
  };

  const handleCopyPrompt = () => {
    if (result?.generation_prompt) {
      navigator.clipboard.writeText(result.generation_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Use Veo to visualize the prompt as a rotating video
  const handleGeneratePreview = async () => {
    if (!result?.generation_prompt) return;
    
    // API Key Check
    const aiStudio = getAIStudio();
    if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
       await handleSelectKey();
       // Re-check after dialog closes
       if (!(await aiStudio.hasSelectedApiKey())) return;
       setHasKey(true);
    }

    setVideoStatus('loading');
    setErrorMessage(null);
    setPreviewVideoUrl(null);
    
    try {
      // Veo works best with 16:9 for cinematic rotation
      const previewPrompt = `Cinematic 360 degree turntable rotation video of: ${result.generation_prompt}. High resolution, neutral studio lighting, seamless loop.`;
      
      const generatedUrl = await generateVideoWithGemini(previewPrompt, '16:9');
      
      // Fetch Blob to handle potential auth/network errors before display
      const response = await fetch(generatedUrl);
      if (!response.ok) {
         throw new Error(`Failed to load video. Status: ${response.status}. Please check your API key permissions.`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setPreviewVideoUrl(objectUrl);
      setVideoStatus('success');
    } catch (e: any) {
      console.error(e);
      setVideoStatus('error');
      setErrorMessage(e.message || "Failed to generate preview video. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Box className="w-8 h-8 text-blue-500" />
          AI 360
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Controlled 3D generation orchestrator. Safe, precise, and structured.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Orchestrator: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
         
         {/* Input Area */}
         <div className="flex flex-col gap-4">
            <div className="flex gap-4">
               <div 
                  onClick={() => fileRef.current?.click()}
                  className={`
                    w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all
                    ${image ? 'border-blue-500 bg-slate-800' : 'border-slate-700 hover:border-blue-500 hover:bg-slate-800'}
                  `}
               >
                  {image ? (
                     <img src={image} className="w-full h-full object-cover" />
                  ) : (
                     <Upload className="w-6 h-6 text-slate-500" />
                  )}
                  <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
               </div>
               
               <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the 3D object you want to generate (e.g. 'A futuristic combat helmet')..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
               />
            </div>
            
            <button
               onClick={handleSubmit}
               disabled={(!input.trim() && !image) || status === 'loading'}
               className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Send className="w-4 h-4" />}
               Validate & Orchestrate
            </button>
         </div>

         {/* Error Display */}
         {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-400">
               <AlertTriangle className="w-5 h-5 flex-shrink-0" />
               <p className="text-sm">{errorMessage}</p>
            </div>
         )}

         {/* Result Area */}
         {result && (
            <div className={`rounded-xl border p-6 space-y-4 animate-fade-in-up ${
               result.status === 'accepted' ? 'bg-green-500/10 border-green-500/30' :
               result.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
               'bg-amber-500/10 border-amber-500/30'
            }`}>
               <div className="flex items-center gap-3">
                  {result.status === 'accepted' && <CheckCircle className="w-6 h-6 text-green-500" />}
                  {result.status === 'rejected' && <AlertTriangle className="w-6 h-6 text-red-500" />}
                  {result.status === 'needs_clarification' && <HelpCircle className="w-6 h-6 text-amber-500" />}
                  
                  <div>
                     <h3 className="text-lg font-bold text-white capitalize">{result.status.replace('_', ' ')}</h3>
                     <p className="text-sm text-slate-300">{result.reason}</p>
                  </div>
               </div>

               {/* REJECTED */}
               {result.status === 'rejected' && (
                  <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/20 text-xs font-mono text-red-300">
                     Safety Categories: {result.safety_categories.join(', ')}
                  </div>
               )}

               {/* CLARIFICATION */}
               {result.status === 'needs_clarification' && (
                  <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/20">
                     <p className="text-amber-200 font-bold mb-2">Question:</p>
                     <p className="text-white text-lg">"{result.clarification_question}"</p>
                     <div className="mt-4 flex gap-2">
                        <input 
                           className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                           placeholder="Type your answer here..."
                           onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                 setInput(prev => prev + " " + (e.target as HTMLInputElement).value);
                                 setTimeout(handleSubmit, 100);
                              }
                           }}
                        />
                        <button 
                           onClick={() => handleSubmit()}
                           className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                           Reply
                        </button>
                     </div>
                  </div>
               )}

               {/* ACCEPTED */}
               {result.status === 'accepted' && result.generation_prompt && (
                  <div className="space-y-4">
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-2">Orchestrated 3D Prompt</div>
                        <p className="font-mono text-sm text-green-300 whitespace-pre-wrap">{result.generation_prompt}</p>
                        <button 
                           onClick={handleCopyPrompt}
                           className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-lg transition-colors"
                           title="Copy Prompt"
                        >
                           {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                     </div>
                     
                     {/* Preview Button using Veo */}
                     {!previewVideoUrl && videoStatus !== 'loading' && (
                        <button 
                           onClick={handleGeneratePreview}
                           className={`w-full font-bold py-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                              !hasKey 
                              ? 'bg-slate-800 border-amber-500/50 text-amber-500 hover:bg-slate-700' 
                              : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                           }`}
                        >
                           {!hasKey ? <Lock className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                           Generate 3D Preview (Veo)
                        </button>
                     )}

                     {videoStatus === 'loading' && (
                        <div className="text-center text-sm text-slate-400 animate-pulse bg-slate-950/50 p-6 rounded-xl border border-slate-800 border-dashed flex flex-col items-center gap-2">
                           <RefreshCw className="w-8 h-8 animate-spin text-blue-500"/>
                           <p>Rendering and Downloading Preview...</p>
                           <p className="text-xs opacity-50">This may take up to a minute.</p>
                        </div>
                     )}

                     {previewVideoUrl && (
                        <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative group shadow-2xl">
                           <video src={previewVideoUrl} autoPlay loop muted playsInline controls className="w-full h-full object-contain" />
                           <div className="absolute top-2 left-2 pointer-events-none">
                              <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                                 AI 360 PREVIEW
                              </span>
                           </div>
                        </div>
                     )}
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};

export default AI360Tool;
