export {};

type IpcResult<T extends object = {}> = {
  success?: boolean;
  error?: string;
} & T;

declare global {
  interface ChatSession {
    id: string;
    title?: string;
    updatedAt?: string;
  }

  interface ChatMessage {
    id: string;
    session_id: string;
    role: string;
    content: string;
    created_at: string;
    displayContent?: string;
    display_content?: string;
    attachment?: unknown;
    task_hints?: unknown;
    tool_call_id?: string;
  }

  interface SubjectCategory {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }

  interface SubjectAttribute {
    key: string;
    value: string;
  }

  interface SubjectRecord {
    id: string;
    name: string;
    categoryId?: string;
    description?: string;
    tags: string[];
    attributes: SubjectAttribute[];
    imagePaths: string[];
    voicePath?: string;
    voiceScript?: string;
    createdAt: string;
    updatedAt: string;
    absoluteImagePaths?: string[];
    previewUrls?: string[];
    primaryPreviewUrl?: string;
    absoluteVoicePath?: string;
    voicePreviewUrl?: string;
  }

  interface Window {
    ipcRenderer: {
      invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>;
      saveSettings: (settings: Record<string, unknown>) => Promise<unknown>;
      getSettings: () => Promise<Record<string, unknown> | undefined>;
      getAppVersion: () => Promise<string>;
      openExternalUrl: (url?: string) => Promise<IpcResult<{ url?: string }>>;
      openAppReleasePage: (url?: string) => Promise<IpcResult<{ url?: string }>>;
      openAppPath: (path: string) => Promise<IpcResult<{ path?: string }>>;
      openAppExportDirectory: () => Promise<IpcResult<{ path?: string; usedFallbackDirectory?: boolean }>>;
      openAppWorkspaceDirectory: () => Promise<IpcResult<{ path?: string }>>;
      debug: {
        getStatus: () => Promise<{ enabled: boolean; logDirectory: string }>;
        getRecent: (limit?: number) => Promise<{ lines?: string[] }>;
      };
      browserPlugin: {
        getStatus: () => Promise<unknown>;
        prepare: () => Promise<IpcResult<{ path?: string; alreadyPrepared?: boolean }>>;
        openDir: () => Promise<IpcResult<{ path?: string }>>;
      };
      subjects: {
        list: (payload?: { limit?: number }) => Promise<IpcResult<{ subjects?: SubjectRecord[] }>>;
        create: (payload: unknown) => Promise<IpcResult<{ subject?: SubjectRecord }>>;
        update: (payload: unknown) => Promise<IpcResult<{ subject?: SubjectRecord }>>;
        categories: {
          list: () => Promise<IpcResult<{ categories?: SubjectCategory[] }>>;
        };
      };
      workspace: {
        exportBackup: (payload?: unknown) => Promise<IpcResult<{
          path?: string;
          usedFallbackDirectory?: boolean;
          counts?: Record<string, number>;
          includesApiKey?: boolean;
          includesWorkspaceFiles?: boolean;
          schemaVersion?: number;
        }>>;
        importBackup: (payload: { content: string }) => Promise<IpcResult<{
          clientState?: {
            manuscriptLinks?: Record<string, string>;
            sessionLinks?: Record<string, string>;
          };
          counts?: Record<string, number>;
          includesApiKey?: boolean;
          includesWorkspaceFiles?: boolean;
          schemaVersion?: number;
        }>>;
      };
      chat: {
        getMessages: (sessionId: string) => Promise<ChatMessage[]>;
        getContextUsage: (sessionId: string) => Promise<unknown>;
        getRuntimeState: (sessionId: string) => Promise<unknown>;
        getOrCreateContextSession: (payload: unknown) => Promise<ChatSession>;
        sendMessage: (payload: unknown) => Promise<IpcResult<{
          sessionId?: string;
          savedManuscriptPath?: string;
          referenceManuscriptPath?: string;
          sourceTitle?: string;
          userMessage?: ChatMessage;
          assistantMessage?: ChatMessage;
        }>>;
      };
      redclawRunner: {
        getStatus: () => Promise<unknown>;
        start: (payload?: unknown) => Promise<IpcResult>;
        stop: () => Promise<IpcResult>;
        runNow: (payload?: unknown) => Promise<unknown>;
        setProject: (payload: unknown) => Promise<IpcResult>;
        setConfig: (payload?: unknown) => Promise<IpcResult>;
        testConfig: (payload?: {
          aiProvider?: string;
          aiModel?: string;
          aiEndpoint?: string;
          aiApiKey?: string;
          exportDirectory?: string;
        }) => Promise<IpcResult<{
          resolvedEndpoint?: string;
          model?: string;
          reply?: string;
          latencyMs?: number;
        }>>;
        listScheduled: () => Promise<IpcResult<{ tasks?: unknown[] }>>;
        addScheduled: (payload: unknown) => Promise<IpcResult>;
        updateScheduled: (payload: unknown) => Promise<IpcResult>;
        removeScheduled: (payload: unknown) => Promise<IpcResult>;
        setScheduledEnabled: (payload: unknown) => Promise<IpcResult>;
        runScheduledNow: (payload: unknown) => Promise<IpcResult>;
        listOutputArchive: () => Promise<IpcResult<{ items?: unknown[] }>>;
        removeOutputArchive: (payload: unknown) => Promise<IpcResult>;
        clearOutputArchive: (payload?: unknown) => Promise<IpcResult<{ removedCount?: number }>>;
        listLongCycle: () => Promise<IpcResult<{ tasks?: unknown[] }>>;
        addLongCycle: (payload: unknown) => Promise<IpcResult>;
        updateLongCycle: (payload: unknown) => Promise<IpcResult>;
        removeLongCycle: (payload: unknown) => Promise<IpcResult>;
        setLongCycleEnabled: (payload: unknown) => Promise<IpcResult>;
        runLongCycleNow: (payload: unknown) => Promise<IpcResult>;
      };
    };
  }
}
