import { useState, useRef, useCallback } from 'react';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { ChatInterface } from '@/components/ui/chat-interface';
import { AIInputWithLoading } from '@/components/ui/ai-input-with-loading';
import { Moon, Sun, MessageCircle, ArrowLeft } from 'lucide-react';
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

  const handleClick = useCallback((e: React.MouseEvent) => {
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

  if (disabled) return null;

  return (
    <div className="wave-cursor-container" onClick={handleClick}>
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

function LandingInput({ onStartChat }: { onStartChat: () => void }) {
  const handleSend = async (value: string) => {
    if (!value.trim()) return;
    onStartChat();
  };

  return (
    <AIInputWithLoading
      className="chat-input-wrapper-centered"
      minHeight={62}
      maxHeight={220}
      loadingDuration={100}
      thinkingDuration={100}
      onSubmit={handleSend}
      placeholder="Start a conversation..."
      id="main-chat-input"
    />
  );
}

function AppContent() {
  const { theme } = useTheme();
  const [chatMode, setChatMode] = useState(false);

  return (
    <div className="app-container" data-theme={theme}>
      {/* Wave Cursor Effect - only on landing */}
      <WaveCursor disabled={chatMode} />

      {/* Background */}
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

      {/* Theme Toggle - Top Right */}
      <div className="theme-toggle-container">
        <ThemeToggle />
      </div>

      {chatMode ? (
        <>
          {/* Back Button */}
          <button
            className="back-button"
            onClick={() => setChatMode(false)}
            aria-label="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* Full Chat Interface */}
          <main className="chat-mode-container">
            <ChatInterface />
          </main>
        </>
      ) : (
        <>
          {/* Mode Toggle Button */}
          <div className="mode-toggle-container">
            <button
              className="mode-toggle"
              onClick={() => setChatMode(true)}
              aria-label="Open chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat</span>
            </button>
          </div>

          {/* Center Input */}
          <main className="center-content">
            <LandingInput onStartChat={() => setChatMode(true)} />
          </main>

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
