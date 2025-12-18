import React, { useState } from 'react';
import { FileQuestion, RefreshCw, Download, CheckCircle, HelpCircle } from 'lucide-react';
import { generateQuiz } from '../../services/geminiService';
import { LoadingState, QuizData } from '../../types';
import jsPDF from 'jspdf';
import { WATERMARK_TEXT } from '../../utils/watermark';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

const QuizGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [status, setStatus] = useState<LoadingState>('idle');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStatus('loading');
    setQuizData(null);
    try {
      const data = await generateQuiz(topic, count, difficulty);
      setQuizData(data);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleDownloadPDF = (withAnswers: boolean) => {
    if (!quizData) return;
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
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(quizData.topic, margin, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Difficulty: ${quizData.difficulty}  |  Questions: ${quizData.questions.length}`, margin, 32);
    
    let y = 45;

    quizData.questions.forEach((q, i) => {
       if (y > 250) {
          doc.addPage();
          addWatermark();
          y = 20;
       }
       
       // Question
       doc.setFont('helvetica', 'bold');
       doc.setFontSize(11);
       const questionText = `${i + 1}. ${q.question}`;
       const splitQuestion = doc.splitTextToSize(questionText, pageWidth - (margin * 2));
       doc.text(splitQuestion, margin, y);
       y += (splitQuestion.length * 6) + 2;

       // Options
       doc.setFont('helvetica', 'normal');
       doc.setFontSize(10);
       q.options.forEach((opt, optIndex) => {
          const letter = String.fromCharCode(65 + optIndex); // A, B, C, D
          doc.text(`${letter}) ${opt}`, margin + 5, y);
          y += 6;
       });
       y += 6; // Spacing between questions
    });

    // Answer Key Page
    if (withAnswers) {
       doc.addPage();
       addWatermark();
       doc.setFontSize(16);
       doc.setFont('helvetica', 'bold');
       doc.text("Answer Key", margin, 25);
       
       y = 40;
       doc.setFontSize(10);
       doc.setFont('helvetica', 'normal');
       
       quizData.questions.forEach((q, i) => {
          if (y > 270) {
             doc.addPage();
             addWatermark();
             y = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${q.correctAnswer}`, margin, y);
          y += 5;
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100);
          const expl = doc.splitTextToSize(`Explanation: ${q.explanation}`, pageWidth - (margin * 2));
          doc.text(expl, margin, y);
          doc.setTextColor(0);
          y += (expl.length * 5) + 8;
       });
    }

    doc.save(`nano-quiz-${topic.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <FileQuestion className="w-8 h-8 text-indigo-500" />
          Nano Quiz
        </h2>
        <div className="flex flex-col items-center gap-1">
           <p className="text-slate-600 dark:text-slate-400">Generate structured quizzes on any topic instantly.</p>
           <span className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              /* Fix: Updated label to match the actual model used (gemini-3-flash-preview). */
              Model: gemini-3-flash-preview
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Controls */}
         <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Topic</label>
                  <input
                     value={topic}
                     onChange={(e) => setTopic(e.target.value)}
                     placeholder="e.g. Photosynthesis, Ancient Rome, Javascript..."
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                     {DIFFICULTIES.map(diff => (
                        <button
                           key={diff}
                           onClick={() => setDifficulty(diff)}
                           className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                              difficulty === diff
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                           }`}
                        >
                           {diff}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Questions: {count}</label>
                  <input 
                     type="range" 
                     min="3" 
                     max="15" 
                     value={count} 
                     onChange={(e) => setCount(Number(e.target.value))}
                     className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
               </div>

               <button
                  onClick={handleGenerate}
                  disabled={!topic.trim() || status === 'loading'}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
               >
                  {status === 'loading' ? <RefreshCw className="animate-spin" /> : <HelpCircle />}
                  Generate Quiz
               </button>
            </div>
         </div>

         {/* Preview */}
         <div className="md:col-span-2">
            {status === 'loading' && (
               <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-400 animate-pulse">Designing questions...</p>
               </div>
            )}

            {!quizData && status !== 'loading' && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl min-h-[300px]">
                  <FileQuestion className="w-16 h-16 opacity-20 mb-4" />
                  <p>Enter a topic to generate a quiz.</p>
               </div>
            )}

            {quizData && (
               <div className="space-y-6 animate-fade-in-up">
                  <div className="flex flex-wrap gap-4 justify-end">
                     <button 
                        onClick={() => handleDownloadPDF(false)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
                     >
                        <Download className="w-4 h-4" />
                        Download PDF (Student)
                     </button>
                     <button 
                        onClick={() => handleDownloadPDF(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
                     >
                        <CheckCircle className="w-4 h-4" />
                        Download with Answers
                     </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8">
                     <div className="border-b border-slate-800 pb-6">
                        <h3 className="text-2xl font-bold text-white">{quizData.topic}</h3>
                        <p className="text-slate-400">{quizData.difficulty} • {quizData.questions.length} Questions</p>
                     </div>

                     <div className="space-y-8">
                        {quizData.questions.map((q, i) => (
                           <div key={i} className="space-y-3">
                              <h4 className="text-lg font-medium text-slate-200">{i + 1}. {q.question}</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 {q.options.map((opt, idx) => (
                                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm text-slate-400">
                                       <span className="font-bold text-slate-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                       {opt}
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default QuizGenerator;