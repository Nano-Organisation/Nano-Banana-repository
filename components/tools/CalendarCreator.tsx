
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon, Type, Palette, CheckCircle, Plus, X, Trash2, Settings } from 'lucide-react';
import { generateCalendarThemeImage } from '../../services/geminiService';
import { LoadingState } from '../../types';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const STYLES = [
  { id: 'claymation', label: 'Claymation', desc: 'Soft, rounded 3D play-doh look', bg: '#fef3c7', text: '#78350f' },
  { id: 'minimal', label: 'Minimalist', desc: 'Clean lines, typography focus', bg: '#ffffff', text: '#1e293b' },
  { id: 'cyberpunk', label: 'Cyberpunk', desc: 'Neon glows, dark mode', bg: '#0f172a', text: '#22d3ee' },
  { id: 'watercolor', label: 'Watercolor', desc: 'Organic textures, soft art', bg: '#fff7ed', text: '#431407' },
  { id: 'corporate', label: 'Corporate', desc: 'Professional, structured', bg: '#f8fafc', text: '#334155' }
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
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedStyle, setSelectedStyle] = useState('claymation');
  const [selectedFont, setSelectedFont] = useState('sans');
  const [showImage, setShowImage] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);
  
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<LoadingState>('idle');

  // Custom Events State
  // Key format: "YYYY-MM-DD"
  const [events, setEvents] = useState<Record<string, string[]>>({});
  const [activeDay, setActiveDay] = useState<number | null>(null); // Day currently being edited
  const [newEventText, setNewEventText] = useState('');

  // Computed Properties
  const styleConfig = STYLES.find(s => s.id === selectedStyle) || STYLES[0];
  const fontConfig = FONTS.find(f => f.id === selectedFont) || FONTS[0];

  // Calendar Logic (Pure Math - No Hallucination)
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getStartDay = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 = Sunday

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);
  
  // Grid Generation
  const calendarGrid = [];
  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    calendarGrid.push(null);
  }
  // Days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarGrid.push(i);
  }

  const getEventKey = (day: number) => `${year}-${month}-${day}`;

  // --- Image Generation ---
  const handleGenerateImage = async () => {
    if (!showImage) return;
    setImageStatus('loading');
    try {
      const img = await generateCalendarThemeImage(MONTHS[month], year, selectedStyle);
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
    const key = getEventKey(activeDay);
    setEvents(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newEventText.trim()]
    }));
    setNewEventText('');
  };

  const handleDeleteEvent = (day: number, idx: number) => {
    const key = getEventKey(day);
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

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split('-');
    setYear(parseInt(y));
    setMonth(parseInt(m) - 1); // Input month is 1-based, JS is 0-based
  };

  const getHoliday = (day: number) => {
    if (!showHolidays) return null;
    return HOLIDAYS.global.find(h => h.month === month && h.day === day);
  };

  // --- PDF Export ---
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
    doc.text(`${MONTHS[month]} ${year}`, width / 2, startY, { align: 'center' });

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
       const hol = getHoliday(dayCount);
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
       const key = getEventKey(dayCount);
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

    doc.save(`calendar-${MONTHS[month]}-${year}.pdf`);
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
              
              {/* Date Selection */}
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">Target Month</label>
                 <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                       <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input 
                       type="month" 
                       value={`${year}-${(month + 1).toString().padStart(2, '0')}`}
                       onChange={handleDateInput}
                       className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button onClick={nextMonth} className="p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                       <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Style Selector */}
              <div className="space-y-3">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Palette className="w-3 h-3"/> Visual Style</label>
                 <div className="grid grid-cols-2 gap-2">
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
              {showImage && (
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
                 <Download className="w-4 h-4" /> Download PDF
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
              {showImage && (
                 <div className="h-64 w-full bg-black/5 relative flex items-center justify-center overflow-hidden group">
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
              <div className="p-8 flex-1 flex flex-col">
                 <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold uppercase tracking-widest">{MONTHS[month]}</h2>
                    <p className="text-xl opacity-60">{year}</p>
                 </div>

                 {/* Grid Header */}
                 <div className="grid grid-cols-7 mb-4 text-center opacity-60 font-bold text-sm uppercase">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                 </div>

                 {/* Days */}
                 <div className="grid grid-cols-7 gap-2 flex-1">
                    {calendarGrid.map((day, i) => {
                       if (!day) return <div key={i} className="aspect-square"></div>;
                       const holiday = getHoliday(day);
                       const eventKey = getEventKey(day);
                       const dayEvents = events[eventKey] || [];
                       
                       // Specific Styles
                       const isClay = selectedStyle === 'claymation';
                       const isCyber = selectedStyle === 'cyberpunk';
                       
                       return (
                          <div 
                             key={i} 
                             onClick={() => setActiveDay(day)}
                             className={`
                                aspect-square p-2 relative flex flex-col transition-all cursor-pointer group
                                ${isClay ? 'rounded-2xl shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.1),inset_2px_2px_6px_rgba(255,255,255,0.5)] bg-opacity-50 hover:bg-opacity-80' : ''}
                                ${isCyber ? 'border border-cyan-500/30 rounded bg-slate-900/50 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}
                                ${selectedStyle === 'minimal' ? 'border border-gray-200 hover:bg-gray-50' : ''}
                                ${selectedStyle === 'corporate' ? 'bg-white shadow-sm border border-slate-100 rounded hover:shadow-md' : ''}
                                ${selectedStyle === 'watercolor' ? 'hover:bg-orange-50' : ''}
                             `}
                          >
                             <span className="font-bold text-lg leading-none">{day}</span>
                             
                             <div className="flex-1 overflow-hidden mt-1 flex flex-col justify-end">
                                {holiday && (
                                   <span className={`text-[9px] leading-tight font-bold truncate mb-0.5 ${isCyber ? 'text-pink-500' : 'text-red-500'}`}>
                                      {holiday.name}
                                   </span>
                                )}
                                {dayEvents.map((evt, idx) => (
                                   <div key={idx} className={`h-1.5 w-full rounded-full mb-0.5 ${isCyber ? 'bg-cyan-500' : 'bg-indigo-400'}`} title={evt}></div>
                                ))}
                             </div>
                             
                             {/* Hover Hint */}
                             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                                <Plus className="w-3 h-3 opacity-50" />
                             </div>
                          </div>
                       );
                    })}
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
                     {MONTHS[month]} {activeDay}, {year}
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
                     {getHoliday(activeDay) && (
                        <div className="bg-red-900/20 border border-red-500/20 p-2 rounded-lg flex items-center gap-2 text-red-300 text-xs font-bold">
                           <CheckCircle className="w-3 h-3" /> {getHoliday(activeDay)?.name} (Holiday)
                        </div>
                     )}
                     
                     {(events[getEventKey(activeDay)] || []).map((evt, idx) => (
                        <div key={idx} className="bg-slate-800 p-2 rounded-lg flex justify-between items-center text-sm text-slate-300 group">
                           <span>{evt}</span>
                           <button 
                              onClick={() => handleDeleteEvent(activeDay, idx)}
                              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     ))}
                     
                     {!getHoliday(activeDay) && (!events[getEventKey(activeDay)] || events[getEventKey(activeDay)].length === 0) && (
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
