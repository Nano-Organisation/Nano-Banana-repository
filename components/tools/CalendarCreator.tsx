
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon, Type, Palette, CheckCircle } from 'lucide-react';
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
    { month: 9, day: 31, name: "Halloween" },
    { month: 11, day: 25, name: "Christmas" },
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
  
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<LoadingState>('idle');

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

  // --- Image Generation ---
  const handleGenerateImage = async () => {
    if (!showImage) return;
    setImageStatus('loading');
    try {
      const img = await generateCalendarThemeImage(MONTHS[month], selectedStyle);
      setHeaderImage(img);
      setImageStatus('success');
    } catch (e) {
      console.error(e);
      setImageStatus('error');
    }
  };

  // Auto-generate image when style/month changes if image mode is on
  useEffect(() => {
    if (showImage && imageStatus !== 'loading') {
       // Debounce slightly or just let user click generate? 
       // For better UX, let's make it manual or explicit trigger to save API calls, 
       // but initially empty.
       // Let's reset the image when month changes so they know to regenerate or keep old
       // setHeaderImage(null); 
    }
  }, [month, selectedStyle]);

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

  const getHoliday = (day: number) => {
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
       doc.text(dayCount.toString(), currentX + 2, currentY + 6);

       // Holiday?
       const hol = getHoliday(dayCount);
       if (hol) {
          doc.setFontSize(7);
          doc.setTextColor(200, 0, 0);
          const splitText = doc.splitTextToSize(hol.name, cellWidth - 4);
          doc.text(splitText, currentX + 2, currentY + 15);
          doc.setTextColor(styleConfig.text);
       }

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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <CalendarIcon className="w-8 h-8 text-indigo-500" />
          AI Calendar
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Design custom monthly calendars with AI-generated art.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Model: gemini-2.5-flash-image
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
              
              {/* Navigation */}
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                 <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-white transition-colors"><ChevronLeft /></button>
                 <div className="text-center">
                    <div className="font-bold text-white text-lg">{MONTHS[month]}</div>
                    <div className="text-xs text-slate-400 font-mono">{year}</div>
                 </div>
                 <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-white transition-colors"><ChevronRight /></button>
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

              {/* Font & Toggle */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Type className="w-3 h-3"/> Font</label>
                    <select 
                       value={selectedFont} 
                       onChange={(e) => setSelectedFont(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                       {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Header Image</label>
                    <button 
                       onClick={() => setShowImage(!showImage)}
                       className={`w-full py-2 rounded-lg text-xs font-bold transition-all border ${showImage ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}`}
                    >
                       {showImage ? 'Enabled' : 'Disabled'}
                    </button>
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
                    Generate {MONTHS[month]} Art
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
                       
                       // Specific Styles
                       const isClay = selectedStyle === 'claymation';
                       const isCyber = selectedStyle === 'cyberpunk';
                       
                       return (
                          <div 
                             key={i} 
                             className={`
                                aspect-square p-2 relative flex flex-col justify-between transition-all hover:scale-105
                                ${isClay ? 'rounded-2xl shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.1),inset_2px_2px_6px_rgba(255,255,255,0.5)] bg-opacity-50' : ''}
                                ${isCyber ? 'border border-cyan-500/30 rounded bg-slate-900/50 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]' : ''}
                                ${selectedStyle === 'minimal' ? 'border border-gray-200' : ''}
                                ${selectedStyle === 'corporate' ? 'bg-white shadow-sm border border-slate-100 rounded' : ''}
                             `}
                          >
                             <span className="font-bold text-lg">{day}</span>
                             {holiday && (
                                <span className={`text-[8px] leading-tight font-bold ${isCyber ? 'text-pink-500' : 'text-red-500'}`}>
                                   {holiday.name}
                                </span>
                             )}
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarCreator;
