"use client";

import { useState, useRef, useEffect } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { cn } from "@/lib/utils";
import { Bot, Plus, User } from "lucide-react";

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
}

const STORAGE_KEY = "ai-chat-sessions-v1";

// Simulated AI responses
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

function getInitialChatState(): {
  sessions: ChatSession[];
  activeSessionId: string | null;
} {
  if (typeof window === "undefined") {
    return { sessions: [], activeSessionId: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sessions: [], activeSessionId: null };
    }

    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) {
      return { sessions: [], activeSessionId: null };
    }

    const sessions = parsed
      .filter((session) => Array.isArray(session.messages))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    return {
      sessions,
      activeSessionId: sessions.length > 0 ? sessions[0].id : null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { sessions: [], activeSessionId: null };
  }
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [{ sessions: initialSessions, activeSessionId: initialActiveSessionId }] = useState(getInitialChatState);
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialActiveSessionId);
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    if (sessions.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isTyping]);

  const updateSession = (sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setSessions((prev) => {
      const next = prev.map((session) =>
        session.id === sessionId ? updater(session) : session
      );

      next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return next;
    });
  };

  const createSession = (firstMessage: Message): string => {
    const now = new Date().toISOString();
    const newSession: ChatSession = {
      id: generateId(),
      title: firstMessage.content.slice(0, 36),
      messages: [firstMessage],
      updatedAt: now,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  };

  const startNewChat = () => {
    setActiveSessionId(null);
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

    const sessionId = activeSessionId ?? createSession(userMessage);

    if (activeSessionId) {
      updateSession(activeSessionId, (session) => ({
        ...session,
        title: session.title || content.slice(0, 36),
        messages: [...session.messages, userMessage],
        updatedAt: new Date().toISOString(),
      }));
    }

    // Simulate AI thinking
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Add AI response
    const aiMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: `${getRandomResponse()} You said: "${content}"`,
      timestamp: new Date().toISOString(),
    };

    updateSession(sessionId, (session) => ({
      ...session,
      messages: [...session.messages, aiMessage],
      updatedAt: new Date().toISOString(),
    }));

    setActiveSessionId(sessionId);
    setIsTyping(false);
  };

  return (
    <div className={cn("flex h-full w-full max-w-7xl gap-4 px-4", className)}>
      <aside className="hidden w-72 flex-shrink-0 rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] p-3 backdrop-blur-xl md:flex md:flex-col">
        <button
          type="button"
          onClick={startNewChat}
          className="mb-2 flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-primary)] transition hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          <span>New chat</span>
        </button>

        {sessions.length > 0 && (
          <div className="mt-1 space-y-1 overflow-y-auto pr-1">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left text-sm transition",
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
                  )}
                >
                  <p className="truncate font-medium">{session.title || "Untitled"}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {new Date(session.updatedAt).toLocaleDateString()} {" "}
                    {new Date(session.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)]/85 backdrop-blur-xl">
        <div className="border-b border-[var(--border-color)] px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={startNewChat}
            className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
          >
            New chat
          </button>
        </div>

        <div className="border-b border-[var(--border-color)] px-4 py-2 md:hidden">
          {sessions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs",
                    session.id === activeSessionId
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-[var(--text-secondary)]"
                  )}
                >
                  {session.title || "Untitled"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            ref={messagesContainerRef}
            className="h-full overflow-y-auto px-4 py-6 scroll-smooth"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.3) transparent" }}
          >
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-4">
          <AIInputWithLoading
            className="w-full"
            minHeight={56}
            maxHeight={200}
            loadingDuration={1800}
            thinkingDuration={800}
            onSubmit={handleSubmit}
            placeholder="Type your message..."
            id="chat-input"
          />
        </div>
      </section>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
          isUser
            ? "bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-hover)]"
            : "glass-avatar"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-[var(--text-primary)]" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl",
          isUser ? "glass-message-user" : "glass-message-ai"
        )}
      >
        <p className="text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <span className="block mt-1 text-[10px] text-[var(--text-muted)]">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in fade-in duration-300">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl glass-avatar flex items-center justify-center">
        <Bot className="w-4 h-4 text-[var(--text-primary)]" />
      </div>
      <div className="glass-message-ai px-4 py-3 rounded-2xl">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
