
import React, { useState, useRef } from 'react';
import { Eye, Upload, RefreshCw, Grid, MousePointer2, Ruler, AlertTriangle, CheckCircle2, Download, CheckSquare, Square } from 'lucide-react';
import { analyzeImageWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const PERSONAS = [
  { id: 'brutal', label: 'The Director', desc: 'Brutal, uncompromising expert critique.' },
  { id: 'constructive', label: 'The Mentor', desc: 'Growth-oriented, actionable feedback.' },
  { id: 'technical', label: 'The Architect', desc: 'Structural, grid, and heuristic analysis.' }
];

interface AnalysisResult {
  verdict: string;
  details: string;
  recommendations: string[];
}

const DesignCritic: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [acceptedRecs, setAcceptedRecs] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await runFileSecurityChecks(file, 'image');
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
        setAnalysis(null);
        setAcceptedRecs(new Set());
      } catch (e: any) { alert(e.message); }
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setStatus('loading');
    setAnalysis(null);
    setAcceptedRecs(new Set());
    
    // Structured JSON Prompt Instructions
    const baseInstruction = `You are a highly-qualified, learned design expert with decades of experience in visual arts, UI/UX, and graphic design. 
    Analyze this image with extreme precision using your Vision capabilities. 
    
    CRITICAL RULES:
    1. Do NOT hallucinate features. Stick strictly to what is visible in the provided image.
    2. Use professional design terminology (e.g., hierarchy, whitespace, kerning, leading, contrast ratio, visual weight).
    3. You MUST return the result as a valid JSON object. Do not wrap it in markdown code blocks. The JSON structure is:
    {
      "verdict": "A short, punchy summary of the design quality",
      "details": "The detailed critique in Markdown format. Use headers and bullets.",
      "recommendations": ["Actionable Item 1", "Actionable Item 2", "Actionable Item 3", ...]
    }`;

    const promptMap: Record<string, string> = {
       'brutal': `${baseInstruction}
       Persona: Brutal Creative Director (Paul Rand/Massimo Vignelli style).
       Tone: Cynical, harsh, uncompromising, technically flawless. Short sentences.
       Task: Roast this design. Identify every alignment error, bad font choice, and poor color contrast.`,
       
       'constructive': `${baseInstruction}
       Persona: Empathetic Senior Design Mentor.
       Tone: Professional, educational, encouraging but honest.
       Task: Analyze the design strengths and weaknesses. Explain *why* something works or doesn't.`,
       
       'technical': `${baseInstruction}
       Persona: Lead Design Systems Architect.
       Tone: Objective, robotic, analytical, "blueprint" style.
       Task: Audit the layout, grid usage, spacing system, and usability heuristics.`
    };

    try {
      const resultText = await analyzeImageWithGemini(image, promptMap[persona]);
      
      // Parse JSON from text
      let parsed: AnalysisResult;
      try {
         // Attempt to clean markdown code blocks if present
         const cleanText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
         parsed = JSON.parse(cleanText);
      } catch (jsonErr) {
         console.warn("JSON Parse Failed, falling back to text", jsonErr);
         // Fallback if model fails to return JSON
         parsed = {
            verdict: "Analysis Complete",
            details: resultText,
            recommendations: []
         };
      }

      setAnalysis(parsed);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const toggleRec = (index: number) => {
    const next = new Set(acceptedRecs);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setAcceptedRecs(next);
  };

  const toggleAll = () => {
    if (!analysis) return;
    if (acceptedRecs.size === analysis.recommendations.length) {
       setAcceptedRecs(new Set());
    } else {
       const all = new Set(analysis.recommendations.map((_, i) => i));
       setAcceptedRecs(all);
    }
  };

  const handleExport = () => {
    if (!analysis) return;
    
    const acceptedList = analysis.recommendations
       .filter((_, i) => acceptedRecs.has(i))
       .map(r => `- [ ] ${r}`)
       .join('\n');

    const report = `AI DESIGN CRITIC REPORT
Generated by Digital Gentry AI
----------------------------
VERDICT: ${analysis.verdict}
MODE: ${persona.toUpperCase()}

FULL CRITIQUE:
${analysis.details}

----------------------------
ACTION PLAN (ACCEPTED ITEMS):
${acceptedList || '(No recommendations selected)'}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-critique-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-mono">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-3 tracking-tighter uppercase">
          <Ruler className="w-8 h-8 text-blue-600" />
          AI_Design_Critic
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase">Automated Expert Analysis Module</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* LEFT COLUMN: Controls & Input */}
         <div className="space-y-6">
            
            {/* Image Upload Area - Blueprint Style */}
            <div 
               onClick={() => fileRef.current?.click()}
               className={`
                  aspect-video relative flex flex-col items-center justify-center cursor-pointer transition-all border-2 border-dashed
                  bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:20px_20px]
                  ${image ? 'border-blue-500 bg-slate-900' : 'border-slate-700 hover:border-blue-500 hover:bg-slate-900/50'}
               `}
            >
               {/* Technical Markers */}
               <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500/50"></div>
               <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500/50"></div>
               <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500/50"></div>
               <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500/50"></div>
               
               {image ? (
                  <div className="relative w-full h-full p-6">
                     <img src={image} className="w-full h-full object-contain" />
                     <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1">
                        IMG_LOADED
                     </div>
                  </div>
               ) : (
                  <div className="text-center text-slate-500">
                     <div className="w-16 h-16 border border-slate-600 flex items-center justify-center mx-auto mb-4 rounded-full">
                        <Upload className="w-6 h-6" />
                     </div>
                     <p className="uppercase tracking-widest text-xs font-bold">Upload Source_File</p>
                     <p className="text-[10px] mt-1 opacity-60">JPB / PNG / WEBP</p>
                  </div>
               )}
               <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
            </div>

            {/* Persona Selector */}
            <div className="space-y-2">
               <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                  <span>Select Expert_Mode</span>
                  <span>ID: {persona.toUpperCase()}</span>
               </div>
               <div className="grid grid-cols-1 gap-2">
                  {PERSONAS.map(p => (
                     <button
                        key={p.id}
                        onClick={() => setPersona(p.id)}
                        className={`p-3 text-left transition-all border relative overflow-hidden group ${
                           persona === p.id 
                           ? 'bg-blue-600/10 border-blue-500 text-white' 
                           : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                     >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${persona === p.id ? 'bg-blue-500' : 'bg-transparent group-hover:bg-slate-700'}`}></div>
                        <div className="pl-3">
                           <div className="text-sm font-bold uppercase">{p.label}</div>
                           <div className="text-[10px] opacity-70">{p.desc}</div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <button
               onClick={handleAnalyze}
               disabled={!image || status === 'loading'}
               className={`w-full font-bold py-4 text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${
                  status === 'loading'
                  ? 'bg-slate-800 border-slate-700 text-slate-500'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]'
               }`}
            >
               {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Eye className="w-4 h-4" />}
               Initialize_Review
            </button>
         </div>

         {/* RIGHT COLUMN: Output Terminal */}
         <div className="bg-[#0f172a] border border-slate-700 shadow-2xl min-h-[600px] flex flex-col relative overflow-hidden">
            {/* Screen Line Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
            
            {/* Terminal Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center z-30">
               <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest">
                  <Grid className="w-4 h-4" /> Analysis_Log
               </div>
               <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                  <span>MEM: 64K</span>
                  <span>CPU: 12%</span>
               </div>
            </div>

            <div className="flex-1 p-6 relative z-10 overflow-y-auto custom-scrollbar">
               {status === 'loading' ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                     <div className="w-16 h-16 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-blue-400 text-xs font-bold animate-pulse uppercase tracking-widest">
                        Scanning_Pixels...<br/>
                        Analyzing_Composition...
                     </p>
                  </div>
               ) : analysis ? (
                  <div className="space-y-8">
                     {/* Verdict */}
                     <div className="border border-slate-700 bg-slate-900/50 p-4">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">VERDICT</div>
                        <div className="text-lg font-bold text-white uppercase">{analysis.verdict}</div>
                     </div>

                     {/* Details */}
                     <div className="prose prose-invert prose-sm max-w-none font-mono text-xs leading-relaxed border-b border-slate-800 pb-6">
                        <div className="text-blue-400 mb-4 text-[10px] uppercase tracking-widest">
                           <CheckCircle2 className="w-3 h-3 inline mr-2"/> Detailed Analysis
                        </div>
                        <div className="whitespace-pre-wrap text-slate-300 font-mono">
                           {analysis.details}
                        </div>
                     </div>

                     {/* Recommendations Matrix */}
                     {analysis.recommendations.length > 0 && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between text-blue-400 text-[10px] uppercase tracking-widest border-b border-blue-900/30 pb-2">
                              <span><AlertTriangle className="w-3 h-3 inline mr-2"/> Action_Items</span>
                              <button onClick={toggleAll} className="hover:text-white underline">
                                 {acceptedRecs.size === analysis.recommendations.length ? 'DESELECT_ALL' : 'SELECT_ALL'}
                              </button>
                           </div>
                           
                           <div className="space-y-2">
                              {analysis.recommendations.map((rec, idx) => (
                                 <div 
                                    key={idx} 
                                    onClick={() => toggleRec(idx)}
                                    className={`flex items-start gap-3 p-3 text-xs font-mono border cursor-pointer transition-all ${
                                       acceptedRecs.has(idx) 
                                       ? 'bg-blue-900/20 border-blue-500 text-blue-100' 
                                       : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-600'
                                    }`}
                                 >
                                    <div className="mt-0.5">
                                       {acceptedRecs.has(idx) ? <CheckSquare className="w-4 h-4 text-blue-500"/> : <Square className="w-4 h-4"/>}
                                    </div>
                                    <span className="leading-relaxed">{rec}</span>
                                 </div>
                              ))}
                           </div>

                           <button 
                              onClick={handleExport}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-600"
                           >
                              <Download className="w-4 h-4" /> Export_Protocol
                           </button>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-4">
                     <MousePointer2 className="w-12 h-12 opacity-20" />
                     <div className="space-y-1">
                        <p className="text-xs uppercase tracking-widest text-slate-500">System_Standby</p>
                        <p className="text-[10px] text-slate-700">Awaiting visual input for critique protocol.</p>
                     </div>
                  </div>
               )}
            </div>
            
            {/* Status Footer */}
            <div className="bg-slate-900 border-t border-slate-800 p-2 px-4 flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider z-30">
               <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'loading' ? 'bg-yellow-500 animate-pulse' : status === 'success' ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                  {status === 'idle' ? 'Ready' : status === 'loading' ? 'Processing' : 'Done'}
               </span>
               <span>Mode: {persona.toUpperCase()}</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DesignCritic;
