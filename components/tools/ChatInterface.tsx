import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User, Bot, RefreshCw, Mic, MicOff, ThumbsUp, ThumbsDown, Trash2, BrainCircuit, Sparkles } from 'lucide-react';
import { sendChatToProxy } from '../../services/geminiService';
import { ChatMessage, LoadingState } from '../../types';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  // Thinking Mode State
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Session (Standard or Thinking)
  // Note: We no longer create a client-side "Chat" object because that bypasses billing.
  // We manage history locally and send it to the proxy.

  useEffect(() => {
    // Reset messages when switching modes to ensure clean state
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
    if (!inputValue.trim() || status === 'loading') return;

    const userText = inputValue.trim();
    setInputValue('');
    setStatus('loading');

    // Optimistically add user message
    const newMessages = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);

    try {
      // Convert internal ChatMessage format to Gemini API format
      const historyForApi = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Use the PROXY helper to ensure billing is triggered
      const model = isThinkingMode ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      const systemPrompt = isThinkingMode ? 'You are a deep reasoning AI.' : 'You are a helpful assistant.';
      
      const responseText = await sendChatToProxy(historyForApi as any, model, systemPrompt);
      const modelText = responseText || "I didn't have a response for that.";
      
      setMessages(prev => [...prev, { role: 'model', text: modelText, isThinking: isThinkingMode }]);
      setStatus('idle');
    } catch (error: any) {
      console.error("Chat Error:", error);
      const msg = error.message || "Sorry, I encountered an error. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${msg}` }]);
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
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono transition-colors ${isThinkingMode ? 'bg-purple-900/20 border-purple-500/30 text-purple-400' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
           {isThinkingMode ? <BrainCircuit className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
           {/* Updated label to match the actual models used (gemini-3-flash-preview and gemini-3-pro-preview). */}
           Model: {isThinkingMode ? 'gemini-3-pro-preview (Deep Reasoning)' : 'gemini-3-flash-preview'}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Chat Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center transition-colors ${isThinkingMode ? 'bg-purple-900/10 border-purple-900/30' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'}`}>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
             <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)] ${isThinkingMode ? 'bg-purple-50 shadow-purple-500/50' : 'bg-green-500'}`}></div>
             {isThinkingMode ? <span className="text-purple-600 dark:text-purple-300 font-bold">Deep Reasoning Mode</span> : 'Flash Session'}
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={() => setIsThinkingMode(!isThinkingMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                   isThinkingMode 
                    ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isThinkingMode ? "Disable Thinking Mode" : "Enable Thinking Mode for complex tasks"}
             >
                <BrainCircuit className="w-3.5 h-3.5" />
                {isThinkingMode ? 'Thinking ON' : 'Enable Thinking'}
             </button>
             <button 
               onClick={handleClear}
               className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-all group"
               title="Clear conversation and start new chat"
             >
               <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform" />
               New Chat
             </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900 dark:to-[#0B0F17]">
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
              
              <div className="flex flex-col gap-1 max-w-[85%]">
                {/* Thinking Indicator Label for Model Messages */}
                {msg.role === 'model' && msg.isThinking && (
                   <div className="flex items-center gap-1.5 ml-1 mb-1 opacity-100 animate-fade-in bg-purple-500/10 w-fit px-2 py-0.5 rounded-full border border-purple-500/20">
                      <BrainCircuit className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Thought Process</span>
                   </div>
                )}

                <div className={`
                  rounded-2xl px-6 py-4 text-sm leading-relaxed whitespace-pre-wrap shadow-md relative group transition-all duration-500 border
                  ${msg.role === 'user' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tr-none border-slate-200 dark:border-slate-700' 
                    : msg.isThinking
                        ? 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900/80 border-purple-200 dark:border-purple-500/30 text-slate-800 dark:text-purple-50 rounded-tl-none shadow-[0_0_15px_rgba(168,85,247,0.05)] hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                        : 'bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 rounded-tl-none'}
                `}>
                  {msg.text}
                  {/* Subtle pulse indicator for thinking messages */}
                  {msg.role === 'model' && msg.isThinking && (
                    <div className="absolute top-3 right-3 opacity-20">
                       <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-50" />
                    </div>
                  )}
                </div>
                
                {msg.role === 'model' && (
                  <div className="flex gap-2 pl-2">
                    <button
                      onClick={() => handleFeedback(idx, 'up')}
                      className={`p-1 rounded-full transition-colors ${
                        msg.feedback === 'up' ? 'text-green-500 bg-green-500/10' : 'text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${msg.feedback === 'up' ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleFeedback(idx, 'down')}
                      className={`p-1 rounded-full transition-colors ${
                        msg.feedback === 'down' ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
            <div className="flex gap-4 animate-fade-in">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg transition-colors ${isThinkingMode ? 'bg-purple-600' : 'bg-green-600'}`}>
                 <Bot className="w-5 h-5 text-white" />
               </div>
               
               {isThinkingMode ? (
                  // Thinking Mode Specific Loader
                  <div className="rounded-2xl rounded-tl-none px-6 py-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] flex flex-col gap-3 min-w-[240px]">
                     <div className="flex items-center gap-3">
                        <div className="relative">
                           <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                           <span className="absolute inset-0 animate-ping opacity-75 rounded-full bg-purple-400/30"></span>
                        </div>
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Deep Reasoning...</span>
                     </div>
                     <div className="w-full bg-slate-200 dark:bg-purple-900/30 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 animate-[loading_1.5s_ease-in-out_infinite] w-1/3 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                     </div>
                     <span className="text-[10px] text-purple-600 dark:text-purple-400/60 font-mono uppercase tracking-widest">Analyzing logic paths</span>
                  </div>
               ) : (
                  // Standard Loader
                  <div className="rounded-2xl rounded-tl-none px-5 py-4 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center gap-1 shadow-sm">
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
               )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-3 items-end">
          <button 
            onClick={handleClear} 
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors mb-[2px]"
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
                  : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
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
              className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 resize-none max-h-32 min-h-[50px] custom-scrollbar shadow-inner transition-all ${isThinkingMode ? 'focus:ring-purple-500' : 'focus:ring-green-500'}`}
              style={{ height: '52px' }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || status === 'loading'}
            className={`text-white p-3 rounded-xl transition-colors mb-[2px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
               isThinkingMode 
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-900/20' 
                  : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;