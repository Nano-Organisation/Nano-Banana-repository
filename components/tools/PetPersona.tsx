
import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Sparkles, Smile, Briefcase, Quote, Upload } from 'lucide-react';
import { analyzePetProfile, generateImageWithGemini } from '../../services/geminiService';
import { LoadingState, PetProfile } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const PetPersona: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [personaImage, setPersonaImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await runFileSecurityChecks(file, 'image');
        const reader = new FileReader();
        reader.onloadend = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
        setProfile(null);
        setPersonaImage(null);
      } catch (e: any) { alert(e.message); }
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setStatus('loading');
    
    try {
      // 1. Analyze
      const result = await analyzePetProfile(image);
      setProfile(result);
      
      // 2. Generate Image
      const img = await generateImageWithGemini(result.visualPrompt + " 3D Disney Pixar style character, cute, expressive, high quality.", '1:1');
      setPersonaImage(img);
      
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
          <Smile className="w-8 h-8 text-yellow-400" />
          Pet Persona
        </h2>
        <p className="text-slate-600 dark:text-slate-400">What if your pet was a human character?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div 
               onClick={() => fileRef.current?.click()}
               className={`
                  aspect-square rounded-full border-4 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all mx-auto w-64 h-64
                  ${image ? 'border-yellow-400 bg-slate-900' : 'border-slate-700 hover:border-yellow-400 hover:bg-slate-800'}
               `}
            >
               {image ? (
                  <img src={image} className="w-full h-full object-cover" />
               ) : (
                  <div className="text-center text-slate-500">
                     <Camera className="w-12 h-12 mx-auto mb-2" />
                     <p className="text-xs font-bold uppercase">Upload Pet</p>
                  </div>
               )}
               <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
            </div>

            <button
               onClick={handleAnalyze}
               disabled={!image || status === 'loading'}
               className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
               {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Sparkles />}
               Reveal Personality
            </button>
         </div>

         <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            {status === 'loading' && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20 backdrop-blur-sm">
                  <div className="text-center">
                     <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-yellow-400 font-bold animate-pulse">Reading mind...</p>
                  </div>
               </div>
            )}

            {profile ? (
               <div className="space-y-6 text-center relative z-10 animate-fade-in-up">
                  {personaImage && (
                     <img src={personaImage} className="w-40 h-40 rounded-full mx-auto border-4 border-white shadow-lg object-cover" />
                  )}
                  
                  <div>
                     <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{profile.name}</h3>
                     <div className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Briefcase className="w-3 h-3" /> {profile.jobTitle}
                     </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                     "{profile.personality}"
                  </p>

                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                     <Quote className="w-6 h-6 text-yellow-500 mx-auto mb-2 opacity-50" />
                     <p className="text-slate-800 dark:text-white font-serif text-lg">"{profile.quote}"</p>
                  </div>
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                  <p>Results will appear here.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default PetPersona;
