
import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Download, RefreshCw, Palette, FileText, Type, Copy, Sparkles, Feather } from 'lucide-react';
import { generateImageWithGemini, generateTextWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';

const FONTS = [
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Indie Flower', family: "'Indie Flower', cursive" },
  { name: 'Shadows Into Light', family: "'Shadows Into Light', cursive" },
  { name: 'Homemade Apple', family: "'Homemade Apple', cursive" },
  { name: 'Reenie Beanie', family: "'Reenie Beanie', cursive" },
  { name: 'Sacramento', family: "'Sacramento', cursive" },
  { name: 'Nothing You Could Do', family: "'Nothing You Could Do', cursive" }
];

const PAPER_PRESETS = [
  { name: 'Standard', prompt: 'Clean white printer paper texture, high resolution, flat lighting' },
  { name: 'Vintage', prompt: 'Old vintage parchment paper texture, yellowed edges, stained, antique look' },
  { name: 'Linen', prompt: 'Cream colored linen paper texture, woven fabric detail, elegant stationery' },
  { name: 'Kraft', prompt: 'Brown kraft paper texture, recycled look, fibrous details' },
  { name: 'Watercolor', prompt: 'Cold press watercolor paper texture, rough grain, white' }
];

const HandwritingTool: React.FC = () => {
  const [inputText, setInputText] = useState('My dearest friend,\n\nI am writing to you from the digital ether...');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [inkColor, setInkColor] = useState('#1e293b');
  const [fontSize, setFontSize] = useState(24);
  const [paperTextureUrl, setPaperTextureUrl] = useState<string | null>(null);
  const [customPaperPrompt, setCustomPaperPrompt] = useState('');
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [textureStatus, setTextureStatus] = useState<LoadingState>('idle');
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Inject fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script&family=Great+Vibes&family=Homemade+Apple&family=Indie+Flower&family=Nothing+You+Could+Do&family=Reenie+Beanie&family=Sacramento&family=Shadows+Into+Light&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const handleGeneratePaper = async (prompt?: string) => {
    setTextureStatus('loading');
    const finalPrompt = prompt || customPaperPrompt || PAPER_PRESETS[0].prompt;
    const fullPrompt = `Top down view, seamless high resolution texture of ${finalPrompt}. Flat lighting, no shadows, no objects, just the material surface.`;
    
    try {
      const url = await generateImageWithGemini(fullPrompt, '1:1');
      setPaperTextureUrl(url);
      setTextureStatus('success');
    } catch (e) {
      console.error(e);
      setTextureStatus('error');
    }
  };

  const handleRewrite = async (tone: string) => {
    if (!inputText) return;
    setStatus('loading');
    try {
      const prompt = `Rewrite the following text to sound ${tone}. Keep the meaning but change the style. Text: "${inputText}"`;
      const result = await generateTextWithGemini(prompt);
      setInputText(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    setStatus('loading');
    
    try {
      // High scale for better quality
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`handwritten-note-${Date.now()}.pdf`);
      setStatus('success');
    } catch (e) {
      console.error("Export failed", e);
      setStatus('error');
      alert("Export failed. Please try again.");
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(inputText);
    alert("Text copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-3 tracking-tighter uppercase">
          <Feather className="w-10 h-10 text-emerald-600" />
          AI Scribe
        </h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Digital Handwriting & Stationery Forge</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            {/* Input & AI Tools */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3 h-3" /> Content
              </label>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-slate-200 text-sm h-40 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
                placeholder="Type your letter here..."
              />
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handleRewrite('Formal & Elegant')} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[9px] font-bold uppercase py-2 rounded-lg text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-1">
                   <Sparkles className="w-3 h-3" /> Formalize
                </button>
                <button onClick={() => handleRewrite('Romantic & Poetic')} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[9px] font-bold uppercase py-2 rounded-lg text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-1">
                   <Sparkles className="w-3 h-3" /> Romanticize
                </button>
                <button onClick={() => handleRewrite('Archaic & Old English')} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[9px] font-bold uppercase py-2 rounded-lg text-slate-600 dark:text-slate-400 transition-colors flex items-center justify-center gap-1">
                   <Sparkles className="w-3 h-3" /> Archaic
                </button>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Type className="w-3 h-3" /> Typography
              </label>
              
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                 {FONTS.map(f => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedFont(f)}
                      className={`p-2 rounded-lg text-lg text-center transition-all border ${selectedFont.name === f.name ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-100'}`}
                      style={{ fontFamily: f.family }}
                    >
                       {f.name}
                    </button>
                 ))}
              </div>

              <div className="flex gap-4 items-center">
                 <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Ink Color</span>
                    <div className="flex gap-2">
                       {['#1e293b', '#0f172a', '#1e3a8a', '#450a0a', '#064e3b'].map(c => (
                          <button 
                            key={c}
                            onClick={() => setInkColor(c)}
                            className={`w-6 h-6 rounded-full border-2 ${inkColor === c ? 'border-emerald-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'} transition-all`}
                            style={{ backgroundColor: c }}
                          />
                       ))}
                       <input 
                          type="color" 
                          value={inkColor}
                          onChange={(e) => setInkColor(e.target.value)}
                          className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-none bg-transparent"
                       />
                    </div>
                 </div>
                 <div className="flex-1 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Size: {fontSize}px</span>
                    <input 
                       type="range" 
                       min="12" 
                       max="60" 
                       value={fontSize} 
                       onChange={(e) => setFontSize(Number(e.target.value))}
                       className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                 </div>
              </div>
            </div>

            {/* Paper Factory */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-3 h-3" /> Paper Foundry
              </label>
              
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                 {PAPER_PRESETS.map(p => (
                    <button
                       key={p.name}
                       onClick={() => handleGeneratePaper(p.prompt)}
                       className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-[9px] font-bold uppercase text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
                    >
                       {p.name}
                    </button>
                 ))}
              </div>

              <div className="flex gap-2">
                 <input 
                    value={customPaperPrompt}
                    onChange={(e) => setCustomPaperPrompt(e.target.value)}
                    placeholder="Describe custom paper texture..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                 />
                 <button 
                    onClick={() => handleGeneratePaper()}
                    disabled={textureStatus === 'loading'}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 rounded-xl hover:scale-105 transition-transform shadow-lg"
                 >
                    {textureStatus === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                 </button>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
               <button 
                  onClick={handleCopyText}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
               >
                  <Copy className="w-4 h-4" /> Copy Text
               </button>
               <button 
                  onClick={handleExportPDF}
                  disabled={status === 'loading'}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-xs"
               >
                  {status === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export PDF
               </button>
            </div>

          </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-100 dark:bg-[#0B0F17] rounded-[3rem] border border-slate-200 dark:border-slate-900 p-8 shadow-inner overflow-hidden relative">
           {/* Desk texture background */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-5 pointer-events-none"></div>
           
           <div className="relative z-10 w-full max-w-[210mm] shadow-2xl transition-all duration-500 group">
              <div 
                 ref={previewRef}
                 className="aspect-[1/1.414] w-full bg-white relative overflow-hidden"
                 style={{ 
                    backgroundImage: paperTextureUrl ? `url(${paperTextureUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: paperTextureUrl ? 'transparent' : '#fff'
                 }}
              >
                 {!paperTextureUrl && (
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50"></div>
                 )}
                 
                 <div className="p-[10%] h-full w-full">
                    <p 
                       className="whitespace-pre-wrap leading-loose break-words"
                       style={{ 
                          fontFamily: selectedFont.family, 
                          color: inkColor,
                          fontSize: `${fontSize}px`
                       }}
                    >
                       {inputText}
                    </p>
                 </div>
                 
                 {/* Watermark only visible in preview, captured by html2canvas */}
                 <div className="absolute bottom-4 right-4 text-[10px] opacity-30 font-sans text-slate-500 uppercase tracking-widest font-bold pointer-events-none">
                    Digital Gentry Scribe
                 </div>
              </div>
           </div>
           
           <div className="mt-8 text-center space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">A4 Preview • Scale 100%</p>
              <p className="text-[10px] text-slate-500">Note: PDF export captures high-resolution vector text & texture.</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default HandwritingTool;
