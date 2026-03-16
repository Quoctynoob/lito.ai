'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  sectionName: string;
  sectionData: any;
  companyName: string;
  onClose: () => void;
  onSectionUpdate: (updatedData: any, summary: string) => void;
}

export function ChatSidebar({
  isOpen,
  sectionName,
  sectionData,
  companyName,
  onClose,
  onSectionUpdate,
}: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevSectionRef = useRef(sectionName);

  // Reset chat when section changes
  useEffect(() => {
    if (prevSectionRef.current !== sectionName) {
      setMessages([]);
      setLastUpdate(null);
      prevSectionRef.current = sectionName;
    }
  }, [sectionName]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setLastUpdate(null);

    // Placeholder for the streaming assistant reply
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          sectionName,
          sectionData,
          companyName,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Chat request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line) as { t: string; c?: string; d?: any };

            if (event.t === 'text' && event.c) {
              setIsSearching(false);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.c };
                }
                return updated;
              });
            }

            if (event.t === 'tool' && event.d) {
              // The AI called update_section_data — push the new data to the parent
              try {
                const updatedData =
                  typeof event.d.updated_json === 'string'
                    ? JSON.parse(event.d.updated_json)
                    : event.d.updated_json;
                onSectionUpdate(updatedData, event.d.summary_of_changes ?? 'Section updated');
                setLastUpdate(event.d.summary_of_changes ?? 'Section updated');
              } catch (e) {
                console.error('[ChatSidebar] Failed to parse tool data:', e);
              }
            }

            // Heuristic: if the assistant emits nothing for a bit after tool use, it's searching
            if (event.t === 'searching') setIsSearching(true);
          } catch {
            // Not valid JSON — skip
          }
        }
      }
    } catch (err) {
      console.error('[ChatSidebar] error:', err);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Something went wrong. Please try again.',
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setIsSearching(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed right-0 top-0 h-full w-105 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              lito.ai (powered by amz nova pro)
            </p>
            <h3 className="text-sm font-semibold text-slate-800 mt-0.5">{sectionName}</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-10 space-y-2 px-4">
              <p className="text-sm font-medium text-slate-600">Ask me about this section</p>
              <p className="text-xs text-slate-400">
                I can verify claims, discuss the data, or rewrite parts if you ask.
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            // 1. Check if the AI is currently inside a thinking block
            const isCurrentlyThinking =
              msg.role === 'assistant' &&
              msg.content.lastIndexOf('<thinking>') > msg.content.lastIndexOf('</thinking>');

            // 2. Strip the raw XML tags from the visible text
            const displayContent =
              msg.role === 'assistant'
                ? msg.content.replace(/<thinking>[\s\S]*?(<\/thinking>|$)/g, '').trim()
                : msg.content;

            return (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      {/* Reactive "Thinking" UI */}
                      {isCurrentlyThinking && (
                        <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs font-semibold animate-pulse uppercase tracking-wider">
                            Analyzing & Searching...
                          </span>
                        </div>
                      )}

                      {/* Actual Markdown Content */}
                      {displayContent ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc ml-4 mb-1.5">{children}</ul>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          }}
                        >
                          {displayContent}
                        </ReactMarkdown>
                      ) : (
                        /* Default typing dots if it hasn't started thinking or talking yet */
                        isStreaming && i === messages.length - 1 && !isCurrentlyThinking ? (
                          <span className="inline-flex items-center gap-1 h-5">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        ) : null
                      )}
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}

          {/* Searching indicator */}
          {isSearching && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 rounded-xl px-3 py-2">
                <Globe className="h-3 w-3 animate-pulse" />
                Searching the web…
              </div>
            </div>
          )}

          {/* Update confirmation toast */}
          {lastUpdate && (
            <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">Updated: </span>
                {lastUpdate}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-3 shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
              placeholder={isStreaming ? 'Waiting for response…' : 'Ask about this section…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isStreaming}
            />
            <Button
              size="sm"
              className="h-9 w-9 p-0 shrink-0"
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">
            Nova Pro · Can search web & update sections
          </p>
        </div>
      </div>
    </>
  );
}
