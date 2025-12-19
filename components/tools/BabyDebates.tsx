import React, { useState, useEffect, useRef } from 'react';
import { Users, RefreshCw, Play, Download, AlertCircle, MessageSquare, Wand2, UserPlus, X, Baby, Sliders, Camera, Music, Type, Monitor, Smartphone, Volume2, Stars, Palette, CheckCircle2, Lock, FileText, Save, Edit2, Unlock } from 'lucide-react';
import { generateBabyDebateScript, generateTalkingBabyVideo } from '../../services/geminiService';
import { LoadingState, BabyDebateScript, BabyDebateParticipant } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const VISUAL_STYLES = [
  { id: 'stylized_3d', label: 'Stylized 3D', desc: 'Pixar-inspired' },
  { id: 'claymation', label: 'Claymation', desc: 'Stop-motion' },
  { id: 'blueprint', label: 'Art Sketch', desc: 'Technical blue' },
  { id: 'felted', label: 'Felted Wool', desc: 'Fuzzy characters' },
  { id: 'watercolor', label: 'Watercolor', desc: 'Storybook' },
  { id: 'popart', label: 'Pop Art', desc: 'Comic style' },
  { 
    id: 'edewede_ai_o3', 
    label: 'Edewede-AI-O3', 
    desc: 'Analog 2D storybook minimalism inspired by mid-century printmaking and educational infographics. Features clean, intentional contours and flat color blocks with slight misregistered ink edges to mimic vintage offset printing. Compositions are calm and airy, utilizing generous negative space and geometric groupings in flattened frontal views. Palette: 3–5 strictly limited earthy tones (ochre, muted sage, dusty terracotta, charcoal) on off-white paper. Characters are essential symbols: bodies as bold silhouettes, hair as oversized solid geometric shapes (like large afros or circular bobs), limbs as thin tapered lines, and faces with tiny dot eyes and small pink circular cheeks. Zero gradients, zero highlights, and zero 3D depth cues. Environment props like trees and buildings are reduced to primitive geometric blocks, circles, and triangles.' 
  }
];

const MUSIC_STYLES = [
  'Nursery Rhyme Remix', 'Lofi Beats', 'Cinematic Orchestral', 'Smooth Jazz', 'Playful Whistle', 'Techno Babies'
];

const SPEAKER_TONES = [
  'Serious & Professional', 'Filled with Mirth', 'Intellectual & Snobby', 'Sarcastic & Dry', 'Aggressive & Hot-headed', 'Whiny & Playful', 'Confused & Innocent'
];

