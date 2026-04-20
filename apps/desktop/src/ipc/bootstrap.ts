import { invoke } from '@tauri-apps/api/core';

async function invokeChannel<T = unknown>(channel: string, payload?: unknown): Promise<T> {
  return invoke<T>('ipc_invoke', { channel, payload: payload ?? null });
}

const ipcRenderer = {
  invoke<T = unknown>(channel: string, payload?: unknown) {
    return invokeChannel<T>(channel, payload);
  },

  saveSettings: (settings: unknown) => invokeChannel('db:save-settings', settings),
  getSettings: () => invokeChannel('db:get-settings'),
  getAppVersion: () => invokeChannel('app:get-version'),
  openExternalUrl: (url?: string) => invokeChannel('app:open-url', { url }),
  openAppReleasePage: (url?: string) => invokeChannel('app:open-url', { url }),
  openAppPath: (path: string) => invokeChannel('app:open-path', { path }),
  openAppExportDirectory: () => invokeChannel('app:open-export-directory'),
  openAppWorkspaceDirectory: () => invokeChannel('app:open-workspace-directory'),

  debug: {
    getStatus: () => invokeChannel('debug:get-status'),
    getRecent: (limit?: number) => invokeChannel('debug:get-recent', { limit }),
  },

  browserPlugin: {
    getStatus: () => invokeChannel('plugin:browser-extension-status'),
    prepare: () => invokeChannel('plugin:prepare-browser-extension'),
    openDir: () => invokeChannel('plugin:open-browser-extension-dir'),
  },

  subjects: {
    list: (payload?: unknown) => invokeChannel('subjects:list', payload ?? {}),
    create: (payload: unknown) => invokeChannel('subjects:create', payload),
    update: (payload: unknown) => invokeChannel('subjects:update', payload),
    categories: {
      list: () => invokeChannel('subjects:categories:list'),
    },
  },

  workspace: {
    exportBackup: (payload?: unknown) => invokeChannel('workspace:export-backup', payload ?? {}),
    importBackup: (payload: unknown) => invokeChannel('workspace:import-backup', payload),
  },

  chat: {
    getMessages: (sessionId: string) => invokeChannel('chat:get-messages', sessionId),
    getContextUsage: (sessionId: string) => invokeChannel('chat:get-context-usage', sessionId),
    getRuntimeState: (sessionId: string) => invokeChannel('chat:get-runtime-state', sessionId),
    getOrCreateContextSession: (payload: unknown) => invokeChannel('chat:getOrCreateContextSession', payload),
    sendMessage: (payload: unknown) => invokeChannel('chat:send-message', payload),
  },

  redclawRunner: {
    getStatus: () => invokeChannel('redclaw:automation-status'),
    start: (payload?: unknown) => invokeChannel('redclaw:automation-start', payload ?? {}),
    stop: () => invokeChannel('redclaw:automation-stop'),
    runNow: (payload?: unknown) => invokeChannel('redclaw:automation-run-now', payload ?? {}),
    setProject: (payload: unknown) => invokeChannel('redclaw:automation-set-project', payload),
    setConfig: (payload?: unknown) => invokeChannel('redclaw:automation-set-config', payload ?? {}),
    testConfig: (payload?: unknown) => invokeChannel('redclaw:automation-test-config', payload ?? {}),
    listScheduled: () => invokeChannel('redclaw:automation-list-scheduled'),
    addScheduled: (payload: unknown) => invokeChannel('redclaw:automation-add-scheduled', payload),
    updateScheduled: (payload: unknown) => invokeChannel('redclaw:automation-update-scheduled', payload),
    removeScheduled: (payload: unknown) => invokeChannel('redclaw:automation-remove-scheduled', payload),
    setScheduledEnabled: (payload: unknown) => invokeChannel('redclaw:automation-set-scheduled-enabled', payload),
    runScheduledNow: (payload: unknown) => invokeChannel('redclaw:automation-run-scheduled-now', payload),
    listOutputArchive: () => invokeChannel('redclaw:automation-list-output-archive'),
    removeOutputArchive: (payload: unknown) => invokeChannel('redclaw:automation-remove-output-archive', payload),
    clearOutputArchive: (payload?: unknown) => invokeChannel('redclaw:automation-clear-output-archive', payload ?? {}),
    listLongCycle: () => invokeChannel('redclaw:automation-list-long-cycle'),
    addLongCycle: (payload: unknown) => invokeChannel('redclaw:automation-add-long-cycle', payload),
    updateLongCycle: (payload: unknown) => invokeChannel('redclaw:automation-update-long-cycle', payload),
    removeLongCycle: (payload: unknown) => invokeChannel('redclaw:automation-remove-long-cycle', payload),
    setLongCycleEnabled: (payload: unknown) => invokeChannel('redclaw:automation-set-long-cycle-enabled', payload),
    runLongCycleNow: (payload: unknown) => invokeChannel('redclaw:automation-run-long-cycle-now', payload),
  },
};

;(window as typeof window & { ipcRenderer: typeof ipcRenderer }).ipcRenderer = ipcRenderer;
