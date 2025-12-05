
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, Volume2, CloudOff } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const LiveTool: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  // References for Audio Contexts and Session
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const startSession = async () => {
    try {
      addLog("Initializing Audio Contexts...");
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      addLog("Requesting Mic...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      addLog("Connecting to Live API...");
      
      // Helper to convert Float32 to 16-bit PCM
      function createBlob(data: Float32Array) {
         const l = data.length;
         const int16 = new Int16Array(l);
         for (let i = 0; i < l; i++) {
           int16[i] = data[i] * 32768;
         }
         // Custom encode logic to avoid external dep
         let binary = '';
         const bytes = new Uint8Array(int16.buffer);
         const len = bytes.byteLength;
         for (let i = 0; i < len; i++) {
           binary += String.fromCharCode(bytes[i]);
         }
         return {
           data: btoa(binary),
           mimeType: 'audio/pcm;rate=16000',
         };
      }
      
      // Audio Decoding
      async function decodeAudioData(base64: string, ctx: AudioContext) {
          const binaryString = atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
             bytes[i] = binaryString.charCodeAt(i);
          }
          
          const dataInt16 = new Int16Array(bytes.buffer);
          const frameCount = dataInt16.length;
          const buffer = ctx.createBuffer(1, frameCount, 24000);
          const channelData = buffer.getChannelData(0);
          for (let i = 0; i < frameCount; i++) {
             channelData[i] = dataInt16[i] / 32768.0;
          }
          return buffer;
      }

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            addLog("Connected!");
            setIsConnected(true);
            
            // Setup input stream
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
              setAudioLevel(sum / inputData.length * 50);

              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current?.then(session => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
               const buffer = await decodeAudioData(base64Audio, outputCtx);
               const source = outputCtx.createBufferSource();
               source.buffer = buffer;
               source.connect(outputNode);
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += buffer.duration;
               sourcesRef.current.add(source);
               source.onended = () => sourcesRef.current.delete(source);
            }
            
            if (msg.serverContent?.interrupted) {
               addLog("Interrupted");
               sourcesRef.current.forEach(s => s.stop());
               sourcesRef.current.clear();
               nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            addLog("Connection Closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error(err);
            addLog("Error occurred");
            setIsConnected(false);
          }
        },
        config: {
           responseModalities: [Modality.AUDIO],
           speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' }}
           }
        }
      });

    } catch (e) {
      console.error(e);
      addLog("Failed to start session");
    }
  };

  const stopSession = () => {
    // There isn't a direct 'disconnect' on the session object easily accessible without reference
    // Reloading is the safest way to fully clear audio contexts and sockets in this simple implementation
    window.location.reload(); 
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in text-center py-12">
       <div className="space-y-4">
          <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${isConnected ? 'bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`}>
             {isConnected ? (
                <div className="flex gap-1 items-end h-12">
                   {[...Array(5)].map((_,i) => (
                      <div 
                        key={i} 
                        className="w-2 bg-indigo-500 rounded-full animate-bounce" 
                        style={{ 
                           height: `${20 + Math.random() * 40}px`,
                           animationDuration: `${0.5 + Math.random() * 0.5}s` 
                        }}
                      ></div>
                   ))}
                </div>
             ) : (
                <Activity className="w-16 h-16 text-slate-600" />
             )}
          </div>
          
          <h2 className="text-4xl font-bold text-white">Nano Live</h2>
          <p className="text-slate-400 max-w-md mx-auto">
             Start a real-time voice conversation with Gemini. Speak naturally and get instant audio responses.
          </p>
       </div>

       <div className="flex flex-col items-center gap-6">
          {!isConnected ? (
             <button
               onClick={startSession}
               className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-4 rounded-2xl flex items-center gap-3 transition-transform hover:scale-105 shadow-xl shadow-indigo-900/30"
             >
                <Mic className="w-6 h-6" />
                Start Conversation
             </button>
          ) : (
             <div className="flex gap-4">
                <button
                   onClick={() => setIsMuted(!isMuted)}
                   className={`p-4 rounded-full border-2 transition-all ${isMuted ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-slate-600 text-slate-400 hover:text-white'}`}
                >
                   {isMuted ? <MicOff /> : <Mic />}
                </button>
                <button
                   onClick={stopSession}
                   className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2"
                >
                   <CloudOff className="w-5 h-5" />
                   End Session
                </button>
             </div>
          )}

          <div className="w-full max-w-sm bg-slate-900 rounded-xl p-4 border border-slate-800 text-left h-32 overflow-hidden font-mono text-xs text-slate-500">
             {logs.map((log, i) => <div key={i}>&gt; {log}</div>)}
          </div>
       </div>
    </div>
  );
};

export default LiveTool;
