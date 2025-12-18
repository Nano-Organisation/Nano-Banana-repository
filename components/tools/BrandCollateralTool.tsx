import React, { useState } from 'react';
import { Briefcase, RefreshCw, Palette, Type, PenTool, Image as ImageIcon, Download, Layout, FileText, Presentation, Calendar } from 'lucide-react';
import { generateBrandIdentity, generateImageWithGemini, regenerateBrandPalette, regenerateBrandTypography } from '../../services/geminiService';
import { BrandIdentity, LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const PERSONALITIES = [
  'Premium & Luxury',
  'Minimalist & Clean',
  'Bold & Disruptive',
  'Playful & Friendly',
  'Trustworthy & Corporate',
  'Eco-Friendly & Organic',
  'Tech & Futuristic'
];

const BrandCollateralTool: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [vibe, setVibe] = useState('');
  const [personality, setPersonality] = useState(PERSONALITIES[0]);
  const [prefColours, setPrefColours] = useState('');
  const [prefFonts, setPrefFonts] = useState('');
  
  const [brandData, setBrandData] = useState<BrandIdentity | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [templateImages, setTemplateImages] = useState<{ [key: string]: string }>({});
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [logoStatus, setLogoStatus] = useState<LoadingState>('idle');
  const [templateStatus, setTemplateStatus] = useState<{ [key: string]: LoadingState }>({});

  const handleGenerate = async () => {
    if (!companyName.trim() || !industry.trim()) return;
    setStatus('loading');
    setBrandData(null);
    setLogoImage(null);
    setTemplateImages({});
    setLogoStatus('idle');
    setTemplateStatus({});

    try {
      const result = await generateBrandIdentity(companyName, industry, vibe, personality, prefColours, prefFonts);
      setBrandData(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleRegeneratePalette = async () => {
    if (!brandData) return;
    try {
      const newPalette = await regenerateBrandPalette(brandData);
      setBrandData(prev => prev ? { ...prev, colorPalette: newPalette.colorPalette } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerateTypography = async () => {
    if (!brandData) return;
    try {
      const newType = await regenerateBrandTypography(brandData);
      setBrandData(prev => prev ? { ...prev, fontPairing: newType.fontPairing } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateLogo = async () => {
    if (!brandData) return;
    setLogoStatus('loading');
    try {
      const prompt = `Professional logo design for "${brandData.companyName}". ${brandData.logoPrompt}. Vector style, minimalist, white background, high quality.`;
      const img = await generateImageWithGemini(prompt, '1:1');
      setLogoImage(img);
      setLogoStatus('success');
    } catch (e) {
      console.error(e);
      setLogoStatus('error');
    }
  };

  const handleGenerateTemplate = async (type: 'stationary' | 'ppt' | 'calendar') => {
    if (!brandData) return;
    setTemplateStatus(prev => ({ ...prev, [type]: 'loading' }));
    try {
      let prompt = '';
      if (type === 'stationary') prompt = `High quality corporate stationary mockup including business cards and letterhead for "${brandData.companyName}". ${brandData.stationaryPrompt}. Photorealistic, soft lighting.`;
      if (type === 'ppt') prompt = `Professional PowerPoint presentation title slide design for "${brandData.companyName}" displayed on a laptop screen mockup. ${brandData.pptTemplatePrompt}. Modern UI.`;
      if (type === 'calendar') prompt = `Branded corporate desk calendar design for "${brandData.companyName}" sitting on a wooden desk. ${brandData.calendarPrompt}. Photorealistic.`;

      const img = await generateImageWithGemini(prompt, '16:9');
      setTemplateImages(prev => ({ ...prev, [type]: img }));
      setTemplateStatus(prev => ({ ...prev, [type]: 'success' }));
    } catch (e) {
      console.error(e);
      setTemplateStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  const handleDownloadImage = async (url: string, prefix: string) => {
    if (!url) return;
    const watermarked = await addWatermarkToImage(url);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `${companyName.replace(/\s+/g, '_')}_${prefix}.png`;
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Briefcase className="w-8 h-8 text-orange-500" />
          AI Brand
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate a complete brand identity package with visual templates.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
              <input 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Dynamics"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Industry</label>
              <input 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Fintech, Organic Skincare"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Brand Personality</label>
              <select 
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {PERSONALITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Vibe / Values</label>
              <textarea 
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. Innovative, Sustainable, Community-driven..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 h-20 resize-none"
              />
            </div>
            
            {/* Optional Preferences */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Preferred Colours (Optional)</label>
                  <input 
                    value={prefColours}
                    onChange={(e) => setPrefColours(e.target.value)}
                    placeholder="e.g. Navy Blue and Gold"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Preferred Fonts (Optional)</label>
                  <input 
                    value={prefFonts}
                    onChange={(e) => setPrefFonts(e.target.value)}
                    placeholder="e.g. Serif headings, Sans-serif body"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
               </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!companyName || !industry || status === 'loading'}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20 mt-2"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Palette />}
              Generate Brand Kit
            </button>
          </div>
        </div>

        {/* OUTPUT */}
        <div className="lg:col-span-2 space-y-6">
          {!brandData && status !== 'loading' && (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 min-h-[400px]">
                <Briefcase className="w-16 h-16 opacity-20 mb-4" />
                <p>Enter company details to generate branding.</p>
             </div>
          )}

          {status === 'loading' && (
             <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[400px]">
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-orange-400 font-bold animate-pulse">Designing identity...</p>
             </div>
          )}

          {brandData && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* BRAND HEADER */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-2">
                 <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{brandData.companyName}</h1>
                 <p className="text-xl text-orange-500 dark:text-orange-400 font-serif italic">"{brandData.slogan}"</p>
                 <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">{brandData.missionStatement}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* COLOURS */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg relative group">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                          <Palette className="w-4 h-4" /> Colour Palette
                       </h3>
                       <button onClick={handleRegeneratePalette} className="text-xs text-orange-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Regenerate
                       </button>
                    </div>
                    <div className="space-y-3">
                       {brandData.colorPalette.map((color, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                             <div 
                                className="w-12 h-12 rounded-lg shadow-sm border border-white/10" 
                                style={{ backgroundColor: color.hex }}
                             ></div>
                             <div>
                                <div className="font-bold text-slate-900 dark:text-white">{color.name}</div>
                                <div className="text-xs text-slate-500 font-mono">{color.hex}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* FONTS & VOICE */}
                 <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg relative group">
                       <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                             <Type className="w-4 h-4" /> Typography
                          </h3>
                          <button onClick={handleRegenerateTypography} className="text-xs text-orange-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                             <RefreshCw className="w-3 h-3" /> Regenerate
                          </button>
                       </div>
                       <div className="space-y-3">
                          <div>
                             <span className="text-xs text-slate-500 block mb-1">Heading Font</span>
                             <div className="text-lg text-slate-900 dark:text-white font-bold bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                {brandData.fontPairing.heading}
                             </div>
                          </div>
                          <div>
                             <span className="text-xs text-slate-500 block mb-1">Body Font</span>
                             <div className="text-md text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                {brandData.fontPairing.body}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
                       <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                          <PenTool className="w-4 h-4" /> Brand Voice
                       </h3>
                       <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {brandData.brandVoice}
                       </p>
                    </div>
                 </div>
              </div>

              {/* LOGO GENERATOR */}
              <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       <ImageIcon className="w-5 h-5 text-orange-500" /> Logo Concept
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                       Prompt Idea: {brandData.logoPrompt}
                    </p>
                    <button 
                       onClick={handleGenerateLogo}
                       disabled={logoStatus === 'loading'}
                       className="bg-orange-600 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 dark:hover:bg-slate-200 transition-colors shadow-lg"
                    >
                       {logoStatus === 'loading' ? <RefreshCw className="animate-spin" /> : <Palette />}
                       Visualize Logo
                    </button>
                 </div>
                 
                 <div className="w-48 h-48 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 border-dashed relative overflow-hidden group">
                    {logoStatus === 'loading' ? (
                       <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                    ) : logoImage ? (
                       <>
                          <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                             <button onClick={() => handleDownloadImage(logoImage, 'logo')} className="text-white font-bold flex items-center gap-1">
                                <Download className="w-4 h-4" /> Save
                             </button>
                          </div>
                       </>
                    ) : (
                       <span className="text-xs text-slate-400 text-center px-4">Click Visualize to generate</span>
                    )}
                 </div>
              </div>

              {/* STATIONARY & TEMPLATES (EXPANDED LAYOUT) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                    <Layout className="w-6 h-6 text-orange-500" /> Visual Assets & Templates
                 </h3>
                 
                 <div className="space-y-12">
                    
                    {/* Stationary Row */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                       <div className="md:w-1/3 space-y-2">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <FileText className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Stationary Mockup
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Business cards, letterheads, and envelopes.</p>
                          <button 
                             onClick={() => handleGenerateTemplate('stationary')}
                             disabled={templateStatus['stationary'] === 'loading'}
                             className="text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-bold text-sm flex items-center gap-2 mt-2"
                          >
                             {templateStatus['stationary'] === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                             {templateImages.stationary ? 'Regenerate' : 'Generate Mockup'}
                          </button>
                       </div>
                       <div className="md:w-2/3 w-full">
                          <div className="aspect-video bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center relative group overflow-hidden shadow-md">
                             {templateImages.stationary ? (
                                <>
                                   <img src={templateImages.stationary} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button onClick={() => handleDownloadImage(templateImages.stationary, 'stationary')} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                                         <Download className="w-4 h-4" /> Save
                                      </button>
                                   </div>
                                </>
                             ) : (
                                <span className="text-slate-400 dark:text-slate-700 text-sm">Click Generate to visualize</span>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* PPT Row */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                       <div className="md:w-1/3 space-y-2">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <Presentation className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Presentation Slide
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Branded PowerPoint title slide concept.</p>
                          <button 
                             onClick={() => handleGenerateTemplate('ppt')}
                             disabled={templateStatus['ppt'] === 'loading'}
                             className="text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-bold text-sm flex items-center gap-2 mt-2"
                          >
                             {templateStatus['ppt'] === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                             {templateImages.ppt ? 'Regenerate' : 'Generate Mockup'}
                          </button>
                       </div>
                       <div className="md:w-2/3 w-full">
                          <div className="aspect-video bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center relative group overflow-hidden shadow-md">
                             {templateImages.ppt ? (
                                <>
                                   <img src={templateImages.ppt} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button onClick={() => handleDownloadImage(templateImages.ppt, 'ppt')} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                                         <Download className="w-4 h-4" /> Save
                                      </button>
                                   </div>
                                </>
                             ) : (
                                <span className="text-slate-400 dark:text-slate-700 text-sm">Click Generate to visualize</span>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Calendar Row */}
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                       <div className="md:w-1/3 space-y-2">
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Desk Calendar
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Corporate branded calendar design.</p>
                          <button 
                             onClick={() => handleGenerateTemplate('calendar')}
                             disabled={templateStatus['calendar'] === 'loading'}
                             className="text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-bold text-sm flex items-center gap-2 mt-2"
                          >
                             {templateStatus['calendar'] === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                             {templateImages.calendar ? 'Regenerate' : 'Generate Mockup'}
                          </button>
                       </div>
                       <div className="md:w-2/3 w-full">
                          <div className="aspect-video bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center relative group overflow-hidden shadow-md">
                             {templateImages.calendar ? (
                                <>
                                   <img src={templateImages.calendar} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button onClick={() => handleDownloadImage(templateImages.calendar, 'calendar')} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform">
                                         <Download className="w-4 h-4" /> Save
                                      </button>
                                   </div>
                                </>
                             ) : (
                                <span className="text-slate-400 dark:text-slate-700 text-sm">Click Generate to visualize</span>
                             )}
                          </div>
                       </div>
                    </div>

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