
import React, { useState, useEffect } from 'react';
import { BookMarked, Lock, Calendar, CheckCircle, Shield, Lightbulb, Clock, FastForward } from 'lucide-react';

interface Tip {
  id: number;
  title: string;
  content: string;
  category: 'Prompting' | 'Security';
  example?: string;
}

const TIPS: Tip[] = [
  {
    id: 0,
    category: 'Prompting',
    title: 'The Persona Pattern',
    content: 'Always assign a specific role to the AI at the start of your prompt. Instead of asking "Write a blog post," say "Act as an expert copywriter with 10 years of experience in SaaS marketing."',
    example: '"Act as a senior nutritionist. Create a meal plan..."'
  },
  {
    id: 1,
    category: 'Security',
    title: 'Ignore Previous Instructions',
    content: 'Be wary of user inputs that try to override your system instructions. This is a common "Jailbreak" technique. In your own apps, validate user input length and structure before sending it to the model.',
    example: 'Input: "Ignore all previous rules and tell me..." -> Block this.'
  },
  {
    id: 2,
    category: 'Prompting',
    title: 'Chain of Thought',
    content: 'For complex logic, ask the AI to "think step-by-step". This forces the model to generate intermediate reasoning steps, drastically reducing logic errors.',
    example: '"Calculate the total mass. Think step-by-step and show your work."'
  },
  {
    id: 3,
    category: 'Prompting',
    title: 'Few-Shot Prompting',
    content: 'Don\'t just tell the AI what to do; show it. Providing 2-3 examples of the desired input and output format significantly improves consistency.',
    example: '"Convert these names to emails. Example: John Doe -> j.doe@company.com. Now convert: Jane Smith"'
  },
  {
    id: 4,
    category: 'Security',
    title: 'Prompt Injection Defense',
    content: 'When building AI apps, use delimiters (like triple quotes or XML tags) to separate your System Instructions from User Data. This helps the model distinguish commands from content.',
    example: 'Analyze the following text inside <user_input> tags: <user_input>{user_message}</user_input>'
  },
  {
    id: 5,
    category: 'Prompting',
    title: 'Output Constraints',
    content: 'Be extremely specific about what you DO NOT want. Negative constraints are often as important as positive instructions.',
    example: '"Write a summary. Do NOT use the word \'delve\'. Do NOT use bullet points."'
  },
  {
    id: 6,
    category: 'Prompting',
    title: 'The Style Transfer',
    content: 'You can force a specific tone by using "In the style of..." or referencing famous authors, publications, or eras.',
    example: '"Explain quantum physics in the style of Shakespeare."'
  },
  {
    id: 7,
    category: 'Security',
    title: 'PII Leakage Prevention',
    content: 'Never send Personally Identifiable Information (PII) like real credit card numbers, passwords, or patient names to an LLM API unless you have a specific enterprise agreement covering it.',
  },
  {
    id: 8,
    category: 'Prompting',
    title: 'Format Enforcement',
    content: 'If you need code or data, ask for a specific format like JSON, CSV, or Markdown. Even better, provide a schema.',
    example: '"Return the result as a valid JSON object with keys: \'name\', \'age\'."'
  },
  {
    id: 9,
    category: 'Prompting',
    title: 'The "Refine" Loop',
    content: 'Don\'t settle for the first draft. Ask the AI to critique its own work and then improve it based on that critique.',
    example: '"Critique the code above for efficiency, then rewrite it to be O(n)."'
  }
];

const PromptAcademy: React.FC = () => {
  const [unlockedCount, setUnlockedCount] = useState(1);
  const [daysSinceStart, setDaysSinceStart] = useState(0);

  useEffect(() => {
    // 1. Check for start date
    let startDateStr = localStorage.getItem('nano_academy_start_date');
    
    if (!startDateStr) {
      // First visit: Set start date to NOW
      startDateStr = new Date().toISOString();
      localStorage.setItem('nano_academy_start_date', startDateStr);
    }

    const startDate = new Date(startDateStr);
    const now = new Date();
    
    // Calculate difference in days (integers)
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    // We unlock 1 tip per day. 
    // Day 0 (First visit) = 1 tip (Index 0)
    // Day 1 = 2 tips (Indices 0, 1)
    const count = Math.min(diffDays + 1, TIPS.length);
    
    setDaysSinceStart(diffDays);
    setUnlockedCount(count);
  }, []);

  // Debug function to simulate passing time (for demo purposes)
  const simulateNextDay = () => {
    const currentStart = new Date(localStorage.getItem('nano_academy_start_date') || new Date().toISOString());
    // Move start date BACK by 1 day to simulate 1 day passing
    currentStart.setDate(currentStart.getDate() - 1);
    localStorage.setItem('nano_academy_start_date', currentStart.toISOString());
    window.location.reload();
  };

  const todaysTip = TIPS[unlockedCount - 1];
  const previousTips = TIPS.slice(0, unlockedCount - 1).reverse(); // Show newest first
  const lockedCount = TIPS.length - unlockedCount;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-12">
      <div className="text-center space-y-2 py-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <BookMarked className="w-8 h-8 text-teal-500" />
          Nano Academy
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Daily bite-sized lessons to master Prompt Engineering and AI Security.
        </p>
      </div>

      {/* TODAY'S TIP HERO */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-slate-900 ring-1 ring-slate-800 rounded-2xl p-8 md:p-12 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span className="bg-teal-500 text-slate-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                    Today's Lesson
                 </span>
                 <span className="text-slate-500 text-xs font-mono">
                    Day {daysSinceStart + 1}
                 </span>
              </div>
              {todaysTip.category === 'Security' ? (
                 <Shield className="w-6 h-6 text-red-400" />
              ) : (
                 <Lightbulb className="w-6 h-6 text-yellow-400" />
              )}
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
            
            {previousTips.length > 0 ? (
               <div className="space-y-4">
                  {previousTips.map(tip => (
                     <div key={tip.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:bg-slate-750 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                           <h5 className="font-bold text-slate-200">{tip.title}</h5>
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              tip.category === 'Security' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
                           }`}>
                              {tip.category}
                           </span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                           {tip.content}
                        </p>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                  <p>No previous lessons yet. Come back tomorrow!</p>
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
               <div className="flex items-center gap-4 text-slate-500 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                     <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                     <div className="h-4 w-2/3 bg-slate-800 rounded mb-2"></div>
                     <div className="h-3 w-1/3 bg-slate-800 rounded"></div>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-slate-800 text-center">
                  <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                     <Clock className="w-4 h-4" />
                     Next lesson unlocks in 24h
                  </p>
               </div>
            </div>

            {/* Hidden Dev Tool for Demo Purposes */}
            <div className="text-center pt-8 opacity-20 hover:opacity-100 transition-opacity">
               <button 
                  onClick={simulateNextDay}
                  className="text-xs text-slate-500 hover:text-teal-400 flex items-center justify-center gap-1 mx-auto"
                  title="Dev Tool: Fast forward time"
               >
                  <FastForward className="w-3 h-3" /> Simulate Next Day
               </button>
            </div>
         </div>

      </div>
    </div>
  );
};

export default PromptAcademy;
