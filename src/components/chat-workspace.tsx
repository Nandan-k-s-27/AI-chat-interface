import {
  type FormEvent,
  type KeyboardEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bot,
  CheckCircle2,
  History,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PenLine,
  Plus,
  Search,
  SendHorizontal,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import type {
  ChatConversation,
  ChatMessage,
  UserAccount,
  UserPreferences,
} from "@/lib/chat-store";

export interface WorkspaceProfileDraft {
  displayName: string;
  email: string;
  title: string;
  bio: string;
}

interface ChatWorkspaceProps {
  currentUser: UserAccount;
  conversations: ChatConversation[];
  preferences: UserPreferences;
  activeConversationId: string | null;
  isResponding: boolean;
  onStartNewChat: () => void;
  onOpenConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onSendMessage: (value: string) => Promise<void>;
  onSaveSettings: (
    profile: WorkspaceProfileDraft,
    nextPreferences: UserPreferences
  ) => string | null;
  onSignOut: () => void;
}

interface ConversationGroup {
  label: string;
  items: ChatConversation[];
}

const SUGGESTION_PROMPTS = [
  "Plan a polished rollout for my AI chat app",
  "Write a clear product update for my team",
  "Help me improve the UX of a React dashboard",
];

function createProfileDraft(account: UserAccount): WorkspaceProfileDraft {
  return {
    displayName: account.displayName,
    email: account.email,
    title: account.title,
    bio: account.bio,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AI";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTimeLabel(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatConversationMeta(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function createConversationGroups(
  conversations: ChatConversation[]
): ConversationGroup[] {
  const groups = new Map<string, ChatConversation[]>();
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  conversations.forEach((conversation) => {
    const updatedAt = new Date(conversation.updatedAt);
    const updatedDay = new Date(
      updatedAt.getFullYear(),
      updatedAt.getMonth(),
      updatedAt.getDate()
    ).getTime();
    const diff = startOfToday - updatedDay;

    let label = "Older";

    if (diff <= 0) {
      label = "Today";
    } else if (diff <= oneDay) {
      label = "Yesterday";
    } else if (diff <= oneDay * 7) {
      label = "Earlier this week";
    }

    const current = groups.get(label) ?? [];
    current.push(conversation);
    groups.set(label, current);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

function conversationMatchesQuery(
  conversation: ChatConversation,
  query: string
): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    conversation.title,
    conversation.preview,
    conversation.messages[conversation.messages.length - 1]?.content ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function MessageComposer({
  value,
  onValueChange,
  onSubmit,
  isBusy,
  compact,
  enterToSend,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  isBusy: boolean;
  compact: boolean;
  enterToSend: boolean;
}) {
  const minHeight = compact ? 96 : 118;
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight: 240,
  });

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight, value]);

  const submit = async () => {
    if (!value.trim() || isBusy) {
      return;
    }

    await onSubmit();
    adjustHeight(true);
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submit();
    }
  };

  return (
    <div className="composer-shell">
      <div className="composer-field">
        <Sparkles className="composer-leading-icon" />
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            void handleKeyDown(event);
          }}
          placeholder="Message AI Chat..."
          className="composer-textarea"
          disabled={isBusy}
          style={{ minHeight, maxHeight: 240 }}
        />
        <button
          type="button"
          className="composer-submit"
          onClick={() => {
            void submit();
          }}
          disabled={isBusy || !value.trim()}
          aria-label="Send message"
        >
          {isBusy ? (
            <span className="composer-spinner" aria-hidden="true" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="composer-hint-row">
        <span>
          {enterToSend ? "Press Enter to send" : "Press Shift + Enter for new lines"}
        </span>
        <span>Local demo experience with persistent history</span>
      </div>
    </div>
  );
}

function ChatMessageCard({
  message,
  compact,
}: {
  message: ChatMessage;
  compact: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "message-row",
        isUser ? "message-row-user" : "message-row-assistant",
        compact && "message-row-compact"
      )}
    >
      <div className={cn("message-avatar", isUser ? "message-avatar-user" : "")}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="message-surface">
        <div className="message-meta">
          <strong>{isUser ? "You" : "AI Chat"}</strong>
          <span>{formatTimeLabel(message.timestamp)}</span>
        </div>
        <p className="message-copy">{message.content}</p>
      </div>
    </article>
  );
}

function TypingRow({ compact }: { compact: boolean }) {
  return (
    <article className={cn("message-row", compact && "message-row-compact")}>
      <div className="message-avatar">
        <Bot className="h-4 w-4" />
      </div>
      <div className="typing-surface">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </article>
  );
}

