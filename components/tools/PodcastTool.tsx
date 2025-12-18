import React, { useState, useRef, useEffect } from 'react';
import { Mic2, Play, Users, RefreshCw, Download, Image as ImageIcon, Music } from 'lucide-react';
import { generatePodcastScript, generateSpeechWithGemini, generateImageWithGemini } from '../../services/geminiService';
import { LoadingState, PodcastScript } from '../../types';
import { addWatermarkToImage } from '../../utils/watermark';

const VOICES = [
  { name: 'Kore', label: 'Kore (Female, Balanced)', color: 'pink' },
  { name: 'Puck', label: 'Puck (Male, Energetic)', color: 'blue' },
  { name: 'Charon', label: 'Charon (Male, Deep)', color: 'indigo' },
  { name: 'Fenrir', label: 'Fenrir (Male, Intense)', color: 'red' },
  { name: 'Zephyr', label: 'Zephyr (Female, Calm)', color: 'teal' },
];

const PodcastTool: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [hostVoice, setHostVoice] = useState(VOICES[1].name); // Puck
  const [guestVoice, setGuestVoice] = useState(VOICES[0].name); // Kore
  
  const [scriptData, setScriptData] = useState<PodcastScript | null>(null);
  const [coverArt, setCoverArt] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const [status, setStatus] = useState<LoadingState>('idle');
  const [step, setStep] = useState(1); // 1: Config, 2: Generating Script, 3: Generating Audio

  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setStep(2);
    setScriptData(null);
    setCoverArt(null);
    setAudioUrl(null);

    try {
      // Step 1: Generate Script
      const script = await generatePodcastScript(topic, "Host", "Guest");
      setScriptData(script);
      
      // Step 2: Parallel - Generate Audio & Cover Art
      setStep(3);
      
      const audioPromise = generateSpeechWithGemini(
        script.script, 
        'Kore', // Ignored for multi-speaker
        1.0, 
        0, 
        [
          { speaker: 'Host', voice: hostVoice },
          { speaker: 'Guest', voice: guestVoice }
        ]
      );

      const artPromise = generateImageWithGemini(`Podcast cover art for "${script.title}". ${script.visualPrompt}. Square, high quality, text overlay`, '1:1');

      const [audio, art] = await Promise.all([audioPromise, artPromise]);
      
      // Automatically watermark the cover art for display
      const watermarkedArt = await addWatermarkToImage(art);
      
      setAudioUrl(audio);
      setCoverArt(watermarkedArt);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Mic2 className="w-8 h-8 text-indigo-500" />
          AI Cast
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Create instant dual-host audio podcasts from any topic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Configuration */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase">Podcast Topic</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. The future of AI in 2030, Why cats are better than dogs, The history of pizza..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Users className="w-3 h-3" /> Host Voice
                   </label>
                   <select 
                      value={hostVoice}
                      onChange={(e) => setHostVoice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                   >
                      {VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Users className="w-3 h-3" /> Guest Voice
                   </label>
                   <select 
                      value={guestVoice}
                      onChange={(e) => setGuestVoice(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                   >
                      {VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                   </select>
                </div>
             </div>

             <button
               onClick={handleGenerate}
               disabled={!topic || status === 'loading'}
               className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
             >
               {status === 'loading' ? (
                 <>
                   <RefreshCw className="animate-spin" />
                   {step === 2 ? 'Writing Script...' : 'Recording Audio...'}
                 </>
               ) : (
                 <>
                   <Mic2 className="fill-current" />
                   Generate Podcast
                 </>
               )}
             </button>
          </div>

          {/* Script Preview */}
          {scriptData && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg animate-fade-in-up max-h-[300px] overflow-y-auto custom-scrollbar">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{scriptData.title}</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                   {scriptData.script}
                </div>
             </div>
          )}
        </div>

        {/* Output Player */}
        <div className="flex flex-col items-center justify-center space-y-6">
           {status === 'idle' && !audioUrl && (
              <div className="text-center text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 w-full h-full flex flex-col items-center justify-center">
                 <Music className="w-16 h-16 opacity-20 mb-4" />
                 <p>Your podcast will appear here.</p>
              </div>
           )}

           {status === 'loading' && (
              <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-4">
                 <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Mic2 className="w-10 h-10 text-indigo-500 animate-pulse" />
                    </div>
                 </div>
                 <p className="text-indigo-400 font-medium animate-pulse">
                    {step === 2 ? 'Scripting episode...' : 'Recording voices...'}
                 </p>
              </div>
           )}

           {status === 'success' && audioUrl && (
              <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden animate-fade-in">
                 {/* Cover Art */}
                 <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-2xl ring-4 ring-slate-100 dark:ring-slate-800">
                    {coverArt ? (
                       <img src={coverArt} alt="Cover Art" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                       </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-center">
                       <p className="text-white text-xs font-bold truncate">{scriptData?.title}</p>
                    </div>
                 </div>

                 {/* Player */}
                 <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <audio ref={audioRef} controls src={audioUrl} className="w-full h-10" autoPlay />
                 </div>

                 <a 
                   href={audioUrl} 
                   download={`ai-cast-${Date.now()}.wav`}
                   className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 px-6 py-3 rounded-xl font-medium transition-colors border border-slate-300 dark:border-slate-700"
                 >
                   <Download className="w-5 h-5" />
                   Download Episode
                 </a>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default PodcastTool;