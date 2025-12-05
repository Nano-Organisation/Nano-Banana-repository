
import React, { useState, useEffect } from 'react';
import { BookMarked, Lock, Calendar, CheckCircle, Shield, Lightbulb, Clock, RefreshCw } from 'lucide-react';
import { generateDailyTip } from '../../services/geminiService';
import { DailyTip } from '../../types';

const PromptAcademy: React.FC = () => {
  const [daysSinceStart, setDaysSinceStart] = useState(0);
  const [todaysTip, setTodaysTip] = useState<DailyTip | null>(null);
  const [history, setHistory] = useState<DailyTip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeAcademy();
  }, []);

  const initializeAcademy = async () => {
    // 1. Determine "Day Number" based on persistent start date
    let startDateStr = localStorage.getItem('nano_academy_start_date');
    if (!startDateStr) {
      startDateStr = new Date().toISOString();
      localStorage.setItem('nano_academy_start_date', startDateStr);
    }

    const startDate = new Date(startDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Day 1, Day 2...
    
    setDaysSinceStart(dayIndex);

    // 2. Load History from LocalStorage
    const storedHistoryStr = localStorage.getItem('nano_academy_history');
    let storedHistory: DailyTip[] = storedHistoryStr ? JSON.parse(storedHistoryStr) : [];
    
    // 3. Check if we already have a tip for today (DayIndex)
    let tipForToday = storedHistory.find(t => t.dayIndex === dayIndex);

    if (!tipForToday) {
      setLoading(true);
      try {
        // Generate NEW tip for this specific day index
        tipForToday = await generateDailyTip(dayIndex);
        
        // Save to history
        storedHistory = [tipForToday, ...storedHistory]; // Add new tip to front
        localStorage.setItem('nano_academy_history', JSON.stringify(storedHistory));
      } catch (e) {
        console.error("Failed to generate tip", e);
      }
      setLoading(false);
    }

    setTodaysTip(tipForToday || null);
    
    // Filter out today's tip from history list for display
    const prevTips = storedHistory.filter(t => t.dayIndex !== dayIndex);
    setHistory(prevTips);
  };

  const handleRegenerateToday = async () => {
    setLoading(true);
    try {
       const newTip = await generateDailyTip(daysSinceStart);
       setTodaysTip(newTip);
       
       // Update history: remove old entry for today, add new one
       let storedHistoryStr = localStorage.getItem('nano_academy_history');
       let storedHistory: DailyTip[] = storedHistoryStr ? JSON.parse(storedHistoryStr) : [];
       storedHistory = storedHistory.filter(t => t.dayIndex !== daysSinceStart);
       storedHistory = [newTip, ...storedHistory];
       
       localStorage.setItem('nano_academy_history', JSON.stringify(storedHistory));
    } catch (e) {
       console.error("Regeneration failed", e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-12">
      <div className="text-center space-y-2 py-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <BookMarked className="w-8 h-8 text-teal-500" />
          Nano Academy
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Infinite daily lessons to master Prompt Engineering and AI Security.
        </p>
      </div>

      {/* TODAY'S TIP HERO */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-slate-900 ring-1 ring-slate-800 rounded-2xl p-8 md:p-12 space-y-6 min-h-[300px] flex flex-col justify-center">
           {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                 <RefreshCw className="w-12 h-12 text-teal-500 animate-spin" />
                 <p className="text-teal-400 font-medium">Generating today's lesson...</p>
              </div>
           ) : todaysTip ? (
             <>
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <span className="bg-teal-500 text-slate-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Today's Lesson
                     </span>
                     <span className="text-slate-500 text-xs font-mono">
                        Day {todaysTip.dayIndex}
                     </span>
                  </div>
                  <div className="flex items-center gap-4">
                     {todaysTip.category === 'Security' ? (
                        <div className="flex items-center gap-2 text-red-400 text-sm font-bold uppercase tracking-wider">
                           <Shield className="w-5 h-5" /> Security
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold uppercase tracking-wider">
                           <Lightbulb className="w-5 h-5" /> Prompting
                        </div>
                     )}
                  </div>
               </div>
               
               <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-bold text-white">
                     {todaysTip.title}
                  </h3>
                  <p className="text-lg text-slate-300 leading-relaxed">
                     {todaysTip.content}
                  </p>
                  {todaysTip.example && (
                     <div className="bg-slate-950/50 border-l-4 border-teal-500 p-4 rounded-r-xl">
                        <p className="text-sm font-mono text-teal-300">{todaysTip.example}</p>
                     </div>
                  )}
               </div>

               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                     onClick={handleRegenerateToday}
                     className="p-2 text-slate-500 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                     title="Regenerate this tip"
                  >
                     <RefreshCw className="w-4 h-4" />
                  </button>
               </div>
             </>
           ) : (
             <div className="text-center text-slate-500">
                Failed to load tip. Please check your connection.
             </div>
           )}
        </div>
      </div>

      {/* ARCHIVE & UPCOMING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* PREVIOUS LESSONS */}
         <div className="lg:col-span-2 space-y-6">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <CheckCircle className="w-5 h-5 text-slate-400" />
               Previous Lessons
            </h4>
            
            {history.length > 0 ? (
               <div className="space-y-4">
                  {history.map((tip, idx) => (
                     <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:bg-slate-750 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                           <div className="flex items-center gap-2">
                              <span className="text-slate-500 text-xs font-mono">Day {tip.dayIndex}</span>
                              <h5 className="font-bold text-slate-200">{tip.title}</h5>
                           </div>
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              tip.category === 'Security' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
                           }`}>
                              {tip.category}
                           </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                           {tip.content}
                        </p>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                  <p>No previous lessons yet. This is Day 1!</p>
               </div>
            )}
         </div>

         {/* UPCOMING SCHEDULE */}
         <div className="space-y-6">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <Calendar className="w-5 h-5 text-slate-400" />
               Upcoming
            </h4>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
               <div className="flex items-center gap-4 text-slate-500">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                     <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                     <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse mb-2"></div>
                     <div className="h-3 w-1/2 bg-slate-800 rounded animate-pulse"></div>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-slate-800 text-center">
                  <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                     <Clock className="w-4 h-4" />
                     New lesson unlocks tomorrow
                  </p>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default PromptAcademy;
