
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User, Bot, RefreshCw, Mic, MicOff, ThumbsUp, ThumbsDown, Trash2, BrainCircuit } from 'lucide-react';
import { Chat } from "@google/genai";
import { createChatSession, createThinkingChatSession } from '../../services/geminiService';
import { ChatMessage, LoadingState } from '../../types';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  // Thinking Mode State
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Session (Standard or Thinking)
  const initSession = (thinking: boolean) => {
    if (thinking) {
       chatSessionRef.current = createThinkingChatSession();
    } else {
       chatSessionRef.current = createChatSession();
    }
  };

  // Effect 1: Handle Session Switching (Thinking Mode vs Standard)
  useEffect(() => {
    initSession(isThinkingMode);
    
    setMessages([
      { 
        role: 'model', 
        text: isThinkingMode 
          ? "Thinking mode active. I will reason deeply about your complex queries." 
          : "Hi! I'm ready to help. How can I assist you today?",
        isThinking: isThinkingMode 
      }
    ]);
  }, [isThinkingMode]);

  // Effect 2: Initialize Speech Recognition (Run Once)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === 'network') {
             alert("Speech Recognition Error: Please check your internet connection.");
          } else if (event.error === 'not-allowed') {
             alert("Microphone access denied. Please allow permissions in your browser settings.");
          }
        };
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
          }
        };

        recognitionRef.current = recognition;
      }
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatSessionRef.current || status === 'loading') return;

    const userText = inputValue.trim();
    setInputValue('');
    setStatus('loading');

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userText });
      const modelText = response.text || "I didn't have a response for that.";
      
      setMessages(prev => [...prev, { role: 'model', text: modelText, isThinking: isThinkingMode }]);
      setStatus('idle');
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
      setStatus('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    initSession(isThinkingMode);
    setMessages([{ 
      role: 'model', 
      text: isThinkingMode 
        ? "Chat cleared. Ready for complex reasoning." 
        : "Chat cleared. What's on your mind now?",
      isThinking: isThinkingMode
    }]);
    setStatus('idle');
  };

  const handleFeedback = (index: number, type: 'up' | 'down') => {
    setMessages(prev => prev.map((msg, i) => {
      if (i === index) {
        if (msg.feedback === type) {
          return { ...msg, feedback: undefined };
        }
        return { ...msg, feedback: type };
      }
      return msg;
    }));
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col">
      <div className="text-center space-y-1 flex-shrink-0">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
          <MessageSquare className="w-8 h-8 text-green-500" />
          AI Chat
        </h2>
        <div className="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400">
           Model: {isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-2.5-flash'}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
             <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] ${isThinkingMode ? 'bg-purple-500 shadow-purple-500/50' : 'bg-green-500'}`}></div>
             {isThinkingMode ? 'Thinking Mode' : 'Flash Session'}
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={() => setIsThinkingMode(!isThinkingMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                   isThinkingMode 
                    ? 'bg-purple-600/20 text-purple-400 border-purple-500/50' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title={isThinkingMode ? "Disable Thinking Mode" : "Enable Thinking Mode for complex tasks"}
             >
                <BrainCircuit className="w-3.5 h-3.5" />
                Deep Think
             </button>
             <button 
               onClick={handleClear}
               className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all group"
               title="Clear conversation and start new chat"
             >
               <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
               New Chat
             </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg
                ${msg.role === 'user' ? 'bg-amber-500' : (msg.isThinking ? 'bg-purple-600' : 'bg-green-600')}
              `}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-slate-900" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              
              <div className="flex flex-col gap-1 max-w-[80%]">
                {/* Thinking Indicator Label for Model Messages */}
                {msg.role === 'model' && msg.isThinking && (
                   <div className="flex items-center gap-1.5 ml-1 mb-0.5 opacity-90 animate-fade-in">
                      <BrainCircuit className="w-3 h-3 text-purple-400" />
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Thought Process</span>
                   </div>
                )}

                <div className={`
                  rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-md relative group
                  ${msg.role === 'user' 
                    ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                    : msg.isThinking
                        ? 'bg-purple-900/10 border border-purple-500/30 text-purple-100 rounded-tl-none shadow-[0_0_10px_rgba(168,85,247,0.05)]'
                        : 'bg-slate-950/50 border border-slate-800 text-slate-300 rounded-tl-none'}
                `}>
                  {msg.text}
                  {/* Subtle pulse indicator for thinking messages */}
                  {msg.role === 'model' && msg.isThinking && (
                    <div className="absolute top-3 right-3 opacity-30">
                       <BrainCircuit className="w-4 h-4 text-purple-500" />
                    </div>
                  )}
                </div>
                
                {msg.role === 'model' && (
                  <div className="flex gap-2 pl-2">
                    <button
                      onClick={() => handleFeedback(idx, 'up')}
                      className={`p-1 rounded-full transition-colors ${
                        msg.feedback === 'up' ? 'text-green-500 bg-green-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${msg.feedback === 'up' ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleFeedback(idx, 'down')}
                      className={`p-1 rounded-full transition-colors ${
                        msg.feedback === 'down' ? 'text-red-500 bg-red-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${msg.feedback === 'down' ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {status === 'loading' && (
            <div className="flex gap-4">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${isThinkingMode ? 'bg-purple-600' : 'bg-green-600'}`}>
                 <Bot className="w-5 h-5 text-white" />
               </div>
               <div className={`
                  rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-3
                  ${isThinkingMode ? 'bg-purple-900/10 border border-purple-500/20' : 'bg-slate-950/50 border border-slate-800'}
               `}>
                 <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isThinkingMode ? 'bg-purple-400' : 'bg-slate-500'}`} style={{ animationDelay: '0ms' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isThinkingMode ? 'bg-purple-400' : 'bg-slate-500'}`} style={{ animationDelay: '150ms' }}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isThinkingMode ? 'bg-purple-400' : 'bg-slate-500'}`} style={{ animationDelay: '300ms' }}></div>
                 </div>
                 {isThinkingMode && (
                    <div className="flex items-center gap-2 border-l border-purple-500/30 pl-3">
                       <BrainCircuit className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                       <span className="text-xs font-medium text-purple-300 animate-pulse">Deep Reasoning...</span>
                    </div>
                 )}
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3 items-end">
          <button 
            onClick={handleClear} 
            className="p-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors mb-[2px]"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {isSpeechSupported && (
            <button
              onClick={toggleVoiceInput}
              title={isListening ? "Stop Listening" : "Start Listening"}
              className={`p-3 rounded-xl transition-all mb-[2px] ${
                isListening 
                  ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500/50' 
                  : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isThinkingMode ? "Ask a complex question requiring reasoning..." : "Type your message..."}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none max-h-32 min-h-[50px] custom-scrollbar shadow-inner"
              style={{ height: '52px' }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || status === 'loading'}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors mb-[2px] shadow-lg shadow-green-900/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
