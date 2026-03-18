"use client";

import { useState, useRef, useEffect } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { cn } from "@/lib/utils";
import { Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

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

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: value.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI thinking
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Add AI response
    const aiMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: `${getRandomResponse()} You said: "${value.trim()}"`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
    setIsTyping(false);
  };

  return (
    <div className={cn("flex flex-col h-full w-full max-w-2xl mx-auto", className)}>
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="glass-container p-8 text-center max-w-md">
              <div className="mb-4 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-hover)] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Welcome to AI Chat
              </h2>
              <p className="text-[var(--text-secondary)] text-sm">
                Start a conversation by typing your message below. I'm here to help!
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={messagesContainerRef}
            className="h-full overflow-y-auto px-4 py-6 scroll-smooth"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent' }}
          >
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
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
          {message.timestamp.toLocaleTimeString([], {
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
