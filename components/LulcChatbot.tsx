'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChatService, type ChatMessage } from '@/lib/chatService';
import { type PredictionResult } from '@/components/PredictionResults';
import { X, Send, Bot } from 'lucide-react';

interface LulcChatbotProps {
  currentResult: PredictionResult | null;
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <span className="block">
      {lines.map((line, lineIdx) => {
        const trim = line.trim();
        const isBullet = trim.startsWith('* ') || trim.startsWith('- ');
        const clean = isBullet ? trim.substring(2) : line;
        const parts = clean.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <span key={lineIdx} className="block mb-0.5 last:mb-0">
            {isBullet && <span className="font-bold text-indigo-400 mr-1">•</span>}
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**'))
                return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
              if (part.startsWith('*') && part.endsWith('*'))
                return <em key={i} className="not-italic font-semibold text-indigo-300">{part.slice(1, -1)}</em>;
              return <span key={i}>{part}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
}

export function LulcChatbot({ currentResult }: LulcChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    text: 'Hello! I am your LULC Expert Assistant. Ask me anything about Remote Sensing or your results!',
    sender: 'ai',
    timestamp: new Date(),
  }]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastResultId = useRef<string | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Auto-message on new prediction
  useEffect(() => {
    if (!currentResult) return;
    const id = currentResult.prediction_id || `${currentResult.model_type}-${currentResult.inference_time_ms}`;
    if (id === lastResultId.current) return;
    lastResultId.current = id;

    const isMulti = currentResult.classification_mode === 'multi';
    const labels = isMulti
      ? (currentResult.predicted_labels ?? []).join(', ')
      : (currentResult.predicted_class ?? 'Unknown');
    const autoText = isMulti
      ? `Wow! 🌟 The AMSI-Net model detected multiple land-cover classes: **${labels}**! Uncertainty score: **${currentResult.uncertainty?.toFixed(4) ?? 'N/A'}**. Would you like me to explain what each class represents?`
      : `Wow! 🌟 Excellent result! The model detected **"${labels}"** with **${((currentResult.confidence ?? 0) * 100).toFixed(1)}%** confidence. Would you like me to explain the neural network's decision?`;

    setMessages(prev => [...prev, { id: `auto-${Date.now()}`, text: autoText, sender: 'ai' as const, timestamp: new Date() }].slice(-10));
    setHasNewMessage(true);
  }, [currentResult]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), text: trimmed, sender: 'user', timestamp: new Date() };
    const updated = [...messages, userMsg].slice(-10);
    setMessages(updated);
    setInputText('');
    setIsTyping(true);
    const response = await ChatService.sendMessage(trimmed, currentResult, updated);
    setMessages(prev => [...prev, { id: `${Date.now() + 1}`, text: response, sender: 'ai' as const, timestamp: new Date() }].slice(-10));
    setIsTyping(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[60]">
        {/* Pulse ring — rendered behind button, won't push layout */}
        <span className="absolute inset-0 rounded-full animate-ping bg-indigo-500/25 pointer-events-none" />

        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#060918] transition-transform hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 24px rgba(99,102,241,0.5), 0 4px 16px rgba(0,0,0,0.4)',
          }}
          aria-label="Open LULC Expert Assistant"
        >
          👨‍🚀
          {/* Notification badge */}
          {hasNewMessage && (
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#060918] animate-pulse" />
          )}
        </button>
      </div>

      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-end sm:justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#060918]/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Window */}
          <div
            className="relative z-10 w-full sm:w-[420px] h-[85vh] sm:h-[600px] max-h-[90vh] sm:max-h-[calc(100vh-3rem)] sm:mr-6 sm:mb-6 flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden float-in"
            style={{
              background: 'rgba(10, 15, 35, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-indigo-500/15 flex-shrink-0"
              style={{ background: 'rgba(13, 20, 45, 0.8)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white leading-none">LULC Expert Assistant</p>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 flex items-center justify-center transition-all"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'text-white rounded-br-sm'
                        : 'text-slate-300 rounded-bl-sm border border-indigo-500/10'
                    }`}
                    style={msg.sender === 'user'
                      ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
                      : { background: 'rgba(20, 30, 60, 0.7)' }
                    }
                  >
                    <FormattedText text={msg.text} />
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm border border-indigo-500/10 flex gap-1 items-center"
                    style={{ background: 'rgba(20, 30, 60, 0.7)' }}
                  >
                    {[0, 150, 300].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-t border-indigo-500/15"
              style={{ background: 'rgba(10, 15, 35, 0.9)' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Remote Sensing…"
                disabled={isTyping}
                className="flex-1 text-sm text-white placeholder-slate-600 bg-transparent outline-none px-3 py-2 rounded-xl border border-slate-700/60 focus:border-indigo-500/60 transition-colors disabled:opacity-50"
                style={{ background: 'rgba(20, 30, 60, 0.5)' }}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !inputText.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}
                aria-label="Send"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
