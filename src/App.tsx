import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  History,
  LockKeyhole,
  Mail,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";

import { ChatWorkspace, type WorkspaceProfileDraft } from "@/components/chat-workspace";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import {
  buildAssistantReply,
  createConversationTitle,
  createDefaultPreferences,
  createDemoConversations,
  generateId,
  loadAppStore,
  saveAppStore,
  sortConversations,
  type AppStore,
  type ChatConversation,
  type ChatMessage,
  type UserAccount,
} from "@/lib/chat-store";
import "./App.css";

type AuthMode = "login" | "signup";

interface AuthFormState {
  displayName: string;
  email: string;
  password: string;
}

const DEMO_EMAIL = "demo@aichat.local";
const DEMO_PASSWORD = "demo1234";

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="shell-icon-button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

function createEmptyAuthForm(): AuthFormState {
  return {
    displayName: "",
    email: "",
    password: "",
  };
}

function AuthScreen({
  authMode,
  authForm,
  authError,
  authMessage,
  onModeChange,
  onFieldChange,
  onSubmit,
  onDemoAccess,
}: {
  authMode: AuthMode;
  authForm: AuthFormState;
  authError: string;
  authMessage: string;
  onModeChange: (mode: AuthMode) => void;
  onFieldChange: (field: keyof AuthFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDemoAccess: () => void;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />

      <header className="auth-topbar">
        <div className="auth-brand">
          <span className="workspace-brand-mark">AI</span>
          <div>
            <p className="workspace-brand-title">AI Chat</p>
            <p className="workspace-brand-subtitle">Refined local workspace</p>
          </div>
        </div>
        <ThemeToggleButton />
      </header>

      <main className="auth-layout">
        <section className="auth-hero">
          <Badge className="workspace-badge accent" variant="outline">
            Upgraded product shell
          </Badge>
          <h1>Clean UX, login flow, account settings, and persistent chat history.</h1>
          <p>
            This version moves the app closer to a real AI assistant product with a
            ChatGPT-inspired layout, searchable threads, and per-account local data.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <Sparkles className="h-4 w-4" />
              <span>Cleaner workspace with a focused chat layout</span>
            </div>
            <div className="auth-feature-item">
              <History className="h-4 w-4" />
              <span>Persistent conversation history for each account</span>
            </div>
            <div className="auth-feature-item">
              <Settings className="h-4 w-4" />
              <span>Account settings for profile and chat preferences</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === "signup" ? "auth-tab active" : "auth-tab"}
              onClick={() => onModeChange("signup")}
            >
              Create account
            </button>
            <button
              type="button"
              className={authMode === "login" ? "auth-tab active" : "auth-tab"}
              onClick={() => onModeChange("login")}
            >
              Sign in
            </button>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            {authMode === "signup" ? (
              <label className="auth-field">
                <span>Display name</span>
                <div className="auth-input-shell">
                  <UserRound className="h-4 w-4" />
                  <Input
                    value={authForm.displayName}
                    onChange={(event) =>
                      onFieldChange("displayName", event.target.value)
                    }
                    placeholder="Nagashree"
                    className="auth-input"
                  />
                </div>
              </label>
            ) : null}

            <label className="auth-field">
              <span>Email</span>
              <div className="auth-input-shell">
                <Mail className="h-4 w-4" />
                <Input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => onFieldChange("email", event.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-shell">
                <LockKeyhole className="h-4 w-4" />
                <Input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => onFieldChange("password", event.target.value)}
                  placeholder="Minimum 6 characters"
                  className="auth-input"
                />
              </div>
            </label>

            {authError ? <p className="auth-feedback error">{authError}</p> : null}
            {authMessage ? <p className="auth-feedback">{authMessage}</p> : null}

            <button type="submit" className="workspace-primary-button auth-submit">
              <span>{authMode === "signup" ? "Create account" : "Sign in"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <button
            type="button"
            className="workspace-secondary-button auth-demo-button"
            onClick={onDemoAccess}
          >
            Open demo workspace
          </button>

          <p className="auth-note">
            Local-only auth for now. Profiles, settings, and chat history are stored
            in this browser so the UI behaves like a real product before backend
            integration.
          </p>
        </section>
      </main>
    </div>
  );
}

function AppContent() {
  const [store, setStore] = useState<AppStore>(() => loadAppStore());
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authForm, setAuthForm] = useState<AuthFormState>(createEmptyAuthForm);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    saveAppStore(store);
  }, [store]);

  const currentUser = useMemo(
    () => store.accounts.find((account) => account.id === store.activeUserId) ?? null,
    [store.accounts, store.activeUserId]
  );

  const conversations = useMemo(
    () =>
      currentUser ? store.conversationsByUserId[currentUser.id] ?? [] : [],
    [currentUser, store.conversationsByUserId]
  );

  const preferences = useMemo(
    () =>
      currentUser
        ? store.preferencesByUserId[currentUser.id] ?? createDefaultPreferences()
        : createDefaultPreferences(),
    [currentUser, store.preferencesByUserId]
  );

  useEffect(() => {
    const currentUserId = currentUser?.id ?? null;

    if (previousUserIdRef.current !== currentUserId) {
      setActiveConversationId(conversations[0]?.id ?? null);
      previousUserIdRef.current = currentUserId;
      return;
    }

    if (
      activeConversationId &&
      !conversations.some((conversation) => conversation.id === activeConversationId)
    ) {
      setActiveConversationId(conversations[0]?.id ?? null);
    }
  }, [activeConversationId, conversations, currentUser?.id]);

  const updateConversationsForUser = (
    userId: string,
    updater: (current: ChatConversation[]) => ChatConversation[]
  ) => {
    setStore((currentStore) => ({
      ...currentStore,
      conversationsByUserId: {
        ...currentStore.conversationsByUserId,
        [userId]: sortConversations(
          updater(currentStore.conversationsByUserId[userId] ?? [])
        ),
      },
    }));
  };

  const handleFieldChange = (field: keyof AuthFormState, value: string) => {
    setAuthForm((current) => ({ ...current, [field]: value }));
  };

  const handleAuthSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password.trim();
    const displayName = authForm.displayName.trim();

    setAuthError("");
    setAuthMessage("");

    if (!email || !password || (authMode === "signup" && !displayName)) {
      setAuthError("Please fill in every required field.");
      return;
    }

    if (password.length < 6) {
      setAuthError("Use at least 6 characters for the password.");
      return;
    }

    if (authMode === "signup") {
      const alreadyExists = store.accounts.some((account) => account.email === email);

      if (alreadyExists) {
        setAuthError("That email already has a local account. Sign in instead.");
        setAuthMode("login");
        return;
      }

      const newAccount: UserAccount = {
        id: generateId(),
        displayName,
        email,
        password,
        title: "Product Builder",
        bio: "Designing and testing flows inside AI Chat.",
        plan: "Free",
        createdAt: new Date().toISOString(),
      };

      setStore((currentStore) => ({
        ...currentStore,
        accounts: [newAccount, ...currentStore.accounts],
        activeUserId: newAccount.id,
        conversationsByUserId: {
          ...currentStore.conversationsByUserId,
          [newAccount.id]: [],
        },
        preferencesByUserId: {
          ...currentStore.preferencesByUserId,
          [newAccount.id]: createDefaultPreferences(),
        },
      }));

      setAuthForm(createEmptyAuthForm());
      setAuthMessage("Account created successfully.");
      return;
    }

    const matchingAccount = store.accounts.find(
      (account) => account.email === email && account.password === password
    );

    if (!matchingAccount) {
      setAuthError("The email or password does not match any local account.");
      return;
    }

    setStore((currentStore) => ({
      ...currentStore,
      activeUserId: matchingAccount.id,
    }));
    setAuthForm(createEmptyAuthForm());
  };

  const handleDemoAccess = () => {
    setAuthError("");
    setAuthMessage("");

    const existingDemo = store.accounts.find((account) => account.email === DEMO_EMAIL);
    if (existingDemo) {
      setStore((currentStore) => ({
        ...currentStore,
        activeUserId: existingDemo.id,
      }));
      return;
    }

    const demoAccount: UserAccount = {
      id: generateId(),
      displayName: "Demo User",
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      title: "Product Designer",
      bio: "Using a seeded workspace to explore the upgraded AI Chat interface.",
      plan: "Plus",
      createdAt: new Date().toISOString(),
    };

    setStore((currentStore) => ({
      ...currentStore,
      accounts: [demoAccount, ...currentStore.accounts],
      activeUserId: demoAccount.id,
      conversationsByUserId: {
        ...currentStore.conversationsByUserId,
        [demoAccount.id]: createDemoConversations(demoAccount.displayName),
      },
      preferencesByUserId: {
        ...currentStore.preferencesByUserId,
        [demoAccount.id]: {
          ...createDefaultPreferences(),
          compactMode: true,
        },
      },
    }));
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
  };

  const handleOpenConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (!currentUser) {
      return;
    }

    updateConversationsForUser(currentUser.id, (current) =>
      current.filter((conversation) => conversation.id !== conversationId)
    );

    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
  };

  const handleRenameConversation = (conversationId: string, title: string) => {
    if (!currentUser) {
      return;
    }

    updateConversationsForUser(currentUser.id, (current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, title: title.trim() }
          : conversation
      )
    );
  };

  const handleSendMessage = async (value: string) => {
    if (!currentUser || isResponding) {
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    const now = new Date().toISOString();
    const conversationId = activeConversationId ?? generateId();
    const existingConversation =
      conversations.find((conversation) => conversation.id === conversationId) ?? null;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: now,
    };

    const conversationAfterUserMessage: ChatConversation = existingConversation
      ? {
          ...existingConversation,
          preview: trimmed,
          updatedAt: now,
          messages: [...existingConversation.messages, userMessage],
        }
      : {
          id: conversationId,
          title: createConversationTitle(trimmed),
          preview: trimmed,
          createdAt: now,
          updatedAt: now,
          messages: [userMessage],
        };

    updateConversationsForUser(currentUser.id, (current) => [
      conversationAfterUserMessage,
      ...current.filter((conversation) => conversation.id !== conversationId),
    ]);
    setActiveConversationId(conversationId);
    setIsResponding(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: buildAssistantReply(trimmed, currentUser.displayName),
        timestamp: new Date().toISOString(),
      };

      updateConversationsForUser(currentUser.id, (current) => {
        const latestConversation = current.find(
          (conversation) => conversation.id === conversationId
        );
        const sourceConversation = latestConversation ?? conversationAfterUserMessage;

        const nextConversation: ChatConversation = {
          ...sourceConversation,
          preview: assistantMessage.content.split("\n")[0] ?? trimmed,
          updatedAt: assistantMessage.timestamp,
          messages: [...sourceConversation.messages, assistantMessage],
        };

        return [
          nextConversation,
          ...current.filter((conversation) => conversation.id !== conversationId),
        ];
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleSaveSettings = (
    profile: WorkspaceProfileDraft,
    nextPreferences: typeof preferences
  ): string | null => {
    if (!currentUser) {
      return "No active account was found.";
    }

    const nextDisplayName = profile.displayName.trim();
    const nextEmail = profile.email.trim().toLowerCase();
    const nextTitle = profile.title.trim();
    const nextBio = profile.bio.trim();

    if (!nextDisplayName || !nextEmail || !nextTitle) {
      return "Display name, email, and role are required.";
    }

    const emailTaken = store.accounts.some(
      (account) => account.id !== currentUser.id && account.email === nextEmail
    );

    if (emailTaken) {
      return "That email is already linked to another local account.";
    }

    setStore((currentStore) => ({
      ...currentStore,
      accounts: currentStore.accounts.map((account) =>
        account.id === currentUser.id
          ? {
              ...account,
              displayName: nextDisplayName,
              email: nextEmail,
              title: nextTitle,
              bio: nextBio || "Working locally inside AI Chat.",
            }
          : account
      ),
      preferencesByUserId: {
        ...currentStore.preferencesByUserId,
        [currentUser.id]: nextPreferences,
      },
    }));

    return null;
  };

  const handleSignOut = () => {
    setIsResponding(false);
    setStore((currentStore) => ({
      ...currentStore,
      activeUserId: null,
    }));
  };

  if (!currentUser) {
    return (
      <AuthScreen
        authMode={authMode}
        authForm={authForm}
        authError={authError}
        authMessage={authMessage}
        onModeChange={(mode) => {
          setAuthMode(mode);
          setAuthError("");
          setAuthMessage("");
        }}
        onFieldChange={handleFieldChange}
        onSubmit={handleAuthSubmit}
        onDemoAccess={handleDemoAccess}
      />
    );
  }

  return (
    <ChatWorkspace
      currentUser={currentUser}
      conversations={conversations}
      preferences={preferences}
      activeConversationId={activeConversationId}
      isResponding={isResponding}
      onStartNewChat={handleStartNewChat}
      onOpenConversation={handleOpenConversation}
      onDeleteConversation={handleDeleteConversation}
      onRenameConversation={handleRenameConversation}
      onSendMessage={handleSendMessage}
      onSaveSettings={handleSaveSettings}
      onSignOut={handleSignOut}
    />
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
