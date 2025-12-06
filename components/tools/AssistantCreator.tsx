
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Image as ImageIcon, Send, RefreshCw, Settings, Trash2, User, Camera, X } from 'lucide-react';
import { Chat } from "@google/genai";
import { createChatSession } from '../../services/geminiService';
import { ChatMessage, LoadingState } from '../../types';

interface AssistantConfig {
  name: string;
  role: string;
  tone: string;
  instructions: string;
}

const AssistantCreator: React.FC = () => {
  const [mode, setMode] = useState<'create' | 'chat'>('create');
  const [config, setConfig] = useState<AssistantConfig>({
    name: '',
    role: '',
    tone: '',
    instructions: ''
  });

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [inputImage, setInputImage] = useState<string | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Voice Setup ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };
        recognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreate = () => {
    if (!config.name || !config.instructions) return;
    
    const systemPrompt = `
      You are a custom AI assistant named "${config.name}".
      ROLE: ${config.role}
      TONE: ${config.tone}
      
      SPECIFIC INSTRUCTIONS:
      ${config.instructions}
      
      Always stay in character.
    `;

    chatSessionRef.current = createChatSession(systemPrompt);
    setMessages([{ role: 'model', text: `Hello! I am ${config.name}. How can I assist you today?` }]);
    setMode('chat');
  };

  const handleEdit = () => {
    setMode('create');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setInputImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setInputImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && !inputImage) || !chatSessionRef.current || status === 'loading') return;

    const userText = inputValue.trim();
    const currentImage = inputImage; // Capture image state
    
    setInputValue('');
    setInputImage(null);
    setStatus('loading');

    // Add user message to UI
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userText, 
      image: currentImage || undefined 
    }]);

    try {
      let response;
      
      // Construct message payload
      // Note: We use the SDK's loose typing for message content to support parts
      if (currentImage) {
        const base64Data = currentImage.split(',')[1];
        const parts = [
           { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
           { text: userText || "Analyze this image." }
        ];
        response = await chatSessionRef.current.sendMessage({ message: parts as any });
      } else {
        response = await chatSessionRef.current.sendMessage({ message: userText });
      }

      const modelText = response.text || "I didn't have a response for that.";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
      setStatus('idle');
    } catch (error) {
      console.error("Assistant Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
      setStatus('error');
    }
  };

  if (mode === 'create') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
            <Bot className="w-10 h-10 text-cyan-500" />
            AI Assistant Creator
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Design your own specialized AI companion.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Name</label>
              <input
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="e.g. Chef Remy, Code Ninja, Dr. Watson"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Role</label>
                <input
                  value={config.role}
                  onChange={(e) => setConfig({ ...config, role: e.target.value })}
                  placeholder="e.g. Expert French Chef"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tone</label>
                <input
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                  placeholder="e.g. Grumpy but helpful"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Instructions & Knowledge</label>
              <textarea
                value={config.instructions}
                onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                placeholder="Describe exactly how the assistant should behave, what it knows, and any rules it must follow..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-40 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!config.name || !config.instructions}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
          >
            <Bot className="w-5 h-5" />
            Create Assistant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{config.name}</h2>
            <p className="text-xs text-slate-400">{config.role} • {config.tone}</p>
          </div>
        </div>
        <button 
          onClick={handleEdit}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Edit Assistant"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg
                ${msg.role === 'user' ? 'bg-slate-700' : 'bg-cyan-600'}
              `}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-slate-300" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              
              <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.image && (
                  <img src={msg.image} alt="User Upload" className="w-48 rounded-lg border border-slate-700 shadow-md" />
                )}
                <div className={`
                  rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-md
                  ${msg.role === 'user' 
                    ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                    : 'bg-slate-950/80 border border-slate-800 text-slate-300 rounded-tl-none'}
                `}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {status === 'loading' && (
             <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
                 <Bot className="w-5 h-5 text-white" />
               </div>
               <div className="bg-slate-950/50 border border-slate-800 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2">
                 <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                 <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                 <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          {inputImage && (
            <div className="mb-3 flex items-center gap-3 bg-slate-900 w-fit px-3 py-2 rounded-lg border border-slate-800 animate-fade-in-up">
              <img src={inputImage} className="w-10 h-10 object-cover rounded" />
              <button onClick={clearImage} className="text-slate-400 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex gap-3 items-end">
            <button 
              onClick={() => {
                setMessages([]);
                chatSessionRef.current = null;
                handleCreate(); // Re-init
              }}
              className="p-3 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-colors mb-[2px]"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl transition-all mb-[2px] ${inputImage ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'}`}
              title="Upload Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

            <button
              onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()}
              className={`p-3 rounded-xl transition-all mb-[2px] ${
                isListening 
                  ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' 
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Message ${config.name}...`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none max-h-32 min-h-[50px] custom-scrollbar"
                style={{ height: '52px' }}
              />
            </div>
            
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && !inputImage) || status === 'loading'}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors mb-[2px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantCreator;
