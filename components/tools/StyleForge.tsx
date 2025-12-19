import React, { useState, useEffect, useRef } from 'react';
import { Palette, Plus, Save, Play, ChevronRight, ChevronLeft, Trash2, Edit3, Image as ImageIcon, Upload, X, RefreshCw, Layers, CheckCircle2, FlaskConical, AlertTriangle, Info, Download, Search, Wand2, ShieldCheck } from 'lucide-react';
import { generateImageWithGemini, generateTextWithGemini } from '../../services/geminiService';
import { UserDefinedStyle, LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';
import { dbService, STORES } from '../../utils/db';

const KNOWN_STYLES = [
  { id: 'impressionism', name: 'Impressionism', block: 'Soft brushstrokes, focus on light, everyday subjects, visible dabs of paint, vibrant colors.', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=300&auto=format&fit=crop' },
  { id: 'synthwave', name: 'Synthwave / Outrun', block: 'Neon pink and blue colors, retro-futuristic 80s aesthetic, glowing grids, sunset gradients, chrome textures.', image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=300&auto=format&fit=crop' },
  { id: 'minimalism', name: 'Minimalism', block: 'Simple geometric shapes, massive negative space, limited color palette, clean lines, no unnecessary detail.', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=300&auto=format&fit=crop' },
  { id: 'bauhaus', name: 'Bauhaus', block: 'Primary colors, geometric abstraction, industrial design influence, balance of form and function.', image: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=300&auto=format&fit=crop' },
  { id: 'gothic', name: 'Gothic / Victorian Noir', block: 'Dark atmosphere, moody shadows, ornate Victorian details, cold color palette, spooky architectural elements.', image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=300&auto=format&fit=crop' },
  { id: 'popart', name: 'Pop Art', block: 'Bold primary colors, Ben-Day dots, thick black outlines, repetitive patterns, commercial illustration aesthetic.', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=300&auto=format&fit=crop' },
  { id: 'cyberpunk', name: 'Cyberpunk', block: 'High-tech low-life, rainy cityscapes, neon signs, cybernetic enhancements, cluttered detail, high contrast.', image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=300&auto=format&fit=crop' }
];

const StyleForge: React.FC = () => {
  const [view, setView] = useState<'list' | 'create' | 'generate' | 'comparison'>('list');
  const [styles, setStyles] = useState<UserDefinedStyle[]>([]);
  const [status, setStatus] = useState<LoadingState>('idle');
  
  const [similarMatches, setSimilarMatches] = useState<any[]>([]);
  const [uniquenessSuggestions, setUniquenessSuggestions] = useState<string[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeStyleForComparison, setActiveStyleForComparison] = useState<UserDefinedStyle | null>(null);

  const [step, setStep] = useState(1);
  const [newStyle, setNewStyle] = useState<Partial<UserDefinedStyle>>({
    version: 1,
    rules: { rendering: '', colors: '', composition: '', world: '', negative: '' },
    referenceImages: []
  });
  
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [extraDetails, setExtraDetails] = useState('');
  const [genResult, setGenResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStyles();
  }, []);

  const loadStyles = async () => {
    try {
      const saved = await dbService.getAll<UserDefinedStyle>(STORES.STYLES);
      setStyles(saved.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error("Failed to load styles from IndexedDB", e);
    }
  };

  /**
   * Internal Validation Module
   * Enforces mandatory presence, English-only chars, and basic nonsense detection.
   */
  const validateInput = (text: string | undefined, allowNA = false) => {
    if (!text || !text.trim()) return false;
    const t = text.trim();
    
    // Explicit check for "n/a"
    if (allowNA && t.toLowerCase() === 'n/a') return true;
    
    // Length check for "rubbish" strings
    if (t.length < 3) return false;
    
    // English-only character set (Strictly alphanumeric + standard typography/punctuation)
    // Fix: Added – (en dash), — (em dash), and smart quotes to the permitted character set.
    if (!/^[a-zA-Z0-9\s.,!?'"()\-;:/–—‘’“”]+$/.test(t)) return false;
    
    // Heuristic nonsense detection:
    // 1. Repeating characters (e.g. "aaaaa")
    if (/(.)\1{4,}/.test(t)) return false;
    
    // 2. Lack of spaces in long strings (e.g. "verylongstringwithoutanymeaningfulspaces")
    if (t.length > 25 && !t.includes(' ')) return false;

    return true;
  };

  const isCurrentStepValid = () => {
    if (step === 1) {
      return validateInput(newStyle.name) && validateInput(newStyle.concept);
    }
    if (step === 2) {
      return (
        validateInput(newStyle.rules?.rendering) &&
        validateInput(newStyle.rules?.colors) &&
        validateInput(newStyle.rules?.composition) &&
        validateInput(newStyle.rules?.world)
      );
    }
    if (step === 3) {
      return validateInput(newStyle.rules?.negative, true);
    }
    return true;
  };

  const handleNextStep = () => {
    if (isCurrentStepValid()) {
      setStep(s => s + 1);
    }
    // Quietly ignore invalid/rubbish input
  };

  const handlePrevStep = () => setStep(s => s - 1);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
       if ((newStyle.referenceImages?.length || 0) + newImages.length >= 30) break;
       try {
          await runFileSecurityChecks(files[i], 'image');
          const reader = new FileReader();
          const b64 = await new Promise<string>((res) => {
             reader.onload = () => res(reader.result as string);
             reader.readAsDataURL(files[i]);
          });
          newImages.push(b64);
       } catch (err) {}
    }
    setNewStyle(prev => ({ ...prev, referenceImages: [...(prev.referenceImages || []), ...newImages] }));
  };

  const finalizeStyle = async () => {
    // Final logic validation check
    if (!isCurrentStepValid()) return;

    setStatus('loading');
    try {
      const summaryPrompt = `Combine these style rules into a single, cohesive, reusable visual recipe paragraph for an AI image generator. 
      STYLE NAME: ${newStyle.name}
      CONCEPT: ${newStyle.concept}
      RENDERING: ${newStyle.rules?.rendering}
      COLORS: ${newStyle.rules?.colors}
      COMPOSITION: ${newStyle.rules?.composition}
      WORLD: ${newStyle.rules?.world}
      AVOID: ${newStyle.rules?.negative}
      Return ONLY the descriptive paragraph.`;

      const block = await generateTextWithGemini(summaryPrompt);
      
      const completeStyle: UserDefinedStyle = {
        id: newStyle.id || Date.now().toString(),
        version: (newStyle.version || 1) + (newStyle.id ? 1 : 0),
        name: newStyle.name || 'Unnamed Style',
        concept: newStyle.concept || '',
        rules: newStyle.rules as any,
        referenceImages: newStyle.referenceImages || [],
        styleBlock: block,
        createdAt: new Date().toISOString()
      };

      const thumb = await generateImageWithGemini(`A sample visual showcasing the style: ${block}. Abstract shape.`, '1:1');
      completeStyle.thumbnail = thumb;

      await dbService.put(STORES.STYLES, completeStyle);
      await loadStyles();
      
      setActiveStyleForComparison(completeStyle);
      runComparison(completeStyle);
      setView('comparison');
      setStatus('idle');
      setStep(1);
      setNewStyle({ version: 1, rules: { rendering: '', colors: '', composition: '', world: '', negative: '' }, referenceImages: [] });
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const runComparison = async (style: UserDefinedStyle) => {
    setComparisonLoading(true);
    setSimilarMatches([]);
    setUniquenessSuggestions([]);
    try {
      const prompt = `Identify if the following custom AI style description matches or is conceptually very similar to any of these known styles.
      USER STYLE: "${style.styleBlock}"
      
      KNOWN STYLES:
      ${KNOWN_STYLES.map(s => `- ID: ${s.id}, DESC: ${s.block}`).join('\n')}
      
      Instructions: 
      1. ONLY return style IDs that have a strong conceptual overlap (similarity > 70%).
      2. If NO styles match, return an empty array.
      3. Do NOT hallucinate style names. Use the IDs provided.
      
      Return as a JSON array of strings: ["id1", "id2"]`;

      const resText = await generateTextWithGemini(prompt);
      try {
        const ids = JSON.parse(resText.replace(/```json/g, '').replace(/```/g, '').trim());
        const matches = KNOWN_STYLES.filter(ks => ids.includes(ks.id));
        setSimilarMatches(matches);
      } catch (err) {
        setSimilarMatches([]);
      }
    } catch (e) {
      console.error(e);
    }
    setComparisonLoading(false);
  };

  const getUniquenessSuggestions = async () => {
    if (!activeStyleForComparison) return;
    setSuggestionsLoading(true);
    try {
      const prompt = `Style Name: "${activeStyleForComparison.name}"
      Description: "${activeStyleForComparison.styleBlock}"
      
      Task: Provide 3 high-impact, sophisticated suggestions to change this style to make it more unique, distinct, and "never-before-seen" in AI art. Focus on mixing unexpected textures, niche lighting conditions, or unusual materials.
      
      Return as a JSON array of strings: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

      const resText = await generateTextWithGemini(prompt);
      const res = JSON.parse(resText.replace(/```json/g, '').replace(/```/g, '').trim());
      setUniquenessSuggestions(res);
    } catch (e) {
      console.error(e);
    }
    setSuggestionsLoading(false);
  };

  const deleteStyle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this style permanently?")) return;
    try {
      await dbService.delete(STORES.STYLES, id);
      setStyles(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleGen = async () => {
    const style = styles.find(s => s.id === selectedStyleId);
    if (!style || !subject.trim()) return;
    setStatus('loading');
    setGenResult(null);
    try {
       const prompt = `${subject} in the ${style.name} style: ${style.styleBlock}, ${extraDetails}`;
       const img = await generateImageWithGemini(prompt, '1:1');
       setGenResult(img);
       setStatus('success');
    } catch (e) {
       setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-3 tracking-tighter uppercase">
          <FlaskConical className="w-10 h-10 text-indigo-500" />
          AI Style Forge
        </h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Visual DNA Synthesis & Management</p>
      </div>

      {view === 'list' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Your Visual Library</h3>
              <button 
                onClick={() => setView('create')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
              >
                 <Plus className="w-5 h-5" /> CREATE NEW STYLE
              </button>
           </div>

           {styles.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center space-y-4">
                 <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <Palette className="w-10 h-10 text-slate-400" />
                 </div>
                 <h4 className="text-xl font-bold text-slate-400">No styles forged yet.</h4>
                 <p className="text-sm text-slate-500 max-w-xs mx-auto">Build your first reusable visual recipe to maintain consistency across all your AI generations.</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {styles.map(style => (
                    <div 
                      key={style.id}
                      onClick={() => { setSelectedStyleId(style.id); setView('generate'); }}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer relative"
                    >
                       <div className="aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
                          {style.thumbnail ? (
                             <img src={style.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={style.name} />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700"><ImageIcon className="w-12 h-12" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                             <div className="flex justify-between items-center text-white">
                                <span className="text-lg font-black uppercase tracking-tight">{style.name}</span>
                                <span className="text-[10px] font-bold bg-indigo-600 px-2 py-0.5 rounded">v{style.version}</span>
                             </div>
                          </div>
                       </div>
                       <div className="p-5 space-y-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">"{style.concept}"</p>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{style.referenceImages.length} Samples</span>
                             <div className="flex gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setNewStyle(style); setView('create'); }}
                                  className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                ><Edit3 className="w-4 h-4" /></button>
                                <button 
                                  onClick={(e) => deleteStyle(style.id, e)}
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                ><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
      )}

      {view === 'create' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col min-h-[600px]">
           <div className="h-1.5 bg-slate-100 dark:bg-slate-800 flex">
              {[1,2,3,4].map(i => (
                 <div key={i} className={`flex-1 transition-all duration-500 ${step >= i ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
              ))}
           </div>

           <div className="p-10 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
              {step === 1 && (
                 <div className="space-y-8 animate-fade-in">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Identity & Mission</h3>
                       <p className="text-sm text-slate-500">Name your style and define its core spirit.</p>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Distinct Style Name</label>
                            <div className="group relative">
                              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 normal-case font-bold leading-relaxed border border-slate-700">
                                Example Distinct Style Name can be Wede-AI-03 – Analog Storybook Minimalism.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          </div>
                          <input 
                             value={newStyle.name || ''}
                             onChange={e => setNewStyle({...newStyle, name: e.target.value})}
                             placeholder="e.g. Neo-Organic-v1"
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">One-Sentence Concept</label>
                            <div className="group relative">
                              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 normal-case font-bold leading-relaxed border border-slate-700">
                                An example can be Clean, minimal storybook art inspired by mid‑century printmaking and infographics, using flat shapes, clear silhouettes, and restrained earthy colors.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          </div>
                          <textarea 
                             value={newStyle.concept || ''}
                             onChange={e => setNewStyle({...newStyle, concept: e.target.value})}
                             placeholder="e.g. A whimsical yet dark fusion of botanical life and cyberpunk circuitry."
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white text-md h-24 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                       </div>
                    </div>
                 </div>
              )}

              {step === 2 && (
                 <div className="space-y-6 animate-fade-in flex flex-col">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Visual Grammar</h3>
                       <p className="text-sm text-slate-500">How should the AI render this world?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 flex-1 overflow-visible">
                       <div className="space-y-1 relative">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rendering & Lines</label>
                            <div className="group relative">
                              <Info className="w-3 h-3 text-slate-400 cursor-help" />
                              <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] normal-case font-bold leading-relaxed border border-slate-700">
                                No visible sketch lines; contours are clean and intentional.<br /><br />Shapes are built from flat color blocks with slightly misregistered edges to mimic old offset printing.
                                <div className="absolute bottom-full left-4 border-8 border-transparent border-b-slate-800"></div>
                              </div>
                            </div>
                          </div>
                          <textarea 
                             value={newStyle.rules?.rendering || ''}
                             onChange={e => setNewStyle({...newStyle, rules: {...newStyle.rules!, rendering: e.target.value}})}
                             placeholder="e.g. Thick charcoal outlines..."
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm h-24 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                       <div className="space-y-1 relative">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Colour & Lighting</label>
                            <div className="group relative">
                              <Info className="w-3 h-3 text-slate-400 cursor-help" />
                              <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] normal-case font-bold leading-relaxed border border-slate-700">
                                Very limited color palette: 3–5 earthy colors (ochres, muted greens, browns, dusty reds) plus an off‑white paper background.​<br /><br />No gradients; depth is created with flat tones and value contrast only.<br /><br />Lighting is implied rather than rendered, with small, simple drops of shadow and no photoreal highlights.
                                <div className="absolute bottom-full right-4 border-8 border-transparent border-b-slate-800"></div>
                              </div>
                            </div>
                          </div>
                          <textarea 
                             value={newStyle.rules?.colors || ''}
                             onChange={e => setNewStyle({...newStyle, rules: {...newStyle.rules!, colors: e.target.value}})}
                             placeholder="e.g. Desaturated sepia tones..."
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm h-24 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                       <div className="space-y-1 relative">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Composition & Lens</label>
                            <div className="group relative">
                              <Info className="w-3 h-3 text-slate-400 cursor-help" />
                              <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] normal-case font-bold leading-relaxed border border-slate-700">
                                Compositions are calm and balanced, often frontal or isometric, emphasizing clear silhouettes.​<br /><br />Negative space is used generously to keep pages airy and uncluttered.<br /><br />Elements are arranged in simple geometric groupings reminiscent of mid‑century posters and infographics.
                                <div className="absolute top-full left-4 border-8 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          </div>
                          <textarea 
                             value={newStyle.rules?.composition || ''}
                             onChange={e => setNewStyle({...newStyle, rules: {...newStyle.rules!, composition: e.target.value}})}
                             placeholder="e.g. Extreme wide angle..."
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm h-24 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                       <div className="space-y-1 relative">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">World & Character DNA</label>
                            <div className="group relative">
                              <Info className="w-3 h-3 text-slate-400 cursor-help" />
                              <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] normal-case font-bold leading-relaxed border border-slate-700">
                                Characters are simple geometric constructions (circles, rectangles, triangles) with big, readable silhouettes and tiny facial features.​<br /><br />Props and environments are reduced to essential shapes and symbols rather than detailed depictions.<br /><br />Overall finish is matte with subtle paper grain to reinforce the analog, printed feel.
                                <div className="absolute top-full right-4 border-8 border-transparent border-t-slate-800"></div>
                              </div>
                            </div>
                          </div>
                          <textarea 
                             value={newStyle.rules?.world || ''}
                             onChange={e => setNewStyle({...newStyle, rules: {...newStyle.rules!, world: e.target.value}})}
                             placeholder="e.g. Victorian era..."
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm h-24 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                       </div>
                    </div>
                 </div>
              )}

              {step === 3 && (
                 <div className="space-y-8 animate-fade-in">
                    <div className="space-y-1 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Negative Space/Negative rules (what to avoid)</h3>
                          <div className="group relative">
                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 normal-case font-bold leading-relaxed border border-slate-700">
                                Avoid high-detail rendering and intricate textures; details should stay minimal and graphic.​<br /><br />Avoid realistic surface textures (metal, glass, skin pores) and photoreal lighting or complex perspective.<br /><br />No gradients, airbrush effects, or heavy 3D depth cues like volumetric light or motion blur.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                            </div>
                          </div>
                       </div>
                       <p className="text-sm text-slate-500">What elements are strictly forbidden in this style? (Type 'n/a' if none)</p>
                    </div>
                    <textarea 
                       value={newStyle.rules?.negative || ''}
                       onChange={e => setNewStyle({...newStyle, rules: {...newStyle.rules!, negative: e.target.value}})}
                       placeholder="e.g. No glossy 3D, no anime features..."
                       className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-white text-md h-48 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 flex items-start gap-3">
                       <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                       <p className="text-xs text-red-600/80 leading-relaxed font-bold uppercase">All fields are mandatory. Only the Negative Space field accepts 'n/a'.</p>
                    </div>
                 </div>
              )}

              {step === 4 && (
                 <div className="space-y-8 animate-fade-in">
                    <div className="space-y-1 text-center">
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Visual Evidence</h3>
                       <p className="text-sm text-slate-500">Upload 10-30 reference images (Optional but recommended).</p>
                    </div>
                    
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
                       {newStyle.referenceImages?.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group">
                             <img src={img} className="w-full h-full object-cover" alt="ref" />
                             <button 
                                onClick={() => setNewStyle(prev => ({ ...prev, referenceImages: prev.referenceImages?.filter((_, i) => i !== idx) }))}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                             ><X className="w-5 h-5"/></button>
                          </div>
                       ))}
                       <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all"
                       >
                          <Upload className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-bold">ADD SAMPLES</span>
                       </button>
                    </div>
                    <input type="file" multiple ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-500/10 flex items-start gap-4">
                       <Info className="w-6 h-6 text-indigo-500 shrink-0" />
                       <div className="space-y-1">
                          <p className="text-xs text-indigo-900 dark:text-indigo-200 font-bold uppercase">Final Synthesis Looming</p>
                          <p className="text-[10px] text-indigo-800/60 dark:text-indigo-400 leading-relaxed">Proceeding will use Gemini to condense your rules into a high-density "Style Block" for one-click reuse.</p>
                       </div>
                    </div>
                 </div>
              )}

              <div className="mt-auto pt-10 flex justify-between gap-4">
                 {step > 1 ? (
                    <button 
                       onClick={handlePrevStep}
                       className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2"
                    ><ChevronLeft className="w-4 h-4"/> Back</button>
                 ) : (
                    <button 
                       onClick={() => setView('list')}
                       className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-500"
                    >Cancel</button>
                 )}
                 
                 {step < 4 ? (
                    <button 
                       onClick={handleNextStep}
                       disabled={status === 'loading'}
                       className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2"
                    >Next <ChevronRight className="w-4 h-4"/></button>
                 ) : (
                    <button 
                       onClick={finalizeStyle}
                       disabled={status === 'loading'}
                       className="bg-indigo-600 hover:bg-indigo-700 px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2"
                    >
                       {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                       FORGE STYLE
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {view === 'comparison' && activeStyleForComparison && (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-10">
              <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                    <Search className="w-10 h-10 text-indigo-500" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Similarity Audit</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning global art history for overlap_</p>
                 </div>
              </div>

              {comparisonLoading ? (
                 <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                    <p className="text-indigo-400 font-black uppercase text-xs animate-pulse">Running Neural comparison...</p>
                 </div>
              ) : (
                 <div className="space-y-10">
                    {similarMatches.length > 0 ? (
                       <div className="space-y-6">
                          <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-3xl flex items-start gap-4">
                             <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                             <div>
                                <h4 className="text-lg font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">Overlap Detected</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                                   Your forged style has strong visual commonalities with the following existing movements. To be truly unique, consider more specific refinements.
                                </p>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {similarMatches.map(match => (
                                <div key={match.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-sm">
                                   <div className="aspect-video relative overflow-hidden">
                                      <img src={match.image} className="w-full h-full object-cover" alt={match.name} />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                      <span className="absolute bottom-4 left-4 text-white font-black uppercase tracking-tight text-lg">{match.name}</span>
                                   </div>
                                   <div className="p-5">
                                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{match.block}"</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    ) : (
                       <div className="bg-green-500/10 border border-green-500/30 p-10 rounded-[2.5rem] text-center space-y-4">
                          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                             <ShieldCheck className="w-10 h-10 text-green-500" />
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-2xl font-black text-green-600 dark:text-green-400 uppercase tracking-tighter">Unique DNA Confirmed</h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400">We found no known existing styles that match your specific visual recipe. You've forged something truly distinct.</p>
                          </div>
                       </div>
                    )}

                    <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-6">
                       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-center md:text-left">
                             <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Style Evolution</h4>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Refinement Assistant</p>
                          </div>
                          <button 
                             onClick={getUniquenessSuggestions}
                             disabled={suggestionsLoading}
                             className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-8 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-transform shadow-xl disabled:opacity-50"
                          >
                             {suggestionsLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                             GENERATE UNIQUENESS PROPOSALS
                          </button>
                       </div>

                       {uniquenessSuggestions.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
                             {uniquenessSuggestions.map((s, i) => (
                                <div key={i} className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-3xl relative group hover:bg-indigo-500/10 transition-colors">
                                   <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg">{i+1}</div>
                                   <p className="text-xs text-slate-700 dark:text-indigo-100 leading-relaxed font-bold uppercase pt-2">{s}</p>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>

                    <div className="flex justify-center pt-10">
                       <button 
                          onClick={() => setView('list')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 py-4 rounded-3xl shadow-2xl transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-sm"
                       >
                          <CheckCircle2 className="w-5 h-5" />
                          Finalize and Store Style
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {view === 'generate' && selectedStyleId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
           <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                 <div className="flex justify-between items-center">
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Generate in {styles.find(s => s.id === selectedStyleId)?.name}</h3>
                       <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">One-Click Consistent Styling</p>
                    </div>
                    <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 uppercase">Primary Subject</label>
                       <textarea 
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="e.g. A giant tortoise with an island on its back..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none h-24"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-500 uppercase">Extra Context (Action, Background, Ratio)</label>
                       <input 
                          value={extraDetails}
                          onChange={e => setExtraDetails(e.target.value)}
                          placeholder="e.g. cinematic lighting, 8k..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm"
                       />
                    </div>
                 </div>

                 <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Automated Style Block Injection</p>
                    <p className="text-xs text-indigo-400 italic font-medium leading-relaxed">
                       {styles.find(s => s.id === selectedStyleId)?.styleBlock}
                    </p>
                 </div>

                 <button 
                    onClick={handleGen}
                    disabled={!subject || status === 'loading'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                 >
                    {status === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    GENERATE ARTWORK
                 </button>
              </div>
           </div>

           <div className="flex flex-col justify-center">
              <div className="aspect-square bg-slate-100 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden relative shadow-2xl flex items-center justify-center group">
                 {status === 'loading' ? (
                    <div className="text-center space-y-4">
                       <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                       <p className="text-indigo-500 font-bold animate-pulse">Forging consistent pixels...</p>
                    </div>
                 ) : genResult ? (
                    <>
                       <img src={genResult} className="w-full h-full object-cover" alt="result" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <a href={genResult} download="forged-art.png" className="bg-white text-slate-900 px-8 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform shadow-xl">
                             <Download className="w-5 h-5" /> DOWNLOAD
                          </a>
                       </div>
                    </>
                 ) : (
                    <div className="text-center opacity-10 space-y-4">
                       <Layers className="w-24 h-24 mx-auto" />
                       <p className="text-xl font-black uppercase tracking-[0.3em]">Awaiting_Input</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StyleForge;