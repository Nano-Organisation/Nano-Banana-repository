import React, { useState } from 'react';
import { Shield, Crown, Scissors, RefreshCw, Download, Layers, PenTool } from 'lucide-react';
import { generateImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const HeritageTool: React.FC = () => {
  const [mode, setMode] = useState<'emblem' | 'signet' | 'textile'>('emblem');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  // Emblem State
  const [emblemName, setEmblemName] = useState('');
  const [emblemSymbols, setEmblemSymbols] = useState('');
  const [emblemColors, setEmblemColors] = useState('');
  const [emblemMotto, setEmblemMotto] = useState('');

  // Signet State
  const [signetMetal, setSignetMetal] = useState('Gold');
  const [signetSymbol, setSignetSymbol] = useState('');
  const [signetInitials, setSignetInitials] = useState('');

  // Textile State
  const [textileType, setTextileType] = useState('Tartan');
  const [textileColors, setTextileColors] = useState('');
  const [textileRegion, setTextileRegion] = useState('');

  const handleGenerate = async () => {
    setStatus('loading');
    setResultImage(null);
    let prompt = '';

    try {
      if (mode === 'emblem') {
        if (!emblemName.trim() && !emblemSymbols.trim()) return;
        prompt = `Intricate Heraldic Coat of Arms for family "${emblemName}". 
        Central shield symbols: ${emblemSymbols}. 
        Colors: ${emblemColors || 'Royal Gold and Deep Blue'}. 
        Motto on ribbon: "${emblemMotto}". 
        Style: High-detail vector heraldry, ornate mantling, medieval crest, white background, masterpiece.`;
      } 
      else if (mode === 'signet') {
        if (!signetSymbol.trim() && !signetInitials.trim()) return;
        prompt = `Macro photography of an expensive ${signetMetal} signet ring. 
        Engraving details: Deep intaglio engraving of ${signetSymbol || 'family crest'} ${signetInitials ? `with initials ${signetInitials}` : ''}. 
        Lighting: Cinematic, rim lighting, metallic reflection, photorealistic, 8k resolution.`;
      } 
      else if (mode === 'textile') {
        if (!textileColors.trim()) return;
        const texture = textileType === 'Tartan' ? 'woven wool tartan pattern' : 'herringbone tweed fabric texture';
        prompt = `Seamless ${texture}. 
        Colors: ${textileColors}. 
        ${textileRegion ? `Style inspiration: ${textileRegion} clan style.` : ''} 
        Detail: Ultra-realistic fabric close-up, visible threads, high quality texture map.`;
      }

      const img = await generateImageWithGemini(prompt, '1:1');
      setResultImage(img);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    const watermarked = await addWatermarkToImage(resultImage);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `nano-heritage-${mode}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Shield className="w-8 h-8 text-amber-600" />
          AI Heritage
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Design intricate family crests, signet rings, and authentic textiles.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash-image
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mode Selector */}
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl flex border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setMode('emblem')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                mode === 'emblem' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crown className="w-3 h-3" /> Emblem
            </button>
            <button
              onClick={() => setMode('signet')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                mode === 'signet' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-3 h-3" /> Signet
            </button>
            <button
              onClick={() => setMode('textile')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                mode === 'textile' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scissors className="w-3 h-3" /> Textile
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            
            {/* EMBLEM FORM */}
            {mode === 'emblem' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Family Name</label>
                  <input 
                    value={emblemName}
                    onChange={(e) => setEmblemName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                    placeholder="e.g. Windsor"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Symbols / Charges</label>
                  <textarea 
                    value={emblemSymbols}
                    onChange={(e) => setEmblemSymbols(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none h-20 resize-none transition-all"
                    placeholder="e.g. A roaring lion, three stars, an oak tree..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Colors</label>
                  <input 
                    value={emblemColors}
                    onChange={(e) => setEmblemColors(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                    placeholder="e.g. Crimson and Gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Motto (Latin or English)</label>
                  <input 
                    value={emblemMotto}
                    onChange={(e) => setEmblemMotto(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                    placeholder="e.g. Fortis et Fidelis"
                  />
                </div>
              </div>
            )}

            {/* SIGNET FORM */}
            {mode === 'signet' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Metal Type</label>
                  <select 
                    value={signetMetal}
                    onChange={(e) => setSignetMetal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                  >
                    <option>Gold</option>
                    <option>Silver</option>
                    <option>Rose Gold</option>
                    <option>Black Onyx</option>
                    <option>Lapis Lazuli</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Symbol to Engrave</label>
                  <textarea 
                    value={signetSymbol}
                    onChange={(e) => setSignetSymbol(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none h-20 resize-none transition-all"
                    placeholder="e.g. A wolf's head, an anchor, a rose..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Initials (Optional)</label>
                  <input 
                    value={signetInitials}
                    onChange={(e) => setSignetInitials(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                    placeholder="e.g. J.D."
                  />
                </div>
              </div>
            )}

            {/* TEXTILE FORM */}
            {mode === 'textile' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fabric Type</label>
                  <select 
                    value={textileType}
                    onChange={(e) => setTextileType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                  >
                    <option>Tartan</option>
                    <option>Tweed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Color Palette</label>
                  <input 
                    value={textileColors}
                    onChange={(e) => setTextileColors(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                    placeholder="e.g. Forest green, navy blue, thin red line"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Region / Style (Optional)</label>
                  <input 
                    value={textileRegion}
                    onChange={(e) => setTextileRegion(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-amber-600 focus:outline-none transition-all"
                    placeholder="e.g. Scottish Highlands, Harris"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={status === 'loading'}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20 mt-2"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Layers />}
              Generate {mode === 'emblem' ? 'Emblem' : mode === 'signet' ? 'Ring' : 'Fabric'}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-2">
          <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative shadow-2xl group max-w-xl mx-auto">
            {status === 'loading' ? (
               <div className="text-center space-y-4">
                 <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-amber-600 font-bold animate-pulse">Forging heritage...</p>
               </div>
            ) : resultImage ? (
               <>
                  <img src={resultImage} alt="Generated Heritage Asset" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <button 
                      onClick={handleDownload}
                      className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
               </>
            ) : (
               <div className="text-slate-400 dark:text-slate-600 flex flex-col items-center">
                 <Shield className="w-20 h-20 opacity-20 mb-4" />
                 <p className="font-bold text-sm tracking-widest uppercase opacity-40">Awaiting Heritage Config</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeritageTool;