
import React, { useState } from 'react';
import { Heart, RefreshCw, Download, Sun, Calendar, Sparkles } from 'lucide-react';
import { generateAffirmationPlan } from '../../services/geminiService';
import { LoadingState, AffirmationPlan } from '../../types';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const TONES = ['Empowering', 'Gentle', 'Direct', 'Spiritual', 'Gratitude-focused'];

const AffirmationGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [plan, setPlan] = useState<AffirmationPlan | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setPlan(null);
    try {
      const result = await generateAffirmationPlan(topic, tone);
      setPlan(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDownloadPDF = () => {
    if (!plan) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const addWatermark = () => {
        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text(WATERMARK_TEXT, pageWidth - 10, 10, { align: 'right' });
        doc.text(WATERMARK_TEXT, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.setTextColor(0);
    };

    addWatermark();
    
    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 128, 128); // Teal color
    doc.text("Weekly Affirmations", pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Focus: ${plan.topic}`, pageWidth / 2, 35, { align: 'center' });
    
    // Mantra
    doc.setDrawColor(0, 128, 128);
    doc.setLineWidth(0.5);
    doc.rect(margin, 45, pageWidth - (margin * 2), 30, 'S');
    
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text("MANTRA OF THE WEEK", pageWidth / 2, 55, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(0);
    const splitMantra = doc.splitTextToSize(`"${plan.weeklyMantra}"`, pageWidth - (margin * 3));
    doc.text(splitMantra, pageWidth / 2, 65, { align: 'center' });

    // Daily List
    let y = 90;
    doc.setFontSize(12);
    
    plan.dailyAffirmations.forEach((item) => {
       // Day Label
       doc.setFont('helvetica', 'bold');
       doc.setTextColor(0, 128, 128);
       doc.text(item.day, margin, y);
       
       // Affirmation Text
       doc.setFont('helvetica', 'normal');
       doc.setTextColor(50);
       const splitText = doc.splitTextToSize(item.text, pageWidth - margin - 50);
       doc.text(splitText, margin + 35, y);
       
       y += (splitText.length * 7) + 8;
    });

    doc.save(`affirmations-${topic.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <Heart className="w-8 h-8 text-teal-500" />
          Nano Affirmations
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate a personalized weekly affirmation plan.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash
           </span>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
         <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase">What area do you need support in?</label>
               <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. New Job, Anxiety, Confidence, Healing..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase">Preferred Tone</label>
               <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                     <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                           tone === t 
                           ? 'bg-teal-600/20 border-teal-500 text-teal-400' 
                           : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                        }`}
                     >
                        {t}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         <button
            onClick={handleGenerate}
            disabled={!topic.trim() || status === 'loading'}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
         >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <Sparkles />}
            Generate Plan
         </button>
      </div>

      {/* Result Section */}
      {status === 'loading' && (
         <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-teal-500 font-bold animate-pulse">Manifesting positivity...</p>
         </div>
      )}

      {plan && (
         <div className="space-y-6 animate-fade-in-up">
            
            {/* Mantra Card */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-2xl p-8 border border-teal-800 text-center space-y-4 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-20 bg-teal-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
               <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 text-teal-400 font-bold uppercase tracking-widest text-xs mb-2">
                     <Sun className="w-4 h-4" /> Mantra of the Week
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif text-white italic leading-relaxed">
                     "{plan.weeklyMantra}"
                  </h3>
               </div>
            </div>

            {/* Daily Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {plan.dailyAffirmations.map((item, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-teal-500/30 transition-colors">
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-teal-500 border border-slate-700 flex-shrink-0">
                           <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                           <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">{item.day}</h4>
                           <p className="text-slate-300 font-medium">{item.text}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="flex justify-center pt-4">
               <button 
                  onClick={handleDownloadPDF}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-700"
               >
                  <Download className="w-5 h-5" />
                  Download PDF Plan
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default AffirmationGenerator;
