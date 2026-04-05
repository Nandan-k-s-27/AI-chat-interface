import { useState, useRef, useCallback, useEffect } from 'react';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { ChatInterface } from '@/components/ui/chat-interface';
import { AIInputWithLoading } from '@/components/ui/ai-input-with-loading';
import { Moon, Sun, MessageCircle, ArrowLeft, Sparkles } from 'lucide-react';
import darkBg from './assets/dark-bg.jpg';
import './App.css';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}

function WaveCursor({ disabled }: { disabled?: boolean }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);

  const handleClick = useCallback((e: MouseEvent) => {
    if (disabled) return;
    const newRipple: Ripple = {
      id: rippleIdRef.current++,
      x: e.clientX,
      y: e.clientY,
    };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);
  }, [disabled]);

  useEffect(() => {
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleClick]);

  if (disabled) return null;

  return (
    <div className="wave-cursor-container" style={{ pointerEvents: 'none' }}>
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="wave-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </div>
  );
}

function LandingContent({ onStartChat }: { onStartChat: (val?: string) => void }) {
  return (
    <div className="center-content animate-in">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl shadow-2xl">
            <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
          AI Assistant
        </h1>
        <p className="text-lg text-white/60">
          Clean, fast, and intelligent conversation.
        </p>
      </div>

      <AIInputWithLoading
        className="chat-input-wrapper-centered"
        minHeight={62}
        maxHeight={220}
        loadingDuration={600}
        thinkingDuration={400}
        onSubmit={(val) => onStartChat(val)}
        placeholder="How can I help you today?"
        id="landing-chat-input"
      />

      <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Write a poem", "Explain React Hooks", "Dinner ideas"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onStartChat(suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition active:scale-95"
              >
                  {suggestion}
              </button>
          ))}
      </div>
    </div>
  );
}

function AppContent() {
  const { theme } = useTheme();
  const [chatMode, setChatMode] = useState(false);
  const [initialMsg, setInitialMsg] = useState<string | undefined>(undefined);

  const handleStartChat = (msg?: string) => {
      setInitialMsg(msg);
      setChatMode(true);
  };

  return (
    <div className="app-container" data-theme={theme}>
      <WaveCursor disabled={chatMode} />

      <div className="background-wrapper">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className={`background-image ${theme === 'light' ? 'active' : ''}`}
        />
        <img
          src={darkBg}
          alt=""
          className={`background-image ${theme === 'dark' ? 'active' : ''}`}
        />
        <div className="background-overlay" />
      </div>

      <div className="theme-toggle-container">
        <ThemeToggle />
      </div>

      {chatMode ? (
        <>
          <button
            className="back-button"
            onClick={() => {
                setChatMode(false);
                setInitialMsg(undefined);
            }}
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>

          <main className="chat-mode-container animate-in">
            <ChatInterface
                initialMessage={initialMsg}
                onClearInitial={() => setInitialMsg(undefined)}
            />
          </main>
        </>
      ) : (
        <>
          <div className="mode-toggle-container">
            <button
              className="mode-toggle"
              onClick={() => setChatMode(true)}
              aria-label="Open chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Full Chat</span>
            </button>
          </div>

          <LandingContent onStartChat={handleStartChat} />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
