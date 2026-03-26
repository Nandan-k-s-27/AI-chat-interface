export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface UserAccount {
  id: string;
  displayName: string;
  email: string;
  password: string;
  title: string;
  bio: string;
  plan: "Free" | "Plus";
  createdAt: string;
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  compactMode: boolean;
  memoryEnabled: boolean;
  enterToSend: boolean;
}

export interface AppStore {
  accounts: UserAccount[];
  activeUserId: string | null;
  conversationsByUserId: Record<string, ChatConversation[]>;
  preferencesByUserId: Record<string, UserPreferences>;
}

const STORAGE_KEY = "ai-chat-workspace-v2";

const DEFAULT_PREFERENCES: UserPreferences = {
  notificationsEnabled: true,
  compactMode: false,
  memoryEnabled: true,
  enterToSend: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function createTimestamp(hoursAgo = 0): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 12);
}

export function createDefaultPreferences(): UserPreferences {
  return { ...DEFAULT_PREFERENCES };
}

export function createConversationTitle(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Untitled conversation";
  }

  return truncate(normalized, 44);
}

export function sortConversations(
  conversations: ChatConversation[]
): ChatConversation[] {
  return [...conversations].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function buildFocusLine(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (/\b(code|bug|error|debug|fix|refactor|typescript|react)\b/.test(normalized)) {
    return "Here is a clean technical approach to move this forward.";
  }

  if (/\b(plan|roadmap|strategy|launch|project|study)\b/.test(normalized)) {
    return "This works well if we keep it structured and outcome-focused.";
  }

  if (/\b(write|email|message|copy|content|bio|summary)\b/.test(normalized)) {
    return "I can help shape this into something concise and polished.";
  }

  return "Here is a practical response you can build on right away.";
}

function buildActionItems(prompt: string): string[] {
  const normalized = prompt.toLowerCase();

  if (/\b(code|bug|error|debug|fix|refactor|typescript|react)\b/.test(normalized)) {
    return [
      "Confirm the exact failing path and isolate the smallest reproducible case.",
      "Implement one focused fix, then verify the behavior before expanding scope.",
      "Capture the final pattern as a reusable utility, test case, or checklist.",
    ];
  }

  if (/\b(plan|roadmap|strategy|launch|project|study)\b/.test(normalized)) {
    return [
      "Define the outcome, constraints, and the deadline we need to hit.",
      "Break the work into three or four milestones with visible checkpoints.",
      "Decide what can be deferred so the first version stays clean and shippable.",
    ];
  }

  if (/\b(write|email|message|copy|content|bio|summary)\b/.test(normalized)) {
    return [
      "Start with the core point so the message feels clear immediately.",
      "Trim supporting details until every line earns its place.",
      "Close with a direct next step or call to action.",
    ];
  }

  return [
    "Clarify what matters most so the response stays focused.",
    "Turn the idea into a short checklist or draft that is easy to act on.",
    "Review the first pass quickly and tighten it based on what feels most useful.",
  ];
}

export function buildAssistantReply(
  prompt: string,
  displayName: string
): string {
  const cleanedPrompt = prompt.replace(/\s+/g, " ").trim();
  const actionItems = buildActionItems(cleanedPrompt);
  const promptSummary = truncate(cleanedPrompt, 120);

  return [
    `${buildFocusLine(cleanedPrompt)} ${displayName.split(" ")[0]}, I picked up the main direction quickly.`,
    "",
    `What I am hearing: ${promptSummary}`,
    "",
    "Suggested next steps:",
    `1. ${actionItems[0]}`,
    `2. ${actionItems[1]}`,
    `3. ${actionItems[2]}`,
    "",
    "If you want, I can turn this into a sharper plan, draft, or implementation outline next.",
  ].join("\n");
}

export function loadAppStore(): AppStore {
  if (typeof window === "undefined") {
    return {
      accounts: [],
      activeUserId: null,
      conversationsByUserId: {},
      preferencesByUserId: {},
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        accounts: [],
        activeUserId: null,
        conversationsByUserId: {},
        preferencesByUserId: {},
      };
    }

    const parsed = JSON.parse(raw) as Partial<AppStore>;

    return {
      accounts: Array.isArray(parsed.accounts)
        ? parsed.accounts.filter(isRecord).map((account) => ({
            id: typeof account.id === "string" ? account.id : generateId(),
            displayName:
              typeof account.displayName === "string"
                ? account.displayName
                : "AI Chat User",
            email:
              typeof account.email === "string" ? account.email : "user@local.dev",
            password:
              typeof account.password === "string" ? account.password : "",
            title: typeof account.title === "string" ? account.title : "Builder",
            bio:
              typeof account.bio === "string"
                ? account.bio
                : "Working locally inside AI Chat.",
            plan: account.plan === "Plus" ? "Plus" : "Free",
            createdAt:
              typeof account.createdAt === "string"
                ? account.createdAt
                : new Date().toISOString(),
          }))
        : [],
      activeUserId:
        typeof parsed.activeUserId === "string" ? parsed.activeUserId : null,
      conversationsByUserId: isRecord(parsed.conversationsByUserId)
        ? Object.fromEntries(
            Object.entries(parsed.conversationsByUserId).map(([userId, value]) => [
              userId,
              Array.isArray(value)
                ? sortConversations(
                    value.filter(isRecord).map((conversation) => ({
                      id:
                        typeof conversation.id === "string"
                          ? conversation.id
                          : generateId(),
                      title:
                        typeof conversation.title === "string"
                          ? conversation.title
                          : "Untitled conversation",
                      preview:
                        typeof conversation.preview === "string"
                          ? conversation.preview
                          : "",
                      createdAt:
                        typeof conversation.createdAt === "string"
                          ? conversation.createdAt
                          : new Date().toISOString(),
                      updatedAt:
                        typeof conversation.updatedAt === "string"
                          ? conversation.updatedAt
                          : new Date().toISOString(),
                      messages: Array.isArray(conversation.messages)
                        ? conversation.messages.filter(isRecord).map((message) => ({
                            id:
                              typeof message.id === "string"
                                ? message.id
                                : generateId(),
                            role:
                              message.role === "assistant" ? "assistant" : "user",
                            content:
                              typeof message.content === "string"
                                ? message.content
                                : "",
                            timestamp:
                              typeof message.timestamp === "string"
                                ? message.timestamp
                                : new Date().toISOString(),
                          }))
                        : [],
                    }))
                  )
                : [],
            ])
          )
        : {},
      preferencesByUserId: isRecord(parsed.preferencesByUserId)
        ? Object.fromEntries(
            Object.entries(parsed.preferencesByUserId).map(([userId, value]) => [
              userId,
              {
                notificationsEnabled:
                  isRecord(value) && typeof value.notificationsEnabled === "boolean"
                    ? value.notificationsEnabled
                    : DEFAULT_PREFERENCES.notificationsEnabled,
                compactMode:
                  isRecord(value) && typeof value.compactMode === "boolean"
                    ? value.compactMode
                    : DEFAULT_PREFERENCES.compactMode,
                memoryEnabled:
                  isRecord(value) && typeof value.memoryEnabled === "boolean"
                    ? value.memoryEnabled
                    : DEFAULT_PREFERENCES.memoryEnabled,
                enterToSend:
                  isRecord(value) && typeof value.enterToSend === "boolean"
                    ? value.enterToSend
                    : DEFAULT_PREFERENCES.enterToSend,
              },
            ])
          )
        : {},
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {
      accounts: [],
      activeUserId: null,
      conversationsByUserId: {},
      preferencesByUserId: {},
    };
  }
}

export function saveAppStore(store: AppStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createDemoConversations(displayName: string): ChatConversation[] {
  const launchUserPrompt = "Create a launch checklist for a college AI chat app.";
  const bugUserPrompt =
    "Help me debug a Vite app where the sidebar state is not persisting.";
  const studyUserPrompt =
    "Draft a focused weekly study routine for React and TypeScript.";

  return sortConversations([
    {
      id: generateId(),
      title: "Launch checklist",
      preview: "Break the work into milestones and keep the MVP focused.",
      createdAt: createTimestamp(52),
      updatedAt: createTimestamp(2),
      messages: [
        {
          id: generateId(),
          role: "user",
          content: launchUserPrompt,
          timestamp: createTimestamp(2.3),
        },
        {
          id: generateId(),
          role: "assistant",
          content: buildAssistantReply(launchUserPrompt, displayName),
          timestamp: createTimestamp(2),
        },
      ],
    },
    {
      id: generateId(),
      title: "Sidebar persistence bug",
      preview: "Confirm the failing path and isolate the smallest reproducible case.",
      createdAt: createTimestamp(30),
      updatedAt: createTimestamp(18),
      messages: [
        {
          id: generateId(),
          role: "user",
          content: bugUserPrompt,
          timestamp: createTimestamp(18.4),
        },
        {
          id: generateId(),
          role: "assistant",
          content: buildAssistantReply(bugUserPrompt, displayName),
          timestamp: createTimestamp(18),
        },
      ],
    },
    {
      id: generateId(),
      title: "Weekly study routine",
      preview: "A structured plan works well when the milestones are visible.",
      createdAt: createTimestamp(168),
      updatedAt: createTimestamp(96),
      messages: [
        {
          id: generateId(),
          role: "user",
          content: studyUserPrompt,
          timestamp: createTimestamp(96.5),
        },
        {
          id: generateId(),
          role: "assistant",
          content: buildAssistantReply(studyUserPrompt, displayName),
          timestamp: createTimestamp(96),
        },
      ],
    },
  ]);
}
