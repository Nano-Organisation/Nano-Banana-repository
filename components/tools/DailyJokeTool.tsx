
import React, { useState, useEffect } from 'react';
import { Laugh, Calendar, RefreshCw } from 'lucide-react';
import { generateDailyJoke } from '../../services/geminiService';

const DailyJokeTool: React.FC = () => {
  const [joke, setJoke] = useState('');
  const [loading, setLoading] = useState(false);
  const [dayIndex, setDayIndex] = useState(1);

  useEffect(() => {
    initializeJoke();
  }, []);

  const initializeJoke = async () => {
    // Determine "Day Number"
    let startDateStr = localStorage.getItem('nano_academy_start_date'); // Reuse same start date for consistency
    if (!startDateStr) {
      startDateStr = new Date().toISOString();
      localStorage.setItem('nano_academy_start_date', startDateStr);
    }

    const startDate = new Date(startDateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const dayIdx = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setDayIndex(dayIdx);

    // Check Local Storage for today's joke
    const storedJokeData = localStorage.getItem('nano_daily_joke');
    if (storedJokeData) {
       const parsed = JSON.parse(storedJokeData);
       if (parsed.dayIndex === dayIdx) {
          setJoke(parsed.joke);
          return;
       }
    }

    // Generate new if needed
    setLoading(true);
    try {
       const newJoke = await generateDailyJoke(dayIdx);
       setJoke(newJoke);
       localStorage.setItem('nano_daily_joke', JSON.stringify({ dayIndex: dayIdx, joke: newJoke }));
    } catch (e) {
       console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in text-center py-12">
       <div className="space-y-4">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
             <Laugh className="w-10 h-10 text-yellow-500" />
             AI Joke of the Day
          </h2>
          <div className="inline-flex items-center gap-2 bg-slate-200 dark:bg-slate-800 px-4 py-1 rounded-full text-sm font-medium text-slate-600 dark:text-slate-400">
             <Calendar className="w-4 h-4" /> Day {dayIndex}
          </div>
       </div>

       <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-24 bg-yellow-500/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-yellow-500/20 transition-colors"></div>
          
          {loading ? (
             <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-12 h-12 text-yellow-500 animate-spin" />
                <p className="text-yellow-500 font-bold">Thinking of something funny...</p>
             </div>
          ) : (
             <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed font-serif relative z-10">
                "{joke}"
             </p>
          )}
       </div>
    </div>
  );
};

export default DailyJokeTool;
