
import React, { useState, useRef } from 'react';
import { FileAudio, Upload, RefreshCw, Copy, Check, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';
import { transcribeAudioWithGemini } from '../../services/geminiService';
import { LoadingState } from '../../types';
import { runFileSecurityChecks } from '../../utils/security';

const AudioTranscriber: React.FC = () => {
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await runFileSecurityChecks(file, 'audio');
        
        setFileName(file.name);
        setMimeType(file.type);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioFile(reader.result as string);
          setTranscript('');
          setStatus('idle');
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        alert(err.message);
        e.target.value = '';
      }
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) return;
    setStatus('loading');
    setFeedback(null);
    try {
      const result = await transcribeAudioWithGemini(audioFile, mimeType);
      setTranscript(result);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFeedback = (type: 'up' | 'down') => {
    if (feedback === type) setFeedback(null);
    else setFeedback(type);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <FileAudio className="w-8 h-8 text-sky-500" />
          Nano Scribe
          <span className="text-xs font-normal bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-full border border-sky-200 dark:border-sky-800 ml-2">
             Model: gemini-2.5-flash
          </span>
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Accurate audio transcription powered by Gemini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Upload Section */}
        <div className="md:col-span-1 space-y-6">
          <div 
            onClick={() => fileRef.current?.click()}
            className={`
              aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-all
              ${audioFile ? 'border-sky-500 bg-sky-900/10' : 'border-slate-700 hover:border-sky-500 hover:bg-slate-800'}
            `}
          >
            {audioFile ? (
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 bg-sky-500/20 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileAudio className="w-8 h-8" />
                </div>
                <p className="font-bold text-sky-400 truncate max-w-[200px]">{fileName}</p>
                <button 
                   onClick={(e) => {
                      e.stopPropagation();
                      setAudioFile(null);
                      setTranscript('');
                      if (fileRef.current) fileRef.current.value = '';
                   }}
                   className="text-xs text-red-400 hover:text-red-300 underline mt-2"
                >
                   Remove File
                </button>
              </div>
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-medium text-slate-300">Upload Audio</p>
                <p className="text-xs text-slate-500">MP3, WAV, M4A</p>
              </div>
            )}
            <input type="file" ref={fileRef} className="hidden" onChange={handleUpload} accept="audio/*" />
          </div>

          <button 
            onClick={handleTranscribe}
            disabled={!audioFile || status === 'loading'}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-900/20"
          >
            {status === 'loading' ? <RefreshCw className="animate-spin" /> : <FileText />}
            Transcribe
          </button>
        </div>

        {/* Result Section */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col relative h-[500px]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
               Transcription Result
            </h3>
            {transcript && (
               <div className="flex items-center gap-3">
                  <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                    <button 
                      onClick={() => toggleFeedback('up')} 
                      className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback === 'up' ? 'text-green-500' : 'text-slate-500'}`}
                    >
                       <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px bg-slate-800 mx-0.5"></div>
                    <button 
                      onClick={() => toggleFeedback('down')} 
                      className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${feedback === 'down' ? 'text-red-500' : 'text-slate-500'}`}
                    >
                       <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                 </div>
                 <button 
                   onClick={handleCopy} 
                   className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                 >
                   {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                   Copy Text
                 </button>
               </div>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {status === 'loading' ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                 <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-sky-400 animate-pulse">Listening and transcribing...</p>
              </div>
            ) : transcript ? (
              <div className="prose prose-invert prose-sm max-w-none">
                 <p className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono text-sm">{transcript}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                 <FileAudio className="w-16 h-16 opacity-20 mb-4" />
                 <p>Upload an audio file to see the transcription here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioTranscriber;
