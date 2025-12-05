
import React, { useState } from 'react';
import { Layout, Smartphone, Monitor, Download, RefreshCw, Layers, Moon, Sun, Type, FileCode } from 'lucide-react';
import { generateImageWithGemini, generateUiCode } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const DEVICES = [
  { id: 'desktop', label: 'Desktop Web', icon: Monitor },
  { id: 'mobile', label: 'Mobile App', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Layout }
];

const STYLES = [
  { id: 'clean', label: 'Clean / Modern', icon: Layout },
  { id: 'dark', label: 'Dark Mode', icon: Moon },
  { id: 'glass', label: 'Glassmorphism', icon: Layers },
  { id: 'minimal', label: 'Wireframe', icon: Type }
];

const MockupDesigner: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [device, setDevice] = useState('desktop');
  const [style, setStyle] = useState('clean');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultCode, setResultCode] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [step, setStep] = useState<string>(''); // To track granular progress

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setStatus('loading');
    setResultImage(null);
    setResultCode(null);
    
    try {
      const deviceLabel = DEVICES.find(d => d.id === device)?.label || 'UI';
      const styleLabel = STYLES.find(s => s.id === style)?.label || 'Modern';
      
      // Use 16:9 for desktop, 9:16 for mobile/tablet
      const ratio = device === 'mobile' ? '9:16' : '16:9';

      // 1. GENERATE IMAGE
      setStep('Visualizing Design...');
      const fullPrompt = `High fidelity ${deviceLabel} UI design mockup for: ${prompt}. 
      Style: ${styleLabel}. 
      Details: Professional UI/UX, clean typography, consistent color palette, Figma style, 4k resolution, professional portfolio aesthetic.`;
      
      const img = await generateImageWithGemini(fullPrompt, ratio);
      setResultImage(img); // Display image immediately

      // 2. GENERATE CODE (Using the image as reference for accuracy)
      setStep('Writing Code to Match...');
      const code = await generateUiCode('', deviceLabel, style, img); // Pass image to code gen
      setResultCode(code);

      setStatus('success');
      setStep('');
    } catch (e) {
      console.error(e);
      setStatus('error');
      setStep('');
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    const watermarked = await addWatermarkToImage(resultImage);
    const link = document.createElement('a');
    link.href = watermarked;
    link.download = `nano-mockup-${device}-${Date.now()}.png`;
    link.click();
  };

  const handleDownloadCode = () => {
    if (!resultCode) return;
    const blob = new Blob([resultCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nano-mockup-${device}-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Layout className="w-8 h-8 text-fuchsia-500" />
          Nano Mockup
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate professional UI/UX mockups for apps and websites.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash-image
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            
            {/* Device Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device Frame</label>
              <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                {DEVICES.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDevice(d.id)}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      device === d.id ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <d.icon className="w-3 h-3" />
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visual Style</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      style === s.id 
                        ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <s.icon className={`w-4 h-4 ${style === s.id ? 'text-fuchsia-400' : ''}`} />
                    <span className="text-xs font-bold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">App Concept</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A meditation app with a calming blue theme and progress tracker..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 h-32 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || status === 'loading'}
              className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-900/20"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Layout />}
              Generate Mockup
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-2">
          <div className={`
             relative bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden shadow-2xl group mx-auto transition-all
             ${device === 'mobile' ? 'aspect-[9/16] max-w-sm' : 'aspect-video w-full'}
          `}>
            {status === 'loading' && !resultImage && (
               <div className="text-center space-y-4">
                 <div className="w-16 h-16 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                 <p className="text-fuchsia-500 font-bold animate-pulse">{step || 'Designing interface...'}</p>
               </div>
            )}

            {resultImage && (
               <>
                  <img src={resultImage} alt="Generated Mockup" className="w-full h-full object-cover" />
                  
                  {/* Overlay for Loading Code or Downloading */}
                  <div className={`absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm gap-3 transition-opacity ${status === 'loading' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                     {status === 'loading' ? (
                        <div className="text-center text-white space-y-2">
                           <RefreshCw className="w-8 h-8 animate-spin mx-auto text-fuchsia-500" />
                           <p className="font-bold">{step}</p>
                        </div>
                     ) : (
                        <>
                           <button 
                              onClick={handleDownload}
                              className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                           >
                              <Download className="w-5 h-5" />
                              Download Image
                           </button>
                           {resultCode && (
                              <button 
                                 onClick={handleDownloadCode}
                                 className="bg-slate-800 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl border border-slate-600"
                              >
                                 <FileCode className="w-5 h-5" />
                                 Download HTML
                              </button>
                           )}
                        </>
                     )}
                  </div>
               </>
            )}

            {!resultImage && status !== 'loading' && (
               <div className="text-slate-600 flex flex-col items-center p-8 text-center">
                 <Layout className="w-20 h-20 opacity-20 mb-4" />
                 <p>Describe your app idea to generate a UI mockup.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupDesigner;