export function ChatWorkspace({
  currentUser,
  conversations,
  preferences,
  activeConversationId,
  isResponding,
  onStartNewChat,
  onOpenConversation,
  onDeleteConversation,
  onRenameConversation,
  onSendMessage,
  onSaveSettings,
  onSignOut,
}: ChatWorkspaceProps) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(
    null
  );
  const [renameValue, setRenameValue] = useState("");
  const [profileDraft, setProfileDraft] = useState<WorkspaceProfileDraft>(() =>
    createProfileDraft(currentUser)
  );
  const [preferencesDraft, setPreferencesDraft] = useState<UserPreferences>(preferences);
  const [settingsError, setSettingsError] = useState("");
  const deferredHistoryQuery = useDeferredValue(historyQuery);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      null,
    [activeConversationId, conversations]
  );

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversationMatchesQuery(conversation, deferredHistoryQuery)
      ),
    [conversations, deferredHistoryQuery]
  );

  const conversationGroups = useMemo(
    () => createConversationGroups(filteredConversations),
    [filteredConversations]
  );

  const totalMessages = useMemo(
    () =>
      conversations.reduce(
        (count, conversation) => count + conversation.messages.length,
        0
      ),
    [conversations]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeConversation?.messages.length, isResponding]);

  const handleSendMessage = async () => {
    const trimmed = composerValue.trim();
    if (!trimmed) {
      return;
    }

    await onSendMessage(trimmed);
    setComposerValue("");
  };

  const handleSuggestionClick = async (prompt: string) => {
    setComposerValue(prompt);
    await onSendMessage(prompt);
    setComposerValue("");
  };

  const handleRenameSubmit = (
    event: FormEvent<HTMLFormElement>,
    conversationId: string
  ) => {
    event.preventDefault();

    const trimmed = renameValue.trim();
    if (!trimmed) {
      return;
    }

    onRenameConversation(conversationId, trimmed);
    setRenamingConversationId(null);
    setRenameValue("");
  };

  const handleSaveSettings = () => {
    const error = onSaveSettings(profileDraft, preferencesDraft);
    if (error) {
      setSettingsError(error);
      return;
    }

    setSettingsOpen(false);
  };

  const activeConversationTitle =
    activeConversation?.title ?? "New conversation";
  const activeConversationMeta = activeConversation
    ? `${activeConversation.messages.length} messages • ${formatConversationMeta(
        activeConversation.updatedAt
      )}`
    : "Start a new thread and keep everything organized.";

  const handleSettingsOpenChange = (open: boolean) => {
    if (open) {
      setProfileDraft(createProfileDraft(currentUser));
      setPreferencesDraft(preferences);
      setSettingsError("");
    }

    setSettingsOpen(open);
  };

  return (
    <>
      <div className="workspace-shell" data-theme={theme}>
        <div
          className={cn(
            "workspace-sidebar-backdrop",
            sidebarOpen && "workspace-sidebar-backdrop-open"
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={cn(
            "workspace-sidebar",
            sidebarOpen && "workspace-sidebar-open"
          )}
        >
          <div className="workspace-brand-row">
            <div>
              <span className="workspace-brand-mark">AI</span>
              <div>
                <p className="workspace-brand-title">AI Chat</p>
                <p className="workspace-brand-subtitle">Personal workspace</p>
              </div>
            </div>
            <button
              type="button"
              className="shell-icon-button lg-hidden-only"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className="workspace-primary-button"
            onClick={() => {
              onStartNewChat();
              setSidebarOpen(false);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>New chat</span>
          </button>

          <div className="history-search">
            <Search className="history-search-icon" />
            <Input
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder="Search chats"
              className="history-search-input"
            />
          </div>

          <div className="history-summary-card">
            <div>
              <span className="history-summary-label">Conversations</span>
              <strong>{conversations.length}</strong>
            </div>
            <div>
              <span className="history-summary-label">Messages</span>
              <strong>{totalMessages}</strong>
            </div>
            <div>
              <span className="history-summary-label">Memory</span>
              <strong>{preferences.memoryEnabled ? "On" : "Off"}</strong>
            </div>
          </div>

          <div className="history-panel">
            <div className="history-panel-header">
              <div>
                <p className="history-panel-title">Chat history</p>
                <p className="history-panel-subtitle">
                  Search, reopen, rename, or clear threads.
                </p>
              </div>
              <History className="h-4 w-4 text-[var(--muted-text)]" />
            </div>

            {conversationGroups.length === 0 ? (
              <div className="history-empty-state">
                <p>No chats match your search yet.</p>
              </div>
            ) : (
              <div className="history-groups">
                {conversationGroups.map((group) => (
                  <section key={group.label} className="history-group">
                    <h3>{group.label}</h3>
                    <div className="history-group-items">
                      {group.items.map((conversation) => {
                        const isActive = conversation.id === activeConversationId;
                        const isRenaming =
                          renamingConversationId === conversation.id;

                        return (
                          <div
                            key={conversation.id}
                            className={cn(
                              "history-item",
                              isActive && "history-item-active"
                            )}
                          >
                            {isRenaming ? (
                              <form
                                onSubmit={(event) =>
                                  handleRenameSubmit(event, conversation.id)
                                }
                                className="history-rename-form"
                              >
                                <Input
                                  autoFocus
                                  value={renameValue}
                                  onChange={(event) =>
                                    setRenameValue(event.target.value)
                                  }
                                  className="history-rename-input"
                                />
                                <button
                                  type="submit"
                                  className="workspace-icon-ghost"
                                  aria-label="Save title"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              </form>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="history-item-main"
                                  onClick={() => {
                                    onOpenConversation(conversation.id);
                                    setSidebarOpen(false);
                                  }}
                                >
                                  <span className="history-item-title">
                                    {conversation.title}
                                  </span>
                                  <span className="history-item-preview">
                                    {conversation.preview}
                                  </span>
                                  <span className="history-item-date">
                                    {formatConversationMeta(conversation.updatedAt)}
                                  </span>
                                </button>
                                <div className="history-item-actions">
                                  <button
                                    type="button"
                                    className="workspace-icon-ghost"
                                    onClick={() => {
                                      setRenamingConversationId(conversation.id);
                                      setRenameValue(conversation.title);
                                    }}
                                    aria-label="Rename conversation"
                                  >
                                    <PenLine className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="workspace-icon-ghost danger"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Delete this conversation from local history?"
                                        )
                                      ) {
                                        onDeleteConversation(conversation.id);
                                      }
                                    }}
                                    aria-label="Delete conversation"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="workspace-account-card">
            <button
              type="button"
              className="workspace-account-button"
              onClick={() => setSettingsOpen(true)}
            >
              <span className="workspace-account-avatar">
                {getInitials(currentUser.displayName)}
              </span>
              <span className="workspace-account-copy">
                <strong>{currentUser.displayName}</strong>
                <span>{currentUser.title}</span>
              </span>
            </button>
            <button
              type="button"
              className="workspace-icon-ghost"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <main className="workspace-main">
          <header className="workspace-header">
            <div className="workspace-header-copy">
              <button
                type="button"
                className="shell-icon-button desktop-hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <div className="workspace-header-title-row">
                  <h1>{activeConversationTitle}</h1>
                  <Badge className="workspace-badge" variant="outline">
                    {currentUser.plan}
                  </Badge>
                  <Badge className="workspace-badge soft" variant="outline">
                    {preferences.memoryEnabled ? "Memory on" : "Memory off"}
                  </Badge>
                </div>
                <p>{activeConversationMeta}</p>
              </div>
            </div>

            <div className="workspace-header-actions">
              <button
                type="button"
                className="shell-icon-button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                className="workspace-secondary-button"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </header>

          <div className="workspace-content">
            {activeConversation ? (
              <div className="messages-panel">
                <div
                  className={cn(
                    "messages-stack",
                    preferences.compactMode ? "messages-stack-compact" : ""
                  )}
                >
                  {activeConversation.messages.map((message) => (
                    <ChatMessageCard
                      key={message.id}
                      message={message}
                      compact={preferences.compactMode}
                    />
                  ))}
                  {isResponding && <TypingRow compact={preferences.compactMode} />}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              <div className="workspace-empty-state">
                <div className="workspace-empty-copy">
                  <Badge className="workspace-badge accent" variant="outline">
                    ChatGPT-inspired workflow
                  </Badge>
                  <h2>Clean workspace, persistent history, and account controls.</h2>
                  <p>
                    Start a new conversation, pick a suggestion, or reopen an old
                    thread from the sidebar. Everything is stored locally per account
                    so the experience already feels like a real product.
                  </p>
                </div>

                <div className="workspace-feature-grid">
                  <div className="workspace-feature-card">
                    <MessageSquare className="h-5 w-5" />
                    <strong>Focused chat area</strong>
                    <span>Clean, readable threads with a stronger hierarchy.</span>
                  </div>
                  <div className="workspace-feature-card">
                    <History className="h-5 w-5" />
                    <strong>Persistent history</strong>
                    <span>Each local account keeps its own searchable conversations.</span>
                  </div>
                  <div className="workspace-feature-card">
                    <Settings className="h-5 w-5" />
                    <strong>Account settings</strong>
                    <span>Profile info and chat preferences are editable in-app.</span>
                  </div>
                </div>

                <div className="workspace-suggestions">
                  {SUGGESTION_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="workspace-suggestion-card"
                      onClick={() => {
                        void handleSuggestionClick(prompt);
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="workspace-footer">
            <MessageComposer
              value={composerValue}
              onValueChange={setComposerValue}
              onSubmit={handleSendMessage}
              isBusy={isResponding}
              compact={preferences.compactMode}
              enterToSend={preferences.enterToSend}
            />
          </footer>
        </main>
      </div>

      <Dialog open={settingsOpen} onOpenChange={handleSettingsOpenChange}>
        <DialogContent className="settings-dialog" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Account settings</DialogTitle>
            <DialogDescription>
              Update your local profile, tune the chat experience, and keep the app
              feeling closer to a production-ready assistant interface.
            </DialogDescription>
          </DialogHeader>

          <div className="settings-summary-card">
            <div className="workspace-account-avatar large">
              {getInitials(currentUser.displayName)}
            </div>
            <div>
              <strong>{currentUser.displayName}</strong>
              <p>{currentUser.email}</p>
            </div>
            <Badge className="workspace-badge accent" variant="outline">
              {currentUser.plan} plan
            </Badge>
          </div>

          <div className="settings-grid">
            <section className="settings-section">
              <div className="settings-section-header">
                <h3>Profile</h3>
                <p>Edit the identity shown across the workspace.</p>
              </div>

              <label className="settings-field">
                <span>Display name</span>
                <Input
                  value={profileDraft.displayName}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className="settings-input"
                />
              </label>

              <label className="settings-field">
                <span>Email</span>
                <Input
                  type="email"
                  value={profileDraft.email}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="settings-input"
                />
              </label>

              <label className="settings-field">
                <span>Role</span>
                <Input
                  value={profileDraft.title}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="settings-input"
                />
              </label>

              <label className="settings-field">
                <span>Bio</span>
                <Textarea
                  value={profileDraft.bio}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  className="settings-textarea"
                />
              </label>
            </section>

            <section className="settings-section">
              <div className="settings-section-header">
                <h3>Chat preferences</h3>
                <p>Adjust how the workspace behaves day to day.</p>
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Enter to send</strong>
                  <p>Use Enter to send and Shift + Enter for new lines.</p>
                </div>
                <Switch
                  checked={preferencesDraft.enterToSend}
                  onCheckedChange={(checked) =>
                    setPreferencesDraft((current) => ({
                      ...current,
                      enterToSend: checked,
                    }))
                  }
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Compact layout</strong>
                  <p>Tighten message spacing and the composer height.</p>
                </div>
                <Switch
                  checked={preferencesDraft.compactMode}
                  onCheckedChange={(checked) =>
                    setPreferencesDraft((current) => ({
                      ...current,
                      compactMode: checked,
                    }))
                  }
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Memory enabled</strong>
                  <p>Keep workspace context and history easier to revisit.</p>
                </div>
                <Switch
                  checked={preferencesDraft.memoryEnabled}
                  onCheckedChange={(checked) =>
                    setPreferencesDraft((current) => ({
                      ...current,
                      memoryEnabled: checked,
                    }))
                  }
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <strong>Notifications</strong>
                  <p>Keep simple local preference tracking for future upgrades.</p>
                </div>
                <Switch
                  checked={preferencesDraft.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    setPreferencesDraft((current) => ({
                      ...current,
                      notificationsEnabled: checked,
                    }))
                  }
                />
              </div>

              <div className="settings-note">
                <p>
                  Profile and login data are stored locally in this browser for now.
                  The structure is ready for a backend later.
                </p>
              </div>
            </section>
          </div>

          {settingsError ? <p className="settings-error">{settingsError}</p> : null}

          <DialogFooter className="settings-footer">
            <button
              type="button"
              className="workspace-secondary-button"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="workspace-primary-button"
              onClick={handleSaveSettings}
            >
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
