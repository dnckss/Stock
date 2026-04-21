'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatStreamFetch } from '@/lib/api';
import { CHAT_MAX_MESSAGES, CHAT_WELCOME_MESSAGE } from '@/lib/constants';
import type { ChatMessage } from '@/types/dashboard';

export interface UseChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  send: (content: string) => void;
  stop: () => void;
  clear: () => void;
}

const WELCOME: ChatMessage = { role: 'assistant', content: CHAT_WELCOME_MESSAGE };

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const streamingRef = useRef(false);
  const msgsRef = useRef<ChatMessage[]>([WELCOME]);

  // Keep ref in sync
  useEffect(() => { msgsRef.current = messages; }, [messages]);
  useEffect(() => { streamingRef.current = isStreaming; }, [isStreaming]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const send = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || streamingRef.current) return;

    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: trimmed };

    // Snapshot for API call (exclude welcome & empty)
    const prevMsgs = msgsRef.current;
    const apiMessages: ChatMessage[] = [...prevMsgs, userMsg]
      .filter((m) => m !== WELCOME && m.content.length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    // Optimistic UI: append user + empty assistant
    setMessages((prev) => {
      const updated = [...prev, userMsg, { role: 'assistant' as const, content: '' }];
      return updated.length > CHAT_MAX_MESSAGES
        ? [WELCOME, ...updated.slice(-(CHAT_MAX_MESSAGES - 1))]
        : updated;
    });

    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await chatStreamFetch(apiMessages, undefined, controller.signal);

      if (!response.body) throw new Error('Streaming이 지원되지 않습니다');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!mountedRef.current) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            for (const line of part.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') return;

              let chunk = '';
              try {
                const json = JSON.parse(payload);
                chunk = json.content ?? json.delta?.content ?? json.text ?? '';
                if (json.error) {
                  if (mountedRef.current) setError(String(json.error));
                  return;
                }
              } catch {
                chunk = payload;
              }

              if (chunk && mountedRef.current) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: last.content + chunk };
                  }
                  return updated;
                });
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;

      const msg = err instanceof Error ? err.message : 'AI 응답을 받을 수 없습니다';
      setError(msg);

      // Remove empty assistant placeholder on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === 'assistant' && !last.content ? prev.slice(0, -1) : prev;
      });
    } finally {
      if (mountedRef.current) {
        setIsStreaming(false);
        abortRef.current = null;
      }
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([WELCOME]);
    setIsStreaming(false);
    setError(null);
  }, []);

  return { messages, isStreaming, error, send, stop, clear };
}
