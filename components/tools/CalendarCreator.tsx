
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon, Type, Palette, CheckCircle, Plus, X, Trash2, Settings, Grid3X3, Layout, List } from 'lucide-react';
import { generateCalendarThemeImage } from '../../services/geminiService';
import { LoadingState } from '../../types';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const STYLES = [
  { id: 'claymation', label: 'Claymation', desc: 'Soft, rounded 3D play-doh look', bg: '#fef3c7', text: '#78350f' },
  { id: 'minimal', label: 'Minimalist', desc: 'Clean lines, typography focus', bg: '#ffffff', text: '#1e293b' },
  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon glows, dark mode', bg: '#0f172a', text: '#22d3ee' },
  { id: 'watercolor', label: 'Watercolor', desc: 'Organic textures, soft art', bg: '#fff7ed', text: '#431407' },
  { id: 'corporate', label: 'Corporate', desc: 'Professional, structured', bg: '#f8fafc', text: '#334155' },
  { id: 'cutout', label: 'Cutout Animation', desc: 'Layered paper art aesthetic', bg: '#fff1f2', text: '#be123c' },
  { id: 'animation', label: 'Animation', desc: 'Vibrant modern cartoon style', bg: '#f0f9ff', text: '#0369a1' },
  { id: 'rotoscope', label: 'Rotoscope', desc: 'Realistic traced hand-drawn look', bg: '#fafaf9', text: '#1c1917' },
  { id: 'typography', label: 'Typography', desc: 'Kinetic text-focused art', bg: '#171717', text: '#facc15' },
  { id: 'classic2d', label: 'Classic 2D', desc: 'Traditional hand-drawn frame style', bg: '#eff6ff', text: '#1e3a8a' },
  { id: 'pixilation', label: 'Pixilation', desc: 'Stop-motion with live subjects', bg: '#f3e8ff', text: '#6b21a8' },
  { id: 'silhouette', label: 'Silhouette', desc: 'High contrast shadow art', bg: '#020617', text: '#e2e8f0' },
  { id: 'stopmotion', label: 'Stop Motion', desc: 'Physical object animation style', bg: '#fffbeb', text: '#b45309' }
];

