import React, { useState, useEffect } from 'react';
import { Youtube, Download, RefreshCw, Zap, TrendingUp, Gamepad, Smile, Layout, Film, Monitor, Smartphone, Square, Image as ImageIcon, Lock, AlertTriangle, Clock, AtSign } from 'lucide-react';
import { generateViralThumbnails, generateVideoWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const STYLES = [
  { id: 'reaction', label: 'Reaction', icon: Smile, desc: 'Shocked face, big emotions, arrows' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad, desc: 'High action, glowing effects, intense' },
  { id: 'vlog', label: 'Vlog / Lifestyle', icon: Layout, desc: 'Bright, cinematic, depth of field' },
  { id: 'versus', label: 'Versus / Comparison', icon: Zap, desc: 'Split screen, red vs blue, contrast' },
  { id: 'trending', label: 'General Viral', icon: TrendingUp, desc: 'High saturation, bold text, clickbait style' }
];

const ThumbnailTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [customFooter, setCustomFooter] = useState(''); // New state for custom footer
  const [selectedStyleId, setSelectedStyleId] = useState(STYLES[4].id);
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryMessage, setRetryMessage] = useState('');
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => { checkKey(); }, []);

  const getAIStudio = () => (window as any).aistudio;

  const checkKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      const selected = await aiStudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true); 
    }
  };

  const handleSelectKey = async () => {
    const aiStudio = getAIStudio();
    if (aiStudio) {
      await aiStudio.openSelectKey();
      setHasKey(true);
    }
  };

  const selectedStyle = STYLES.find(s => s.id === selectedStyleId) || STYLES[4];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (mode === 'video') {
       const aiStudio = getAIStudio();
       if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
          handleSelectKey();
       }
    }

    setStatus('loading');
    setErrorMessage('');
    setRetryMessage('');

    if (mode === 'image') setVideoUrl(null);
    else setThumbnails([]);
    
    const onRetry = (msg: string) => setRetryMessage(msg);

    try {
      // Inject the footer text as a strict production instruction
      const footerInstruction = customFooter.trim() 
        ? `. PRODUCTION RULE: Place the following URL or Username in a small, clean footer at the bottom of the frame: "${customFooter.trim()}". Ensure 100% spelling accuracy.` 
        : "";
      
      const finalPrompt = `${prompt}. Style: ${selectedStyle.label} - ${selectedStyle.desc}${footerInstruction}`;
      
      if (mode === 'image') {
         const results = await generateViralThumbnails(finalPrompt, onRetry);
         setThumbnails(results);
      } else {
         const url = await generateVideoWithGemini(finalPrompt, aspectRatio, undefined, onRetry);
         const response = await fetch(url);
         if (!response.ok) throw new Error("Failed to load generated video stream.");
         const blob = await response.blob();
         setVideoUrl(URL.createObjectURL(blob));
      }
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "";
      if (msg.includes("Requested entity was not found")) {
          setHasKey(false);
          handleSelectKey();
      }
      setErrorMessage(msg || "Generation failed");
      setStatus('error');
    } finally {
      setRetryMessage('');
    }
  };

  const handleDownloadImage = async (url: string, index: number) => {
    // PASS THE CUSTOM FOOTER TEXT DIRECTLY TO THE WATERMARK HANDLER
    // This ensures ONLY the user's custom text is burned into the final file.
    const watermarked = await addWatermarkToImage(url, customFooter);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `ai-thumbnail-${index + 1}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Youtube className="w-8 h-8 text-red-600" />
          AI Thumbnails
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate viral YouTube thumbnails or motion intros instantly.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">Model: gemini-2.5-flash-image</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
             <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
               <button onClick={() => setMode('image')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${mode === 'image' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}><ImageIcon className="w-4 h-4" />Thumbnails</button>
               <button onClick={() => { setMode('video'); setAspectRatio('16:9'); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${mode === 'video' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}><Film className="w-4 h-4" />Motion Clip</button>
             </div>
             {mode === 'video' && (
               <div className="flex items-center gap-3 animate-fade-in"><span className="text-sm font-medium text-slate-400">Ratio:</span><div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700"><button onClick={() => setAspectRatio('16:9')} className={`p-2 rounded-md transition-all ${aspectRatio === '16:9' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'}`}><Monitor className="w-4 h-4" /></button><button onClick={() => setAspectRatio('9:16')} className={`p-2 rounded-md transition-all ${aspectRatio === '9:16' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'}`}><Smartphone className="w-4 h-4" /></button></div></div>
             )}
          </div>

          <div className="space-y-3">
             <label className="text-sm font-medium text-slate-400">Select Viral Style</label>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
               {STYLES.map((style) => (
                 <button key={style.id} onClick={() => setSelectedStyleId(style.id)} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all text-center ${selectedStyleId === style.id ? 'bg-slate-800 border-red-500 text-white ring-1 ring-red-500/50' : 'bg-slate-950/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}><style.icon className={`w-5 h-5 ${selectedStyleId === style.id ? 'text-red-500' : ''}`} /><span className="text-xs font-bold">{style.label}</span></button>
               ))}
             </div>
          </div>

          {/* New Footer Text Input Box */}
          <div className="space-y-2">
             <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <AtSign className="w-3.5 h-3.5" /> Branding / Footer Text (Optional)
                </label>
                <span className={`text-[10px] font-bold ${customFooter.length > 35 ? 'text-red-500' : 'text-slate-600'}`}>
                   {customFooter.length}/40
                </span>
             </div>
             <input 
                type="text" 
                maxLength={40}
                value={customFooter} 
                onChange={(e) => setCustomFooter(e.target.value)} 
                placeholder="e.g. @yourname or yourwebsite.com" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all text-sm"
             />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
             <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={mode === 'image' ? "Main video topic..." : "Motion prompt..."} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500" onKeyDown={(e) => e.key === 'Enter' && handleGenerate()} />
             <button onClick={handleGenerate} disabled={!prompt || status === 'loading'} className={`${mode === 'image' ? 'bg-red-600 hover:bg-red-700' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg whitespace-nowrap min-w-[180px]`}>{status === 'loading' ? (<RefreshCw className="animate-spin" />) : (mode === 'image' ? <Zap className="fill-current" /> : <Film className="fill-current" />)}{mode === 'image' ? 'Generate 5 Variants' : 'Generate Video'}</button>
          </div>
          {mode === 'video' && !hasKey && (<div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors" onClick={handleSelectKey}><Lock className="w-4 h-4" /><span className="text-sm font-medium">Paid API Key required for Video Generation</span></div>)}
        </div>

        <div className="border-t border-slate-800 pt-8 min-h-[300px]">
           {status === 'loading' ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className={`w-12 h-12 border-4 ${mode === 'image' ? 'border-red-500' : 'border-rose-500'} border-t-transparent rounded-full animate-spin`}></div>
                <div className="space-y-2 text-center">
                  <p className={`${mode === 'image' ? 'text-red-400' : 'text-rose-400'} animate-pulse font-bold`}>{mode === 'image' ? 'Designing viral clickbait...' : 'Rendering motion clip...'}</p>
                  {retryMessage && (
                    <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 animate-fade-in mx-auto w-fit">
                      <div className="flex items-center gap-1.5">
                         <Clock className="w-3 h-3" />
                         <span className="text-[10px] font-black uppercase tracking-wider">{retryMessage}</span>
                      </div>
                    </div>
                  )}
                </div>
                {mode === 'video' && <p className="text-xs text-slate-500">Video generation may take up to a minute.</p>}
             </div>
           ) : status === 'error' ? (
             <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/30"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                <div className="space-y-1"><h3 className="text-white font-bold">Generation Failed</h3><p className="text-slate-400 text-sm">{errorMessage}</p></div>
                {mode === 'video' && (<button onClick={handleSelectKey} className="text-amber-500 text-xs hover:underline flex items-center gap-1 mx-auto mt-2"><Lock className="w-3 h-3" /> Check API Key</button>)}
             </div>
           ) : (
             <>
                {mode === 'image' && (thumbnails.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">{thumbnails.map((src, idx) => (<div key={idx} className="group relative aspect-video bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg transition-transform hover:-translate-y-1"><img src={src} alt={`Thumbnail variant ${idx + 1}`} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><button onClick={() => handleDownloadImage(src, idx)} className="bg-white text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform"><Download className="w-4 h-4" />Download</button></div><div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded">Variant {idx + 1}</div></div>))}</div>) : (<div className="text-center py-12 text-slate-500"><ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-10" /><p>Enter a topic to generate thumbnails.</p></div>))}
                {mode === 'video' && (videoUrl ? (<div className="flex justify-center animate-fade-in-up"><div className={`relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl group ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm w-full' : aspectRatio === '1:1' ? 'aspect-square max-w-md w-full' : 'aspect-video max-w-2xl w-full'}`}><video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" /><div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><a href={videoUrl} download="ai-motion.mp4" className="bg-black/60 hover:bg-rose-600 text-white p-3 rounded-full backdrop-blur-sm transition-colors block" title="Download Video"><Download className="w-5 h-5" /></a></div></div></div>) : (<div className="text-center py-12 text-slate-500"><Film className="w-16 h-16 mx-auto mb-4 opacity-10" /><p>Enter a prompt to generate a motion clip.</p></div>))}
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailTool;