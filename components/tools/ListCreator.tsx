
import React, { useState } from 'react';
import { ListChecks, RefreshCw, CheckSquare, Download, Image as ImageIcon } from 'lucide-react';
import { generateHelpfulList, generateImageWithGemini } from '../../services/geminiService';
import { HelpfulList, LoadingState } from '../../types';
import jsPDF from 'jspdf';

const ListCreator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [listData, setListData] = useState<HelpfulList | null>(null);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setListData(null);
    setHeaderImage(null);
    setCheckedItems(new Set());

    try {
      // 1. Generate List Content
      const data = await generateHelpfulList(topic);
      setListData(data);

      // 2. Generate Header Image
      const img = await generateImageWithGemini(data.imagePrompt, '16:9');
      setHeaderImage(img);
      
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDownloadPDF = () => {
    if (!listData) return;
    const doc = new jsPDF();
    
    // Header
    if (headerImage) {
       try {
          doc.addImage(headerImage, 'PNG', 15, 15, 180, 100);
       } catch (e) {
          console.error('Image add failed', e);
       }
    }

    const startY = headerImage ? 125 : 20;
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(listData.title, 15, startY);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text(listData.description, 15, startY + 10);
    doc.setTextColor(0);

    doc.setFont('helvetica', 'normal');
    let y = startY + 25;

    listData.items.forEach((item, i) => {
       if (y > 280) {
          doc.addPage();
          y = 20;
       }
       // Draw checkbox square
       doc.rect(15, y - 4, 5, 5);
       doc.text(item, 25, y);
       y += 10;
    });

    doc.save(`${listData.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <ListChecks className="w-8 h-8 text-lime-500" />
          Nano Lists
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Generate helpful, illustrated checklists for anything.</p>
      </div>

      {/* Input Section */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
         <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">What list do you need?</label>
            <input 
               type="text"
               value={topic}
               onChange={(e) => setTopic(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
               placeholder="e.g. Spring Cleaning, Daily Self Care, Learn Python Basics..."
               className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
         </div>
         <button
            onClick={handleGenerate}
            disabled={!topic || status === 'loading'}
            className="bg-lime-600 hover:bg-lime-700 disabled:opacity-50 text-slate-900 font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg self-end h-[50px]"
         >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <CheckSquare />}
            Create List
         </button>
      </div>

      {/* Result Section */}
      {status === 'loading' && (
         <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-lime-500 font-bold animate-pulse">Organizing your life...</p>
         </div>
      )}

      {listData && status === 'success' && (
         <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            {/* Header Image */}
            <div className="h-48 md:h-64 bg-slate-200 w-full relative">
               {headerImage ? (
                  <img src={headerImage} alt="List Header" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                     <ImageIcon className="w-12 h-12" />
                  </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                  <h3 className="text-3xl md:text-4xl font-bold text-white">{listData.title}</h3>
                  <p className="text-slate-300 mt-2 text-lg">{listData.description}</p>
               </div>
            </div>

            {/* List Content */}
            <div className="p-8">
               <div className="space-y-4 mb-8">
                  {listData.items.map((item, idx) => (
                     <div 
                        key={idx} 
                        onClick={() => toggleItem(idx)}
                        className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                           checkedItems.has(idx) ? 'bg-lime-50 border border-lime-200' : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                        }`}
                     >
                        <div className={`
                           w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                           ${checkedItems.has(idx) ? 'bg-lime-500 border-lime-500' : 'border-slate-300 bg-white'}
                        `}>
                           {checkedItems.has(idx) && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`text-lg ${checkedItems.has(idx) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                           {item}
                        </span>
                     </div>
                  ))}
               </div>

               <div className="flex justify-end pt-6 border-t border-slate-100">
                  <button
                     onClick={handleDownloadPDF}
                     className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg"
                  >
                     <Download className="w-5 h-5" />
                     Download PDF
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ListCreator;
