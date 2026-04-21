'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Square, Trash2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '@/hooks/useChat';
import type { ChatMessage } from '@/types/dashboard';

/* ── Message bubble ── */

function MessageBubble({
  msg,
  isLast,
  isStreaming,
}: {
  msg: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
}) {
  const isUser = msg.role === 'user';
  const isWaiting = isStreaming && isLast && !isUser && msg.content.length === 0;

  // Waiting state: just dots, no bubble
  if (isWaiting) {
    return (
      <div className="flex justify-start">
        <div className="flex items-center gap-1.5 px-1 py-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? 'bg-zinc-800/60 border border-zinc-600/20 text-zinc-200'
            : 'bg-zinc-800/60 border border-zinc-700/30 text-zinc-300'
        }`}
      >
        {isUser ? (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="chat-md">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="text-[13px] text-zinc-300 leading-relaxed my-1 first:mt-0 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => <strong className="text-zinc-100 font-semibold">{children}</strong>,
                em: ({ children }) => <em className="text-zinc-400">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-[13px] text-zinc-300">{children}</li>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <code className="block text-[11px] bg-black/40 rounded-lg p-2.5 my-1.5 font-mono text-zinc-300 overflow-x-auto">
                      {children}
                    </code>
                  ) : (
                    <code className="text-[12px] bg-zinc-800 rounded px-1 py-0.5 text-emerald-400 font-mono">
                      {children}
                    </code>
                  );
                },
                h1: ({ children }) => <h1 className="text-sm font-bold text-zinc-100 mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-zinc-100 mt-2.5 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[13px] font-semibold text-zinc-200 mt-2 mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-zinc-700/30 pl-3 my-1.5 text-zinc-400">{children}</blockquote>
                ),
                hr: () => <hr className="border-zinc-800 my-2" />,
              }}
            >
              {msg.content}
            </ReactMarkdown>
            {isStreaming && isLast && (
              <span className="inline-block w-0.5 h-3.5 bg-emerald-400 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main widget ── */

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isStreaming, error, send, stop, clear } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    send(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full
                       bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100
                       border border-zinc-700/50 hover:border-zinc-600
                       shadow-lg shadow-black/40
                       flex items-center justify-center transition-all duration-200"
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fixed bottom-6 right-6 z-50
                       w-[calc(100vw-48px)] sm:w-[400px] h-[min(600px,80vh)]
                       flex flex-col
                       bg-[#0c0c10] border border-zinc-800/60 rounded-2xl
                       shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between shrink-0 bg-zinc-900/50">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-zinc-200">Quantix AI</span>
                <span className="text-[9px] font-mono text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded">BETA</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={clear}
                  className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg hover:bg-zinc-800/50"
                  title="대화 초기화"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg hover:bg-zinc-800/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  isLast={i === messages.length - 1}
                  isStreaming={isStreaming}
                />
              ))}

              {error && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  disabled={isStreaming}
                  className="flex-1 text-[13px] bg-zinc-800/50 border border-zinc-700/30 rounded-xl px-3.5 py-2.5
                             text-zinc-200 placeholder:text-zinc-600
                             focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-500/15
                             disabled:opacity-50 transition-colors"
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl
                               bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
                    title="중지"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl
                               bg-zinc-700 hover:bg-zinc-600 text-zinc-200
                               disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
