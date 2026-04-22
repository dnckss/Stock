'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Minus, ArrowUp, Square, AlertCircle, ChevronDown, Clock,
  TrendingUp, BarChart3, Lightbulb, Briefcase, Paperclip, X, Loader2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '@/hooks/useChat';
import {
  fetchChatSessions,
  createChatSession,
  fetchChatSessionDetail,
  uploadChatFile,
} from '@/lib/api';
import type { ChatMessage, ApiChatSession } from '@/types/dashboard';

/* ── Quick actions ── */

const QUICK_ACTIONS = [
  { icon: TrendingUp, label: '종목 분석 요청하기', prompt: '관심 종목을 분석해주세요' },
  { icon: BarChart3, label: '시장 전망 물어보기', prompt: '현재 시장 전망은 어떤가요?' },
  { icon: Lightbulb, label: '투자 전략 상담하기', prompt: '지금 시점에 맞는 투자 전략을 추천해주세요' },
  { icon: Briefcase, label: '포트폴리오 리뷰하기', prompt: '포트폴리오를 리뷰하고 개선점을 알려주세요' },
];

/* ── Markdown components ── */

const MD_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-[13px] text-zinc-300 leading-relaxed my-1.5 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-zinc-100 font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-zinc-400">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-[13px] text-zinc-300">{children}</li>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isBlock = className?.includes('language-');
    return isBlock ? (
      <code className="block text-[11px] bg-black/40 rounded-lg p-3 my-2 font-mono text-zinc-300 overflow-x-auto">{children}</code>
    ) : (
      <code className="text-[12px] bg-zinc-800 rounded px-1 py-0.5 text-emerald-400 font-mono">{children}</code>
    );
  },
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-sm font-bold text-zinc-100 mt-3 mb-1">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold text-zinc-100 mt-2.5 mb-1">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-[13px] font-semibold text-zinc-200 mt-2 mb-1">{children}</h3>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-zinc-700/40 pl-3 my-1.5 text-zinc-400">{children}</blockquote>
  ),
  hr: () => <hr className="border-zinc-800 my-3" />,
};

/* ── Helpers ── */

function formatSessionTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch { return iso; }
}

/* ── Sub-components ── */

