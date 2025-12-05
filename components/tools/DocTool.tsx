
import React, { useState } from 'react';
import { FileText, Scissors, Download, FileType, CheckCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

const DocTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'split'>('pdf');
  const [input, setInput] = useState('');
  const [filename, setFilename] = useState('nano-doc');
  
  // Splitter State
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunks, setChunks] = useState<string[]>([]);

  // --- PDF Logic ---
  const handleDownloadPdf = () => {
    if (!input.trim()) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(input, 180); // Wrap text
    let y = 20;
    
    // Simple pagination loop
    for (let i = 0; i < splitText.length; i++) {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(splitText[i], 15, y);
        y += 7; // Line height
    }
    
    doc.save(`${filename}.pdf`);
  };

  // --- Splitter Logic ---
  const handleSplit = () => {
    if (!input.trim()) return;
    const result = [];
    for (let i = 0; i < input.length; i += chunkSize) {
      result.push(input.substring(i, i + chunkSize));
    }
    setChunks(result);
  };

  const handleDownloadZip = async () => {
    if (chunks.length === 0) return;
    const zip = new JSZip();
    chunks.forEach((chunk, idx) => {
        zip.file(`${filename}_part_${idx + 1}.txt`, chunk);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_split.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <FileType className="w-8 h-8 text-teal-500" />
          Nano Doc
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Essential document utilities powered by Nano.</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pdf' ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          PDF Converter
        </button>
        <button
          onClick={() => setActiveTab('split')}
          className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeTab === 'split' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Scissors className="w-4 h-4" />
          File Splitter
        </button>
      </div>

      {/* Main Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
        
        {/* Input Area */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-400 uppercase">Input Text</label>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-slate-500">Filename:</span>
                   <input 
                     type="text" 
                     value={filename}
                     onChange={(e) => setFilename(e.target.value)}
                     className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-teal-500 outline-none w-32"
                   />
                </div>
            </div>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your text content here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y min-h-[200px]"
            />
            <div className="text-right text-xs text-slate-500">
                {input.length} characters
            </div>
        </div>

        {/* Tab Specific Actions */}
        {activeTab === 'pdf' && (
            <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                <button
                    onClick={handleDownloadPdf}
                    disabled={!input.trim()}
                    className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20"
                >
                    <Download className="w-5 h-5" />
                    Download as PDF
                </button>
                <p className="text-xs text-slate-500">Converts standard text to a downloadable PDF document.</p>
            </div>
        )}

        {activeTab === 'split' && (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col md:flex-row items-end gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-sm text-slate-400">Split every N characters:</label>
                        <input 
                            type="number" 
                            min="10"
                            step="100"
                            value={chunkSize}
                            onChange={(e) => setChunkSize(Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <button
                        onClick={handleSplit}
                        disabled={!input.trim()}
                        className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2"
                    >
                        <Scissors className="w-4 h-4" />
                        Split Now
                    </button>
                </div>

                {chunks.length > 0 && (
                    <div className="space-y-4 border-t border-slate-800 pt-6">
                        <div className="flex items-center justify-between">
                             <h3 className="font-bold text-white flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Created {chunks.length} Parts
                             </h3>
                             <button
                                onClick={handleDownloadZip}
                                className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1"
                             >
                                <Download className="w-4 h-4" />
                                Download All (ZIP)
                             </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {chunks.map((_, idx) => (
                                <div key={idx} className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                                    <FileText className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                                    <div className="text-xs text-slate-300 font-mono">Part {idx + 1}</div>
                                    <div className="text-[10px] text-slate-500">{chunks[idx].length} chars</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default DocTool;
