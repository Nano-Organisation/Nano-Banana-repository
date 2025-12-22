import React from 'react';
/* Fix: Added missing AlertCircle import from lucide-react. */
import { Shield, Key, FileText, Zap, Cpu, Video, Settings, ChevronRight, ArrowLeft, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

interface ActivationGuideProps {
  onBack: () => void;
}

const ActivationGuide: React.FC<ActivationGuideProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-amber-500/30 selection:text-white">
      {/* Subtle Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 lg:py-20">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <Shield className="w-4 h-4 text-amber-500" />
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Official Documentation</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Activation Protocol</h1>
            </div>
          </div>
          <button 
            onClick={() => window.open(window.location.href, '_blank')}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors bg-slate-900 border border-slate-800 px-4 py-2 rounded-full"
          >
            <ExternalLink className="w-3 h-3" />
            Open in New Tab
          </button>
        </header>

        <div className="space-y-16">
          
          {/* Phase 1 */}
          <section className="relative pl-12 border-l-2 border-slate-800 pb-12">
            <div className="absolute left-[-13px] top-0 w-6 h-6 bg-slate-950 border-2 border-amber-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Key className="w-6 h-6 text-amber-500" />
                  Phase 1: Entry & Authentication
                </h2>
                <p className="text-amber-500/80 font-bold text-xs uppercase tracking-widest">Goal: Validate your seat in the suite.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                <ol className="space-y-4 text-sm leading-relaxed">
                  <li className="flex gap-4">
                    <span className="text-amber-500 font-black">01.</span>
                    <span><strong>Locate your License:</strong> Retrieve the unique access code sent to your email.</span>
                  </li>
                  <li className="flex flex-col gap-2 pl-8">
                     <span className="text-[10px] uppercase font-bold text-slate-500">Example Format:</span>
                     <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] break-all text-amber-500/60">
                       Xy7Pq92LmN04vW8zR1cT5bY6kU3hG4jD9sA7fE2wQ1vX9zP0mN8bL7vK4jH3gD2sF1aG5
                     </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-amber-500 font-black">02.</span>
                    <span><strong>Portal Access:</strong> Navigate to the main suite URL.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-amber-500 font-black">03.</span>
                    <span><strong>Authentication:</strong> Enter your unique code into the <strong>License Portal</strong> and click <span className="text-white font-bold">Unlock Suite</span>.</span>
                  </li>
                </ol>
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                   <Zap className="w-5 h-5 text-emerald-500 shrink-0" />
                   <p className="text-xs text-emerald-200/70 font-medium italic">Visual Indicator: You will see a pulsing Zap icon as the gateway verifies your credentials, followed by a transition to the Master Dashboard.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 2 */}
          <section className="relative pl-12 border-l-2 border-slate-800 pb-12">
            <div className="absolute left-[-13px] top-0 w-6 h-6 bg-slate-950 border-2 border-amber-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Cpu className="w-6 h-6 text-indigo-400" />
                  Phase 2: Powering the Engine (The "BYOK" Bridge)
                </h2>
                <p className="text-indigo-400/80 font-bold text-xs uppercase tracking-widest">Goal: Connect the platform to Google’s high-performance compute nodes.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                <ol className="space-y-4 text-sm leading-relaxed">
                  <li className="flex gap-4">
                    <span className="text-indigo-400 font-black">01.</span>
                    <span><strong>Compute Gate:</strong> If this is your first session, you will encounter the <strong>AI PRO UNLOCK</strong> screen.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-indigo-400 font-black">02.</span>
                    <span><strong>Connectivity:</strong> Click the large <span className="text-white font-bold">Connect API Key</span> button.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-indigo-400 font-black">03.</span>
                    <span><strong>Selection:</strong> A secure Google Cloud dialog will appear. Select your <strong>Paid GCP Project API Key</strong>.</span>
                  </li>
                </ol>
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-xs text-amber-200/70 leading-relaxed font-medium">Note: This step is mandatory for multimodal tasks (Video/Audio/4K Imaging) as it bypasses standard "Free Tier" throttling and unlocks professional-grade throughput.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 3 */}
          <section className="relative pl-12 border-l-2 border-slate-800 pb-12">
            <div className="absolute left-[-13px] top-0 w-6 h-6 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <FileText className="w-6 h-6 text-sky-400" />
                  Phase 3: Creative Ingestion (Example: AI Captions)
                </h2>
                <p className="text-sky-400/80 font-bold text-xs uppercase tracking-widest">Goal: Feed the model your source material.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                <ol className="space-y-4 text-sm leading-relaxed">
                  <li className="flex gap-4">
                    <span className="text-sky-400 font-black">01.</span>
                    <span><strong>Launch Tool:</strong> Click on the <strong>AI Captions</strong> flagship button from the primary grid.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-sky-400 font-black">02.</span>
                    <span><strong>Media Upload:</strong> Click <span className="text-white font-bold">SELECT VIDEO / AUDIO</span> or drag your file (max 60s) into the device frame.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-sky-400 font-black">03.</span>
                    <span><strong>Style Selection:</strong> In the <strong>Global Style</strong> panel, select your desired <strong>Font Family</strong>, <strong>Emoji Theme</strong>, and <strong>Display Mode</strong>.</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Phase 4 */}
          <section className="relative pl-12 border-l-2 border-slate-800 pb-12">
            <div className="absolute left-[-13px] top-0 w-6 h-6 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Settings className="w-6 h-6 text-fuchsia-400" />
                  Phase 4: Neural Synthesis
                </h2>
                <p className="text-fuchsia-400/80 font-bold text-xs uppercase tracking-widest">Goal: Trigger the Gemini 3 multimodal transcription.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                <ol className="space-y-4 text-sm leading-relaxed">
                  <li className="flex gap-4">
                    <span className="text-fuchsia-400 font-black">01.</span>
                    <span><strong>Initiate AI:</strong> Click the deep indigo <span className="text-white font-bold">GENERATE AI CAPTIONS</span> button.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-fuchsia-400 font-black">02.</span>
                    <span><strong>The "Listening" Phase:</strong> The button status will switch to <span className="italic text-indigo-400">AI IS LISTENING...</span> while the file is being transmitted via an encrypted stream.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-fuchsia-400 font-black">03.</span>
                    <span><strong>Review & Polish:</strong> Once the progress bar reaches 100%, your captions will populate the <strong>Edit Blocks</strong> sidebar.</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Phase 5 */}
          <section className="relative pl-12 border-l-2 border-slate-800">
            <div className="absolute left-[-13px] top-0 w-6 h-6 bg-slate-950 border-2 border-amber-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Video className="w-6 h-6 text-rose-400" />
                  Phase 5: Production Export
                </h2>
                <p className="text-rose-400/80 font-bold text-xs uppercase tracking-widest">Goal: Finalize the asset for social media distribution.</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                <ol className="space-y-4 text-sm leading-relaxed">
                  <li className="flex gap-4">
                    <span className="text-rose-400 font-black">01.</span>
                    <span><strong>Burn-In:</strong> Click the <span className="text-white font-bold">BURN & EXPORT</span> button.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-rose-400 font-black">02.</span>
                    <span><strong>Rendering:</strong> A production overlay will appear, showing the real-time progress as the browser "burns" the styled captions directly into pixels.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="text-rose-400 font-black">03.</span>
                    <span><strong>Delivery:</strong> Upon completion, your finalized high-resolution <span className="text-white font-bold">.mp4</span> file will automatically download.</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

        </div>

        {/* Pro Tip Footer */}
        <div className="mt-24 pt-12 border-t border-slate-900 flex flex-col items-center gap-6">
           <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Pro-Testing Tip for Admins</h4>
           </div>
           <p className="text-center text-slate-500 text-sm leading-relaxed max-w-2xl">
            When entering your <strong>Master Admin Key</strong>, the system flags the environment as an <strong>Admin Session</strong>. This enables you to bypass the secondary <strong>AI PRO UNLOCK</strong> screen and use the system’s internal backbone for rapid UI/UX verification before testing external user-provided keys.
           </p>
           <button 
             onClick={onBack}
             className="mt-4 px-10 py-4 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
           >
              Return to Portal
           </button>
        </div>
      </div>
    </div>
  );
};

export default ActivationGuide;