const BabyDebates: React.FC = () => {
  const [participants, setParticipants] = useState<BabyDebateParticipant[]>([
    { name: 'The Tech CEO', tone: 'Aggressive & Hot-headed' },
    { name: 'The Scientist', tone: 'Serious & Professional' }
  ]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [topic, setTopic] = useState('Should nap time be replaced with code reviews?');
  
  const [selectedStyle, setSelectedStyle] = useState(VISUAL_STYLES[0].id);
  const [selectedMusic, setSelectedMusic] = useState(MUSIC_STYLES[0]);
  const [includeMusic, setIncludeMusic] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [showCaptions, setShowCaptions] = useState(true);
  
  const [scriptData, setScriptData] = useState<BabyDebateScript | null>(null);
  const [editableLines, setEditableLines] = useState<{ speaker: string, text: string }[]>([]);
  const [isScriptLocked, setIsScriptLocked] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [stage, setStage] = useState<'idle' | 'scripting' | 'rendering' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasKey, setHasKey] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);

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
      /* Fix: Assume selection success immediately after triggering the dialog to mitigate race condition. */
      setHasKey(true);
    }
  };

  const addParticipant = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isScriptLocked) return;

    setParticipants(prev => {
      if (prev.length >= 5) return prev;
      
      const nameToAdd = newParticipantName.trim() || `Baby ${prev.length + 1}`;
      setNewParticipantName('');
      return [...prev, { name: nameToAdd, tone: SPEAKER_TONES[0] }];
    });
  };

  const removeParticipant = (index: number) => {
    if (isScriptLocked) return;
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const updateParticipantTone = (index: number, tone: string) => {
    if (isScriptLocked) return;
    setParticipants(prev => prev.map((p, i) => i === index ? { ...p, tone } : p));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadIndex !== null) {
      try {
        await runFileSecurityChecks(file, 'image');
        const reader = new FileReader();
        reader.onloadend = () => {
           setParticipants(prev => prev.map((p, i) => 
              i === uploadIndex ? { ...p, image: reader.result as string } : p
           ));
           setAspectRatio('16:9');
        };
        reader.readAsDataURL(file);
      } catch (err: any) { alert(err.message); }
    }
    setUploadIndex(null);
  };

  const handleGenerateScript = async () => {
    if (!topic.trim() || participants.length === 0) return;
    setStatus('loading');
    setStage('scripting');
    setErrorMessage('');
    setTopic(topic);
    setScriptData(null);
    setVideoUrl(null);
    setIsScriptLocked(false);

    try {
      const script = await generateBabyDebateScript(topic, participants);
      if (!script || !script.scriptLines) {
         throw new Error("The AI failed to generate a valid script. Please try a different topic.");
      }
      setScriptData(script);
      setEditableLines(script.scriptLines.map(l => ({ ...l })));
      setStatus('success');
      setStage('idle');
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to generate script.");
      setStatus('error');
    }
  };

  const handleUpdateLine = (index: number, text: string) => {
    if (isScriptLocked) return;
    const next = [...editableLines];
    next[index].text = text;
    setEditableLines(next);
  };

  const handleSaveScript = () => {
    if (!scriptData) return;
    setScriptData({
      ...scriptData,
      scriptLines: editableLines.map(l => ({ ...l }))
    });
    setIsScriptLocked(true);
  };

  const handleUnlockScript = () => {
    setIsScriptLocked(false);
  };

  const handleRenderVideo = async () => {
    if (!scriptData || !isScriptLocked) return;
    
    // Fix: Trigger key selection if missing for Veo but proceed immediately as per guidelines.
    const aiStudio = getAIStudio();
    if (aiStudio && !(await aiStudio.hasSelectedApiKey())) {
       handleSelectKey();
    }

    setStatus('loading');
    setStage('rendering');
    setErrorMessage('');

    try {
      const selectedStyleObj = VISUAL_STYLES.find(s => s.id === selectedStyle);
      const styleLabel = selectedStyleObj ? `${selectedStyleObj.label}: ${selectedStyleObj.desc}` : '3D';
      const musicLabel = includeMusic ? selectedMusic : 'SILENT. No music. Zero background musical sound accompanying the video.';
      const url = await generateTalkingBabyVideo(scriptData, styleLabel, musicLabel, showCaptions, aspectRatio);
      
      if (!url) throw new Error("Video generation failed. No link returned.");

      const response = await fetch(url);
      if (!response.ok) {
         if (response.status === 404) throw new Error("Requested entity was not found. Please refresh your API key in Settings.");
         throw new Error("Video filtered during synthesis. This is a system-wide safety block on specific likenesses. Try using generic role-based names (e.g. 'The CEO' instead of a specific person's name) to ensure compliance.");
      }
      
      const blob = await response.blob();
      setVideoUrl(URL.createObjectURL(blob));
      setStage('done');
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      const msg = e.message || "";
      // Fix: Reset key state and prompt for a new key if the request fails with "Requested entity was not found."
      if (msg.includes("Requested entity was not found")) {
          setHasKey(false);
          handleSelectKey();
      }
      setErrorMessage(msg || "The video generation was blocked by post-generation safety filters. This often happens with real-world names or sensitive prompts. Try descriptive, generic character names for better results.");
      setStatus('error');
    }
  };

  const hasAnyImages = participants.some(p => p && p.image);

  // Friendly timestamp for file naming
  const getFriendlyTimestamp = () => {
    const date = new Date();
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') + '_' + 
           date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/:/g, '-');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans pb-12">
      {/* Compact Header */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Baby className="w-10 h-10 text-sky-500" />
          <div>
             <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">AI Baby Debates</h2>
             <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Dialogue Simulation Module</p>
          </div>
        </div>
        {!hasKey && (
          <button onClick={handleSelectKey} className="text-xs flex items-center gap-2 text-amber-500 border border-amber-500/30 px-4 py-2 rounded-full bg-amber-500/10 font-bold hover:bg-amber-500/20 transition-all">
            <Lock className="w-3 h-3" /> Connect Paid Key for Video
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Configuration & Casting (4/12) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          
          {/* Topic Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest mb-3">
               <MessageSquare className="w-3.5 h-3.5 text-sky-500" /> 1. THE ARGUMENT
            </h3>
            <textarea 
               value={topic}
               readOnly={isScriptLocked}
               onChange={(e) => setTopic(e.target.value)}
               className={`w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 h-20 resize-none transition-all ${isScriptLocked ? 'bg-slate-100 dark:bg-slate-800 opacity-60' : 'bg-slate-50 dark:bg-slate-950'}`}
               placeholder="What are the babies fighting over?"
            />
          </div>

          {/* Casting Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex-1">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                   <Users className="w-3.5 h-3.5 text-sky-500" /> 2. THE PANEL
                </h3>
                {!isScriptLocked && participants.length < 5 && (
                   <form onSubmit={addParticipant} className="flex gap-1">
                      <input 
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        placeholder="Add name..."
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 w-24"
                      />
                      <button 
                        type="submit"
                        className="bg-sky-600 hover:bg-sky-700 text-white p-1 rounded-lg transition-all active:scale-95"
                      >
                         <UserPlus className="w-3.5 h-3.5" />
                      </button>
                   </form>
                )}
             </div>

             <div className="space-y-2">
                {participants.map((p, i) => p && (
                   <div key={i} className={`border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center gap-3 transition-colors ${isScriptLocked ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-slate-50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                      <div className="flex-1 min-w-0">
                         <div className="font-bold text-slate-900 dark:text-white text-xs truncate">{p.name}</div>
                         <select 
                           value={p.tone}
                           disabled={isScriptLocked}
                           onChange={(e) => updateParticipantTone(i, e.target.value)}
                           className="w-full bg-transparent border-none p-0 text-[10px] text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer hover:text-sky-400 disabled:cursor-not-allowed"
                         >
                           {SPEAKER_TONES.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t}</option>)}
                         </select>
                      </div>
                      
                      <div className="flex items-center gap-1">
                         <button 
                           onClick={() => { if (!isScriptLocked) { setUploadIndex(i); fileRef.current?.click(); } }}
                           disabled={isScriptLocked}
                           className={`p-1.5 rounded-lg transition-all ${p.image ? 'text-green-500 bg-green-500/10' : 'text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-sky-500 disabled:opacity-30'}`}
                           title="Upload Likeness (Optional)"
                         >
                            {p.image ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                         </button>
                         {!isScriptLocked && (
                            <button onClick={() => removeParticipant(i)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:text-red-500 transition-colors rounded-lg">
                               <X className="w-3.5 h-3.5" />
                            </button>
                         )}
                      </div>
                   </div>
                ))}
             </div>
             <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
             <div className="mt-4 p-3 bg-blue-500/5 dark:bg-blue-900/10 border border-blue-500/20 rounded-xl">
                <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase leading-tight">
                   PRO TIP: AVOID REAL NAMES TO BYPASS LIKENESS SAFETY FILTERS. TRY ROLE DESCRIPTIONS (E.G., "THE GIANT TECH CEO") FOR A 100% SUCCESS RATE.
                </p>
             </div>
          </div>

          <button
            onClick={handleGenerateScript}
            disabled={!topic.trim() || participants.length === 0 || status === 'loading'}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-900 dark:text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-slate-200 dark:border-slate-700 mt-2"
          >
            {status === 'loading' && stage === 'scripting' ? <RefreshCw className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            {scriptData ? 'RE-GENERATE SCRIPT' : 'WRITE SCRIPT'}
          </button>
        </div>

        {/* RIGHT COLUMN: Production & Output (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* VIDEO PLAYER AREA */}
              <div className="flex flex-col gap-4">
                <div className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center relative ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[320px] mx-auto' : 'aspect-video'}`}>
                  {status === 'loading' && stage === 'rendering' ? (
                    <div className="text-center p-6 space-y-4">
                        <div className="relative mx-auto w-10 h-10">
                          <div className="absolute inset-0 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                              <Baby className="w-3 h-3 text-sky-500 animate-pulse" />
                          </div>
                        </div>
                        <p className="text-sky-600 dark:text-sky-400 font-bold uppercase tracking-widest text-[8px]">Synthesizing Caricatures...</p>
                        <p className="text-slate-500 dark:text-slate-600 text-[8px] animate-pulse">Running safety-compliant video pipeline</p>
                    </div>
                  ) : errorMessage ? (
                    <div className="text-center p-6 space-y-3">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                        <p className="text-slate-600 dark:text-slate-500 text-[10px] leading-relaxed px-4">{errorMessage}</p>
                        <button onClick={() => setStatus('idle')} className="text-sky-500 font-bold text-[10px] uppercase underline">Reset Configuration</button>
                    </div>
                  ) : videoUrl ? (
                    <div className="w-full h-full relative group">
                        <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay loop playsInline />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href={videoUrl} download={`ai-debate-${getFriendlyTimestamp()}.mp4`} className="bg-black/60 hover:bg-sky-600 text-white p-2 rounded-full backdrop-blur-md block shadow-xl"><Download className="w-4 h-4" /></a>
                        </div>
                    </div>
                  ) : (
                    <div className="text-center opacity-10 p-8 text-slate-900 dark:text-white">
                        <Play className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Simulator Result</p>
                    </div>
                  )}
                </div>

                {/* Recommendation Note */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                   <p className="text-[10px] md:text-xs text-amber-600 dark:text-amber-500 font-medium leading-relaxed italic">
                      To create your debate successfully, use descriptive roles or archetypes (e.g., "The Gigantic Tech CEO" or "The Eccentric Space Billionaire") instead of specific real-world names.
                   </p>
                </div>
              </div>

              {/* DIALOGUE & SETTINGS */}
              <div className="flex flex-col gap-4">
                 
                 {/* Production Settings */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl">
                    <h3 className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><Sliders className="w-3 h-3"/> STUDIO CONFIG</h3>
                    
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold uppercase"><Music className="w-2.5 h-2.5"/> AUDIO TRACK</span>
                          <select 
                            disabled={!includeMusic}
                            value={selectedMusic} 
                            onChange={e => setSelectedMusic(e.target.value)} 
                            className={`bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white px-2 py-1 outline-none text-[10px] ${!includeMusic ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                          >
                             {MUSIC_STYLES.map(m => <option key={m}>{m}</option>)}
                          </select>
                          <div className="flex items-center gap-1.5 mt-1">
                             <input 
                                type="checkbox" 
                                id="no-music-check" 
                                checked={!includeMusic} 
                                onChange={(e) => setIncludeMusic(!e.target.checked)}
                                className="w-3 h-3 accent-sky-500 rounded border-slate-300 dark:border-slate-700"
                             />
                             <label htmlFor="no-music-check" className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase cursor-pointer select-none">No Background Music</label>
                          </div>
                       </div>

                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold uppercase"><Monitor className="w-2.5 h-2.5"/> ASPECT</span>
                          <div className="flex bg-slate-100 dark:bg-slate-950 rounded p-0.5 border border-slate-200 dark:border-slate-800">
                             <button 
                                onClick={() => setAspectRatio('16:9')} 
                                className={`flex-1 py-0.5 rounded text-[9px] font-bold ${aspectRatio === '16:9' ? 'bg-sky-600 text-white' : 'text-slate-400 dark:text-slate-500'}`}
                             >
                                16:9
                             </button>
                             <button 
                                onClick={() => setAspectRatio('9:16')} 
                                disabled={hasAnyImages}
                                className={`flex-1 py-0.5 rounded text-[9px] font-bold ${aspectRatio === '9:16' ? 'bg-sky-600 text-white' : 'text-slate-400 dark:text-slate-500 disabled:opacity-30'}`}
                                title={hasAnyImages ? "9:16 not available with Likeness" : ""}
                             >
                                9:16
                             </button>
                          </div>
                       </div>

                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold uppercase"><Palette className="w-2.5 h-2.5"/> VISUAL FILTER</span>
                          <select value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white px-2 py-1 outline-none text-[10px]">
                             {VISUAL_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                       </div>

                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-bold uppercase"><Type className="w-2.5 h-2.5"/> SUBTITLES</span>
                          <button onClick={() => setShowCaptions(!showCaptions)} className={`w-full h-5 rounded relative transition-all border border-slate-200 dark:border-slate-800 ${showCaptions ? 'bg-sky-100 dark:bg-sky-900/30' : 'bg-slate-50 dark:bg-slate-950'}`}>
                             <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded transition-all ${showCaptions ? 'translate-x-[calc(100%-8px)] bg-sky-500' : 'translate-x-0 bg-slate-300 dark:bg-slate-700'}`}></div>
                             <span className={`text-[8px] font-bold uppercase absolute inset-0 flex items-center justify-center pointer-events-none ${showCaptions ? 'text-sky-700 dark:text-sky-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                {showCaptions ? 'ENABLED' : 'DISABLED'}
                             </span>
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Dialogue Feed / Script Editor */}
                 <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex-1 overflow-hidden flex flex-col shadow-inner min-h-[250px]">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                       <h4 className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1"><Volume2 className="w-3 h-3"/> TRANSCRIPT_OUTPUT</h4>
                       {scriptData && (
                          <div className="flex gap-2">
                             {isScriptLocked ? (
                                <button 
                                   onClick={handleUnlockScript}
                                   className="text-[9px] font-black text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 uppercase flex items-center gap-1 transition-colors"
                                >
                                   <Unlock className="w-2.5 h-2.5" /> EDIT SCRIPT
                                </button>
                             ) : (
                                <button 
                                   onClick={handleSaveScript}
                                   className="text-[9px] font-black text-sky-600 hover:text-sky-700 dark:text-sky-500 dark:hover:text-sky-400 uppercase flex items-center gap-1 transition-colors"
                                >
                                   <Save className="w-2.5 h-2.5" /> SAVE CHANGES
                                </button>
                             )}
                          </div>
                       )}
                    </div>
                    {scriptData ? (
                       <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 max-h-[160px]">
                          {editableLines.map((line, idx) => (
                             <div key={idx} className="space-y-1 group">
                                <div className="flex items-center justify-between">
                                   <span className="text-[8px] font-black text-sky-600 dark:text-sky-500 uppercase block">{line.speaker}</span>
                                   {!isScriptLocked && <Edit2 className="w-2 h-2 text-slate-400 dark:text-slate-700 opacity-0 group-hover:opacity-100" />}
                                </div>
                                <textarea 
                                   value={line.text}
                                   readOnly={isScriptLocked}
                                   onChange={(e) => handleUpdateLine(idx, e.target.value)}
                                   rows={2}
                                   className={`w-full border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-[10px] text-slate-800 dark:text-slate-300 leading-tight focus:outline-none focus:border-sky-500 resize-none font-sans transition-colors ${isScriptLocked ? 'bg-slate-100 dark:bg-slate-800 opacity-80' : 'bg-white dark:bg-slate-900'}`}
                                   placeholder="Edit dialogue..."
                                />
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-slate-900 dark:text-white">
                          <FileText className="w-8 h-8 mb-2" />
                          <p className="text-[8px] font-bold">Awaiting Script Generation</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Production Action */}
           {scriptData && (
              <div className="space-y-3">
                 {!isScriptLocked && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2 text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase">
                       <AlertCircle className="w-3.5 h-3.5" /> LOCK SCRIPT ABOVE TO PRODUCE VIDEO
                    </div>
                 )}
                 <button 
                   onClick={handleRenderVideo} 
                   disabled={status === 'loading' || !isScriptLocked}
                   className={`w-full text-white font-black py-4 rounded-3xl shadow-[0_0_30px_rgba(14,165,233,0.2)] flex items-center justify-center gap-3 animate-fade-in-up hover:scale-[1.01] transition-transform active:scale-[0.99] disabled:opacity-50 disabled:grayscale ${videoUrl ? 'bg-gradient-to-r from-emerald-500 to-sky-600' : 'bg-gradient-to-r from-sky-500 to-indigo-600'}`}
                 >
                    {status === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                    {videoUrl ? 'RE-GENERATE VIDEO' : 'FINALIZE & PRODUCE VIDEO'}
                 </button>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default BabyDebates;