import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, Play, Download, AlertCircle, MessageSquare, Wand2, UserPlus, X, Trash2, Baby, Sliders, Lock } from 'lucide-react';
import { generateBabyDebateScript, generateTalkingBabyVideo } from '../../services/geminiService';
import { LoadingState, BabyDebateScript } from '../../types';

const VISUAL_STYLES = [
  { id: 'stylized_3d', label: 'Stylized 3D', desc: 'Soft textures, vibrant colors, Pixar-inspired.' },
  { id: 'claymation', label: 'Handcrafted Clay', desc: 'Stop-motion aesthetic, plasticine textures.' },
  { id: 'blueprint', label: 'Artistic Sketch', desc: 'Blue ink lines, non-photorealistic artistic style.' }
];

const BabyDebates: React.FC = () => {
  // Config
  const [participants, setParticipants] = useState<string[]>(['Donald Trump', 'Michelle Obama']);
  const [newParticipant, setNewParticipant] = useState('');
  const [topic, setTopic] = useState('Who gets the last cookie in the nursery?');
  const [selectedStyle, setSelectedStyle] = useState(VISUAL_STYLES[0].id);
  
  // Results
  const [scriptData, setScriptData] = useState<BabyDebateScript | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [stage, setStage] = useState<'idle' | 'scripting' | 'rendering' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkKey();
  }, []);

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
      await checkKey();
    }
  };

  const addParticipant = () => {
    if (newParticipant.trim() && participants.length < 3) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleGenerateScript = async () => {
    if (!topic.trim() || participants.length === 0) return;
    setStatus('loading');
    setStage('scripting');
    setErrorMessage('');
    setScriptData(null);
    setVideoUrl(null);

    try {
      const script = await generateBabyDebateScript(topic, participants);
      setScriptData(script);
      setStatus('success');
      setStage('idle');
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Failed to generate script.");
      setStatus('error');
    }
  };

  const handleRenderVideo = async () => {
    if (!scriptData) return;
    
    if (!hasKey) {
       handleSelectKey();
       return;
    }

    setStatus('loading');
    setStage('rendering');
    setErrorMessage('');

    try {
      const styleLabel = VISUAL_STYLES.find(s => s.id === selectedStyle)?.label || '3D';
      const url = await generateTalkingBabyVideo(scriptData, styleLabel);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load video stream.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setVideoUrl(objectUrl);
      setStage('done');
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Video generation failed.");
      setStatus('error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 flex items-center justify-center gap-3 tracking-tighter">
          <Users className="w-10 h-10 text-sky-500" />
          Baby_Debates
        </h2>
        <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">Famous Personalities as Talking Babies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CONFIGURATION PANEL */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            {/* Participants */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Participants (Max 3)</label>
                <span className="text-[10px] text-slate-600 font-mono">{participants.length}/3</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {participants.map((p, i) => (
                  <div key={i} className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold animate-fade-in">
                    <Baby className="w-3 h-3" />
                    {p}
                    <button onClick={() => removeParticipant(i)} className="text-sky-400/50 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {participants.length < 3 && (
                   <div className="flex-1 min-w-[150px] relative">
                      <input 
                        value={newParticipant}
                        onChange={(e) => setNewParticipant(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                        placeholder="Add name (e.g. Trump)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                      <button onClick={addParticipant} className="absolute right-2 top-1.5 text-sky-500 hover:text-sky-400">
                        <UserPlus className="w-4 h-4" />
                      </button>
                   </div>
                )}
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Debate Topic</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What are they arguing about?"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 h-24 resize-none"
              />
            </div>

            {/* Style Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Visual Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {VISUAL_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedStyle === s.id 
                      ? 'bg-sky-600/20 border-sky-500 text-white' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className="text-[9px] opacity-60 leading-tight mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
               <button
                 onClick={handleGenerateScript}
                 disabled={!topic.trim() || participants.length === 0 || status === 'loading'}
                 className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border border-slate-700"
               >
                 {status === 'loading' && stage === 'scripting' ? <RefreshCw className="animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                 GENERATE SCRIPT
               </button>
               
               <button
                 onClick={handleRenderVideo}
                 disabled={!scriptData || status === 'loading'}
                 className="flex-[2] bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-sky-500/20 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg"
               >
                 {status === 'loading' && stage === 'rendering' ? <RefreshCw className="animate-spin" /> : <Wand2 className="w-5 h-5" />}
                 {!hasKey ? <Lock className="w-4 h-4" /> : ''} RENDER TALKING BABIES
               </button>
            </div>
          </div>

          {/* SCRIPT PREVIEW */}
          {scriptData && (
             <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 animate-fade-in shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                   <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest">Debate Script</h3>
                   <button onClick={() => setScriptData(null)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                   {scriptData.scriptLines.map((line, idx) => (
                      <div key={idx} className="space-y-1">
                         <span className="text-[10px] font-black text-slate-500 uppercase">{line.speaker}</span>
                         <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 italic">
                            "{line.text}"
                         </p>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* OUTPUT PANEL */}
        <div className="flex flex-col gap-6">
           <div className={`
             relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center
             ${videoUrl ? 'aspect-video w-full' : 'aspect-square w-full'}
           `}>
             {status === 'loading' ? (
                <div className="text-center p-8 space-y-6">
                   <div className="relative mx-auto">
                      <div className="w-20 h-20 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Baby className="w-8 h-8 text-sky-500 animate-pulse" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-sky-400 font-bold uppercase tracking-widest text-xs">{stage === 'scripting' ? 'Writing Dialogue...' : 'Synthesizing 4K Video...'}</p>
                      <p className="text-slate-600 text-[10px] max-w-xs mx-auto">
                         {stage === 'rendering' ? 'Applying realistic lip-sync and character likeness abstraction. This may take up to a minute.' : 'Capturing character essence for the debate.'}
                      </p>
                   </div>
                </div>
             ) : errorMessage ? (
                <div className="text-center p-8 space-y-4">
                   <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                   <h3 className="font-bold text-white uppercase text-xs">Generation Blocked</h3>
                   <p className="text-slate-500 text-[10px] max-w-xs mx-auto">{errorMessage}</p>
                   <button onClick={() => setStatus('idle')} className="text-sky-500 font-bold text-xs uppercase underline">Try Again</button>
                </div>
             ) : videoUrl ? (
                <div className="w-full h-full relative group">
                   <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay loop playsInline />
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={videoUrl} 
                        download="baby-debate.mp4"
                        className="bg-black/60 hover:bg-sky-600 text-white p-3 rounded-full backdrop-blur-md transition-all block"
                      >
                         <Download className="w-5 h-5" />
                      </a>
                   </div>
                   <div className="absolute top-4 left-4 bg-sky-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border border-white/20">BABY DEBATE ACTIVE</div>
                </div>
             ) : (
                <div className="text-center text-slate-700 p-8 space-y-4">
                   <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto">
                      <Play className="w-8 h-8 opacity-20" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs uppercase font-bold tracking-widest opacity-30">Awaiting Simulation</p>
                      <p className="text-[10px] opacity-20 max-w-[200px] mx-auto leading-relaxed">
                         Define your participants and topic to generate a high-end talking baby video.
                      </p>
                   </div>
                </div>
             )}
           </div>

           {/* Features Highlight */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
                 <div className="bg-sky-500/20 p-2 rounded-lg"><Sliders className="w-4 h-4 text-sky-400" /></div>
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lip-Sync Pro</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Advanced mouth articulation for precise dialogue delivery.</p>
                 </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
                 <div className="bg-blue-500/20 p-2 rounded-lg"><Users className="w-4 h-4 text-blue-400" /></div>
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Character Likeness</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Preserving features of public figures in baby form.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BabyDebates;
