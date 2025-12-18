import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  Compass, 
  Target, 
  LineChart, 
  Wallet, 
  ChevronRight, 
  Save, 
  Trash2, 
  Info, 
  Lightbulb, 
  Zap,
  ArrowRight,
  Plus,
  BarChart2,
  Settings,
  Shield,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---

interface UserProfile {
  name: string;
  age: number;
  currentIncome: number;
  monthlySavings: number;
  savingsBalance: number;
  careerGoals: string;
  location: string;
  agreedToTerms: boolean;
}

interface CareerRoadmap {
  steps: {
    title: string;
    description: string;
    timeline: string;
    skillsNeeded: string[];
    potentialIncomeBoost: string;
  }[];
  marketInsight: string;
}

interface FinancialProjection {
  years: {
    year: number;
    estimatedNetWorth: number;
    monthlyIncome: number;
  }[];
  summary: string;
}

interface RetirementPlan {
  feasibleAge: number;
  strategy: string;
  milestones: string[];
}

interface SkillGapAnalysis {
  gaps: {
    skill: string;
    urgency: 'High' | 'Medium' | 'Low';
    howToLearn: string;
  }[];
}

interface MarketTrend {
  title: string;
  trend: 'Rising' | 'Steady' | 'Declining';
  description: string;
  impactOnCareer: string;
}

interface Advice {
  headline: string;
  content: string;
  actionableSteps: string[];
}

// --- Constants ---

const INITIAL_PROFILE: UserProfile = {
  name: '',
  age: 30,
  currentIncome: 50000,
  monthlySavings: 500,
  savingsBalance: 5000,
  careerGoals: '',
  location: 'Global',
  agreedToTerms: false
};

// --- Components ---