function WelcomeScreen({ onAction }: { onAction: (prompt: string) => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8">
      <h2 className="text-lg font-bold text-zinc-100 mb-1">Quantix AI</h2>
      <p className="text-sm text-zinc-500 mb-8">투자에 관한 무엇이든 물어보세요.</p>
      <div className="space-y-0.5">
        {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => onAction(prompt)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                       text-left text-[13px] text-zinc-400 hover:text-zinc-200
                       hover:bg-zinc-800/50 transition-colors"
          >
            <Icon className="w-4 h-4 text-zinc-600 shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryDropdown({
  sessions,
  loading,
  onSelect,
  onNewChat,
}: {
  sessions: ApiChatSession[];
  loading: boolean;
  onSelect: (session: ApiChatSession) => void;
  onNewChat: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute left-3 top-[46px] z-20 w-[280px]
                 bg-zinc-800 border border-zinc-700/50 rounded-xl shadow-xl shadow-black/40 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-zinc-700/30">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full text-left text-[13px] text-zinc-200 hover:text-white py-1.5 px-2 rounded-lg hover:bg-zinc-700/50 transition-colors"
        >
          + 새 대화 시작
        </button>
      </div>
      <div className="px-3 pt-2 pb-1">
        <span className="text-[11px] text-zinc-600 px-1">이전 채팅</span>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
          <Clock className="w-5 h-5 mb-2" />
          <span className="text-[12px]">이전 채팅이 없습니다</span>
        </div>
      ) : (
        <div className="max-h-[260px] overflow-y-auto pb-2">
          {sessions.map((s) => (
            <button
              key={s.session_id}
              type="button"
              onClick={() => onSelect(s)}
              className="w-full text-left px-4 py-2.5 hover:bg-zinc-700/40 transition-colors"
            >
              <p className="text-[13px] text-zinc-300 truncate">{s.title}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {formatSessionTime(s.updated_at)}
                {s.message_count != null && ` · ${s.message_count}개 메시지`}
              </p>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-zinc-800/50 rounded-2xl px-4 py-2.5">
        <p className="text-[13px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function AssistantMessage({ msg, isLast, isStreaming }: { msg: ChatMessage; isLast: boolean; isStreaming: boolean }) {
  if (isStreaming && isLast && msg.content.length === 0) {
    return (
      <div className="flex items-center gap-1.5 py-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
      </div>
    );
  }

  return (
    <div className="py-0.5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {msg.content}
      </ReactMarkdown>
      {isStreaming && isLast && (
        <span className="inline-block w-0.5 h-3.5 bg-zinc-400 animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}

/* ── Main widget ── */

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isStreaming, error, send, stop, clear, load } = useChat();
  const [input, setInput] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // History
  const [sessions, setSessions] = useState<ApiChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // File attach
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasConversation = messages.length > 1;

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showHistory) return;
    const close = () => setShowHistory(false);
    const timer = setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', close); };
  }, [showHistory]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  // ── Session API ──

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await fetchChatSessions(20, 0);
      setSessions(data.sessions);
    } catch { /* silent */ }
    finally { setSessionsLoading(false); }
  }, []);

  const handleToggleHistory = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !showHistory;
    setShowHistory(next);
    if (next) loadSessions();
  }, [showHistory, loadSessions]);

  const handleNewChat = useCallback(() => {
    clear();
    setActiveSessionId(null);
    setShowHistory(false);
    setAttachedFile(null);
  }, [clear]);

  const handleLoadSession = useCallback(async (session: ApiChatSession) => {
    setShowHistory(false);
    try {
      const detail = await fetchChatSessionDetail(session.session_id);
      const msgs: ChatMessage[] = detail.messages.map((m) => ({ role: m.role, content: m.content }));
      load(msgs);
      setActiveSessionId(session.session_id);
    } catch {
      // 에러 시 무시 — 드롭다운만 닫힘
    }
  }, [load]);

  // ── Send ──

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || uploading) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // 1) 세션 없으면 자동 생성
    let sid = activeSessionId;
    if (!sid) {
      try {
        const s = await createChatSession();
        sid = s.session_id;
        setActiveSessionId(sid);
      } catch { /* stateless fallback */ }
    }

    // 2) 파일 업로드
    let fileIds: string[] | undefined;
    if (attachedFile) {
      setUploading(true);
      try {
        const f = await uploadChatFile(attachedFile);
        fileIds = [f.file_id];
      } catch { /* continue without file */ }
      finally {
        setUploading(false);
        setAttachedFile(null);
      }
    }

    // 3) 전송
    send(trimmed, { sessionId: sid ?? undefined, attachments: fileIds });
  }, [input, isStreaming, uploading, activeSessionId, attachedFile, send]);

  const handleQuickAction = useCallback(async (prompt: string) => {
    let sid = activeSessionId;
    if (!sid) {
      try {
        const s = await createChatSession();
        sid = s.session_id;
        setActiveSessionId(sid);
      } catch { /* stateless fallback */ }
    }
    send(prompt, { sessionId: sid ?? undefined });
  }, [activeSessionId, send]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAttachedFile(file);
    if (e.target) e.target.value = '';
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
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full
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
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fixed bottom-6 right-6 z-50
                       w-[calc(100vw-48px)] sm:w-[420px] h-[min(620px,80vh)]
                       flex flex-col
                       bg-[#191919] border border-zinc-700/40 rounded-2xl
                       shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2.5 flex items-center justify-between shrink-0 border-b border-zinc-800/40 relative">
              <button
                type="button"
                onClick={handleToggleHistory}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-200 bg-zinc-800/60 hover:bg-zinc-700/60 px-3 py-1.5 rounded-lg transition-colors"
              >
                새 AI 채팅
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg hover:bg-zinc-800/50"
              >
                <Minus className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <HistoryDropdown
                    sessions={sessions}
                    loading={sessionsLoading}
                    onSelect={handleLoadSession}
                    onNewChat={handleNewChat}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Content */}
            {!hasConversation ? (
              <WelcomeScreen onAction={handleQuickAction} />
            ) : (
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.slice(1).map((msg, i) => (
                  msg.role === 'user' ? (
                    <UserMessage key={i} content={msg.content} />
                  ) : (
                    <AssistantMessage key={i} msg={msg} isLast={i === messages.length - 2} isStreaming={isStreaming} />
                  )
                ))}
                {error && (
                  <div className="flex items-center gap-1.5 text-[12px] text-red-400 bg-red-500/10 border border-red-500/15 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className="shrink-0 px-3 pb-3 pt-1">
              {attachedFile && (
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-800/60 border border-zinc-700/30 rounded-lg px-2.5 py-1">
                    <Paperclip className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                    <button type="button" onClick={() => setAttachedFile(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); adjustHeight(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="무엇이든 물어보세요..."
                  rows={1}
                  disabled={isStreaming || uploading}
                  className="w-full text-[13px] bg-transparent px-4 pt-3 pb-1
                             text-zinc-200 placeholder:text-zinc-600
                             focus:outline-none disabled:opacity-50
                             resize-none overflow-hidden"
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <div>
                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isStreaming || uploading}
                      className="p-1.5 text-zinc-600 hover:text-zinc-400 disabled:opacity-40 transition-colors rounded-lg hover:bg-zinc-700/30"
                      title="파일 첨부"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                  </div>
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-600 hover:bg-zinc-500 text-white transition-colors"
                    >
                      <Square className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={(!input.trim() && !attachedFile) || uploading}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-600 hover:bg-zinc-500 text-white
                                 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
