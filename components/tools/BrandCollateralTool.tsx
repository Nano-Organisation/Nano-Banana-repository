
import React, { useState } from 'react';
import { Briefcase, RefreshCw, Palette, Type, PenTool, Image as ImageIcon, Download } from 'lucide-react';
import { generateBrandIdentity, generateImageWithGemini } from '../../services/geminiService';
import { BrandIdentity, LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const BrandCollateralTool: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [vibe, setVibe] = useState('');
  const [brandData, setBrandData] = useState<BrandIdentity | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [logoStatus, setLogoStatus] = useState<LoadingState>('idle');

  const handleGenerate = async () => {
    if (!companyName.trim() || !industry.trim()) return;
    setStatus('loading');
    setBrandData(null);
    setLogoImage(null);
    setLogoStatus('idle');

    try {
      const result = await generateBrandIdentity(companyName, industry, vibe);
      setBrandData(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleGenerateLogo = async () => {
    if (!brandData) return;
    setLogoStatus('loading');
    try {
      // Enhance prompt for logo specific quality
      const prompt = `Professional logo design for "${brandData.companyName}". ${brandData.logoPrompt}. Vector style, minimalist, white background, high quality.`;
      const img = await generateImageWithGemini(prompt, '1:1');
      setLogoImage(img);
      setLogoStatus('success');
    } catch (e) {
      console.error(e);
      setLogoStatus('error');
    }
  };

  const handleDownloadLogo = async () => {
    if (!logoImage) return;
    const watermarked = await addWatermarkToImage(logoImage);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `${companyName.replace(/\s+/g, '_')}_logo.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Briefcase className="w-8 h-8 text-orange-500" />
          Nano Brand
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate a complete brand identity package.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
              <input 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Dynamics"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Industry</label>
              <input 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Fintech, Organic Skincare"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Vibe / Values</label>
              <textarea 
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. Modern, Trustworthy, Eco-friendly, Minimalist..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!companyName || !industry || status === 'loading'}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Palette />}
              Generate Brand Kit
            </button>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="lg:col-span-2 space-y-6">
          {!brandData && status !== 'loading' && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-12 min-h-[400px]">
                <Briefcase className="w-16 h-16 opacity-20 mb-4" />
                <p>Enter company details to generate branding.</p>
             </div>
          )}

          {status === 'loading' && (
             <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[400px]">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-orange-400 font-bold animate-pulse">Designing identity...</p>
             </div>
          )}

          {brandData && (
            <div className="space-y-6 animate-fade-in-up">
              
              {/* BRAND HEADER */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-2">
                 <h1 className="text-4xl font-bold text-white tracking-tight">{brandData.companyName}</h1>
                 <p className="text-xl text-orange-400 font-serif italic">"{brandData.slogan}"</p>
                 <p className="text-sm text-slate-400 mt-4 max-w-2xl mx-auto">{brandData.missionStatement}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* COLORS */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                       <Palette className="w-4 h-4" /> Color Palette
                    </h3>
                    <div className="space-y-3">
                       {brandData.colorPalette.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-slate-950 p-2 rounded-lg border border-slate-800">
                             <div 
                                className="w-12 h-12 rounded-lg shadow-sm border border-white/10" 
                                style={{ backgroundColor: color.hex }}
                             ></div>
                             <div>
                                <div className="font-bold text-white">{color.name}</div>
                                <div className="text-xs text-slate-500 font-mono">{color.hex}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* FONTS & VOICE */}
                 <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                       <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                          <Type className="w-4 h-4" /> Typography
                       </h3>
                       <div className="space-y-3">
                          <div>
                             <span className="text-xs text-slate-500 block mb-1">Heading Font</span>
                             <div className="text-lg text-white font-bold bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                                {brandData.fontPairing.heading}
                             </div>
                          </div>
                          <div>
                             <span className="text-xs text-slate-500 block mb-1">Body Font</span>
                             <div className="text-md text-slate-300 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                                {brandData.fontPairing.body}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                       <h3 className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                          <PenTool className="w-4 h-4" /> Brand Voice
                       </h3>
                       <p className="text-sm text-slate-300 leading-relaxed">
                          {brandData.brandVoice}
                       </p>
                    </div>
                 </div>
              </div>

              {/* LOGO GENERATOR */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <ImageIcon className="w-5 h-5 text-orange-500" /> Logo Concept
                    </h3>
                    <p className="text-sm text-slate-400">
                       Prompt Idea: {brandData.logoPrompt}
                    </p>
                    <button 
                       onClick={handleGenerateLogo}
                       disabled={logoStatus === 'loading'}
                       className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg"
                    >
                       {logoStatus === 'loading' ? <RefreshCw className="animate-spin" /> : <Palette />}
                       Visualize Logo
                    </button>
                 </div>
                 
                 <div className="w-48 h-48 bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-700 border-dashed relative overflow-hidden group">
                    {logoStatus === 'loading' ? (
                       <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                    ) : logoImage ? (
                       <>
                          <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                             <button onClick={handleDownloadLogo} className="text-white font-bold flex items-center gap-1">
                                <Download className="w-4 h-4" /> Save
                             </button>
                          </div>
                       </>
                    ) : (
                       <span className="text-xs text-slate-500 text-center px-4">Click Visualize to generate</span>
                    )}
                 </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandCollateralTool;
