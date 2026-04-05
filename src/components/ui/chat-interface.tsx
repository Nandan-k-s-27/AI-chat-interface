"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { cn } from "@/lib/utils";
import {
  Bot,
  Plus,
  User,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Trash,
  ArrowDown,
  XCircle,
  Clock
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

interface ChatInterfaceProps {
  className?: string;
  initialMessage?: string;
  onClearInitial?: () => void;
}

const STORAGE_KEY = "ai-chat-sessions-v1";

const aiResponses = [
  "I'm here to help! What would you like to know?",
  "That's an interesting question. Let me think about that...",
  "Based on my understanding, here's what I can tell you:",
  "Great question! Here's my perspective on this:",
  "I'd be happy to assist you with that. Here's what I found:",
];

function getRandomResponse(): string {
  return aiResponses[Math.floor(Math.random() * aiResponses.length)];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function ChatInterface({ className, initialMessage, onClearInitial }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // Load sessions
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatSession[];
      if (!Array.isArray(parsed)) return;

      const sorted = parsed.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setSessions(sorted);
      if (sorted.length > 0 && !initialMessage) {
          setActiveSessionId(sorted[0].id);
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }, []);

  // Save sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [sessions]);

  // Handle initial message from landing page
  useEffect(() => {
      if (initialMessage) {
          handleSubmit(initialMessage);
          onClearInitial?.();
      }
  }, [initialMessage]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior
      });
    }
  }, []);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - clientHeight - scrollTop < 100;
      setShowScrollButton(!isAtBottom && scrollHeight > clientHeight);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping, scrollToBottom]);

  const createSession = (firstMessage: Message): string => {
    const newSession: ChatSession = {
      id: generateId(),
      title: firstMessage.content.slice(0, 40),
      messages: [firstMessage],
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const clearAllSessions = () => {
    if (window.confirm("Are you sure you want to delete all chat history?")) {
      setSessions([]);
      setActiveSessionId(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const stopResponse = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setIsTyping(false);
      }
  };

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    const content = value.trim();
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = createSession(userMessage);
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [...s.messages, userMessage],
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    }

    setIsTyping(true);
    abortControllerRef.current = new AbortController();

    try {
        // Simulate AI response delay
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 1500 + Math.random() * 1000);
            abortControllerRef.current?.signal.addEventListener('abort', () => {
                clearTimeout(timeout);
                reject(new Error('Aborted'));
            });
        });

        const aiMessage: Message = {
          id: generateId(),
          role: "assistant",
          content: `${getRandomResponse()} You mentioned: "${content}"`,
          timestamp: new Date().toISOString(),
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  messages: [...s.messages, aiMessage],
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        );
    } catch (err) {
        console.log("Response stopped or failed");
    } finally {
        setIsTyping(false);
        abortControllerRef.current = null;
    }
  };

  const regenerateResponse = async () => {
    if (!activeSessionId || messages.length === 0 || isTyping) return;

    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastUserMessage = messages[actualIndex];

    setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
            return {
                ...s,
                messages: s.messages.slice(0, actualIndex + 1),
                updatedAt: new Date().toISOString()
            };
        }
        return s;
    }));

    handleSubmit(lastUserMessage.content);
  };

  return (
    <div className={cn("flex h-full w-full max-w-7xl gap-4 px-4 overflow-hidden", className)}>
      {/* Sidebar */}
      <aside className="hidden w-72 flex-shrink-0 flex-col gap-4 md:flex">
        <div className="flex flex-col h-full rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] backdrop-blur-xl overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]">
            <button
              onClick={() => setActiveSessionId(null)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={cn(
                  "group relative flex cursor-pointer flex-col gap-1 rounded-xl px-3 py-3 transition",
                  s.id === activeSessionId
                    ? "bg-white/15 text-white"
                    : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                )}
              >
                <p className="truncate text-sm font-medium pr-6">{s.title || "Untitled Chat"}</p>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(s.updatedAt).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => deleteSession(e, s.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <p className="text-xs text-[var(--text-muted)] italic">No history yet</p>
              </div>
            )}
          </div>

          {sessions.length > 0 && (
            <div className="p-2 border-t border-[var(--border-color)]">
              <button
                onClick={clearAllSessions}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400/80 hover:bg-red-400/10 transition"
              >
                <Trash className="h-3.5 w-3.5" />
                Clear all chats
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)]/85 backdrop-blur-xl overflow-hidden relative">
        {/* Mobile Session Switcher */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3 md:hidden">
            <button
                onClick={() => setActiveSessionId(null)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white"
            >
                New Chat
            </button>
            {sessions.length > 0 && (
                <select
                    value={activeSessionId || ""}
                    onChange={(e) => setActiveSessionId(e.target.value || null)}
                    className="bg-transparent text-xs text-white border-none focus:ring-0 max-w-[150px] truncate"
                >
                    <option value="" className="bg-[#1a1a1a]">History</option>
                    {sessions.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#1a1a1a]">
                            {s.title}
                        </option>
                    ))}
                </select>
            )}
        </div>

        {/* Messages */}
        <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 && !isTyping ? (
            <div className="flex h-full flex-col items-center justify-center opacity-40 text-center">
                <Bot className="mb-4 h-12 w-12" />
                <h3 className="text-xl font-semibold">Ready to assist</h3>
                <p className="text-sm mt-1">Start a conversation to see it here.</p>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {isTyping && <TypingIndicator onStop={stopResponse} />}
            </>
          )}
        </div>

        {/* Scroll Button */}
        {showScrollButton && (
            <button
                onClick={() => scrollToBottom()}
                className="absolute bottom-24 right-8 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-color)] bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-90 shadow-xl z-10"
            >
                <ArrowDown className="h-4 w-4" />
            </button>
        )}

        {/* Action Bar */}
        {messages.length > 0 && !isTyping && messages[messages.length-1].role === 'assistant' && (
            <div className="flex justify-center mb-2">
                <button
                    onClick={regenerateResponse}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-white/5 px-3 py-1.5 text-[10px] text-[var(--text-secondary)] hover:bg-white/10 transition active:scale-95"
                >
                    <RotateCcw className="h-3 w-3" />
                    Regenerate
                </button>
            </div>
        )}

        {/* Input */}
        <div className="p-4 pt-0">
          <AIInputWithLoading
            className="w-full shadow-2xl"
            minHeight={56}
            maxHeight={200}
            loadingDuration={1800}
            thinkingDuration={800}
            onSubmit={handleSubmit}
            placeholder="Ask me anything..."
            id="chat-input-main"
          />
        </div>
      </main>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group flex w-full gap-4 animate-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform",
          isUser
            ? "bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-hover)]"
            : "glass-avatar shadow-lg"
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-[var(--text-primary)]" />
        )}
      </div>

      <div
        className={cn(
          "relative flex max-w-[85%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 shadow-sm",
            isUser ? "glass-message-user" : "glass-message-ai"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
            {message.content}
          </p>
        </div>

        <div className={cn(
            "flex items-center gap-3 px-1 transition-opacity",
            "opacity-0 group-hover:opacity-100"
        )}>
            <span className="text-[10px] text-[var(--text-muted)]">
                {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </span>
            {!isUser && (
                <button
                    onClick={copyToClipboard}
                    className="text-[var(--text-muted)] hover:text-white transition"
                    title="Copy message"
                >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
            )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ onStop }: { onStop?: () => void }) {
  return (
    <div className="flex w-full gap-4 animate-in">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl glass-avatar shadow-lg">
        <Bot className="h-5 w-5 text-[var(--text-primary)]" />
      </div>
      <div className="flex flex-col gap-2">
          <div className="glass-message-ai rounded-2xl px-5 py-4 w-fit">
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-muted)] [animation-delay:300ms]" />
            </div>
          </div>
          {onStop && (
              <button
                onClick={onStop}
                className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-red-400 transition ml-1"
              >
                  <XCircle className="h-3 w-3" />
                  Stop generating
              </button>
          )}
      </div>
    </div>
  );
}