const FONTS = [
  { id: 'sans', label: 'Modern Sans', css: 'font-sans' },
  { id: 'serif', label: 'Elegant Serif', css: 'font-serif' },
  { id: 'mono', label: 'Tech Mono', css: 'font-mono' }
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Standard Holidays (No Hallucination - Hardcoded)
const HOLIDAYS: Record<string, { month: number, day: number, name: string }[]> = {
  global: [
    { month: 0, day: 1, name: "New Year's Day" },
    { month: 1, day: 14, name: "Valentine's Day" },
    { month: 2, day: 17, name: "St. Patrick's Day" },
    { month: 9, day: 31, name: "Halloween" },
    { month: 10, day: 11, name: "Remembrance Day" },
    { month: 11, day: 25, name: "Christmas Day" },
    { month: 11, day: 31, name: "New Year's Eve" }
  ]
};

const CalendarCreator: React.FC = () => {
  // State
  const [view, setView] = useState<'annual' | 'monthly' | 'weekly'>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

  const [selectedStyle, setSelectedStyle] = useState('claymation');
  const [selectedFont, setSelectedFont] = useState('sans');
  const [showImage, setShowImage] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);
  
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<LoadingState>('idle');

  // Custom Events State
  // Key format: "YYYY-MM-DD"
  const [events, setEvents] = useState<Record<string, string[]>>({});
  const [activeDay, setActiveDay] = useState<{ day: number, month: number, year: number } | null>(null);
  const [newEventText, setNewEventText] = useState('');

  // Computed Properties
  const styleConfig = STYLES.find(s => s.id === selectedStyle) || STYLES[0];
  const fontConfig = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  const getEventKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

  // --- Image Generation ---
  const handleGenerateImage = async () => {
    if (!showImage) return;
    setImageStatus('loading');
    try {
      const monthLabel = view === 'annual' ? 'Year' : MONTHS[month];
      const img = await generateCalendarThemeImage(monthLabel, year, selectedStyle);
      setHeaderImage(img);
      setImageStatus('success');
    } catch (e) {
      console.error(e);
      setImageStatus('error');
    }
  };

  // --- Event Management ---
  const handleAddEvent = () => {
    if (!activeDay || !newEventText.trim()) return;
    const key = getEventKey(activeDay.year, activeDay.month, activeDay.day);
    setEvents(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newEventText.trim()]
    }));
    setNewEventText('');
  };

  const handleDeleteEvent = (y: number, m: number, d: number, idx: number) => {
    const key = getEventKey(y, m, d);
    setEvents(prev => {
      const currentList = [...(prev[key] || [])];
      currentList.splice(idx, 1);
      if (currentList.length === 0) {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      }
      return { ...prev, [key]: currentList };
    });
  };

  // --- Navigation Logic ---
  const handleNext = () => {
    if (view === 'annual') {
        setYear(y => y + 1);
    } else if (view === 'monthly') {
        if (month === 11) {
            setMonth(0);
            setYear(y => y + 1);
        } else {
            setMonth(m => m + 1);
        }
    } else if (view === 'weekly') {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() + 7);
        setWeekStartDate(d);
        // Sync context
        setMonth(d.getMonth());
        setYear(d.getFullYear());
    }
  };

  const handlePrev = () => {
    if (view === 'annual') {
        setYear(y => y - 1);
    } else if (view === 'monthly') {
        if (month === 0) {
            setMonth(11);
            setYear(y => y - 1);
        } else {
            setMonth(m => m - 1);
        }
    } else if (view === 'weekly') {
        const d = new Date(weekStartDate);
        d.setDate(d.getDate() - 7);
        setWeekStartDate(d);
        // Sync context
        setMonth(d.getMonth());
        setYear(d.getFullYear());
    }
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split('-');
    setYear(parseInt(y));
    setMonth(parseInt(m) - 1);
    
    // For weekly, try to set to 1st of selected month
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    setWeekStartDate(d);
  };

  const getHoliday = (m: number, d: number) => {
    if (!showHolidays) return null;
    return HOLIDAYS.global.find(h => h.month === m && h.day === d);
  };

  // --- PDF Export (Optimized for Monthly) ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const width = 210;
    const height = 297;
    const margin = 10;

    // Background
    doc.setFillColor(styleConfig.bg);
    doc.rect(0, 0, width, height, 'F');

    // Header Image
    let startY = margin;
    if (showImage && headerImage) {
       try {
          doc.addImage(headerImage, 'PNG', margin, margin, width - (margin * 2), 80);
          startY = 100;
       } catch (e) { console.error('PDF Image Error'); }
    } else {
       startY = 30;
    }

    // Title
    doc.setTextColor(styleConfig.text);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    
    const titleText = view === 'annual' ? `${year} Calendar` : `${MONTHS[month]} ${year}`;
    doc.text(titleText, width / 2, startY, { align: 'center' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    // Grid
    const gridY = startY + 15;
    const cellWidth = (width - (margin * 2)) / 7;
    const cellHeight = 25;
    
    // Weekdays
    doc.setFontSize(10);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach((day, i) => {
       doc.text(day, margin + (i * cellWidth) + (cellWidth/2), gridY, { align: 'center' });
    });

    // Days
    let currentX = margin;
    let currentY = gridY + 5;
    
    // Re-calculate grid for PDF loop
    let dayCount = 1;
    // Skip padding
    currentX += startDay * cellWidth;

    while (dayCount <= daysInMonth) {
       // Cell Box
       doc.setDrawColor(styleConfig.text);
       doc.setLineWidth(0.1);
       doc.rect(currentX, currentY, cellWidth, cellHeight);
       
       // Day Number
       doc.setFontSize(12);
       doc.setFont('helvetica', 'normal');
       doc.setTextColor(styleConfig.text);
       doc.text(dayCount.toString(), currentX + 2, currentY + 6);

       let contentY = currentY + 12;

       // Holiday?
       const hol = getHoliday(month, dayCount);
       if (hol) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(200, 0, 0); // Red for holidays
          const splitText = doc.splitTextToSize(hol.name, cellWidth - 4);
          doc.text(splitText, currentX + 2, contentY);
          contentY += (splitText.length * 3) + 2;
          doc.setTextColor(styleConfig.text); // Reset color
       }

       // Custom Events
       const key = getEventKey(year, month, dayCount);
       const dayEvents = events[key] || [];
       dayEvents.forEach(evt => {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 150); // Dark Blue for user events
          const splitText = doc.splitTextToSize(evt, cellWidth - 4);
          
          // Check for overflow (simple check)
          if (contentY + (splitText.length * 3) < currentY + cellHeight) {
             doc.text(splitText, currentX + 2, contentY);
             contentY += (splitText.length * 3) + 1;
          }
       });

       dayCount++;
       currentX += cellWidth;
       
       // New Row
       if ((startDay + dayCount - 1) % 7 === 0) {
          currentX = margin;
          currentY += cellHeight;
       }
    }

    // Watermark
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(WATERMARK_TEXT, width / 2, height - 5, { align: 'center' });

    doc.save(`calendar-${view}-${year}.pdf`);
  };

  // --- Render Helpers ---

  const renderMonthlyGrid = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const grid = [];
    
    // Header
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Padding
    for (let i = 0; i < startDay; i++) grid.push(null);
    // Days
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);

    // Styles
    const isClay = selectedStyle === 'claymation';
    const isCyber = selectedStyle === 'cyberpunk';

    return (
        <>
            <div className="grid grid-cols-7 mb-4 text-center opacity-60 font-bold text-sm uppercase">
                {weekdays.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                {grid.map((day, i) => {
                    if (!day) return <div key={i} className="aspect-square"></div>;
                    const holiday = getHoliday(month, day);
                    const eventKey = getEventKey(year, month, day);
                    const dayEvents = events[eventKey] || [];
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => setActiveDay({ day, month, year })}
                            className={`
                            p-2 relative flex flex-col transition-all cursor-pointer group min-h-[80px]
                            ${isClay ? 'rounded-2xl shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.1),inset_2px_2px_6px_rgba(255,255,255,0.5)] bg-opacity-50 hover:bg-opacity-80' : ''}
                            ${isCyber ? 'border border-cyan-500/30 rounded bg-slate-900/50 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}
                            ${selectedStyle === 'minimal' ? 'border border-gray-200 hover:bg-gray-50' : ''}
                            ${selectedStyle === 'corporate' ? 'bg-white shadow-sm border border-slate-100 rounded hover:shadow-md' : ''}
                            ${selectedStyle === 'watercolor' ? 'hover:bg-orange-50' : ''}
                            `}
                        >
                            <span className="font-bold text-lg leading-none">{day}</span>
                            
                            <div className="flex-1 overflow-hidden mt-1 flex flex-col justify-end gap-0.5">
                                {holiday && (
                                    <span className={`text-[9px] leading-tight font-bold truncate ${isCyber ? 'text-pink-500' : 'text-red-500'}`}>
                                    {holiday.name}
                                    </span>
                                )}
                                {dayEvents.map((evt, idx) => (
                                    <div key={idx} className={`h-1.5 w-full rounded-full ${isCyber ? 'bg-cyan-500' : 'bg-indigo-400'}`} title={evt}></div>
                                ))}
                            </div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                                <Plus className="w-3 h-3 opacity-50" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
  };

  const renderAnnualGrid = () => {
    return (
        <div className="grid grid-cols-3 gap-4 h-full overflow-y-auto custom-scrollbar pr-2">
            {MONTHS.map((mName, mIdx) => {
                const daysInM = new Date(year, mIdx + 1, 0).getDate();
                const startD = new Date(year, mIdx, 1).getDay();
                const grid = Array(startD).fill(null).concat([...Array(daysInM).keys()].map(i => i + 1));
                
                return (
                    <div key={mName} className="flex flex-col border border-current/10 rounded-lg p-2 overflow-hidden bg-white/5">
                        <div className="text-center font-bold text-xs uppercase mb-1 opacity-70">{mName}</div>
                        <div className="grid grid-cols-7 gap-0.5 flex-1">
                            {grid.map((d, i) => {
                                if(!d) return <div key={i}></div>;
                                const holiday = getHoliday(mIdx, d);
                                const hasEvent = events[getEventKey(year, mIdx, d)]?.length > 0;
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => {
                                            setMonth(mIdx);
                                            setView('monthly');
                                        }}
                                        className={`
                                            flex items-center justify-center text-[8px] cursor-pointer hover:font-bold rounded-sm h-4
                                            ${holiday ? 'bg-red-500/20 text-red-600 font-bold' : ''}
                                            ${hasEvent ? 'bg-indigo-500/20 text-indigo-600 font-bold' : ''}
                                        `}
                                    >
                                        {d}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderWeeklyGrid = () => {
    const days = [];
    const d = new Date(weekStartDate);
    
    // Specific styles
    const isCyber = selectedStyle === 'cyberpunk';
    const isClay = selectedStyle === 'claymation';

    for (let i = 0; i < 7; i++) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
    }

    return (
        <div className="grid grid-cols-7 gap-2 h-full">
            {days.map((date, i) => {
                const dayNum = date.getDate();
                const mIdx = date.getMonth();
                const yIdx = date.getFullYear();
                const holiday = getHoliday(mIdx, dayNum);
                const eventKey = getEventKey(yIdx, mIdx, dayNum);
                const dayEvents = events[eventKey] || [];
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                    <div 
                        key={i} 
                        onClick={() => setActiveDay({ day: dayNum, month: mIdx, year: yIdx })}
                        className={`
                            flex flex-col p-2 border-r border-current/10 last:border-0 h-full relative cursor-pointer group transition-colors
                            ${isToday ? 'bg-current/5' : ''}
                            ${isClay ? 'rounded-xl shadow-inner bg-opacity-30' : ''}
                            ${isCyber ? 'border border-cyan-500/20 rounded hover:border-cyan-400' : ''}
                            hover:bg-black/5
                        `}
                    >
                        <div className="text-center border-b border-current/10 pb-2 mb-2">
                            <div className="text-xs font-bold uppercase opacity-50">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]}</div>
                            <div className={`text-2xl font-bold ${isToday ? 'text-indigo-500' : ''}`}>{dayNum}</div>
                        </div>
                        
                        <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                            {holiday && (
                                <div className={`text-[10px] font-bold p-1 rounded ${isCyber ? 'bg-pink-500/20 text-pink-300' : 'bg-red-100 text-red-800'}`}>
                                    {holiday.name}
                                </div>
                            )}
                            {dayEvents.map((evt, idx) => (
                                <div key={idx} className={`text-[10px] p-1.5 rounded ${isCyber ? 'bg-cyan-900/40 text-cyan-200' : 'bg-indigo-100 text-indigo-900'}`}>
                                    {evt}
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                            <Plus className="w-3 h-3 opacity-50" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <CalendarIcon className="w-8 h-8 text-indigo-500" />
          AI Calendar
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Design custom calendars with holidays and personal events.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash-image
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
              
              {/* View Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                 <button onClick={() => setView('annual')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors ${view === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Grid3X3 className="w-3 h-3" /> Year
                 </button>
                 <button onClick={() => setView('monthly')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors ${view === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <Layout className="w-3 h-3" /> Month
                 </button>
                 <button onClick={() => setView('weekly')} className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-colors ${view === 'weekly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    <List className="w-3 h-3" /> Week
                 </button>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Target Date</label>
                 <div className="flex gap-2">
                    <button onClick={handlePrev} className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                       <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input 
                       type="month" 
                       value={`${year}-${(month + 1).toString().padStart(2, '0')}`}
                       onChange={handleDateInput}
                       className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono text-center"
                    />
                    <button onClick={handleNext} className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                       <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Style Selector */}
              <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Palette className="w-3 h-3"/> Visual Style</label>
                 <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto custom-scrollbar pr-1">
                    {STYLES.map(s => (
                       <button 
                          key={s.id}
                          onClick={() => setSelectedStyle(s.id)}
                          className={`text-left p-3 rounded-lg border transition-all ${selectedStyle === s.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                       >
                          <div className="text-xs font-bold">{s.label}</div>
                          <div className="text-[10px] opacity-70 truncate">{s.desc}</div>
                       </button>
                    ))}
                 </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Settings className="w-3 h-3"/> Options</label>
                 
                 <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-700">
                    <span className="text-sm text-slate-300">Show Image</span>
                    <button 
                       onClick={() => setShowImage(!showImage)}
                       className={`w-10 h-5 rounded-full relative transition-colors ${showImage ? 'bg-green-500' : 'bg-slate-700'}`}
                    >
                       <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showImage ? 'translate-x-5' : ''}`}></div>
                    </button>
                 </div>

                 <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-700">
                    <span className="text-sm text-slate-300">International Holidays</span>
                    <button 
                       onClick={() => setShowHolidays(!showHolidays)}
                       className={`w-10 h-5 rounded-full relative transition-colors ${showHolidays ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                       <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showHolidays ? 'translate-x-5' : ''}`}></div>
                    </button>
                 </div>
                 
                 {/* Font Selector */}
                 <div className="space-y-1 pt-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Font Family</label>
                    <select 
                       value={selectedFont} 
                       onChange={(e) => setSelectedFont(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                       {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                 </div>
              </div>

              {/* Generate Image Button */}
              {showImage && view !== 'annual' && (
                 <button
                    onClick={handleGenerateImage}
                    disabled={imageStatus === 'loading'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                 >
                    {imageStatus === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    Generate Theme Art
                 </button>
              )}

              <button
                 onClick={handleDownloadPDF}
                 className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
              >
                 <Download className="w-4 h-4" /> Download PDF (Monthly)
              </button>
           </div>
        </div>

        {/* PREVIEW */}
        <div className="lg:col-span-2">
           <div 
              className={`rounded-2xl shadow-2xl overflow-hidden transition-colors duration-500 min-h-[600px] flex flex-col ${fontConfig.css}`}
              style={{ backgroundColor: styleConfig.bg, color: styleConfig.text }}
           >
              {/* Header Image Area */}
              {showImage && view !== 'annual' && (
                 <div className="h-64 w-full bg-black/5 relative flex items-center justify-center overflow-hidden group shrink-0">
                    {headerImage ? (
                       <img src={headerImage} alt="Header" className="w-full h-full object-cover" />
                    ) : (
                       <div className="text-center opacity-30 p-8">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm font-bold">Generate art for {MONTHS[month]}</p>
                       </div>
                    )}
                    {imageStatus === 'loading' && (
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <RefreshCw className="w-8 h-8 text-white animate-spin" />
                       </div>
                    )}
                 </div>
              )}

              {/* Calendar Body */}
              <div className="p-8 flex-1 flex flex-col h-full">
                 <div className="text-center mb-6">
                    <h2 className="text-4xl font-bold uppercase tracking-widest">
                        {view === 'annual' ? year : view === 'weekly' ? `Week of ${MONTHS[weekStartDate.getMonth()]} ${weekStartDate.getDate()}` : MONTHS[month]}
                    </h2>
                    <p className="text-xl opacity-60">{view === 'weekly' ? weekStartDate.getFullYear() : year}</p>
                 </div>

                 <div className="flex-1">
                    {view === 'monthly' && renderMonthlyGrid()}
                    {view === 'annual' && renderAnnualGrid()}
                    {view === 'weekly' && renderWeeklyGrid()}
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* EVENT MODAL */}
      {activeDay !== null && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
               <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <CalendarIcon className="w-4 h-4 text-indigo-500" />
                     {MONTHS[activeDay.month]} {activeDay.day}, {activeDay.year}
                  </h3>
                  <button onClick={() => setActiveDay(null)} className="text-slate-500 hover:text-white transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-4 space-y-4">
                  {/* Add Event Form */}
                  <div className="flex gap-2">
                     <input 
                        value={newEventText}
                        onChange={(e) => setNewEventText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
                        placeholder="Add event..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        autoFocus
                     />
                     <button 
                        onClick={handleAddEvent}
                        disabled={!newEventText.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                     >
                        <Plus className="w-5 h-5" />
                     </button>
                  </div>

                  {/* List Events */}
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                     {getHoliday(activeDay.month, activeDay.day) && (
                        <div className="bg-red-900/20 border border-red-500/20 p-2 rounded-lg flex items-center gap-2 text-red-300 text-xs font-bold">
                           <CheckCircle className="w-3 h-3" /> {getHoliday(activeDay.month, activeDay.day)?.name} (Holiday)
                        </div>
                     )}
                     
                     {(events[getEventKey(activeDay.year, activeDay.month, activeDay.day)] || []).map((evt, idx) => (
                        <div key={idx} className="bg-slate-800 p-2 rounded-lg flex justify-between items-center text-sm text-slate-300 group">
                           <span>{evt}</span>
                           <button 
                              onClick={() => handleDeleteEvent(activeDay.year, activeDay.month, activeDay.day, idx)}
                              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     ))}
                     
                     {!getHoliday(activeDay.month, activeDay.day) && (!events[getEventKey(activeDay.year, activeDay.month, activeDay.day)] || events[getEventKey(activeDay.year, activeDay.month, activeDay.day)].length === 0) && (
                        <p className="text-center text-slate-600 text-xs py-4">No events scheduled.</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default CalendarCreator;