export default function FuturePathAI() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('fp_profile');
    return saved ? JSON.parse(saved) : INITIAL_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'career' | 'finance' | 'retirement' | 'skills' | 'trends' | 'advice'>('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Results State
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmap | null>(null);
  const [financeProjection, setFinanceProjection] = useState<FinancialProjection | null>(null);
  const [retirementPlan, setRetirementPlan] = useState<RetirementPlan | null>(null);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[] | null>(null);
  const [generalAdvice, setGeneralAdvice] = useState<Advice | null>(null);

  useEffect(() => {
    localStorage.setItem('fp_profile', JSON.stringify(profile));
  }, [profile]);

  const canGenerate = profile.name && profile.careerGoals && profile.agreedToTerms;

  const generateContent = async (type: typeof activeTab) => {
    if (!canGenerate) return;
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let prompt = "";
    let schema: any = {};

    const profileSummary = `User Profile: Name: ${profile.name}, Age: ${profile.age}, Current Income: $${profile.currentIncome}, Monthly Savings: $${profile.monthlySavings}, Current Savings: $${profile.savingsBalance}, Career Goals: ${profile.careerGoals}, Location: ${profile.location}.`;

    switch (type) {
      case 'career':
        prompt = `${profileSummary} Generate a 5-step career roadmap to reach the stated goals. Include specific skills, timeline, and potential income increases.`;
        schema = {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  timeline: { type: Type.STRING },
                  skillsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
                  potentialIncomeBoost: { type: Type.STRING }
                },
                required: ['title', 'description', 'timeline', 'skillsNeeded', 'potentialIncomeBoost']
              }
            },
            marketInsight: { type: Type.STRING }
          },
          required: ['steps', 'marketInsight']
        };
        break;
      case 'finance':
        prompt = `${profileSummary} Project financial growth over the next 15 years based on current savings, income, and likely career progression. Assume conservative market returns (7% avg).`;
        schema = {
          type: Type.OBJECT,
          properties: {
            years: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  year: { type: Type.INTEGER },
                  estimatedNetWorth: { type: Type.NUMBER },
                  monthlyIncome: { type: Type.NUMBER }
                },
                required: ['year', 'estimatedNetWorth', 'monthlyIncome']
              }
            },
            summary: { type: Type.STRING }
          },
          required: ['years', 'summary']
        };
        break;
      case 'retirement':
        prompt = `${profileSummary} Analyze when this person can realistically retire with a comfortable lifestyle and provide a strategy to reach that point faster.`;
        schema = {
          type: Type.OBJECT,
          properties: {
            feasibleAge: { type: Type.INTEGER },
            strategy: { type: Type.STRING },
            milestones: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['feasibleAge', 'strategy', 'milestones']
        };
        break;
      case 'skills':
        prompt = `${profileSummary} Perform a skill gap analysis based on their current situation and career goals. Identify what they lack and how to acquire it.`;
        schema = {
          type: Type.OBJECT,
          properties: {
            gaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  urgency: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                  howToLearn: { type: Type.STRING }
                },
                required: ['skill', 'urgency', 'howToLearn']
              }
            }
          },
          required: ['gaps']
        };
        break;
      case 'trends':
        prompt = `Based on the career goal: "${profile.careerGoals}", identify 4 current and future market trends that will impact this career path.`;
        schema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              trend: { type: Type.STRING, enum: ['Rising', 'Steady', 'Declining'] },
              description: { type: Type.STRING },
              impactOnCareer: { type: Type.STRING }
            },
            required: ['title', 'trend', 'description', 'impactOnCareer']
          }
        };
        break;
      case 'advice':
        prompt = `${profileSummary} Provide personalized high-level advice for lifestyle and career optimization.`;
        schema = {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            content: { type: Type.STRING },
            actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['headline', 'content', 'actionableSteps']
        };
        break;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      const data = JSON.parse(response.text || '{}');
      
      if (type === 'career') setCareerRoadmap(data);
      if (type === 'finance') setFinanceProjection(data);
      if (type === 'retirement') setRetirementPlan(data);
      if (type === 'skills') setSkillAnalysis(data);
      if (type === 'trends') setMarketTrends(data);
      if (type === 'advice') setGeneralAdvice(data);
      
    } catch (err) {
      console.error("AI Generation Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearProfile = () => {
    if (confirm("Reset all data?")) {
      setProfile(INITIAL_PROFILE);
      localStorage.removeItem('fp_profile');
      setCareerRoadmap(null);
      setFinanceProjection(null);
      setRetirementPlan(null);
      setSkillAnalysis(null);
      setMarketTrends(null);
      setGeneralAdvice(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-200">
              <Compass className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              FuturePath AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={clearProfile}
              className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Reset
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs text-indigo-600 hover:underline">
              Powered by Gemini
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar - Profile Editor */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold">Your Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Current Age</label>
                  <input 
                    type="number" 
                    value={profile.age}
                    onChange={e => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Location</label>
                  <input 
                    type="text" 
                    value={profile.location}
                    onChange={e => setProfile({...profile, location: e.target.value})}
                    placeholder="e.g. London"
                    className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Annual Income ($)</label>
                <input 
                  type="number" 
                  value={profile.currentIncome}
                  onChange={e => setProfile({...profile, currentIncome: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Current Savings ($)</label>
                  <input 
                    type="number" 
                    value={profile.savingsBalance}
                    onChange={e => setProfile({...profile, savingsBalance: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Monthly Contribution</label>
                  <input 
                    type="number" 
                    value={profile.monthlySavings}
                    onChange={e => setProfile({...profile, monthlySavings: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Career Ambitions</label>
                <textarea 
                  value={profile.careerGoals}
                  onChange={e => setProfile({...profile, careerGoals: e.target.value})}
                  placeholder="e.g. Become a Senior CTO, Retire with passive income by 50, launch a startup..."
                  rows={4}
                  className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-3 transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={profile.agreedToTerms}
                    onChange={e => setProfile({...profile, agreedToTerms: e.target.checked})}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700">
                    I agree that these projections are AI-generated estimates and do not constitute professional financial advice.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'career', label: 'Career Map', icon: Briefcase },
              { id: 'finance', label: 'Projections', icon: LineChart },
              { id: 'retirement', label: 'Retirement', icon: Wallet },
              { id: 'skills', label: 'Skills Gap', icon: Zap },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'advice', label: 'Daily Advice', icon: Lightbulb }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setActiveTab(btn.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === btn.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-300 ring-offset-2' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <btn.icon className="w-4 h-4" />
                {btn.label}
              </button>
            ))}
          </div>

          <div className="min-h-[600px]">
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Target className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 space-y-4 max-w-lg">
                    <h2 className="text-4xl font-black leading-tight">Welcome, {profile.name || 'Visionary'}.</h2>
                    <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">
                      This is your centralized hub for charting the future. Complete your profile and use the modules above to unlock tailored AI insights.
                    </p>
                    <div className="pt-4 flex gap-4">
                      <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-indigo-200 block">Net Worth Focus</span>
                        <span className="text-xl font-bold">${profile.savingsBalance.toLocaleString()}</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-indigo-200 block">Growth Goal</span>
                        <span className="text-xl font-bold">10-15% YoY</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-500" />
                      Secure Data
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      We never store your financial data on our servers. Your profile lives entirely in your browser's local storage.
                    </p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Action Oriented
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Our models are optimized to provide practical, immediate steps to help you bridge the gap between where you are and where you want to be.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'dashboard' && (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black capitalize">{activeTab} Analysis</h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Custom Insight Protocol</p>
                  </div>
                  <button
                    disabled={!canGenerate || loading}
                    onClick={() => generateContent(activeTab)}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loading ? 'Analyzing...' : 'Generate New Insight'}
                  </button>
                </div>

                <div className="p-8">
                  {!canGenerate && (
                    <div className="text-center py-20">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Info className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold">Profile Incomplete</h3>
                      <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">
                        Please fill in your name, career goals, and agree to the terms in the sidebar to begin analysis.
                      </p>
                    </div>
                  )}

                  {canGenerate && !loading && !getCurrentData(activeTab, {careerRoadmap, financeProjection, retirementPlan, skillAnalysis, marketTrends, generalAdvice}) && (
                    <div className="text-center py-20 text-slate-400">
                      <p className="text-sm font-medium">Click "Generate New Insight" to start the analysis.</p>
                    </div>
                  )}

                  {loading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-indigo-600 font-bold animate-pulse text-sm">Deep Learning Model Computing...</p>
                    </div>
                  )}

                  {!loading && activeTab === 'career' && careerRoadmap && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="grid gap-6">
                        {careerRoadmap.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-6 group">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-600 flex items-center justify-center text-indigo-600 font-black shrink-0 shadow-sm transition-transform group-hover:scale-110">
                                {idx + 1}
                              </div>
                              {idx !== careerRoadmap.steps.length - 1 && (
                                <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                              )}
                            </div>
                            <div className="pb-8 space-y-2">
                              <div className="flex items-center gap-3">
                                <h4 className="text-lg font-bold text-slate-800">{step.title}</h4>
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                  {step.timeline}
                                </span>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {step.skillsNeeded.map(s => (
                                  <span key={s} className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200">
                                    {s}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded">
                                Est. Income Impact: {step.potentialIncomeBoost}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                        <Info className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <h5 className="font-bold text-indigo-900 text-sm">Market Insight</h5>
                          <p className="text-indigo-800/80 text-sm mt-1">{careerRoadmap.marketInsight}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!loading && activeTab === 'finance' && financeProjection && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="bg-slate-900 rounded-3xl p-6 overflow-x-auto border border-slate-800">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-800">
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Year</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Monthly Income</th>
                              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Net Worth (Projected)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {financeProjection.years.map((y, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-4 text-sm font-mono text-indigo-400">Year {y.year}</td>
                                <td className="px-4 py-4 text-sm font-bold text-slate-200">${y.monthlyIncome.toLocaleString()}</td>
                                <td className="px-4 py-4 text-sm font-bold text-white">${y.estimatedNetWorth.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
                        <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                          <LineChart className="w-5 h-5" />
                          Growth Summary
                        </h4>
                        <p className="text-indigo-50 leading-relaxed text-sm">{financeProjection.summary}</p>
                      </div>
                    </div>
                  )}

                  {!loading && activeTab === 'retirement' && retirementPlan && (
                    <div className="space-y-8 animate-fade-in">
                      <div className="flex flex-col md:flex-row items-center gap-8 justify-center py-6">
                        <div className="relative">
                          <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-indigo-200">
                            <span className="text-5xl font-black tracking-tighter">{retirementPlan.feasibleAge}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Retirement Age</span>
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg border border-white/20">
                            FEASIBLE
                          </div>
                        </div>
                        <div className="max-w-sm space-y-3">
                           <h3 className="text-2xl font-black text-slate-800 leading-tight">Your Freedom Timeline.</h3>
                           <p className="text-slate-500 text-sm leading-relaxed">{retirementPlan.strategy}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {retirementPlan.milestones.map((m, i) => (
                          <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4 group hover:bg-indigo-50 hover:border-indigo-200 transition-all">
                             <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                                {i + 1}
                             </div>
                             <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-900">{m}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && activeTab === 'skills' && skillAnalysis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {skillAnalysis.gaps.map((gap, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
                          <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-start">
                              <h4 className="text-lg font-bold text-slate-800">{gap.skill}</h4>
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${
                                gap.urgency === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                                gap.urgency === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-blue-50 text-blue-600 border-blue-100'
                              }`}>
                                {gap.urgency} Priority
                              </span>
                            </div>
                            <div className="space-y-1">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Path</span>
                               <p className="text-sm text-slate-600 leading-relaxed">{gap.howToLearn}</p>
                            </div>
                            <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 group-hover:translate-x-1 transition-transform">
                               Learn More <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && activeTab === 'trends' && marketTrends && (
                    <div className="space-y-6 animate-fade-in">
                      {marketTrends.map((trend, i) => (
                        <div key={i} className="flex gap-6 p-6 rounded-3xl bg-slate-50 border border-slate-200 items-start hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                          <div className={`p-3 rounded-2xl shrink-0 ${
                            trend.trend === 'Rising' ? 'bg-emerald-100 text-emerald-600' : 
                            trend.trend === 'Steady' ? 'bg-blue-100 text-blue-600' : 
                            'bg-red-100 text-red-600'
                          }`}>
                            {trend.trend === 'Rising' ? <TrendingUp className="w-6 h-6" /> : <BarChart2 className="w-6 h-6" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <h4 className="font-bold text-lg">{trend.title}</h4>
                               <span className="text-[10px] font-bold opacity-60 uppercase">{trend.trend}</span>
                            </div>
                            <p className="text-sm text-slate-500">{trend.description}</p>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                               <p className="text-xs font-bold text-indigo-600">Impact: {trend.impactOnCareer}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && activeTab === 'advice' && generalAdvice && (
                    <div className="max-w-2xl mx-auto space-y-8 py-10 animate-fade-in">
                       <div className="text-center space-y-4">
                          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-amber-600">
                            <Lightbulb className="w-8 h-8" />
                          </div>
                          <h2 className="text-3xl font-black text-slate-800">{generalAdvice.headline}</h2>
                          <p className="text-slate-500 leading-relaxed text-lg">{generalAdvice.content}</p>
                       </div>
                       
                       <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 space-y-4">
                          <h4 className="text-sm font-black uppercase text-indigo-900 tracking-widest">Key Optimization Steps</h4>
                          <div className="grid gap-3">
                             {generalAdvice.actionableSteps.map((step, i) => (
                               <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-indigo-200/50 shadow-sm">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  <span className="text-sm font-bold text-slate-700">{step}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <Compass className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">FuturePath AI</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact Support</a>
          </div>
          <p className="text-xs text-slate-400">© 2025 Digital Gentry. Built for the future.</p>
        </div>
      </footer>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function getCurrentData(tab: string, state: any) {
  if (tab === 'career') return state.careerRoadmap;
  if (tab === 'finance') return state.financeProjection;
  if (tab === 'retirement') return state.retirementPlan;
  if (tab === 'skills') return state.skillAnalysis;
  if (tab === 'trends') return state.marketTrends;
  if (tab === 'advice') return state.generalAdvice;
  return null;
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}