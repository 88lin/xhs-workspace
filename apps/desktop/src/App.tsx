import { startTransition, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  CheckCircle2,
  CircleDashed,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  FolderOpen,
  Inbox,
  LibraryBig,
  Loader2,
  MoonStar,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Sparkles,
  SunMedium,
  Upload,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

import { coerceToLocalAssetUrl } from '../shared/localAsset';
import { buildRedClawAuthoringMessage } from './utils/redclawAuthoring';

type StudioView = 'overview' | 'capture' | 'library' | 'settings';
type ThemeMode = 'light' | 'dark';
type NoticeTone = 'info' | 'success' | 'warning';
type OutputArchiveSourceFilter = 'all' | 'manual' | 'scheduled' | 'longCycle';
type DraftStrategyFilter = 'all' | DraftStrategy;

type Notice = { tone: NoticeTone; text: string };
type DraftStrategy = 'fresh' | 'continue' | 'rewrite';
type WorkspaceBackupClientState = {
  manuscriptLinks: Record<string, string>;
  sessionLinks: Record<string, string>;
};

type AppSettings = {
  aiProvider: string;
  aiModel: string;
  aiEndpoint: string;
  aiApiKey: string;
  exportDirectory: string;
};

type SettingsConnectionStatus = {
  tone: NoticeTone;
  title: string;
  detail: string;
  checkedAt: number;
  latencyMs?: number;
  resolvedEndpoint?: string;
  model?: string;
  reply?: string;
};

type CaptureForm = {
  title: string;
  sourceUrl: string;
  description: string;
  tagsText: string;
};

type SubjectDraft = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  tagsText: string;
  attributes: SubjectAttribute[];
};

type CaptureRecord = {
  id: string;
  title?: string;
  description?: string;
  authorName?: string;
  sourceUrl?: string;
  status?: string;
  createdAt?: string;
};

type ActivityRecord = {
  id: string;
  title: string;
  detail?: string;
  kind?: string;
  tone?: 'info' | 'success' | 'warning';
  createdAt?: string;
};

type PluginStatus = {
  bridgeDirectory?: string;
  importedDirectory?: string;
  pendingItems?: number;
  lastSyncAt?: string;
  message?: string;
};

type DebugStatus = {
  enabled: boolean;
  logDirectory: string;
};

type ManuscriptReadResult = {
  content?: string;
  path?: string;
  absolutePath?: string;
  metadata?: {
    id?: string;
    title?: string;
  };
};

type AutomationOutputRecord = {
  id: string;
  taskKind: 'scheduled' | 'longCycle';
  taskName: string;
  draftStrategy?: DraftStrategy;
  projectId?: string;
  projectName?: string;
  manuscriptPath: string;
  referenceManuscriptPath?: string;
  sourceTitle?: string;
  sessionId?: string;
  lastRunAt?: string;
  updatedAt?: string;
  lastResult?: 'success' | 'error' | 'skipped';
};

type OutputArchiveRecord = {
  id: string;
  sourceKind: 'manual' | 'scheduled' | 'longCycle';
  draftStrategy?: DraftStrategy;
  title: string;
  summary?: string;
  manuscriptPath: string;
  referenceManuscriptPath?: string;
  sourceTitle?: string;
  sessionId?: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
};

type StudioOutputRecord = {
  id: string;
  manuscriptPath: string;
  sessionId?: string;
  projectId?: string;
};

type RedClawLaunchMode = 'continue' | 'rewrite';

type ProjectAutomationState = {
  projectId: string;
  enabled: boolean;
  prompt?: string;
  lastRunAt?: string;
  lastResult?: 'success' | 'error' | 'skipped';
  lastError?: string;
};

type RunnerHeartbeatStatus = {
  enabled: boolean;
  intervalMinutes: number;
  suppressEmptyReport: boolean;
  reportToMainSession: boolean;
  prompt?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  lastDigest?: string;
};

type RedClawRunnerStatus = {
  enabled?: boolean;
  available?: boolean;
  directGenerationEnabled?: boolean;
  configurationIssues?: string[];
  contentPackName?: string;
  contentPackSections?: number;
  mode?: string;
  intervalMinutes?: number;
  keepAliveWhenNoWindow?: boolean;
  maxProjectsPerTick?: number;
  maxAutomationPerTick?: number;
  isTicking?: boolean;
  lastTickAt?: string | null;
  nextTickAt?: string | null;
  nextAutomationFireAt?: string | null;
  nextMaintenanceAt?: string | null;
  heartbeat?: RunnerHeartbeatStatus;
  projectStates?: Record<string, ProjectAutomationState>;
  lastError?: string | null;
};

type ScheduledTaskRecord = {
  id: string;
  name: string;
  enabled: boolean;
  mode: 'interval' | 'daily' | 'weekly' | 'once';
  prompt: string;
  projectId?: string;
  intervalMinutes?: number;
  time?: string;
  weekdays?: number[];
  runAt?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastResult?: 'success' | 'error' | 'skipped';
  lastError?: string;
  retryCount?: number;
  maxRetries?: number;
  retryDelayMinutes?: number;
  lastSavedManuscriptPath?: string;
  lastSessionId?: string;
  lastDraftStrategy?: DraftStrategy;
  lastReferenceManuscriptPath?: string;
  nextRunAt?: string;
};

type LongCycleTaskRecord = {
  id: string;
  name: string;
  enabled: boolean;
  status: 'running' | 'paused' | 'completed';
  objective: string;
  stepPrompt: string;
  projectId?: string;
  intervalMinutes: number;
  totalRounds: number;
  completedRounds: number;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastResult?: 'success' | 'error' | 'skipped';
  lastError?: string;
  retryCount?: number;
  maxRetries?: number;
  retryDelayMinutes?: number;
  lastSavedManuscriptPath?: string;
  lastSessionId?: string;
  lastDraftStrategy?: DraftStrategy;
  lastReferenceManuscriptPath?: string;
  nextRunAt?: string;
};

type ScheduledTaskForm = {
  name: string;
  mode: 'interval' | 'daily' | 'weekly' | 'once';
  prompt: string;
  projectId: string;
  intervalMinutes: string;
  time: string;
  weekdays: number[];
  runAt: string;
  maxRetries: string;
  retryDelayMinutes: string;
};

type LongCycleTaskForm = {
  name: string;
  objective: string;
  stepPrompt: string;
  projectId: string;
  intervalMinutes: string;
  totalRounds: string;
  maxRetries: string;
  retryDelayMinutes: string;
};

type RunnerConfigForm = {
  intervalMinutes: string;
  maxProjectsPerTick: string;
  maxAutomationPerTick: string;
  keepAliveWhenNoWindow: boolean;
  heartbeatEnabled: boolean;
  heartbeatIntervalMinutes: string;
  heartbeatSuppressEmptyReport: boolean;
  heartbeatReportToMainSession: boolean;
  heartbeatPrompt: string;
};

type ProjectAutomationDraft = {
  enabled: boolean;
  prompt: string;
};

type RuntimeState = {
  sessionId: string;
  isProcessing: boolean;
  partialResponse: string;
  updatedAt: number;
};

type ContextUsage = {
  sessionId: string;
  contextType?: string;
  messageCount: number;
  estimatedTotalTokens: number;
  activeHistoryTokens: number;
  embeddedPromptTokens: number;
  compactThreshold: number;
  compactRatio: number;
};

const THEME_KEY = 'xhs-studio:theme-mode:v1';
const MANUSCRIPT_KEY = 'xhs-atelier:subject-manuscripts:v1';
const SESSION_KEY = 'xhs-atelier:redclaw-sessions:v1';
const REDCLAW_CONTEXT = 'You are RedClaw, the manuscript execution desk inside XHS Atelier.';
const REPOSITORY_URL = 'https://github.com/88lin/xhs-workspace';
const RELEASES_URL = `${REPOSITORY_URL}/releases`;
const ISSUE_TRACKER_URL = `${REPOSITORY_URL}/issues/new/choose`;
const LAUNCH_CHECKLIST_URL = `${REPOSITORY_URL}/blob/main/docs/desktop-launch-checklist.en.md`;
const RELEASE_FLOW_URL = `${REPOSITORY_URL}/blob/main/docs/desktop-release-flow.en.md`;
const CONTRIBUTING_URL = `${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`;
const SECURITY_POLICY_URL = `${REPOSITORY_URL}/blob/main/SECURITY.md`;
const BUILD_STEPS = [
  'Push desktop changes to the GitHub repository',
  'Wait for the desktop-validate workflow to pass',
  'Create a desktop-v* tag or release',
  'Download installers from GitHub Releases',
];

const VIEW_META: Record<StudioView, { title: string; summary: string }> = {
  overview: {
    title: 'One workflow from capture to library to RedClaw',
    summary: 'The desktop app is organized around capture, consolidation, and creation, while validation and installers are produced only by GitHub Actions.',
  },
  capture: {
    title: 'One inbox for browser bridge, manual capture, and JSON import',
    summary: 'Browser bridge input, manual capture, and local JSON import all land in the same inbox before being promoted into reusable subjects.',
  },
  library: {
    title: 'Move from subject cards straight into Manuscripts and RedClaw',
    summary: 'Each subject can generate a creation brief, write into Manuscripts, and carry context directly into a RedClaw writing session.',
  },
  settings: {
    title: 'Lock down AI settings and the GitHub Actions delivery chain',
    summary: 'The desktop app handles configuration, creation, and review. Dependency install, validation, bundling, and installer publishing all stay in GitHub Actions.',
  },
};

const OUTPUT_ARCHIVE_SOURCE_OPTIONS: Array<{ value: OutputArchiveSourceFilter; label: string }> = [
  { value: 'all', label: 'All sources' },
  { value: 'manual', label: 'Manual generation' },
  { value: 'scheduled', label: 'Scheduled task' },
  { value: 'longCycle', label: 'Long-cycle task' },
];

const DRAFT_STRATEGY_FILTER_OPTIONS: Array<{ value: DraftStrategyFilter; label: string }> = [
  { value: 'all', label: 'All strategies' },
  { value: 'fresh', label: 'Fresh draft' },
  { value: 'continue', label: 'Continue' },
  { value: 'rewrite', label: 'Rewrite' },
];

const NAV_ITEMS: Array<{ id: StudioView; label: string; caption: string; Icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', caption: 'Overview', Icon: Sparkles },
  { id: 'capture', label: 'Capture', caption: 'Capture', Icon: Inbox },
  { id: 'library', label: 'Library', caption: 'Library', Icon: LibraryBig },
  { id: 'settings', label: 'Settings', caption: 'Settings', Icon: Settings2 },
];

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'OpenAI Compatible',
  aiModel: '',
  aiEndpoint: '',
  aiApiKey: '',
  exportDirectory: '',
};

const normalizeAppSettings = (value: AppSettings): AppSettings => ({
  aiProvider: value.aiProvider.trim() || DEFAULT_SETTINGS.aiProvider,
  aiModel: value.aiModel.trim(),
  aiEndpoint: value.aiEndpoint.trim(),
  aiApiKey: value.aiApiKey.trim(),
  exportDirectory: value.exportDirectory.trim(),
});

const getAppSettingsSaveIssues = (value: AppSettings) => {
  const normalized = normalizeAppSettings(value);
  const hasAnyRedClawField = Boolean(normalized.aiModel || normalized.aiEndpoint || normalized.aiApiKey);
  const issues: string[] = [];

  if (!hasAnyRedClawField) {
    return issues;
  }

  if (!normalized.aiModel) {
    issues.push('Please complete the RedClaw model.');
  }
  if (!normalized.aiEndpoint) {
    issues.push('Please complete the RedClaw endpoint.');
  } else {
    try {
      const parsed = new URL(normalized.aiEndpoint);
      if (!/^https?:$/.test(parsed.protocol)) {
        issues.push('The RedClaw endpoint must start with http:// or https://.');
      }
    } catch {
      issues.push('The RedClaw endpoint must be a valid URL, for example https://api.example.com/v1.');
    }
  }
  if (!normalized.aiApiKey) {
    issues.push('Please complete the RedClaw API key.');
  }

  return issues;
};

const DEFAULT_CAPTURE: CaptureForm = {
  title: '',
  sourceUrl: '',
  description: '',
  tagsText: '',
};

const DEFAULT_DRAFT: SubjectDraft = {
  id: '',
  name: '',
  categoryId: '',
  description: '',
  tagsText: '',
  attributes: [],
};

const EMPTY_RUNTIME: RuntimeState = {
  sessionId: '',
  isProcessing: false,
  partialResponse: '',
  updatedAt: 0,
};

const EMPTY_CONTEXT: ContextUsage = {
  sessionId: '',
  contextType: '',
  messageCount: 0,
  estimatedTotalTokens: 0,
  activeHistoryTokens: 0,
  embeddedPromptTokens: 0,
  compactThreshold: 24000,
  compactRatio: 0,
};

const DEFAULT_SCHEDULED_TASK_FORM: ScheduledTaskForm = {
  name: '',
  mode: 'interval',
  prompt: '',
  projectId: '',
  intervalMinutes: '1440',
  time: '09:00',
  weekdays: [1],
  runAt: '',
  maxRetries: '0',
  retryDelayMinutes: '30',
};

const DEFAULT_LONG_CYCLE_FORM: LongCycleTaskForm = {
  name: '',
  objective: '',
  stepPrompt: '',
  projectId: '',
  intervalMinutes: '1440',
  totalRounds: '7',
  maxRetries: '0',
  retryDelayMinutes: '30',
};

const DEFAULT_RUNNER_CONFIG: RunnerConfigForm = {
  intervalMinutes: '30',
  maxProjectsPerTick: '1',
  maxAutomationPerTick: '1',
  keepAliveWhenNoWindow: false,
  heartbeatEnabled: false,
  heartbeatIntervalMinutes: '180',
  heartbeatSuppressEmptyReport: true,
  heartbeatReportToMainSession: false,
  heartbeatPrompt: '',
};

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

const readMap = (key: string): Record<string, string> => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
};

const writeMap = (key: string, value: Record<string, string>) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const getTheme = (): ThemeMode =>
  String(window.localStorage.getItem(THEME_KEY) || '').toLowerCase() === 'dark' ? 'dark' : 'light';

const applyTheme = (mode: ThemeMode) => {
  window.localStorage.setItem(THEME_KEY, mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.style.colorScheme = mode;
  document.documentElement.setAttribute('data-theme', mode);
};

const splitTags = (value: string) =>
  value
    .split(/[\n,\s\uFF0C\u3001]+/)
    .map((item) => item.trim().replace(/^#/, ''))
    .filter(Boolean);

const parsePositiveInt = (value: string, fallback: number) => Math.max(1, Number(value || '0') || fallback);
const parseNonNegativeInt = (value: string, fallback: number) => Math.max(0, Number(value || '0') || fallback);

const toTimestamp = (value?: string | number | null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (!value) {
    return Date.now();
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const timeAgo = (value?: string | number | null) => {
  const diffMinutes = Math.max(1, Math.round((Date.now() - toTimestamp(value)) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  if (diffMinutes < 1440) {
    return `${Math.round(diffMinutes / 60)} hr ago`;
  }
  return `${Math.round(diffMinutes / 1440)} d ago`;
};

const timeUntil = (value?: string | number | null) => {
  const diffMinutes = Math.round((toTimestamp(value) - Date.now()) / 60000);
  if (diffMinutes <= 0) {
    return 'Due now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }
  if (diffMinutes < 1440) {
    return `${Math.round(diffMinutes / 60)} hr`;
  }
  return `${Math.round(diffMinutes / 1440)} d`;
};

const formatDateTime = (value?: string | number | null) =>
  value ? new Date(toTimestamp(value)).toLocaleString('zh-CN', { hour12: false }) : 'Not set';

const scheduledModeLabel = (mode: ScheduledTaskRecord['mode']) =>
  ({ interval: 'Interval', daily: 'Daily', weekly: 'Weekly', once: 'One-time' })[mode];

const scheduledTaskSummary = (task: ScheduledTaskRecord) => {
  if (task.mode === 'interval') {
    return `Every ${task.intervalMinutes || 0} min`;
  }
  if (task.mode === 'daily') {
    return `Daily ${task.time || '--:--'}`;
  }
  if (task.mode === 'weekly') {
    const weekdayText = (task.weekdays || [])
      .map((value) => WEEKDAY_OPTIONS.find((item) => item.value === value)?.label || `Day ${value}`)
      .join(' / ');
    return `Weekly ${weekdayText || 'Not set'} ${task.time || '--:--'}`;
  }
  return `One-time ${formatDateTime(task.runAt)}`;
};

const describeScheduledTaskForm = (form: ScheduledTaskForm) => {
  if (form.mode === 'interval') {
    return `Every ${parsePositiveInt(form.intervalMinutes, 1440)} min`;
  }
  if (form.mode === 'daily') {
    return `Daily ${form.time || '--:--'}`;
  }
  if (form.mode === 'weekly') {
    const weekdayText = form.weekdays
      .map((value) => WEEKDAY_OPTIONS.find((item) => item.value === value)?.label || `Day ${value}`)
      .join(' / ');
    return `Weekly ${weekdayText || 'No weekdays selected'} ${form.time || '--:--'}`;
  }
  return form.runAt ? `One-time ${formatDateTime(form.runAt)}` : 'One-time run time not set';
};

const getScheduledTaskFormIssues = (form: ScheduledTaskForm) => {
  const issues: string[] = [];
  if (!form.name.trim()) {
    issues.push('Add a task name.');
  }
  if (!form.prompt.trim()) {
    issues.push('Add a task prompt.');
  }
  if ((form.mode === 'daily' || form.mode === 'weekly') && !form.time) {
    issues.push('Choose a run time.');
  }
  if (form.mode === 'weekly' && !form.weekdays.length) {
    issues.push('Pick at least one weekday.');
  }
  if (form.mode === 'once' && !form.runAt) {
    issues.push('Choose the run date and time.');
  }
  return issues;
};

const describeLongCycleTaskForm = (form: LongCycleTaskForm) =>
  `Every ${parsePositiveInt(form.intervalMinutes, 1440)} min for ${parsePositiveInt(form.totalRounds, 7)} rounds`;

const getLongCycleTaskFormIssues = (form: LongCycleTaskForm) => {
  const issues: string[] = [];
  if (!form.name.trim()) {
    issues.push('Add a task name.');
  }
  if (!form.objective.trim()) {
    issues.push('Add an objective.');
  }
  if (!form.stepPrompt.trim()) {
    issues.push('Add the step prompt.');
  }
  return issues;
};

const formatDateTimeLocalInput = (value?: string | number | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(toTimestamp(value));
  const pad = (item: number) => String(item).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const buildBrief = (subject: SubjectRecord, categoryName: string) =>
  [
    `# ${subject.name}`,
    '',
    '## Creation Goal',
    'Use the information below to produce a Xiaohongshu draft that can be edited and published.',
    '',
    `- Subject: ${subject.name}`,
    `- Category: ${categoryName || 'Uncategorized'}`,
    `- Summary: ${subject.description || 'Add the angle, audience, and expected outcome first.'}`,
    subject.tags.length ? `- Tags: ${subject.tags.map((item) => `#${item}`).join(' ')}` : '',
    ...subject.attributes.map((item) => `- ${item.key}: ${item.value}`),
    '',
    '- Include a title, body structure, closing CTA, and recommended tags.',
    '- Do not leave placeholders and do not output unrelated meta commentary.',
  ]
    .filter(Boolean)
    .join('\n');

const buildContextId = (spaceName: string, subject: SubjectRecord, manuscriptPath: string) =>
  ['redclaw', spaceName || 'default', subject.id, manuscriptPath || subject.name]
    .join('::')
    .replace(/[\\/ ]+/g, '-');

const manuscriptParentPath = (path: string) => {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const lastSlashIndex = normalized.lastIndexOf('/');
  return lastSlashIndex === -1 ? '' : normalized.slice(0, lastSlashIndex);
};

const manuscriptStem = (path: string) => {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const fileName = normalized.slice(normalized.lastIndexOf('/') + 1);
  return fileName.replace(/\.[^.]+$/, '').trim();
};

const previewUrl = (subject: SubjectRecord) => {
  const raw = subject.primaryPreviewUrl || subject.previewUrls?.[0] || '';
  return coerceToLocalAssetUrl(raw) || raw;
};

export default function App() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const backupFileRef = useRef<HTMLInputElement | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(getTheme);
  const [view, setView] = useState<StudioView>('overview');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [settingsConnectionStatus, setSettingsConnectionStatus] = useState<SettingsConnectionStatus | null>(null);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [appVersion, setAppVersion] = useState('0.1.0');
  const [spaceName, setSpaceName] = useState('Default');
  const [pluginStatus, setPluginStatus] = useState<PluginStatus>({});
  const [debugStatus, setDebugStatus] = useState<DebugStatus>({ enabled: false, logDirectory: '' });
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const [runnerStatus, setRunnerStatus] = useState<RedClawRunnerStatus>({});
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTaskRecord[]>([]);
  const [longCycleTasks, setLongCycleTasks] = useState<LongCycleTaskRecord[]>([]);
  const [outputArchive, setOutputArchive] = useState<OutputArchiveRecord[]>([]);
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [categories, setCategories] = useState<SubjectCategory[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  const [captureForm, setCaptureForm] = useState(DEFAULT_CAPTURE);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [selectedId, setSelectedId] = useState('');
  const [editingNew, setEditingNew] = useState(false);
  const [search, setSearch] = useState('');
  const [archiveQuery, setArchiveQuery] = useState('');
  const [archiveSourceFilter, setArchiveSourceFilter] = useState<OutputArchiveSourceFilter>('all');
  const [archiveDraftStrategyFilter, setArchiveDraftStrategyFilter] = useState<DraftStrategyFilter>('all');
  const [recentOutputDraftStrategyFilter, setRecentOutputDraftStrategyFilter] = useState<DraftStrategyFilter>('all');

  const [manuscriptLinks, setManuscriptLinks] = useState<Record<string, string>>(() => readMap(MANUSCRIPT_KEY));
  const [sessionLinks, setSessionLinks] = useState<Record<string, string>>(() => readMap(SESSION_KEY));
  const [manuscriptPath, setManuscriptPath] = useState('');
  const [manuscriptContent, setManuscriptContent] = useState('');
  const [redClawFollowUpPrompt, setRedClawFollowUpPrompt] = useState('');
  const [messages, setMessages] = useState<Array<ChatMessage & { displayContent?: string; display_content?: string }>>([]);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>(EMPTY_RUNTIME);
  const [contextUsage, setContextUsage] = useState<ContextUsage>(EMPTY_CONTEXT);
  const [scheduledTaskForm, setScheduledTaskForm] = useState(DEFAULT_SCHEDULED_TASK_FORM);
  const [longCycleForm, setLongCycleForm] = useState(DEFAULT_LONG_CYCLE_FORM);
  const [editingScheduledTaskId, setEditingScheduledTaskId] = useState('');
  const [editingLongCycleTaskId, setEditingLongCycleTaskId] = useState('');
  const [runnerConfigForm, setRunnerConfigForm] = useState(DEFAULT_RUNNER_CONFIG);
  const [projectAutomationDrafts, setProjectAutomationDrafts] = useState<Record<string, ProjectAutomationDraft>>({});

  const categoryNameMap = new Map(categories.map((item) => [item.id, item.name]));
  const subjectMap = new Map(subjects.map((item) => [item.id, item]));
  const subjectNameMap = new Map(subjects.map((item) => [item.id, item.name]));
  const activeSubject = editingNew ? null : subjects.find((item) => item.id === selectedId) || null;
  const linkedPath = activeSubject ? manuscriptLinks[activeSubject.id] || '' : '';
  const linkedSession = activeSubject ? sessionLinks[activeSubject.id] || '' : '';
  const brief = activeSubject ? buildBrief(activeSubject, categoryNameMap.get(activeSubject.categoryId || '') || '') : '';
  const visibleSubjects = subjects.filter((item) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [item.name, item.description || '', item.tags.join(' ')].join('\n').toLowerCase().includes(query);
  });

  const normalizedSettings = normalizeAppSettings(settings);
  const settingsSaveIssues = getAppSettingsSaveIssues(settings);
  const hasCompleteRedClawConfig = Boolean(normalizedSettings.aiModel && normalizedSettings.aiEndpoint && normalizedSettings.aiApiKey);
  const redClawReady = hasCompleteRedClawConfig && !settingsSaveIssues.length;
  const launchBlockers = [
    !hasCompleteRedClawConfig ? 'Complete the RedClaw model, endpoint, and API key first.' : '',
    ...settingsSaveIssues,
    !subjects.length ? 'Create at least one subject so the workspace has a reusable creation entry.' : '',
    (runnerStatus.contentPackSections || 0) <= 0 ? 'The embedded content pack is not loaded yet, so this build is not release-ready.' : '',
  ].filter(Boolean);
  const launchWarnings = [
    !settingsConnectionStatus ? 'Run one real AI connection test before shipping.' : '',
    settingsConnectionStatus?.tone === 'warning' ? `Latest AI connection test failed: ${settingsConnectionStatus.detail}` : '',
    !pluginStatus.bridgeDirectory ? 'The browser bridge folder is not prepared yet. Manual capture and local import still work.' : '',
    !normalizedSettings.exportDirectory ? 'No custom export directory is set. The desktop app will fall back to the workspace directory.' : '',
  ].filter(Boolean);
  const launchChecklist = [
    {
      id: 'ai-settings',
      done: redClawReady,
      title: 'RedClaw direct config',
      detail: redClawReady
        ? `${normalizedSettings.aiModel} - ${normalizedSettings.aiEndpoint}`
        : 'Model, endpoint, and API key still need to be completed and verified.',
    },
    {
      id: 'ai-test',
      done: settingsConnectionStatus?.tone === 'success',
      title: 'Model connection test',
      detail: settingsConnectionStatus
        ? `${settingsConnectionStatus.detail}${settingsConnectionStatus.latencyMs ? ` - ${settingsConnectionStatus.latencyMs} ms` : ''}`
        : 'Run a real API connection test before release to confirm the key, route, and model all work.',
    },
    {
      id: 'content-pack',
      done: (runnerStatus.contentPackSections || 0) > 0,
      title: 'Embedded content pack',
      detail:
        (runnerStatus.contentPackSections || 0) > 0
          ? `${runnerStatus.contentPackName || 'embedded-xhsspec'} loaded with ${runnerStatus.contentPackSections || 0} sections.`
          : 'No embedded content pack is available yet.',
    },
    {
      id: 'subject-library',
      done: subjects.length > 0,
      title: 'Subject library',
      detail: subjects.length ? `There are already ${subjects.length} subjects ready for Manuscripts / RedClaw.` : 'Create at least one subject first.',
    },
    {
      id: 'release-flow',
      done: true,
      title: 'GitHub release flow',
      detail: 'Desktop validation, bundling, and installer publishing all run through GitHub Actions.',
    },
  ];
  const compactPercent = Math.min(100, Math.round((contextUsage.compactRatio || 0) * 100));
  const runnerProjectStates = runnerStatus.projectStates || {};
  const runnerConfigurationIssues = Array.from(new Set([...(settingsSaveIssues || []), ...((runnerStatus.configurationIssues as string[] | undefined) || [])]));
  const automationActivities = activities.filter((item) => (item.kind || '').startsWith('redclaw'));
  const automationWarnings = automationActivities.filter((item) => item.tone === 'warning').slice(0, 3);
  const latestAutomationActivity = automationActivities[0] || null;
  const toScheduledAutomationOutput = (task: ScheduledTaskRecord): AutomationOutputRecord | null => {
    if (!task.lastSavedManuscriptPath) {
      return null;
    }

    return {
      id: `scheduled:${task.id}`,
      taskKind: 'scheduled',
      taskName: task.name,
      draftStrategy: task.lastDraftStrategy,
      projectId: task.projectId,
      projectName: task.projectId ? subjectNameMap.get(task.projectId) || task.projectId : undefined,
      manuscriptPath: task.lastSavedManuscriptPath,
      referenceManuscriptPath: task.lastReferenceManuscriptPath,
      sourceTitle: task.name,
      sessionId: task.lastSessionId,
      lastRunAt: task.lastRunAt,
      updatedAt: task.updatedAt,
      lastResult: task.lastResult,
    };
  };
  const toLongCycleAutomationOutput = (task: LongCycleTaskRecord): AutomationOutputRecord | null => {
    if (!task.lastSavedManuscriptPath) {
      return null;
    }

    return {
      id: `long-cycle:${task.id}`,
      taskKind: 'longCycle',
      taskName: task.name,
      draftStrategy: task.lastDraftStrategy,
      projectId: task.projectId,
      projectName: task.projectId ? subjectNameMap.get(task.projectId) || task.projectId : undefined,
      manuscriptPath: task.lastSavedManuscriptPath,
      referenceManuscriptPath: task.lastReferenceManuscriptPath,
      sourceTitle: task.name,
      sessionId: task.lastSessionId,
      lastRunAt: task.lastRunAt,
      updatedAt: task.updatedAt,
      lastResult: task.lastResult,
    };
  };
  const automationOutputHistory = [...scheduledTasks.map(toScheduledAutomationOutput), ...longCycleTasks.map(toLongCycleAutomationOutput)]
    .filter((item): item is AutomationOutputRecord => Boolean(item))
    .sort((left, right) => toTimestamp(right.lastRunAt || right.updatedAt) - toTimestamp(left.lastRunAt || left.updatedAt));
  const canOpenOutputInStudio = (value?: string | { projectId?: string }) => {
    const projectId = typeof value === 'string' ? value : value?.projectId;
    return Boolean(projectId && subjectNameMap.has(projectId));
  };
  const canReconnectOutputSession = (value?: { projectId?: string; sessionId?: string }) =>
    Boolean(value?.sessionId && canOpenOutputInStudio(value));
  const describeOutputSourceKind = (sourceKind: OutputArchiveRecord['sourceKind']) =>
    sourceKind === 'manual' ? 'Manual generation' : sourceKind === 'scheduled' ? 'Scheduled task' : 'Long-cycle task';
  const describeOutputMode = (sourceKind: OutputArchiveRecord['sourceKind']) => (sourceKind === 'manual' ? 'Manual' : 'Automation');
  const normalizeDraftStrategy = (draftStrategy?: DraftStrategy): DraftStrategy => draftStrategy || 'fresh';
  const describeDraftStrategy = (draftStrategy?: DraftStrategy) =>
    normalizeDraftStrategy(draftStrategy) === 'continue'
      ? 'Continue and overwrite'
      : normalizeDraftStrategy(draftStrategy) === 'rewrite'
        ? 'Rewrite as branch'
        : 'Fresh draft';
  const matchesDraftStrategyFilter = (draftStrategy: DraftStrategy | undefined, filter: DraftStrategyFilter) =>
    filter === 'all' || normalizeDraftStrategy(draftStrategy) === filter;
  const countDraftStrategies = (items: Array<{ draftStrategy?: DraftStrategy }>): Record<DraftStrategyFilter, number> => ({
    all: items.length,
    fresh: items.filter((item) => normalizeDraftStrategy(item.draftStrategy) === 'fresh').length,
    continue: items.filter((item) => normalizeDraftStrategy(item.draftStrategy) === 'continue').length,
    rewrite: items.filter((item) => normalizeDraftStrategy(item.draftStrategy) === 'rewrite').length,
  });
  const describeDraftStrategyDetail = (output: {
    draftStrategy?: DraftStrategy;
    manuscriptPath: string;
    referenceManuscriptPath?: string;
  }) => {
    const normalizedDraftStrategy = normalizeDraftStrategy(output.draftStrategy);
    if (normalizedDraftStrategy === 'rewrite') {
      return output.referenceManuscriptPath
        ? `Reference manuscript: ${output.referenceManuscriptPath}`
        : 'This draft was rewritten into a new branch from an earlier manuscript.';
    }
    if (normalizedDraftStrategy === 'continue') {
      return `Overwrite target: ${output.referenceManuscriptPath || output.manuscriptPath}`;
    }
    return 'This draft was generated from scratch.';
  };
  const outputDisplayTitle = (output: OutputArchiveRecord | AutomationOutputRecord) =>
    ('title' in output ? output.title : output.taskName) || 'Untitled draft';
  const normalizedArchiveQuery = archiveQuery.trim().toLowerCase();
  const archiveFilterBase = outputArchive.filter((item) => {
    if (archiveSourceFilter !== 'all' && item.sourceKind !== archiveSourceFilter) {
      return false;
    }
    if (!normalizedArchiveQuery) {
      return true;
    }
    return [item.title, item.sourceTitle || '', item.projectName || '', item.summary || '', item.manuscriptPath, item.referenceManuscriptPath || '', describeDraftStrategy(item.draftStrategy)]
      .join('\n')
      .toLowerCase()
      .includes(normalizedArchiveQuery);
  });
  const archiveDraftStrategyCounts = countDraftStrategies(archiveFilterBase);
  const visibleOutputArchive = archiveFilterBase.filter((item) => matchesDraftStrategyFilter(item.draftStrategy, archiveDraftStrategyFilter));
  const canBulkClearVisibleArchive = !normalizedArchiveQuery && archiveDraftStrategyFilter === 'all';
  const recentAutomationOutputMatches = automationOutputHistory.filter((item) =>
    matchesDraftStrategyFilter(item.draftStrategy, recentOutputDraftStrategyFilter),
  );
  const recentAutomationOutputCounts = countDraftStrategies(automationOutputHistory);
  const recentAutomationOutputs = recentAutomationOutputMatches.slice(0, 8);
  const manualOutputArchiveCount = outputArchive.filter((item) => item.sourceKind === 'manual').length;
  const automatedOutputArchiveCount = outputArchive.length - manualOutputArchiveCount;
  const activeSubjectOutputArchive = activeSubject
    ? outputArchive.filter((item) => item.projectId === activeSubject.id).slice(0, 6)
    : [];
  const activeSubjectLatestOutput = activeSubjectOutputArchive[0] || null;
  const activeSubjectRecoverableOutput = activeSubjectOutputArchive.find((item) => canReconnectOutputSession(item)) || null;
  const activeSubjectWorkingPath = manuscriptPath || linkedPath || '';
  const hasActiveSubjectWorkingPath = Boolean(activeSubjectWorkingPath.trim());
  const canSendRedClawFollowUp = Boolean(
    activeSubject && linkedSession && hasActiveSubjectWorkingPath && redClawReady && !runtimeState.isProcessing,
  );
  const redClawFollowUpHint = !linkedSession
    ? activeSubjectRecoverableOutput
      ? 'Resume the latest session from the workflow guide above, then continue the same draft here.'
      : 'Open the manuscript in RedClaw first, then send follow-up instructions here.'
    : !hasActiveSubjectWorkingPath
      ? 'Create or reopen the manuscript before sending a follow-up request.'
      : runtimeState.isProcessing
        ? 'Wait for the current generation pass to finish before sending another follow-up instruction.'
        : !redClawReady
          ? 'Complete the RedClaw settings in Settings before continuing the session.'
          : 'Follow-up prompts revise the current manuscript in place. Use "Rewrite as new draft" when you need a new branch.';
  const scheduledSubmitBusyKey = editingScheduledTaskId ? `scheduled-save:${editingScheduledTaskId}` : 'add-scheduled';
  const longCycleSubmitBusyKey = editingLongCycleTaskId ? `long-cycle-save:${editingLongCycleTaskId}` : 'add-long-cycle';
  const redClawRecoveryNeeded = Boolean(
    runnerConfigurationIssues.length || !settingsConnectionStatus || settingsConnectionStatus?.tone === 'warning',
  );
  const failedProjectAutomation = subjects
    .map((subject) => ({ subject, state: runnerProjectStates[subject.id] }))
    .filter(({ state }) => Boolean(state && ((state.lastResult || '') === 'error' || state.lastError)))
    .slice(0, 3);
  const failedScheduledTasks = scheduledTasks
    .filter((task) => task.lastResult === 'error' || Boolean(task.lastError))
    .slice(0, 3);
  const failedLongCycleTasks = longCycleTasks
    .filter((task) => task.lastResult === 'error' || Boolean(task.lastError))
    .slice(0, 3);
  const diagnosticsRecoveryCount =
    (redClawRecoveryNeeded ? 1 : 0) +
    (runnerStatus.lastError ? 1 : 0) +
    failedProjectAutomation.length +
    failedScheduledTasks.length +
    failedLongCycleTasks.length;
  const editingScheduledTask = scheduledTasks.find((task) => task.id === editingScheduledTaskId) || null;
  const editingLongCycleTask = longCycleTasks.find((task) => task.id === editingLongCycleTaskId) || null;
  const editingScheduledOutput = editingScheduledTask ? toScheduledAutomationOutput(editingScheduledTask) : null;
  const editingLongCycleOutput = editingLongCycleTask ? toLongCycleAutomationOutput(editingLongCycleTask) : null;
  const scheduledEditorSubject = scheduledTaskForm.projectId ? subjectMap.get(scheduledTaskForm.projectId) || null : null;
  const longCycleEditorSubject = longCycleForm.projectId ? subjectMap.get(longCycleForm.projectId) || null : null;
  const scheduledTaskFormIssues = getScheduledTaskFormIssues(scheduledTaskForm);
  const longCycleTaskFormIssues = getLongCycleTaskFormIssues(longCycleForm);
  const scheduledTaskFormSummary = describeScheduledTaskForm(scheduledTaskForm);
  const longCycleTaskFormSummary = describeLongCycleTaskForm(longCycleForm);
  const scheduledTaskSubjectHint = !scheduledTaskForm.projectId
    ? subjects.length
      ? 'Link a subject to keep generated manuscripts attached to the library workflow.'
      : 'Create a subject in Library first if this automation should stay attached to the manuscript workspace.'
    : '';
  const longCycleTaskSubjectHint = !longCycleForm.projectId
    ? subjects.length
      ? 'Link a subject so each round stays attached to the same library workspace.'
      : 'Create a subject in Library first if this loop should build against a reusable manuscript.'
    : '';
  const canSubmitScheduledTask = !scheduledTaskFormIssues.length;
  const canSubmitLongCycleTask = !longCycleTaskFormIssues.length;
  const getProjectAutomationDraft = (subjectId: string): ProjectAutomationDraft =>
    projectAutomationDrafts[subjectId] || {
      enabled: runnerProjectStates[subjectId]?.enabled ?? true,
      prompt: runnerProjectStates[subjectId]?.prompt || '',
    };

  const patchProjectAutomationDraft = (subjectId: string, patch: Partial<ProjectAutomationDraft>) => {
    setProjectAutomationDrafts((current) => ({
      ...current,
      [subjectId]: {
        enabled: current[subjectId]?.enabled ?? runnerProjectStates[subjectId]?.enabled ?? true,
        prompt: current[subjectId]?.prompt ?? runnerProjectStates[subjectId]?.prompt ?? '',
        ...patch,
      },
    }));
  };

  const toggleScheduledWeekday = (weekday: number) => {
    setScheduledTaskForm((current) => {
      const hasWeekday = current.weekdays.includes(weekday);
      const weekdays = hasWeekday
        ? current.weekdays.filter((item) => item !== weekday)
        : [...current.weekdays, weekday].sort((left, right) => left - right);
      return { ...current, weekdays };
    });
  };

  const resetScheduledTaskEditor = () => {
    setEditingScheduledTaskId('');
    setScheduledTaskForm({
      ...DEFAULT_SCHEDULED_TASK_FORM,
      projectId: activeSubject?.id || '',
    });
  };

  const resetLongCycleEditor = () => {
    setEditingLongCycleTaskId('');
    setLongCycleForm({
      ...DEFAULT_LONG_CYCLE_FORM,
      projectId: activeSubject?.id || '',
    });
  };

  const startEditingScheduledTask = (task: ScheduledTaskRecord) => {
    resetLongCycleEditor();
    setEditingScheduledTaskId(task.id);
    setScheduledTaskForm({
      name: task.name,
      mode: task.mode,
      prompt: task.prompt,
      projectId: task.projectId || '',
      intervalMinutes: String(task.intervalMinutes || 1440),
      time: task.time || '',
      weekdays: (task.weekdays || []).slice(),
      runAt: formatDateTimeLocalInput(task.runAt),
      maxRetries: String(task.maxRetries || 0),
      retryDelayMinutes: String(task.retryDelayMinutes || 30),
    });
  };

  const startEditingLongCycleTask = (task: LongCycleTaskRecord) => {
    resetScheduledTaskEditor();
    setEditingLongCycleTaskId(task.id);
    setLongCycleForm({
      name: task.name,
      objective: task.objective,
      stepPrompt: task.stepPrompt,
      projectId: task.projectId || '',
      intervalMinutes: String(task.intervalMinutes || 1440),
      totalRounds: String(task.totalRounds || 7),
      maxRetries: String(task.maxRetries || 0),
      retryDelayMinutes: String(task.retryDelayMinutes || 30),
    });
  };

  const rememberManuscript = (subjectId: string, path: string) => {
    setManuscriptLinks((current) => {
      const next = { ...current, [subjectId]: path };
      writeMap(MANUSCRIPT_KEY, next);
      return next;
    });
  };

  const rememberSession = (subjectId: string, sessionId: string) => {
    setSessionLinks((current) => {
      const next = { ...current, [subjectId]: sessionId };
      writeMap(SESSION_KEY, next);
      return next;
    });
  };

  const applyWorkspaceBackupClientState = (clientState?: Partial<WorkspaceBackupClientState>) => {
    const nextManuscriptLinks = { ...(clientState?.manuscriptLinks || {}) };
    const nextSessionLinks = { ...(clientState?.sessionLinks || {}) };
    writeMap(MANUSCRIPT_KEY, nextManuscriptLinks);
    writeMap(SESSION_KEY, nextSessionLinks);
    setManuscriptLinks(nextManuscriptLinks);
    setSessionLinks(nextSessionLinks);
  };

  const readManuscriptFile = async (path: string) =>
    (await window.ipcRenderer.invoke('manuscripts:read', { path })) as ManuscriptReadResult;

  const loadManuscriptIntoStudio = async (path: string) => {
    const result = await readManuscriptFile(path);
    const normalizedPath = result.path || path;
    setManuscriptPath(normalizedPath);
    setManuscriptContent(result.content || '');
    return { ...result, path: normalizedPath };
  };

  const load = async () => {
    const [version, rawSettings, spaces, plugin, debug, debugRecent, runner, scheduled, longCycle, outputArchiveRes, captureRes, subjectRes, categoryRes, activityRes] =
      await Promise.all([
        window.ipcRenderer.getAppVersion(),
        window.ipcRenderer.getSettings(),
        window.ipcRenderer.invoke('spaces:list'),
        window.ipcRenderer.browserPlugin.getStatus(),
        window.ipcRenderer.debug.getStatus(),
        window.ipcRenderer.debug.getRecent(10),
        window.ipcRenderer.redclawRunner.getStatus(),
        window.ipcRenderer.redclawRunner.listScheduled(),
        window.ipcRenderer.redclawRunner.listLongCycle(),
        window.ipcRenderer.redclawRunner.listOutputArchive(),
        window.ipcRenderer.invoke('captures:list'),
        window.ipcRenderer.subjects.list(),
        window.ipcRenderer.subjects.categories.list(),
        window.ipcRenderer.invoke('activity:list'),
      ] as const);

    const spacePayload = spaces as {
      activeSpaceId?: string;
      spaces?: Array<{ id: string; name: string }>;
    };

    setAppVersion(version || '0.1.0');
    setSettings(normalizeAppSettings({ ...DEFAULT_SETTINGS, ...((rawSettings as Record<string, string>) || {}) }));
    setSpaceName(spacePayload.spaces?.find((item) => item.id === spacePayload.activeSpaceId)?.name || 'Default');
    setPluginStatus((plugin as PluginStatus) || {});
    setDebugStatus({ enabled: true, ...((debug as Partial<DebugStatus>) || {}) });
    setDebugLines((((debugRecent as { lines?: string[] }) || {}).lines || []).slice());
    setRunnerStatus((runner as RedClawRunnerStatus) || {});
    setScheduledTasks((((scheduled as { tasks?: ScheduledTaskRecord[] }) || {}).tasks || []).slice());
    setLongCycleTasks((((longCycle as { tasks?: LongCycleTaskRecord[] }) || {}).tasks || []).slice());
    setOutputArchive((((outputArchiveRes as { items?: OutputArchiveRecord[] }) || {}).items || []).slice());
    setCaptures((((captureRes as { captures?: CaptureRecord[] }) || {}).captures || []).slice());
    setSubjects((((subjectRes as { subjects?: SubjectRecord[] }) || {}).subjects || []).slice());
    setCategories((((categoryRes as { categories?: SubjectCategory[] }) || {}).categories || []).slice());
    setActivities((((activityRes as { activities?: ActivityRecord[] }) || {}).activities || []).slice());
  };

  const refreshSessionInsights = async (sessionId = linkedSession, quiet = false) => {
    if (!sessionId) {
      setMessages([]);
      setRuntimeState(EMPTY_RUNTIME);
      setContextUsage(EMPTY_CONTEXT);
      return;
    }

    try {
      const [nextMessages, nextRuntime, nextUsage] = await Promise.all([
        window.ipcRenderer.chat.getMessages(sessionId),
        window.ipcRenderer.chat.getRuntimeState(sessionId),
        window.ipcRenderer.chat.getContextUsage(sessionId),
      ]);

      setMessages((nextMessages as Array<ChatMessage & { displayContent?: string; display_content?: string }>) || []);
      setRuntimeState({ ...EMPTY_RUNTIME, ...((nextRuntime as Partial<RuntimeState>) || {}) });
      setContextUsage({ ...EMPTY_CONTEXT, ...((nextUsage as Partial<ContextUsage>) || {}) });
    } catch (error) {
      if (!quiet) {
        setNotice({ tone: 'warning', text: String(error) });
      }
    }
  };

  const runAction = async (token: string, task: () => Promise<void>) => {
    setBusy(token);
    try {
      await task();
    } catch (error) {
      setNotice({ tone: 'warning', text: String(error) });
    } finally {
      setBusy('');
    }
  };

  const handleOpenExternalResource = async (token: string, url: string, successText: string, label: string) => {
    await runAction(token, async () => {
      const result = (await window.ipcRenderer.openExternalUrl(url)) as {
        success?: boolean;
        error?: string;
        url?: string;
      };

      if (result?.success === false) {
        throw new Error(result.error || `Failed to open ${label}.`);
      }

      setNotice({ tone: 'success', text: successText });
    });
  };

  const handleOpenGitHubReleases = async () =>
    handleOpenExternalResource('open-releases', RELEASES_URL, 'Opened GitHub Releases.', 'GitHub Releases');

  const handleOpenLaunchChecklist = async () =>
    handleOpenExternalResource(
      'open-launch-checklist',
      LAUNCH_CHECKLIST_URL,
      'Opened the desktop launch checklist.',
      'the desktop launch checklist',
    );

  const handleOpenReleaseFlow = async () =>
    handleOpenExternalResource(
      'open-release-flow',
      RELEASE_FLOW_URL,
      'Opened the desktop release flow documentation.',
      'the desktop release flow documentation',
    );

  const handleOpenRepository = async () =>
    handleOpenExternalResource('open-repository', REPOSITORY_URL, 'Opened the project repository.', 'the project repository');

  const handleOpenContributingGuide = async () =>
    handleOpenExternalResource(
      'open-contributing',
      CONTRIBUTING_URL,
      'Opened the contribution guide.',
      'the contribution guide',
    );

  const handleOpenSecurityPolicy = async () =>
    handleOpenExternalResource(
      'open-security',
      SECURITY_POLICY_URL,
      'Opened the security policy.',
      'the security policy',
    );

  const handleOpenIssueTracker = async () =>
    handleOpenExternalResource('open-issues', ISSUE_TRACKER_URL, 'Opened the GitHub issue forms.', 'the GitHub issue forms');

  const refreshAll = async () => {
    await runAction('refresh', async () => {
      await Promise.all([load(), refreshSessionInsights(linkedSession, true)]);
      setNotice({ tone: 'success', text: 'Workspace refreshed.' });
    });
  };

  const handleSaveSettings = async () => {
    const nextSettings = normalizeAppSettings(settings);
    const issues = getAppSettingsSaveIssues(nextSettings);
    const readyAfterSave = Boolean(nextSettings.aiModel && nextSettings.aiEndpoint && nextSettings.aiApiKey) && !issues.length;
    if (issues.length) {
      setNotice({ tone: 'warning', text: issues[0] });
      return;
    }

    try {
      setSettings(nextSettings);
      await window.ipcRenderer.saveSettings(nextSettings);
      await load();
      setNotice({
        tone: 'success',
        text: readyAfterSave ? 'RedClaw settings saved. You can test the connection now.' : 'Settings saved.',
      });
    } catch (error) {
      setNotice({ tone: 'warning', text: String(error) });
    }
  };

  const handleTestRedClawConnection = async () => {
    const nextSettings = normalizeAppSettings(settings);
    const issues = getAppSettingsSaveIssues(nextSettings);
    if (issues.length) {
      setNotice({ tone: 'warning', text: issues[0] });
      return;
    }

    setSettings(nextSettings);
    await runAction('settings-test', async () => {
      const result = (await window.ipcRenderer.redclawRunner.testConfig(nextSettings)) as {
        success?: boolean;
        error?: string;
        resolvedEndpoint?: string;
        model?: string;
        reply?: string;
        latencyMs?: number;
      };

      if (!result.success) {
        setSettingsConnectionStatus({
          tone: 'warning',
          title: 'Connection test failed',
          detail: result.error || 'RedClaw connection test failed.',
          checkedAt: Date.now(),
          resolvedEndpoint: result.resolvedEndpoint,
          model: result.model,
          latencyMs: result.latencyMs,
          reply: result.reply,
        });
        throw new Error(result.error || 'RedClaw connection test failed.');
      }

      const detail = `Connected to ${result.model || nextSettings.aiModel} - ${result.resolvedEndpoint || nextSettings.aiEndpoint}`;
      setSettingsConnectionStatus({
        tone: 'success',
        title: 'Connection test passed',
        detail,
        checkedAt: Date.now(),
        resolvedEndpoint: result.resolvedEndpoint || nextSettings.aiEndpoint,
        model: result.model || nextSettings.aiModel,
        latencyMs: result.latencyMs,
        reply: result.reply,
      });
      setNotice({
        tone: 'success',
        text: result.reply ? `RedClaw connection test passed: ${result.reply}` : 'RedClaw connection test passed.',
      });
    });
  };

  const handleOpenExportDirectory = async () => {
    await runAction('open-export-directory', async () => {
      const result = (await window.ipcRenderer.openAppExportDirectory()) as {
        success?: boolean;
        error?: string;
        path?: string;
        usedFallbackDirectory?: boolean;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to open the export directory.');
      }

      setNotice({
        tone: 'success',
        text: result.usedFallbackDirectory
          ? `Opened the fallback export directory: ${result.path || 'app workspace'}`
          : `Opened the export directory: ${result.path || normalizedSettings.exportDirectory}`,
      });
    });
  };

  const handleOpenWorkspaceDirectory = async () => {
    await runAction('open-workspace-directory', async () => {
      const result = (await window.ipcRenderer.openAppWorkspaceDirectory()) as {
        success?: boolean;
        error?: string;
        path?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to open the workspace directory.');
      }

      setNotice({
        tone: 'success',
        text: `Opened the workspace directory: ${result.path || 'XHSAtelier'}`,
      });
    });
  };

  const handleExportWorkspaceBackup = async () => {
    await runAction('workspace-backup-export', async () => {
      const result = (await window.ipcRenderer.workspace.exportBackup({
        clientState: {
          manuscriptLinks,
          sessionLinks,
        },
      })) as {
        success?: boolean;
        error?: string;
        path?: string;
        counts?: Record<string, number>;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to create the workspace backup.');
      }

      setNotice({
        tone: 'success',
        text: result.path
          ? `Workspace backup saved: ${result.path}`
          : 'Workspace backup saved. Open the export folder to review the snapshot.',
      });
    });
  };

  const handleImportWorkspaceBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    const [file] = files;
    const shouldContinue = window.confirm(
      'Restore this workspace backup now? This will replace the current desktop workspace state, but it will not restore local manuscript or media files.',
    );

    if (!shouldContinue) {
      return;
    }

    void runAction('workspace-backup-import', async () => {
      const content = await file.text();
      const result = (await window.ipcRenderer.workspace.importBackup({ content })) as {
        success?: boolean;
        error?: string;
        counts?: Record<string, number>;
        clientState?: Partial<WorkspaceBackupClientState>;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to restore the workspace backup.');
      }

      resetScheduledTaskEditor();
      resetLongCycleEditor();
      setEditingNew(false);
      setSelectedId('');
      applyWorkspaceBackupClientState(result.clientState);
      await load();
      setNotice({
        tone: 'success',
        text: `Workspace backup restored. ${result.counts?.subjects || 0} subjects and ${result.counts?.captures || 0} captures are now available. Re-enter the RedClaw API key before running generation again.`,
      });
    });
  };

  const handleSaveRunnerConfig = async () => {
    await runAction('runner-config', async () => {
      const result = (await window.ipcRenderer.redclawRunner.setConfig({
        intervalMinutes: parsePositiveInt(runnerConfigForm.intervalMinutes, 30),
        keepAliveWhenNoWindow: runnerConfigForm.keepAliveWhenNoWindow,
        maxProjectsPerTick: parsePositiveInt(runnerConfigForm.maxProjectsPerTick, 1),
        maxAutomationPerTick: parsePositiveInt(runnerConfigForm.maxAutomationPerTick, 1),
        heartbeatEnabled: runnerConfigForm.heartbeatEnabled,
        heartbeatIntervalMinutes: parsePositiveInt(runnerConfigForm.heartbeatIntervalMinutes, 180),
        heartbeatSuppressEmptyReport: runnerConfigForm.heartbeatSuppressEmptyReport,
        heartbeatReportToMainSession: runnerConfigForm.heartbeatReportToMainSession,
        heartbeatPrompt: runnerConfigForm.heartbeatPrompt.trim() || undefined,
      })) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to save automation settings.');
      }

      await load();
      setNotice({ tone: 'success', text: 'Automation settings saved.' });
    });
  };

  const handleStartRunner = async () => {
    await runAction('runner-start', async () => {
      const result = (await window.ipcRenderer.redclawRunner.start({
        intervalMinutes: parsePositiveInt(runnerConfigForm.intervalMinutes, 30),
        keepAliveWhenNoWindow: runnerConfigForm.keepAliveWhenNoWindow,
        maxProjectsPerTick: parsePositiveInt(runnerConfigForm.maxProjectsPerTick, 1),
        maxAutomationPerTick: parsePositiveInt(runnerConfigForm.maxAutomationPerTick, 1),
        heartbeatEnabled: runnerConfigForm.heartbeatEnabled,
        heartbeatIntervalMinutes: parsePositiveInt(runnerConfigForm.heartbeatIntervalMinutes, 180),
        heartbeatSuppressEmptyReport: runnerConfigForm.heartbeatSuppressEmptyReport,
        heartbeatReportToMainSession: runnerConfigForm.heartbeatReportToMainSession,
        heartbeatPrompt: runnerConfigForm.heartbeatPrompt.trim() || undefined,
      })) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to start automation runner.');
      }

      await load();
      setNotice({ tone: 'success', text: 'Automation runner started.' });
    });
  };

  const handleStopRunner = async () => {
    await runAction('runner-stop', async () => {
      const result = (await window.ipcRenderer.redclawRunner.stop()) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to stop automation runner.');
      }

      await load();
      setNotice({ tone: 'success', text: 'Automation runner stopped.' });
    });
  };

  const handleSaveProjectAutomation = async (projectId: string) => {
    await runAction(`project-automation:${projectId}`, async () => {
      const draft = getProjectAutomationDraft(projectId);
      const result = (await window.ipcRenderer.redclawRunner.setProject({
        projectId,
        enabled: draft.enabled,
        prompt: draft.prompt.trim() || undefined,
      })) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to save subject automation settings.');
      }

      await load();
      setNotice({ tone: 'success', text: 'Subject automation settings saved.' });
    });
  };

  const handleSubmitScheduledTask = async () => {
    const currentTaskId = editingScheduledTaskId;
    await runAction(currentTaskId ? `scheduled-save:${currentTaskId}` : 'add-scheduled', async () => {
      if (!scheduledTaskForm.name.trim() || !scheduledTaskForm.prompt.trim()) {
        throw new Error('Please enter a scheduled task name and prompt.');
      }

      const payload: {
        name: string;
        mode: ScheduledTaskForm['mode'];
        prompt: string;
        projectId?: string;
        intervalMinutes?: number;
        time?: string;
        weekdays?: number[];
        runAt?: string;
        maxRetries?: number;
        retryDelayMinutes?: number;
        enabled?: true;
      } = {
        name: scheduledTaskForm.name.trim(),
        mode: scheduledTaskForm.mode,
        prompt: scheduledTaskForm.prompt.trim(),
        projectId: scheduledTaskForm.projectId || undefined,
        maxRetries: parseNonNegativeInt(scheduledTaskForm.maxRetries, 0),
        retryDelayMinutes: parsePositiveInt(scheduledTaskForm.retryDelayMinutes, 30),
      };
      if (!currentTaskId) {
        payload.enabled = true;
      }

      if (scheduledTaskForm.mode === 'interval') {
        payload.intervalMinutes = parsePositiveInt(scheduledTaskForm.intervalMinutes, 1440);
      }

      if (scheduledTaskForm.mode === 'daily') {
        if (!scheduledTaskForm.time) {
          throw new Error('Daily tasks require a time.');
        }
        payload.time = scheduledTaskForm.time;
      }

      if (scheduledTaskForm.mode === 'weekly') {
        if (!scheduledTaskForm.time) {
          throw new Error('Weekly tasks require a time.');
        }
        if (!scheduledTaskForm.weekdays.length) {
          throw new Error('Weekly tasks require at least one weekday.');
        }
        payload.time = scheduledTaskForm.time;
        payload.weekdays = scheduledTaskForm.weekdays.slice();
      }

      if (scheduledTaskForm.mode === 'once') {
        if (!scheduledTaskForm.runAt) {
          throw new Error('One-time tasks require a run time.');
        }
        payload.runAt = scheduledTaskForm.runAt;
      }

      const result = (currentTaskId
        ? await window.ipcRenderer.redclawRunner.updateScheduled({ taskId: currentTaskId, ...payload })
        : await window.ipcRenderer.redclawRunner.addScheduled(payload)) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || (currentTaskId ? 'Failed to update scheduled task.' : 'Failed to create scheduled task.'));
      }

      resetScheduledTaskEditor();
      await load();
      if (currentTaskId) {
        setNotice({ tone: 'success', text: 'Scheduled task updated.' });
        return;
      }
      setNotice({ tone: 'success', text: 'Scheduled task created.' });
    });
  };

  const handleSubmitLongCycleTask = async () => {
    const currentTaskId = editingLongCycleTaskId;
    await runAction(currentTaskId ? `long-cycle-save:${currentTaskId}` : 'add-long-cycle', async () => {
      if (!longCycleForm.name.trim() || !longCycleForm.objective.trim() || !longCycleForm.stepPrompt.trim()) {
        throw new Error('Please complete the long-cycle name, objective, and step prompt.');
      }

      const payload = {
        name: longCycleForm.name.trim(),
        objective: longCycleForm.objective.trim(),
        stepPrompt: longCycleForm.stepPrompt.trim(),
        projectId: longCycleForm.projectId || undefined,
        intervalMinutes: Number(longCycleForm.intervalMinutes || '0') || 1440,
        totalRounds: Number(longCycleForm.totalRounds || '0') || 7,
        maxRetries: parseNonNegativeInt(longCycleForm.maxRetries, 0),
        retryDelayMinutes: parsePositiveInt(longCycleForm.retryDelayMinutes, 30),
        ...(currentTaskId ? {} : { enabled: true }),
      };

      const result = (currentTaskId
        ? await window.ipcRenderer.redclawRunner.updateLongCycle({ taskId: currentTaskId, ...payload })
        : await window.ipcRenderer.redclawRunner.addLongCycle(payload)) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || (currentTaskId ? 'Failed to update long-cycle task.' : 'Failed to create long-cycle task.'));
      }

      resetLongCycleEditor();
      await load();
      if (currentTaskId) {
        setNotice({ tone: 'success', text: 'Long-cycle task updated.' });
        return;
      }
      setNotice({ tone: 'success', text: 'Long-cycle task created.' });
    });
  };

  const handleRunScheduledTask = async (taskId: string) => {
    await runAction(`scheduled-run:${taskId}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.runScheduledNow({ taskId })) as {
        success?: boolean;
        error?: string;
      };
      if (!result.success) {
        await load();
        throw new Error(result.error || 'Failed to run the scheduled task now.');
      }
      await load();
      if (linkedSession) {
        await refreshSessionInsights(linkedSession, true);
      }
      setNotice({ tone: 'success', text: 'Scheduled task started.' });
    });
  };

  const handleRunLongCycleTask = async (taskId: string) => {
    await runAction(`long-cycle-run:${taskId}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.runLongCycleNow({ taskId })) as {
        success?: boolean;
        error?: string;
      };
      if (!result.success) {
        await load();
        throw new Error(result.error || 'Failed to advance the long-cycle task.');
      }
      await load();
      if (linkedSession) {
        await refreshSessionInsights(linkedSession, true);
      }
      setNotice({ tone: 'success', text: 'Long-cycle task advanced.' });
    });
  };

  const handleToggleScheduledTask = async (task: ScheduledTaskRecord) => {
    await runAction(`scheduled-toggle:${task.id}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.setScheduledEnabled({
        taskId: task.id,
        enabled: !task.enabled,
      })) as { success?: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle the scheduled task.');
      }
      await load();
    });
  };

  const handleToggleLongCycleTask = async (task: LongCycleTaskRecord) => {
    await runAction(`long-cycle-toggle:${task.id}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.setLongCycleEnabled({
        taskId: task.id,
        enabled: !task.enabled,
      })) as { success?: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle the long-cycle task.');
      }
      await load();
    });
  };

  const handleRemoveScheduledTask = async (taskId: string) => {
    await runAction(`scheduled-remove:${taskId}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.removeScheduled({ taskId })) as {
        success?: boolean;
        error?: string;
      };
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove the scheduled task.');
      }
      if (editingScheduledTaskId === taskId) {
        resetScheduledTaskEditor();
      }
      await load();
    });
  };

  const handleRemoveLongCycleTask = async (taskId: string) => {
    await runAction(`long-cycle-remove:${taskId}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.removeLongCycle({ taskId })) as {
        success?: boolean;
        error?: string;
      };
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove the long-cycle task.');
      }
      if (editingLongCycleTaskId === taskId) {
        resetLongCycleEditor();
      }
      await load();
    });
  };

  const handleSaveSubject = async () => {
    await runAction('subject', async () => {
      if (!draft.name.trim()) {
        throw new Error('Please enter a subject name.');
      }

      const payload = {
        id: draft.id || undefined,
        name: draft.name.trim(),
        categoryId: draft.categoryId || undefined,
        description: draft.description.trim() || undefined,
        tags: splitTags(draft.tagsText),
        attributes: draft.attributes || [],
      };

      const result = draft.id
        ? await window.ipcRenderer.subjects.update(payload)
        : await window.ipcRenderer.subjects.create(payload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save the subject.');
      }

      await load();
      if (result.subject?.id) {
        setEditingNew(false);
        setSelectedId(result.subject.id);
      }
      setNotice({ tone: 'success', text: 'Subject saved.' });
    });
  };

  const handleExportSubject = async () => {
    if (!activeSubject) {
      return;
    }

    await runAction('export', async () => {
      const result = (await window.ipcRenderer.invoke('subjects:export-markdown', {
        id: activeSubject.id,
        openAfterExport: false,
      })) as { success?: boolean; error?: string; path?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to export Markdown.');
      }

      setNotice({ tone: 'success', text: `Markdown exported: ${result.path}` });
    });
  };

  const handleOpenOrCreateManuscript = async () => {
    if (!activeSubject) {
      return;
    }

    await runAction('manuscript', async () => {
      if (linkedPath) {
        await loadManuscriptIntoStudio(linkedPath);
        return;
      }

      const created = (await window.ipcRenderer.invoke('manuscripts:create-file', {
        parentPath: 'xhs-atelier/creation-briefs',
        name: `${activeSubject.name}-creation-brief`,
        content: brief,
      })) as { success?: boolean; error?: string; path?: string };

      if (!created.success || !created.path) {
        throw new Error(created.error || 'Failed to create the creation brief.');
      }

      rememberManuscript(activeSubject.id, created.path);
      await loadManuscriptIntoStudio(created.path);
      setNotice({ tone: 'success', text: 'Creation brief written to Manuscripts.' });
    });
  };

  const handleSaveManuscript = async () => {
    if (!manuscriptPath) {
      return;
    }

    await runAction('save-manuscript', async () => {
      const result = (await window.ipcRenderer.invoke('manuscripts:save', {
        path: manuscriptPath,
        content: manuscriptContent,
      })) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to save the manuscript.');
      }

      setNotice({ tone: 'success', text: 'Manuscript saved.' });
    });
  };

  const handleCopyBrief = async () => {
    await copyTextToClipboard(brief, 'Creation brief copied.');
  };

  const copyTextToClipboard = async (text: string, successText: string) => {
    try {
      const result = (await window.ipcRenderer.invoke('clipboard:write-html', {
        text,
      })) as { success?: boolean; error?: string };

      if (result.success === false) {
        throw new Error(result.error || 'Copy failed.');
      }

      setNotice({ tone: 'success', text: successText });
    } catch (error) {
      setNotice({ tone: 'warning', text: String(error) });
    }
  };

  const reserveManuscriptPath = async (parentPath: string, name: string) => {
    const result = (await window.ipcRenderer.invoke('manuscripts:reserve-file-path', {
      parentPath,
      name,
    })) as { success?: boolean; error?: string; path?: string };

    if (!result.success || !result.path) {
      throw new Error(result.error || 'Failed to reserve a new manuscript path.');
    }

    return result.path;
  };

  const launchRedClawAuthoring = async ({
    busyKey,
    subject,
    briefText,
    sourceTitle,
    sourcePath,
    referencePath,
    sourceContent,
    mode,
    successText,
  }: {
    busyKey: string;
    subject: SubjectRecord;
    briefText: string;
    sourceTitle?: string;
    sourcePath?: string;
    referencePath?: string;
    sourceContent?: string;
    mode: RedClawLaunchMode;
    successText: string;
  }) => {
    if (!redClawReady) {
      setView('settings');
      setNotice({ tone: 'warning', text: 'Complete the RedClaw model, endpoint, and API key in Settings first.' });
      return;
    }

    await runAction(busyKey, async () => {
      const normalizedSourcePath = String(sourcePath || '').trim();
      const normalizedReferencePath = String(referencePath || sourcePath || '').trim();
      const normalizedSourceTitle = String(sourceTitle || subject.name).trim() || subject.name;
      const normalizedSourceContent = String(sourceContent || '').trim();
      const draftStrategy: DraftStrategy = mode === 'rewrite' ? 'rewrite' : normalizedSourcePath ? 'continue' : 'fresh';
      const nextManuscriptPath =
        mode === 'rewrite' && normalizedSourcePath
          ? await reserveManuscriptPath(
              manuscriptParentPath(normalizedSourcePath),
              `${normalizedSourceTitle || manuscriptStem(normalizedSourcePath) || subject.name}-rewrite`,
            )
          : normalizedSourcePath || undefined;

      setEditingNew(false);
      setSelectedId(subject.id);
      startTransition(() => setView('library'));

      const session = await window.ipcRenderer.chat.getOrCreateContextSession({
        contextId: buildContextId(spaceName, subject, nextManuscriptPath || ''),
        contextType: 'xhs-atelier:redclaw-entry',
        title: `RedClaw / ${subject.name}`,
        initialContext: `${REDCLAW_CONTEXT}\nCurrent subject: ${subject.name}`,
      });

      if (!session?.id) {
        throw new Error('Failed to create the RedClaw session.');
      }

      rememberSession(subject.id, session.id);
      setRuntimeState({
        sessionId: session.id,
        isProcessing: true,
        partialResponse: 'RedClaw is preparing the writing request...',
        updatedAt: Date.now(),
      });

      void refreshSessionInsights(session.id, true);
      const draftDirective = normalizedSourcePath
        ? mode === 'rewrite'
          ? 'Treat the reference manuscript as source material only. Create a noticeably fresh new version for the new manuscript path above, while preserving the strongest facts, hooks, and useful structure.'
          : 'Treat the reference manuscript as the current working draft. Continue improving the same manuscript and overwrite it with the stronger next version.'
        : '';

      const packet = buildRedClawAuthoringMessage({
        platform: 'xiaohongshu',
        taskType: 'direct_write',
        brief: briefText,
        draftDirective,
        projectId: subject.id,
        sourceMode: nextManuscriptPath ? 'manuscript' : 'manual',
        draftStrategy,
        sourceTitle: normalizedSourceTitle,
        sourceManuscriptPath: nextManuscriptPath,
        referenceManuscriptPath: normalizedReferencePath || undefined,
        sourceContent: normalizedSourceContent || undefined,
      });

      const result = (await window.ipcRenderer.redclawRunner.runNow({
        sessionId: session.id,
        message: packet.content,
        displayContent: packet.displayContent,
        taskHints: packet.taskHints,
      })) as { success?: boolean; error?: string; savedManuscriptPath?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to send the draft to RedClaw.');
      }

      if (result.savedManuscriptPath) {
        rememberManuscript(subject.id, result.savedManuscriptPath);
        await loadManuscriptIntoStudio(result.savedManuscriptPath);
      }

      await Promise.all([refreshSessionInsights(session.id, true), load()]);
      setNotice({ tone: 'success', text: successText });
    });
  };

  const buildRedClawFollowUpPacket = ({
    subject,
    briefText,
    sourcePath,
    sourceContent,
    instruction,
  }: {
    subject: SubjectRecord;
    briefText: string;
    sourcePath: string;
    sourceContent: string;
    instruction: string;
  }) =>
    buildRedClawAuthoringMessage({
      platform: 'xiaohongshu',
      taskType: 'direct_write',
      brief:
        briefText.trim() ||
        `Continue refining the current Xiaohongshu manuscript for ${subject.name} and keep one clear publishable angle.`,
      draftDirective: [
        'Treat the current manuscript below as the latest working draft.',
        'Update the same manuscript path in place unless the user explicitly asks for a separate branch.',
        `Follow-up request:\n${instruction.trim()}`,
      ].join('\n\n'),
      projectId: subject.id,
      sourceMode: 'manuscript',
      draftStrategy: 'continue',
      sourceTitle: subject.name,
      sourceManuscriptPath: sourcePath,
      referenceManuscriptPath: sourcePath,
      sourceContent: sourceContent.trim() || undefined,
    });

  const handleGenerateOutputWithRedClaw = async (
    output: OutputArchiveRecord | AutomationOutputRecord,
    mode: RedClawLaunchMode,
  ) => {
    const subjectId = output.projectId || '';
    const subject = subjectMap.get(subjectId);
    if (!subject) {
      setNotice({ tone: 'warning', text: 'This manuscript is not linked to an existing subject yet, so RedClaw generation cannot start from here.' });
      return;
    }

    try {
      const source = await readManuscriptFile(output.manuscriptPath);
      const resolvedPath = source.path || output.manuscriptPath;
      const sourceTitle = output.sourceTitle || outputDisplayTitle(output) || subject.name;
      const briefText = buildBrief(subject, categoryNameMap.get(subject.categoryId || '') || '');

      await launchRedClawAuthoring({
        busyKey: `output-redclaw-${mode}:${output.id}`,
        subject,
        briefText,
        sourceTitle,
        sourcePath: resolvedPath,
        sourceContent: source.content || '',
        mode,
        successText: mode === 'continue' ? 'Continued generation from the current manuscript.' : 'Rewrote the current manuscript into a new draft.',
      });
    } catch (error) {
      setNotice({ tone: 'warning', text: String(error) });
    }
  };

  const connectOutputToLibrary = async (
    output: StudioOutputRecord,
    options: {
      action: 'open' | 'resume';
      successText: string;
      missingSubjectText: string;
      missingSessionText?: string;
    },
  ) => {
    const subjectId = output.projectId || '';
    if (!subjectId || !subjectNameMap.has(subjectId)) {
      setNotice({ tone: 'warning', text: options.missingSubjectText });
      return;
    }
    if (options.action === 'resume' && !output.sessionId) {
      setNotice({ tone: 'warning', text: options.missingSessionText || 'This manuscript does not have a recoverable RedClaw session yet.' });
      return;
    }

    await runAction(`${options.action === 'resume' ? 'output-resume' : 'output-open'}:${output.id}`, async () => {
      setEditingNew(false);
      setSelectedId(subjectId);
      rememberManuscript(subjectId, output.manuscriptPath);
      if (output.sessionId) {
        rememberSession(subjectId, output.sessionId);
      }
      if (options.action === 'open') {
        await loadManuscriptIntoStudio(output.manuscriptPath);
      }
      startTransition(() => setView('library'));
      if (output.sessionId) {
        await refreshSessionInsights(output.sessionId, true);
      }
      setNotice({ tone: 'success', text: options.successText });
    });
  };

  const openOutputExternally = async (output: StudioOutputRecord, successText: string) => {
    await runAction(`output-external:${output.id}`, async () => {
      const result = await readManuscriptFile(output.manuscriptPath);
      if (!result.absolutePath) {
        throw new Error('No absolute manuscript path is available.');
      }

      const openResult = (await window.ipcRenderer.openAppPath(result.absolutePath)) as {
        success?: boolean;
        error?: string;
      };
      if (!openResult.success) {
        throw new Error(openResult.error || 'Failed to open the manuscript in the system app.');
      }

      setNotice({ tone: 'success', text: successText });
    });
  };

  const handleOpenAutomationOutputInStudio = async (output: AutomationOutputRecord) =>
    connectOutputToLibrary(output, {
      action: 'open',
      successText: 'Switched to the latest automation manuscript.',
      missingSubjectText: 'This output is not linked to an existing subject yet, so it can only be opened externally for now.',
    });

  const handleResumeAutomationOutputSession = async (output: AutomationOutputRecord) =>
    connectOutputToLibrary(output, {
      action: 'resume',
      successText: 'Resumed the RedClaw session for the latest automation output.',
      missingSubjectText: 'This output is not linked to an existing subject yet, so the session cannot be resumed from here.',
      missingSessionText: 'This output does not have a recoverable RedClaw session yet.',
    });

  const handleOpenAutomationOutputExternally = async (output: AutomationOutputRecord) =>
    openOutputExternally(output, 'Opened the manuscript in the system app.');

  const handleOpenArchivedOutputInStudio = async (output: OutputArchiveRecord) => {
    await connectOutputToLibrary(output, {
      action: 'open',
      successText: 'Switched to the archived manuscript.',
      missingSubjectText: 'This archived manuscript is not linked to an existing subject yet, so it can only be opened externally for now.',
    });
  };

  const handleResumeArchivedOutputSession = async (output: OutputArchiveRecord) =>
    connectOutputToLibrary(output, {
      action: 'resume',
      successText: 'Resumed the RedClaw session for the archived manuscript.',
      missingSubjectText: 'This archived manuscript is not linked to an existing subject yet, so the session cannot be resumed from here.',
      missingSessionText: 'This archived manuscript does not have a recoverable RedClaw session yet.',
    });

  const handleOpenArchivedOutputExternally = async (output: OutputArchiveRecord) =>
    openOutputExternally(output, 'Opened the archived manuscript in the system app.');

  const handleResetArchiveFilters = () => {
    setArchiveQuery('');
    setArchiveSourceFilter('all');
    setArchiveDraftStrategyFilter('all');
  };

  const handleRemoveArchivedOutput = async (archiveId: string) => {
    await runAction(`output-remove:${archiveId}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.removeOutputArchive({
        archiveId,
      })) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete the archived draft.');
      }

      await load();
      setNotice({ tone: 'success', text: 'Archived draft deleted.' });
    });
  };

  const handleClearVisibleArchive = async () => {
    if (!visibleOutputArchive.length) {
      setNotice({ tone: 'warning', text: 'No archived drafts match the current filter.');
      return;
    }

    await runAction('archive-clear-visible', async () => {
      if (canBulkClearVisibleArchive && archiveSourceFilter === 'all') {
        const result = (await window.ipcRenderer.redclawRunner.clearOutputArchive()) as {
          success?: boolean;
          error?: string;
          removedCount?: number;
        };
        if (!result.success) {
          throw new Error(result.error || 'Failed to clear archived drafts.');
        }
        await load();
        setNotice({ tone: 'success', text: `Cleared ${result.removedCount || 0} archived drafts.` });
        return;
      }

      if (canBulkClearVisibleArchive && archiveSourceFilter !== 'all') {
        const result = (await window.ipcRenderer.redclawRunner.clearOutputArchive({
          sourceKind: archiveSourceFilter,
        })) as { success?: boolean; error?: string; removedCount?: number };
        if (!result.success) {
          throw new Error(result.error || 'Failed to clear archived drafts by source.');
        }
        await load();
        setNotice({ tone: 'success', text: `Cleared ${result.removedCount || 0} archived drafts.` });
        return;
      }

      const removalResults = (await Promise.all(
        visibleOutputArchive.map((item) =>
          window.ipcRenderer.redclawRunner.removeOutputArchive({
            archiveId: item.id,
          }),
        ),
      )) as Array<{ success?: boolean; error?: string }>;
      const failedRemoval = removalResults.find((item) => item.success === false);
      if (failedRemoval) {
        throw new Error(failedRemoval.error || 'Failed while removing visible archived drafts.');
      }
      await load();
      setNotice({ tone: 'success', text: `Cleared ${visibleOutputArchive.length} archived drafts.` });
    });
  };

  const handleClearActiveSubjectArchive = async () => {
    if (!activeSubject) {
      return;
    }

    await runAction(`archive-clear-subject:${activeSubject.id}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.clearOutputArchive({
        projectId: activeSubject.id,
      })) as { success?: boolean; error?: string; removedCount?: number };

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear drafts linked to the current subject.');
      }

      await load();
      setNotice({ tone: 'success', text: `Cleared ${result.removedCount || 0} drafts linked to the current subject.` });
    });
  };

  const handleCopyLogDirectory = async () => {
    if (!debugStatus.logDirectory) {
      setNotice({ tone: 'warning', text: 'No log directory is available yet.');
      return;
    }

    await copyTextToClipboard(debugStatus.logDirectory, 'Log directory copied.');
  };

  const handleRefreshDiagnostics = async () => {
    await runAction('refresh-diagnostics', async () => {
      await load();
      setNotice({ tone: 'success', text: 'Diagnostics refreshed.' });
    });
  };

  const openSettingsView = () => {
    startTransition(() => setView('settings'));
  };

  const startNewSubjectInLibrary = () => {
    setEditingNew(true);
    setSelectedId('');
    startTransition(() => setView('library'));
  };

  const openSubjectInLibrary = (subjectId: string) => {
    setEditingNew(false);
    setSelectedId(subjectId);
    startTransition(() => setView('library'));
  };

  const openScheduledTaskInSettings = (task: ScheduledTaskRecord) => {
    startEditingScheduledTask(task);
    openSettingsView();
  };

  const openLongCycleTaskInSettings = (task: LongCycleTaskRecord) => {
    startEditingLongCycleTask(task);
    openSettingsView();
  };

  const assignActiveSubjectToScheduledTask = () => {
    if (!activeSubject) {
      return;
    }
    setScheduledTaskForm((current) => ({ ...current, projectId: activeSubject.id }));
  };

  const assignActiveSubjectToLongCycleTask = () => {
    if (!activeSubject) {
      return;
    }
    setLongCycleForm((current) => ({ ...current, projectId: activeSubject.id }));
  };

  const handleSendToRedClaw = async () => {
    if (!activeSubject) {
      return;
    }

    await launchRedClawAuthoring({
      busyKey: 'redclaw',
      subject: activeSubject,
      briefText: brief,
      sourceTitle: activeSubject.name,
      sourcePath: manuscriptPath || linkedPath || undefined,
      sourceContent: manuscriptContent || undefined,
      mode: 'continue',
      successText: 'RedClaw completed one generation pass.',
    });
  };

  const handleSendRedClawFollowUp = async () => {
    if (!activeSubject) {
      return;
    }
    if (!linkedSession) {
      setNotice({ tone: 'warning', text: 'No active RedClaw session is linked yet. Open the manuscript in RedClaw first.' });
      return;
    }
    if (!hasActiveSubjectWorkingPath) {
      setNotice({ tone: 'warning', text: 'Create or reopen the manuscript first, then send the follow-up request.' });
      return;
    }

    const instruction = redClawFollowUpPrompt.trim();
    if (!instruction) {
      setNotice({ tone: 'warning', text: 'Enter a follow-up instruction for RedClaw first.' });
      return;
    }
    if (!redClawReady) {
      startTransition(() => setView('settings'));
      setNotice({ tone: 'warning', text: 'Complete the RedClaw settings before continuing this session.' });
      return;
    }

    await runAction('redclaw-follow-up', async () => {
      const packet = buildRedClawFollowUpPacket({
        subject: activeSubject,
        briefText: brief,
        sourcePath: activeSubjectWorkingPath,
        sourceContent: manuscriptContent,
        instruction,
      });

      setRuntimeState({
        sessionId: linkedSession,
        isProcessing: true,
        partialResponse: 'RedClaw is revising the current manuscript...',
        updatedAt: Date.now(),
      });

      const result = (await window.ipcRenderer.chat.sendMessage({
        sessionId: linkedSession,
        message: packet.content,
        displayContent: `Follow-up revision / ${activeSubject.name}`,
        taskHints: packet.taskHints,
      })) as {
        success?: boolean;
        error?: string;
        savedManuscriptPath?: string;
      };

      if (!result.success) {
        throw new Error(result.error || 'Failed to send the follow-up request to RedClaw.');
      }

      if (result.savedManuscriptPath) {
        rememberManuscript(activeSubject.id, result.savedManuscriptPath);
        await loadManuscriptIntoStudio(result.savedManuscriptPath);
      }

      await Promise.all([refreshSessionInsights(linkedSession, true), load()]);
      setRedClawFollowUpPrompt('');
      setNotice({ tone: 'success', text: 'RedClaw applied the follow-up instruction to the current manuscript.' });
    });
  };

  const handleRewriteCurrentManuscript = async () => {
    if (!activeSubject) {
      return;
    }

    const sourcePath = manuscriptPath || linkedPath || '';
    if (!sourcePath.trim()) {
      setNotice({ tone: 'warning', text: 'Create or open a manuscript first, then use "Rewrite as new draft".' });
      return;
    }

    await launchRedClawAuthoring({
      busyKey: 'redclaw-rewrite',
      subject: activeSubject,
      briefText: brief,
      sourceTitle: activeSubject.name,
      sourcePath,
      sourceContent: manuscriptContent || undefined,
      mode: 'rewrite',
      successText: 'RedClaw generated a rewritten version from the current manuscript.',
    });
  };

  const handleImportFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    void runAction('import-files', async () => {
      const payload = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        })),
      );

      const result = (await window.ipcRenderer.invoke('captures:import-files', {
        files: payload,
      })) as { success?: boolean; error?: string; failed?: Array<{ error?: string }> };

      if (!result.success) {
        throw new Error(result.error || result.failed?.[0]?.error || 'Failed to import files.');
      }

      await load();
      setNotice({ tone: 'success', text: 'Files imported into inbox.' });
    });
  };

  const overviewView = (
    <section className="atelier-view">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker">Current focus</div>
          <h2>Creation brief -&gt; Manuscripts -&gt; RedClaw</h2>
          <p>The desktop now connects creation brief, manuscript editing, and RedClaw generation into one continuous workspace for everyday users.</p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={() => void refreshAll()}>
              {busy === 'refresh' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              Refresh Workspace            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => startTransition(() => setView('library'))}
            >
              Open Library            </button>
          </div>
        </div>

        <div className="hero-orbit">
          <div className="hero-orbit-card">
            <div className="hero-orbit-label">Readiness</div>
            <div className="hero-orbit-value">
              {subjects.length} subjects / {captures.length} inbox items / {pluginStatus.pendingItems || 0} pending bridge files
            </div>
            <ul>
              <li>Bridge directory: {pluginStatus.bridgeDirectory ? 'Ready' : 'Not prepared'}</li>
              <li>AI connection: {redClawReady ? 'Configured' : 'Needs setup'}</li>
              <li>Embedded content pack: {runnerStatus.contentPackName || 'embedded-xhsspec'} / {runnerStatus.contentPackSections || 0} sections</li>
              <li>Desktop validation and releases run through GitHub Actions</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">Inbox</div>
          <div className="stat-value">{captures.length}</div>
          <div className="stat-detail">Browser bridge, manual capture, and file import all land here.</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">Library</div>
          <div className="stat-value">{subjects.length}</div>
          <div className="stat-detail">Subjects that can move directly into Manuscripts and RedClaw.</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">RedClaw</div>
          <div className="stat-value">{runtimeState.isProcessing ? 'Live' : 'Idle'}</div>
          <div className="stat-detail">{runtimeState.partialResponse || 'Live generation status will appear here.'}</div>
        </article>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">Latest activity</div>
          <h3>Recent activity</h3>
          <div className="activity-list">
            {activities.length ? (
              activities.slice(0, 6).map((item) => (
                <article key={item.id} className="activity-item">
                  <div
                    className={`activity-dot${item.tone === 'success' ? ' is-success' : item.tone === 'warning' ? ' is-warning' : ''}`}
                  />
                  <div className="activity-body">
                    <div className="activity-item-top">
                      <strong>{item.title}</strong>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                    <div className="activity-kind">{item.kind || 'activity'}</div>
                    <p>{item.detail || 'No additional detail.'}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="import-report-note">No recent activity yet.</div>
            )}
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">Desktop release</div>
          <h3>GitHub Actions release flow</h3>
          <div className="build-rail">
            {BUILD_STEPS.map((step, index) => (
              <div key={step} className="build-step">
                <div className="build-index">{index + 1}</div>
                <div>{step}</div>
              </div>
            ))}
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenGitHubReleases()}
            >
              {busy === 'open-releases' ? <Loader2 className="spin" size={15} /> : <Download size={15} />}
              Open GitHub Releases
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenLaunchChecklist()}
            >
              {busy === 'open-launch-checklist' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
              Open launch checklist
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenIssueTracker()}
            >
              {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
              Report issue
            </button>
          </div>
        </section>
      </section>

      <section className="atelier-card">
        <div className="section-tag">Archive</div>
        <h3>Recent output archive</h3>
        <div className="info-grid">
          <div className="info-item">
            <span>Total outputs</span>
            <strong>{outputArchive.length}</strong>
          </div>
          <div className="info-item">
            <span>Manual outputs</span>
            <strong>{manualOutputArchiveCount}</strong>
          </div>
          <div className="info-item">
            <span>Automated outputs</span>
            <strong>{automatedOutputArchiveCount}</strong>
          </div>
          <div className="info-item">
            <span>Latest output</span>
            <strong>{outputArchive[0] ? timeAgo(outputArchive[0].createdAt) : 'No records yet'}</strong>
          </div>
        </div>

        <div className="archive-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              value={archiveQuery}
              onChange={(event) => setArchiveQuery(event.target.value)}
              placeholder="Search by title, subject, or manuscript path"
            />
          </div>

          <div className="archive-toolbar-filters">
            <label className="archive-filter">
              <span>Source</span>
              <select
                value={archiveSourceFilter}
                onChange={(event) => setArchiveSourceFilter(event.target.value as OutputArchiveSourceFilter)}
              >
                {OUTPUT_ARCHIVE_SOURCE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="archive-chip-row">
          <span className="archive-chip-label">Draft strategy</span>
          <div className="archive-chip-group" role="group" aria-label="Archive draft strategy filters">
            {DRAFT_STRATEGY_FILTER_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`filter-chip ${archiveDraftStrategyFilter === item.value ? 'is-active' : ''}`}
                aria-pressed={archiveDraftStrategyFilter === item.value}
                onClick={() => setArchiveDraftStrategyFilter(item.value)}
              >
                {item.label}
                <span>{archiveDraftStrategyCounts[item.value]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="secondary-action compact" onClick={handleResetArchiveFilters}>
            <RefreshCw size={16} />
            Reset filters
          </button>
          <button
            type="button"
            className="secondary-action compact"
            disabled={!visibleOutputArchive.length || busy === 'archive-clear-visible'}
            onClick={() => void handleClearVisibleArchive()}
          >
            {busy === 'archive-clear-visible' ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
            Clear visible results
          </button>
        </div>

        <div className="import-report-note">
          {visibleOutputArchive.length === outputArchive.length
            ? `Showing all ${outputArchive.length} archived outputs.`
            : `Showing ${visibleOutputArchive.length} / ${outputArchive.length} archived outputs.`}
        </div>
        <div className="import-report-note">Continue will overwrite the current manuscript, while rewrite will create a new RedClaw branch draft.</div>

        <div className="automation-stack">
          {visibleOutputArchive.length ? (
            visibleOutputArchive.map((item) => (
              <article key={item.id} className="automation-item">
                <div className="automation-head">
                  <div>
                    <strong>{item.title}</strong>
                    <div className="automation-meta">
                      <span>{describeOutputSourceKind(item.sourceKind)}</span>
                      <span>{item.projectName || 'Unlinked subject'}</span>
                      <span>{timeAgo(item.createdAt)}</span>
                      <span>{describeDraftStrategy(item.draftStrategy)}</span>
                    </div>
                  </div>
                  <span className={`journey-state ${item.sourceKind === 'manual' ? 'is-pending' : 'is-complete'}`}>
                    {describeOutputMode(item.sourceKind)}
                  </span>
                </div>
                <div className="import-report-note">{item.manuscriptPath}</div>
                <div className="import-report-note">{describeDraftStrategyDetail(item)}</div>
                {item.summary ? <p>{item.summary}</p> : null}
                <div className="automation-actions">
                  {canOpenOutputInStudio(item) ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleOpenArchivedOutputInStudio(item)}
                    >
                      {busy === `output-open:${item.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      Open manuscript
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(item) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(item, 'continue')}
                    >
                      {busy === `output-redclaw-continue:${item.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                      Continue in RedClaw
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(item) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(item, 'rewrite')}
                    >
                      {busy === `output-redclaw-rewrite:${item.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      Rewrite as new draft
                    </button>
                  ) : null}
                  {canReconnectOutputSession(item) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeArchivedOutputSession(item)}
                    >
                      {busy === `output-resume:${item.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      Resume session
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void handleOpenArchivedOutputExternally(item)}
                  >
                    {busy === `output-external:${item.id}` ? <Loader2 className="spin" size={16} /> : <ExternalLink size={16} />}
                    Open externally
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void copyTextToClipboard(item.manuscriptPath, 'Manuscript path copied.')}
                  >
                    <Copy size={16} />
                    Copy path
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void handleRemoveArchivedOutput(item.id)}
                  >
                    {busy === `output-remove:${item.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : outputArchive.length ? (
            <div className="import-report-note">No archived outputs match the current filters. Try a different keyword or source.</div>
          ) : (
            <div className="import-report-note">No archived outputs yet. After sending drafts to RedClaw or running automation tasks, history will accumulate here.</div>
          )}
        </div>
      </section>
    </section>
  );
  const captureView = (
    <section className="atelier-view">
      <section className="capture-grid">
        <section className="capture-card">
          <div className="section-tag">Manual capture</div>
          <h3>Manual inbox capture</h3>
          <div className="subject-form">
            <label>
              <span>Source URL</span>
              <input
                value={captureForm.sourceUrl}
                onChange={(event) => setCaptureForm((current) => ({ ...current, sourceUrl: event.target.value }))}
              />
            </label>
            <label>
              <span>Title</span>
              <input
                value={captureForm.title}
                onChange={(event) => setCaptureForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label>
              <span>Tags</span>
              <input
                value={captureForm.tagsText}
                onChange={(event) => setCaptureForm((current) => ({ ...current, tagsText: event.target.value }))}
              />
            </label>
            <label>
              <span>Summary</span>
              <textarea
                value={captureForm.description}
                onChange={(event) => setCaptureForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
          </div>

          <button
            type="button"
            className="primary-action"
            onClick={() =>
              void runAction('capture', async () => {
                const result = (await window.ipcRenderer.invoke('captures:create', {
                  title: captureForm.title,
                  sourceUrl: captureForm.sourceUrl,
                  description: captureForm.description,
                  tags: splitTags(captureForm.tagsText),
                })) as { success?: boolean; error?: string };

                if (!result.success) {
                  throw new Error(result.error || 'Failed to create the inbox record.');
                }

                setCaptureForm(DEFAULT_CAPTURE);
                await load();
                setNotice({ tone: 'success', text: 'Inbox record added.' });
              })
            }
          >
            {busy === 'capture' ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
            Add to inbox          </button>
        </section>

        <section className="capture-card">
          <div className="section-tag">Bridge</div>
          <h3>Browser bridge</h3>
          <div className="info-grid">
            <div className="info-item">
              <span>Inbox</span>
              <strong>{pluginStatus.bridgeDirectory || 'Bridge not prepared'}</strong>
            </div>
            <div className="info-item">
              <span>Pending</span>
              <strong>{pluginStatus.pendingItems || 0}</strong>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="primary-action compact"
              onClick={() =>
                void runAction('bridge', async () => {
                  const result = await window.ipcRenderer.browserPlugin.prepare();
                  if (!result.success) {
                    throw new Error(result.error || 'Failed to prepare the bridge directory.');
                  }
                  await load();
                  setNotice({ tone: 'success', text: 'Bridge directory prepared.' });
                })
              }
            >
              {busy === 'bridge' ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
              Prepare bridge            </button>

            <button
              type="button"
              className="secondary-action compact"
              onClick={() =>
                void runAction('import-bridge', async () => {
                  const result = (await window.ipcRenderer.invoke('captures:import-bridge')) as {
                    success?: boolean;
                    error?: string;
                  };
                  if (!result.success) {
                    throw new Error(result.error || 'Failed to import bridge files.');
                  }
                  await load();
                  setNotice({ tone: 'success', text: 'Bridge files imported.' });
                })
              }
            >
              {busy === 'import-bridge' ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
              Import from bridge
            </button>
          </div>
        </section>

        <section className="capture-card">
          <div className="section-tag">JSON import</div>
          <h3>Import JSON / JSONL files</h3>
          <button type="button" className="file-dropzone" onClick={() => fileRef.current?.click()}>
            <div className="file-dropzone-head">
              <span>Local import</span>
              <Upload size={16} />
            </div>
            <strong>{busy === 'import-files' ? 'Importing files...' : 'Drag or choose local JSON / JSONL files'}</strong>
          </button>
          <input
            ref={fileRef}
            hidden
            type="file"
            multiple
            accept=".json,.jsonl,application/json"
            onChange={handleImportFiles}
          />
        </section>
      </section>

      <section className="atelier-card">
        <div className="section-tag">Inbox</div>
        <h3>Inbox items</h3>
        <div className="capture-list">
          {captures.length ? (
            captures.map((item) => (
              <article key={item.id} className="capture-item">
                <div className="capture-item-top">
                  <div>
                    <h4>{item.title || 'Untitled item'}</h4>
                    <p>{item.description || 'No description'}</p>
                  </div>
                  <span className={`journey-state ${item.status === 'converted' ? 'is-complete' : 'is-pending'}`}>
                    {item.status === 'converted' ? 'Converted' : 'Pending'}
                  </span>
                </div>
                <div className="capture-item-meta">
                  <span>{item.authorName || 'Unknown author'}</span>
                  <span>{item.sourceUrl || 'No source URL'}</span>
                </div>
                <div className="capture-item-actions">
                  <button
                    type="button"
                    className="primary-action compact"
                    disabled={item.status === 'converted' || busy === item.id}
                    onClick={() =>
                      void runAction(item.id, async () => {
                        const result = (await window.ipcRenderer.invoke('captures:promote-to-subject', {
                          id: item.id,
                        })) as {
                          success?: boolean;
                          error?: string;
                          subject?: SubjectRecord;
                        };

                        if (!result.success) {
                          throw new Error(result.error || 'Failed to promote the inbox item to a subject.');
                        }

                        await load();
                        if (result.subject?.id) {
                          setEditingNew(false);
                          setSelectedId(result.subject.id);
                        }
                        startTransition(() => setView('library'));
                        setNotice({ tone: 'success', text: 'Inbox item promoted to subject.' });
                      })
                    }
                  >
                    {busy === item.id ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                    Promote to subject                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="import-report-note">No inbox items yet.</div>
          )}
        </div>
      </section>
    </section>
  );
  const libraryView = (
    <section className="atelier-view">
      <section className="library-grid">
        <section className="atelier-card">
          <div className="library-header">
            <div>
              <div className="section-tag">Shelf</div>
              <h3>Subject library</h3>
            </div>
            <div className="search-field">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subjects, tags, or summaries" />
            </div>
          </div>

          <button
            type="button"
            className="secondary-action compact"
            onClick={() => {
              setEditingNew(true);
              setSelectedId('');
            }}
          >
            <Plus size={16} />
            New subject          </button>

          <div className="subject-list">
            {visibleSubjects.length ? (
              visibleSubjects.map((item) => (
                <article
                  key={item.id}
                  className={`subject-shelf-card atelier-card${!editingNew && item.id === activeSubject?.id ? ' is-selected' : ''}`}
                >
                  <button
                    type="button"
                    className="subject-card-main"
                    onClick={() => {
                      setEditingNew(false);
                      setSelectedId(item.id);
                    }}
                  >
                    <div className="subject-card-media">
                      {previewUrl(item) ? (
                        <img src={previewUrl(item)} alt={item.name} />
                      ) : (
                        <div className="subject-card-placeholder">
                          <FileText size={18} />
                        </div>
                      )}
                    </div>

                    <div className="subject-card-copy">
                      <div className="subject-card-headline">
                        <div>
                          <div className="subject-card-category">
                            {categoryNameMap.get(item.categoryId || '') || 'Uncategorized'}
                          </div>
                          <h4>{item.name}</h4>
                        </div>
                        <span className={`subject-status-chip ${!editingNew && item.id === activeSubject?.id ? 'is-editing' : 'is-draft'}`}>
                          {!editingNew && item.id === activeSubject?.id ? 'Editing' : 'Subject'}
                        </span>
                      </div>
                      <p>{item.description || 'No summary'}</p>
                      <div className="subject-card-meta">
                        <span>{timeAgo(item.updatedAt)}</span>
                      </div>
                    </div>
                  </button>
                </article>
              ))
            ) : (
              <div className="import-report-note">No subjects yet. Create one to unlock the writing workspace.</div>
            )}
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">Editor</div>
          <h3>{editingNew ? 'New subject' : 'Edit selected subject'}</h3>
          <div className="subject-form">
            <div className="subject-form-grid">
              <label>
                <span>Subject name</span>
                <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>Tags</span>
                <input
                  value={draft.tagsText}
                  onChange={(event) => setDraft((current) => ({ ...current, tagsText: event.target.value }))}
                />
              </label>
            </div>

            <div className="subject-editor-meta-grid">
              <label>
                <span>Category</span>
                <select
                  value={draft.categoryId}
                  onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Linked manuscript</span>
                <input value={linkedPath || 'Not linked yet'} readOnly />
              </label>
              <label>
                <span>RedClaw session</span>
                <input value={linkedSession || 'Not linked yet'} readOnly />
              </label>
            </div>

            <label>
              <span>Summary</span>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <div className="subject-editor-actions">
              <button type="button" className="primary-action" onClick={() => void handleSaveSubject()}>
                {busy === 'subject' ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                {draft.id ? 'Save subject' : 'New subject'}
              </button>
              <button type="button" className="secondary-action" disabled={!activeSubject} onClick={() => void handleExportSubject()}>
                {busy === 'export' ? <Loader2 className="spin" size={16} /> : <FileDown size={16} />}
                Export Markdown
              </button>
            </div>
          </div>
        </section>
      </section>

      {activeSubject ? (
        <section className="atelier-card">
          <div className="section-tag">Creation workspace</div>
          <h3>Creation brief / Manuscripts / RedClaw</h3>
          <div className="workspace-guide-grid">
            <article
              className={`workspace-guide-card ${
                !redClawReady || settingsConnectionStatus?.tone === 'warning'
                  ? 'is-warning'
                  : settingsConnectionStatus?.tone === 'success'
                    ? 'is-ready'
                    : 'is-info'
              }`}
            >
              <div className="workspace-guide-top">
                <div>
                  <span className="subject-workspace-label">Step 1</span>
                  <h4>Connection</h4>
                </div>
                <span
                  className={`workspace-guide-status ${
                    !redClawReady || settingsConnectionStatus?.tone === 'warning'
                      ? 'is-warning'
                      : settingsConnectionStatus?.tone === 'success'
                        ? 'is-ready'
                        : 'is-info'
                  }`}
                >
                  {!redClawReady
                    ? 'Needs setup'
                    : settingsConnectionStatus?.tone === 'success'
                      ? 'Verified'
                      : settingsConnectionStatus?.tone === 'warning'
                        ? 'Retry needed'
                        : 'Untested'}
                </span>
              </div>
              <p className="workspace-guide-summary">
                {!redClawReady
                  ? settingsSaveIssues[0] || 'Complete the model, endpoint, and API key before starting generation.'
                  : settingsConnectionStatus?.tone === 'success'
                    ? `${settingsConnectionStatus.model || normalizedSettings.aiModel} is ready via ${
                        settingsConnectionStatus.resolvedEndpoint || normalizedSettings.aiEndpoint
                      }.`
                    : settingsConnectionStatus?.tone === 'warning'
                      ? settingsConnectionStatus.detail
                      : 'Run one real connection test before pushing the subject into RedClaw.'}
              </p>
              <div className="subject-workspace-actions">
                <button
                  type="button"
                  className="secondary-action compact"
                  onClick={() => startTransition(() => setView('settings'))}
                >
                  <Settings2 size={16} />
                  Open settings
                </button>
                {redClawReady ? (
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void handleTestRedClawConnection()}
                  >
                    {busy === 'settings-test' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                    {settingsConnectionStatus?.tone === 'success' ? 'Retest connection' : 'Test connection'}
                  </button>
                ) : null}
              </div>
            </article>

            <article className={`workspace-guide-card ${hasActiveSubjectWorkingPath ? 'is-ready' : 'is-info'}`}>
              <div className="workspace-guide-top">
                <div>
                  <span className="subject-workspace-label">Step 2</span>
                  <h4>Manuscript</h4>
                </div>
                <span className={`workspace-guide-status ${hasActiveSubjectWorkingPath ? 'is-ready' : 'is-info'}`}>
                  {hasActiveSubjectWorkingPath ? 'Ready' : 'Create first'}
                </span>
              </div>
              <p className="workspace-guide-summary">
                {hasActiveSubjectWorkingPath
                  ? `Working file: ${activeSubjectWorkingPath}`
                  : 'Create a manuscript from the brief so the desktop can save edits, reopen drafts, and branch future rewrites.'}
              </p>
              <div className="subject-workspace-actions">
                <button type="button" className="secondary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                  {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                  {hasActiveSubjectWorkingPath ? 'Open manuscript' : 'Create manuscript'}
                </button>
                {manuscriptPath ? (
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void handleSaveManuscript()}
                  >
                    {busy === 'save-manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                    Save manuscript
                  </button>
                ) : (
                  <button type="button" className="secondary-action compact" onClick={() => void handleCopyBrief()}>
                    <Copy size={16} />
                    Copy brief
                  </button>
                )}
              </div>
            </article>

            <article
              className={`workspace-guide-card ${
                linkedSession ? 'is-ready' : activeSubjectRecoverableOutput ? 'is-warning' : 'is-info'
              }`}
            >
              <div className="workspace-guide-top">
                <div>
                  <span className="subject-workspace-label">Step 3</span>
                  <h4>RedClaw session</h4>
                </div>
                <span
                  className={`workspace-guide-status ${
                    linkedSession ? 'is-ready' : activeSubjectRecoverableOutput ? 'is-warning' : 'is-info'
                  }`}
                >
                  {linkedSession ? 'Linked' : activeSubjectRecoverableOutput ? 'Recoverable' : 'Not started'}
                </span>
              </div>
              <p className="workspace-guide-summary">
                {linkedSession
                  ? runtimeState.isProcessing
                    ? 'The current session is generating. Refresh runtime for live context updates or continue editing the same manuscript.'
                    : 'This subject is already linked to a RedClaw session. Continue the current draft or branch a new rewrite at any time.'
                  : activeSubjectRecoverableOutput
                    ? `A recoverable session is available from ${outputDisplayTitle(activeSubjectRecoverableOutput)}. Relink it here instead of starting from scratch.`
                    : activeSubjectLatestOutput
                      ? 'A draft already exists for this subject, but no live session is linked right now. Open the latest draft or start a new pass from the current manuscript.'
                      : hasActiveSubjectWorkingPath
                        ? 'No RedClaw session exists yet. Send the current manuscript to RedClaw to create the first live writing session.'
                        : 'Create a manuscript first, then open it in RedClaw to begin the live writing flow.'}
              </p>
              <div className="subject-workspace-actions">
                {linkedSession ? (
                  <>
                    <button type="button" className="primary-action compact" onClick={() => void handleSendToRedClaw()}>
                      {busy === 'redclaw' ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                      Continue in RedClaw
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void refreshSessionInsights(linkedSession)}
                    >
                      <RefreshCw size={16} />
                      Refresh runtime
                    </button>
                  </>
                ) : activeSubjectRecoverableOutput ? (
                  <>
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleResumeArchivedOutputSession(activeSubjectRecoverableOutput)}
                    >
                      {busy === `output-resume:${activeSubjectRecoverableOutput.id}` ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <Wand2 size={16} />
                      )}
                      Resume latest session
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleOpenArchivedOutputInStudio(activeSubjectRecoverableOutput)}
                    >
                      {busy === `output-open:${activeSubjectRecoverableOutput.id}` ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <FolderOpen size={16} />
                      )}
                      Open latest draft
                    </button>
                  </>
                ) : hasActiveSubjectWorkingPath ? (
                  <button type="button" className="primary-action compact" onClick={() => void handleSendToRedClaw()}>
                    {busy === 'redclaw' ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                    Open in RedClaw
                  </button>
                ) : (
                  <button type="button" className="secondary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                    {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                    Create manuscript first
                  </button>
                )}
              </div>
            </article>
          </div>

          <div className="subject-workspace-grid">
            <div className="subject-workspace-card">
              <div className="subject-workspace-head">
                <div>
                  <span className="subject-workspace-label">Creation brief</span>
                  <strong>{activeSubject.name}</strong>
                </div>
                <div className="subject-workspace-actions">
                  <button type="button" className="secondary-action compact" onClick={() => void handleCopyBrief()}>
                    <Copy size={16} />
                    Copy brief
                  </button>
                  <button type="button" className="secondary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                    {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                    {linkedPath ? 'Open manuscript' : 'Create manuscript'}
                  </button>
                </div>
              </div>
              <textarea className="subject-workspace-editor" value={brief} readOnly />
            </div>

            <div className="subject-workspace-card">
              <div className="subject-workspace-head">
                <div>
                  <span className="subject-workspace-label">Manuscripts</span>
                  <strong>{activeSubjectWorkingPath || 'No manuscript created yet'}</strong>
                </div>
                <div className="subject-workspace-actions">
                  <button
                    type="button"
                    className="secondary-action compact"
                    disabled={!manuscriptPath}
                    onClick={() => void handleSaveManuscript()}
                  >
                    {busy === 'save-manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                    Save manuscript
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    disabled={!manuscriptPath && !linkedPath}
                    onClick={() => void handleRewriteCurrentManuscript()}
                  >
                    {busy === 'redclaw-rewrite' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                    Rewrite as new draft
                  </button>
                  <button type="button" className="primary-action compact" onClick={() => void handleSendToRedClaw()}>
                    {busy === 'redclaw' ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                    Open in RedClaw
                  </button>
                </div>
              </div>
              <textarea
                className="subject-workspace-editor"
                value={manuscriptContent}
                onChange={(event) => setManuscriptContent(event.target.value)}
              />
            </div>
          </div>

          <div className="subject-workspace-grid">
            <div className="subject-workspace-card runtime-panel">
              <div className="subject-workspace-head">
                <div>
                  <span className="subject-workspace-label">Runtime</span>
                  <strong>{linkedSession || 'No linked session'}</strong>
                </div>
                <div className="subject-workspace-actions">
                  <button
                    type="button"
                    className="secondary-action compact"
                    disabled={!linkedSession}
                    onClick={() => void refreshSessionInsights(linkedSession)}
                  >
                    <RefreshCw size={16} />
                    Refresh runtime
                  </button>
                </div>
              </div>

              <div className="runtime-summary">
                <div className={`runtime-chip ${!linkedSession ? 'is-warning' : runtimeState.isProcessing ? 'is-live' : 'is-idle'}`}>
                  {!linkedSession ? 'No session' : runtimeState.isProcessing ? 'Generating' : 'Idle'}
                </div>
                <div className="runtime-summary-text">
                  {!linkedSession
                    ? activeSubjectRecoverableOutput
                      ? 'No live session is linked right now. Resume the latest recoverable session from the workflow guide above.'
                      : 'No live session is linked yet. Open the manuscript in RedClaw to start one.'
                    : runtimeState.partialResponse || 'No streaming output yet.'}
                </div>
              </div>

              <div className="runtime-meter">
                <span style={{ width: `${compactPercent}%` }} />
              </div>

              <div className="runtime-grid">
                <div className="runtime-stat">
                  <span>Context</span>
                  <strong>{contextUsage.contextType || 'xhs-atelier:redclaw-entry'}</strong>
                </div>
                <div className="runtime-stat">
                  <span>Messages</span>
                  <strong>{contextUsage.messageCount || 0}</strong>
                </div>
                <div className="runtime-stat">
                  <span>Est. tokens</span>
                  <strong>{contextUsage.estimatedTotalTokens || 0}</strong>
                </div>
                <div className="runtime-stat">
                  <span>Threshold</span>
                  <strong>{contextUsage.compactThreshold || 24000}</strong>
                </div>
                <div className="runtime-stat">
                  <span>Pack tokens</span>
                  <strong>{contextUsage.embeddedPromptTokens || 0}</strong>
                </div>
                <div className="runtime-stat">
                  <span>History</span>
                  <strong>{contextUsage.activeHistoryTokens || 0}</strong>
                </div>
                <div className="runtime-stat">
                  <span>Updated</span>
                  <strong>{runtimeState.updatedAt ? timeAgo(runtimeState.updatedAt) : 'Just now'}</strong>
                </div>
              </div>
            </div>

            <div className="subject-workspace-card">
              <div className="subject-workspace-head">
                <div>
                  <span className="subject-workspace-label">RedClaw</span>
                  <strong>{linkedSession || 'No linked session'}</strong>
                </div>
              </div>

              <div className="subject-redclaw-log">
                {messages.length ? (
                  messages.map((item) => (
                    <article key={item.id} className={`subject-redclaw-message${item.role === 'user' ? ' is-user' : ''}`}>
                      <div className="subject-redclaw-meta">
                        <span>{item.role === 'user' ? 'You' : 'RedClaw'}</span>
                        <span>{timeAgo(item.created_at)}</span>
                      </div>
                      {item.displayContent || item.display_content ? (
                        <div className="subject-redclaw-display">{item.displayContent || item.display_content}</div>
                      ) : null}
                      <p>{item.content}</p>
                    </article>
                  ))
                ) : (
                  <div className="import-report-note">The creation brief stays editable in Manuscripts, and you can reopen RedClaw here whenever you want to continue or branch the draft.</div>
                )}
              </div>

              <div className="subject-redclaw-composer">
                <div className="subject-workspace-head">
                  <div>
                    <span className="subject-workspace-label">Follow-up</span>
                    <strong>{linkedSession ? 'Continue the same session' : 'Session not linked yet'}</strong>
                  </div>
                </div>
                <textarea
                  className="subject-redclaw-input"
                  value={redClawFollowUpPrompt}
                  onChange={(event) => setRedClawFollowUpPrompt(event.target.value)}
                  placeholder="Example: Make the opening sharper, keep the original structure, and end with a stronger CTA."
                  disabled={!linkedSession}
                />
                <div className={`import-report-note${canSendRedClawFollowUp || !redClawFollowUpPrompt.trim() ? '' : ' is-warning'}`}>
                  {redClawFollowUpHint}
                </div>
                <div className="subject-workspace-actions">
                  <button
                    type="button"
                    className="primary-action compact"
                    disabled={!canSendRedClawFollowUp || !redClawFollowUpPrompt.trim()}
                    onClick={() => void handleSendRedClawFollowUp()}
                  >
                    {busy === 'redclaw-follow-up' ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                    Send follow-up
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    disabled={!linkedSession}
                    onClick={() =>
                      setRedClawFollowUpPrompt('Sharpen the hook, remove repeated lines, and make the CTA more confident without changing the core angle.')
                    }
                  >
                    <Sparkles size={16} />
                    Insert example
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    disabled={!redClawFollowUpPrompt}
                    onClick={() => setRedClawFollowUpPrompt('')}
                  >
                    <CircleDashed size={16} />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="subject-form">
            <div className="subject-workspace-head">
              <div>
                <span className="subject-workspace-label">Draft history</span>
                <strong>{activeSubjectOutputArchive.length ? `${activeSubjectOutputArchive.length} recent drafts` : 'No archived drafts yet'}</strong>
              </div>
              {activeSubjectOutputArchive.length ? (
                <div className="subject-workspace-actions">
                  <button
                    type="button"
                    className="secondary-action compact"
                    disabled={busy === `archive-clear-subject:${activeSubject.id}`}
                    onClick={() => void handleClearActiveSubjectArchive()}
                  >
                    {busy === `archive-clear-subject:${activeSubject.id}` ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <CircleDashed size={16} />
                    )}
                    Clear current subject history
                  </button>
                </div>
              ) : null}
            </div>

            <div className="automation-stack">
              {activeSubjectOutputArchive.length ? (
                activeSubjectOutputArchive.map((item) => (
                  <article key={item.id} className="automation-item">
                    <div className="automation-head">
                      <div>
                        <strong>{item.title}</strong>
                        <div className="automation-meta">
                          <span>{describeOutputSourceKind(item.sourceKind)}</span>
                          <span>{timeAgo(item.createdAt)}</span>
                          <span>{describeDraftStrategy(item.draftStrategy)}</span>
                        </div>
                      </div>
                      <span className={`journey-state ${item.sourceKind === 'manual' ? 'is-pending' : 'is-complete'}`}>
                        {describeOutputMode(item.sourceKind)}
                      </span>
                    </div>
                    <div className="import-report-note">{item.manuscriptPath}</div>
                    <div className="import-report-note">{describeDraftStrategyDetail(item)}</div>
                    {item.summary ? <p>{item.summary}</p> : null}
                    <div className="automation-actions">
                      {canOpenOutputInStudio(item) ? (
                        <button
                          type="button"
                          className="primary-action compact"
                          onClick={() => void handleOpenArchivedOutputInStudio(item)}
                        >
                          {busy === `output-open:${item.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          Open manuscript
                        </button>
                      ) : null}
                      {canOpenOutputInStudio(item) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(item, 'continue')}
                        >
                          {busy === `output-redclaw-continue:${item.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                          Continue in RedClaw
                        </button>
                      ) : null}
                      {canOpenOutputInStudio(item) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(item, 'rewrite')}
                        >
                          {busy === `output-redclaw-rewrite:${item.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                          Rewrite as new draft
                        </button>
                      ) : null}
                      {canReconnectOutputSession(item) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeArchivedOutputSession(item)}
                        >
                          {busy === `output-resume:${item.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          Resume session
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void handleOpenArchivedOutputExternally(item)}
                      >
                        {busy === `output-external:${item.id}` ? <Loader2 className="spin" size={16} /> : <ExternalLink size={16} />}
                        Open in system app
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void copyTextToClipboard(item.manuscriptPath, 'Manuscript path copied.')}
                      >
                        <Copy size={16} />
                        Copy path
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void handleRemoveArchivedOutput(item.id)}
                      >
                        {busy === `output-remove:${item.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                        Remove
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="import-report-note">This subject has no archived drafts yet. After running RedClaw or automation tasks, versions will accumulate here.</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="atelier-card">
          <div className="section-tag">Creation workspace</div>
          <h3>Choose a subject to start</h3>
          <div className="import-report-note">Create or select a subject to generate a creation brief, open a manuscript, and enter the RedClaw workspace.</div>
        </section>
      )}
    </section>
  );
  const settingsView = (
    <section className="atelier-view">
      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">RedClaw</div>
          <h3>AI connection settings</h3>
          <div className="settings-grid">
            <label>
              <span>Provider</span>
              <input
                value={settings.aiProvider}
                onChange={(event) => setSettings((current) => ({ ...current, aiProvider: event.target.value }))}
              />
            </label>
            <label>
              <span>Model</span>
              <input
                value={settings.aiModel}
                placeholder="For example: gpt-4.1-mini"
                onChange={(event) => setSettings((current) => ({ ...current, aiModel: event.target.value }))}
              />
            </label>
            <label>
              <span>Endpoint</span>
              <input
                value={settings.aiEndpoint}
                placeholder="https://api.example.com/v1 or /v1/responses"
                onChange={(event) => setSettings((current) => ({ ...current, aiEndpoint: event.target.value }))}
              />
            </label>
            <label>
              <span>API Key</span>
              <input
                type="password"
                value={settings.aiApiKey}
                onChange={(event) => setSettings((current) => ({ ...current, aiApiKey: event.target.value }))}
              />
            </label>
            <label>
              <span>Export Directory</span>
              <input
                value={settings.exportDirectory}
                onChange={(event) => setSettings((current) => ({ ...current, exportDirectory: event.target.value }))}
              />
            </label>
          </div>

          <div className="import-report-note">The desktop app accepts an OpenAI-compatible base URL, a full `/chat/completions` URL, or a full `/responses` URL. `Provider` is kept mainly as a record field.</div>
          <div className="info-grid">
            <div className="info-item">
              <span>Config</span>
              <strong>{redClawReady ? 'Ready for direct generation' : 'Setup required'}</strong>
            </div>
            <div className="info-item">
              <span>Issues</span>
              <strong>{settingsSaveIssues.length || runnerStatus.configurationIssues?.length ? `${settingsSaveIssues.length || runnerStatus.configurationIssues?.length} items` : 'No blockers'}</strong>
            </div>
            <div className="info-item">
              <span>Last Test</span>
              <strong>{settingsConnectionStatus ? timeAgo(new Date(settingsConnectionStatus.checkedAt).toISOString()) : 'Not tested yet'}</strong>
            </div>
          </div>

          {settingsConnectionStatus ? (
            <div className={`atelier-notice ${settingsConnectionStatus.tone === 'success' ? 'is-success' : 'is-warning'}`}>
              {settingsConnectionStatus.tone === 'success' ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
              <div>
                <strong>{settingsConnectionStatus.title}</strong>
                <div>
                  {settingsConnectionStatus.detail}
                  {settingsConnectionStatus.reply ? ` - ${settingsConnectionStatus.reply}` : ''}
                </div>
              </div>
            </div>
          ) : null}

          <div className="settings-actions">
            <button type="button" className="primary-action" onClick={() => void handleSaveSettings()}>
              <Settings2 size={16} />
              Save settings
            </button>
            <button type="button" className="secondary-action" onClick={() => void handleTestRedClawConnection()}>
              {busy === 'settings-test' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
              Test connection
            </button>
            <button type="button" className="secondary-action" onClick={() => void handleOpenExportDirectory()}>
              {busy === 'open-export-directory' ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
              Open export folder
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => startTransition(() => setView('library'))}
            >
              Open library
            </button>
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">Release</div>
          <h3>GitHub Actions readiness</h3>
          <div className="build-rail">
            {BUILD_STEPS.map((step, index) => (
              <div key={step} className="build-step">
                <div className="build-index">{index + 1}</div>
                <div>{step}</div>
              </div>
            ))}
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span>Bridge</span>
              <strong>{pluginStatus.bridgeDirectory || 'Bridge not prepared'}</strong>
            </div>
            <div className="info-item">
              <span>Pending</span>
              <strong>{pluginStatus.pendingItems || 0}</strong>
            </div>
            <div className="info-item">
              <span>Last Sync</span>
              <strong>{pluginStatus.lastSyncAt ? timeAgo(pluginStatus.lastSyncAt) : 'Not synced yet'}</strong>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenGitHubReleases()}
            >
              {busy === 'open-releases' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
              Open GitHub Releases
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenReleaseFlow()}
            >
              {busy === 'open-release-flow' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
              Open release flow
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() =>
                void runAction('open-bridge', async () => {
                  const result = await window.ipcRenderer.browserPlugin.openDir();
                  if (!result.success) {
                    throw new Error(result.error || 'Failed to open the bridge folder.');
                  }
                })
              }
            >
              <FolderOpen size={15} />
              Open bridge folder
            </button>
          </div>
        </section>
      </section>

      <section className="atelier-card">
        <div className="section-tag">Backup</div>
        <h3>Workspace snapshot</h3>
        <div className="import-report-note">
          Create a JSON snapshot before major imports, machine changes, or release testing. The snapshot includes app state, automation, archive history, and local manuscript/session links. The RedClaw API key and raw manuscript or media files are excluded on purpose.
        </div>
        <div className="info-grid launch-info-grid">
          <div className="info-item">
            <span>Subjects</span>
            <strong>{subjects.length}</strong>
          </div>
          <div className="info-item">
            <span>Captures</span>
            <strong>{captures.length}</strong>
          </div>
          <div className="info-item">
            <span>Automation</span>
            <strong>{scheduledTasks.length + longCycleTasks.length}</strong>
          </div>
          <div className="info-item">
            <span>Linked drafts</span>
            <strong>{Object.keys(manuscriptLinks).length + Object.keys(sessionLinks).length}</strong>
          </div>
        </div>
        <div className="settings-actions">
          <button type="button" className="primary-action compact" onClick={() => void handleExportWorkspaceBackup()}>
            {busy === 'workspace-backup-export' ? <Loader2 className="spin" size={15} /> : <FileDown size={15} />}
            Create backup snapshot
          </button>
          <button type="button" className="secondary-action compact" onClick={() => backupFileRef.current?.click()}>
            {busy === 'workspace-backup-import' ? <Loader2 className="spin" size={15} /> : <Upload size={15} />}
            Restore snapshot
          </button>
          <button type="button" className="secondary-action compact" onClick={() => void handleOpenWorkspaceDirectory()}>
            {busy === 'open-workspace-directory' ? <Loader2 className="spin" size={15} /> : <FolderOpen size={15} />}
            Open workspace folder
          </button>
        </div>
        <div className="import-report-note">
          Restore replaces the current desktop state. For full migration, keep a copy of the workspace folder and the export folder alongside this JSON snapshot.
        </div>
        <input
          ref={backupFileRef}
          hidden
          type="file"
          accept=".json,application/json"
          onChange={handleImportWorkspaceBackup}
        />
      </section>

      <section className="atelier-card">
        <div className="section-tag">Launch readiness</div>
        <h3>Pre-release checklist</h3>
        <div className="import-report-note">This panel only tracks blockers and launch warnings. When blockers reach zero, tag `desktop-v*` to publish installers through GitHub Actions.</div>
        <div className="settings-actions">
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenLaunchChecklist()}
          >
            {busy === 'open-launch-checklist' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
            View checklist
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenIssueTracker()}
          >
            {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            Report blocker
          </button>
        </div>

        <div className="info-grid launch-info-grid">
          <div className="info-item">
            <span>Status</span>
            <strong>{!launchBlockers.length ? 'Release candidate ready' : `${launchBlockers.length} blockers remaining`}</strong>
          </div>
          <div className="info-item">
            <span>Warnings</span>
            <strong>{launchWarnings.length ? `${launchWarnings.length} warnings to confirm` : 'No extra warnings'}</strong>
          </div>
          <div className="info-item">
            <span>Bridge</span>
            <strong>{pluginStatus.bridgeDirectory ? 'Prepared' : 'Optional, not prepared'}</strong>
          </div>
          <div className="info-item">
            <span>Release</span>
            <strong>GitHub Actions Only</strong>
          </div>
        </div>

        <div className="readiness-list">
          {launchChecklist.map((item) => (
            <div key={item.id} className="readiness-item">
              {item.done ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
            </div>
          ))}
        </div>

        {launchBlockers.length ? (
          <div className="launch-issue-list">
            {launchBlockers.map((item) => (
              <div key={item} className="launch-issue-item">
                <CircleDashed size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="launch-issue-list is-success">
            <div className="launch-issue-item">
              <CheckCircle2 size={15} />
              <span>All current blockers are cleared. The desktop app is ready for GitHub tag-based release prep.</span>
            </div>
          </div>
        )}

        {launchWarnings.length ? (
          <div className="launch-issue-list is-warning">
            {launchWarnings.map((item) => (
              <div key={item} className="launch-issue-item">
                <CircleDashed size={15} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="atelier-card">
        <div className="section-tag">Support</div>
        <h3>Docs and community channels</h3>
        <div className="import-report-note">Use repository docs for setup and release details. Use GitHub issue forms for bugs or feature requests. Review the security policy before posting any sensitive finding publicly.</div>
        <div className="info-grid launch-info-grid">
          <div className="info-item">
            <span>Repository</span>
            <strong>Open source workspace</strong>
          </div>
          <div className="info-item">
            <span>Contributing</span>
            <strong>PR checklist and scope</strong>
          </div>
          <div className="info-item">
            <span>Security</span>
            <strong>Private-first reporting</strong>
          </div>
          <div className="info-item">
            <span>Issue intake</span>
            <strong>GitHub forms enabled</strong>
          </div>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenRepository()}
          >
            {busy === 'open-repository' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            Open repository
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenContributingGuide()}
          >
            {busy === 'open-contributing' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
            Open contribution guide
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenSecurityPolicy()}
          >
            {busy === 'open-security' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
            Open security policy
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenIssueTracker()}
          >
            {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            Open issue forms
          </button>
        </div>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">Automation control</div>
          <h3>RedClaw automation runner</h3>
          <div className="info-grid">
            <div className="info-item">
              <span>Runner</span>
              <strong>{runnerStatus.isTicking ? 'Runner active' : 'Runner stopped'}</strong>
            </div>
            <div className="info-item">
              <span>Next Tick</span>
              <strong>{runnerStatus.nextTickAt ? timeUntil(runnerStatus.nextTickAt) : 'Not scheduled'}</strong>
            </div>
            <div className="info-item">
              <span>Heartbeat</span>
              <strong>{runnerStatus.heartbeat?.enabled ? 'Enabled' : 'Disabled'}</strong>
            </div>
            <div className="info-item">
              <span>Next Automation</span>
              <strong>{runnerStatus.nextAutomationFireAt ? timeUntil(runnerStatus.nextAutomationFireAt) : 'No upcoming automation'}</strong>
            </div>
            <div className="info-item">
              <span>Last Tick</span>
              <strong>{runnerStatus.lastTickAt ? timeAgo(runnerStatus.lastTickAt) : 'No recent tick'}</strong>
            </div>
          </div>

          <div className="import-report-note">
            The Rust runner owns timing, queueing, and background execution. Review cadence, heartbeat, and project-level automation here.          </div>

          <div className="subject-form">
            <div className="subject-form-grid">
              <label>
                <span>Tick interval minutes</span>
                <input
                  type="number"
                  min="1"
                  value={runnerConfigForm.intervalMinutes}
                  onChange={(event) => setRunnerConfigForm((current) => ({ ...current, intervalMinutes: event.target.value }))}
                />
              </label>
              <label>
                <span>Max subjects per tick</span>
                <input
                  type="number"
                  min="1"
                  value={runnerConfigForm.maxProjectsPerTick}
                  onChange={(event) => setRunnerConfigForm((current) => ({ ...current, maxProjectsPerTick: event.target.value }))}
                />
              </label>
              <label>
                <span>Max automation jobs per tick</span>
                <input
                  type="number"
                  min="1"
                  value={runnerConfigForm.maxAutomationPerTick}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({ ...current, maxAutomationPerTick: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className="subject-form-grid">
              <label>
                <span>Keep runner alive without window</span>
                <select
                  value={runnerConfigForm.keepAliveWhenNoWindow ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      keepAliveWhenNoWindow: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label>
                <span>Heartbeat</span>
                <select
                  value={runnerConfigForm.heartbeatEnabled ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      heartbeatEnabled: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label>
                <span>Heartbeat interval minutes</span>
                <input
                  type="number"
                  min="1"
                  value={runnerConfigForm.heartbeatIntervalMinutes}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      heartbeatIntervalMinutes: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="subject-form-grid">
              <label>
                <span>Suppress empty heartbeat</span>
                <select
                  value={runnerConfigForm.heartbeatSuppressEmptyReport ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      heartbeatSuppressEmptyReport: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label>
                <span>Report to main session</span>
                <select
                  value={runnerConfigForm.heartbeatReportToMainSession ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      heartbeatReportToMainSession: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label>
                <span>Next heartbeat</span>
                <input
                  readOnly
                  value={runnerStatus.heartbeat?.nextRunAt ? timeUntil(runnerStatus.heartbeat.nextRunAt) : 'Not scheduled'}
                />
              </label>
            </div>

            <label>
              <span>Heartbeat Prompt</span>
              <textarea
                value={runnerConfigForm.heartbeatPrompt}
                onChange={(event) => setRunnerConfigForm((current) => ({ ...current, heartbeatPrompt: event.target.value }))}
                placeholder="Optional: describe what the heartbeat report should summarize."
              />
            </label>
          </div>

          {runnerStatus.lastError ? <div className="import-report-note is-warning">{runnerStatus.lastError}</div> : null}

          <div className="settings-actions">
            <button type="button" className="primary-action compact" onClick={() => void handleSaveRunnerConfig()}>
              {busy === 'runner-config' ? <Loader2 className="spin" size={16} /> : <Settings2 size={16} />}
              Save runner settings
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleStartRunner()}
              disabled={Boolean(runnerStatus.isTicking)}
            >
              {busy === 'runner-start' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              {runnerStatus.isTicking ? 'Runner active' : 'Start runner'}
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleStopRunner()}
              disabled={!runnerStatus.isTicking}
            >
              {busy === 'runner-stop' ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
              Stop runner
            </button>
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">Project automation</div>
          <h3>Project automation</h3>
          <div className="automation-stack">
            {subjects.length ? (
              subjects.map((subject) => {
                const draft = getProjectAutomationDraft(subject.id);
                const projectState = runnerProjectStates[subject.id];
                return (
                  <article key={subject.id} className="automation-item">
                    <div className="automation-head">
                      <div>
                        <strong>{subject.name}</strong>
                        <div className="automation-meta">
                          <span>{categoryNameMap.get(subject.categoryId || '') || 'Uncategorized'}</span>
                          <span>{projectState?.lastRunAt ? `Last run ${timeAgo(projectState.lastRunAt)}` : 'Not run yet'}</span>
                          <span>{projectState?.lastResult ? `Last result: ${projectState.lastResult}` : 'No run result yet'}</span>
                        </div>
                      </div>
                      <span className={`journey-state ${draft.enabled ? 'is-complete' : 'is-pending'}`}>
                        {draft.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <div className="subject-form">
                      <div className="subject-form-grid">
                        <label>
                          <span>Automation state</span>
                          <select
                            value={draft.enabled ? 'enabled' : 'disabled'}
                            onChange={(event) =>
                              patchProjectAutomationDraft(subject.id, { enabled: event.target.value === 'enabled' })
                            }
                          >
                            <option value="enabled">Enable</option>
                            <option value="disabled">Disable</option>
                          </select>
                        </label>
                        <label>
                          <span>Current source</span>
                          <input
                            readOnly
                            value={manuscriptLinks[subject.id] ? 'Manuscript + subject brief' : 'Subject brief only'}
                          />
                        </label>
                      </div>

                      <label>
                        <span>Project prompt</span>
                        <textarea
                          value={draft.prompt}
                          onChange={(event) => patchProjectAutomationDraft(subject.id, { prompt: event.target.value })}
                          placeholder="Optional: add a long-running prompt for this subject, including direction, rhythm, constraints, or references."
                        />
                      </label>
                    </div>

                    {projectState?.lastError ? <div className="import-report-note is-warning">{projectState.lastError}</div> : null}

                    <div className="automation-actions">
                      <button
                        type="button"
                        className="primary-action compact"
                        onClick={() => void handleSaveProjectAutomation(subject.id)}
                      >
                        {busy === `project-automation:${subject.id}` ? <Loader2 className="spin" size={16} /> : <Settings2 size={16} />}
                        Save settings
                      </button>
                      {subject.id === activeSubject?.id ? (
                        <button type="button" className="secondary-action compact" onClick={() => startTransition(() => setView('library'))}>
                          Open subject                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="import-report-note">Create at least one subject before configuring project automation.</div>
            )}
          </div>
        </section>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">Diagnostics</div>
          <h3>Diagnostics overview</h3>
          <div className="info-grid">
            <div className="info-item">
              <span>Activity count</span>
              <strong>{automationActivities.length}</strong>
            </div>
            <div className="info-item">
              <span>Warnings</span>
              <strong>{automationWarnings.length ? `${automationWarnings.length} items` : 'None'}</strong>
            </div>
            <div className="info-item">
              <span>Debug logging</span>
              <strong>{debugStatus.enabled ? 'Enabled' : 'Off'}</strong>
            </div>
            <div className="info-item">
              <span>Latest activity</span>
              <strong>{latestAutomationActivity ? timeAgo(latestAutomationActivity.createdAt) : 'No records yet'}</strong>
            </div>
          </div>

          <label>
            <span>Debug log directory</span>
            <input readOnly value={debugStatus.logDirectory || 'No log directory'} />
          </label>

          <div className="import-report-note">
            Use the recovery queue to jump directly from a failure into the right fix path instead of hunting through logs and forms.
          </div>

          {diagnosticsRecoveryCount ? (
            <div className="automation-stack">
              {redClawRecoveryNeeded ? (
                <article className="automation-item">
                  <div className="automation-head">
                    <div>
                      <strong>RedClaw setup or connection needs attention</strong>
                      <div className="automation-meta">
                        <span>{runnerConfigurationIssues.length ? `${runnerConfigurationIssues.length} config issues` : 'Connection check missing'}</span>
                        <span>{settingsConnectionStatus?.checkedAt ? `Last checked ${timeAgo(settingsConnectionStatus.checkedAt)}` : 'No successful test yet'}</span>
                      </div>
                    </div>
                    <span className="journey-state is-pending">Action needed</span>
                  </div>
                  <p>
                    {runnerConfigurationIssues[0]
                      || (settingsConnectionStatus?.tone === 'warning'
                        ? settingsConnectionStatus.detail
                        : 'Run one real RedClaw connection test before relying on manual or automated generation.')}
                  </p>
                  <div className="automation-actions">
                    <button type="button" className="primary-action compact" onClick={openSettingsView}>
                      <Settings2 size={16} />
                      Open settings
                    </button>
                    {redClawReady ? (
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void handleTestRedClawConnection()}
                      >
                        {busy === 'settings-test' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                        {settingsConnectionStatus ? 'Retest connection' : 'Test connection'}
                      </button>
                    ) : null}
                    {runnerConfigurationIssues.length ? (
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void copyTextToClipboard(runnerConfigurationIssues.join('\n'), 'Configuration issues copied.')}
                      >
                        <Copy size={16} />
                        Copy issues
                      </button>
                    ) : null}
                  </div>
                </article>
              ) : null}

              {runnerStatus.lastError ? (
                <article className="automation-item">
                  <div className="automation-head">
                    <div>
                      <strong>Automation runner reported an error</strong>
                      <div className="automation-meta">
                        <span>{runnerStatus.isTicking ? 'Runner active' : 'Runner stopped'}</span>
                        <span>{runnerStatus.lastTickAt ? `Last tick ${timeAgo(runnerStatus.lastTickAt)}` : 'No recent tick'}</span>
                      </div>
                    </div>
                    <span className="journey-state is-pending">Runner issue</span>
                  </div>
                  <p>{runnerStatus.lastError}</p>
                  <div className="automation-actions">
                    <button type="button" className="primary-action compact" onClick={() => void handleRefreshDiagnostics()}>
                      {busy === 'refresh-diagnostics' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                      Refresh diagnostics
                    </button>
                    <button type="button" className="secondary-action compact" onClick={openSettingsView}>
                      <Settings2 size={16} />
                      Open settings
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void copyTextToClipboard(runnerStatus.lastError || '', 'Runner error copied.')}
                    >
                      <Copy size={16} />
                      Copy error
                    </button>
                  </div>
                </article>
              ) : null}

              {failedProjectAutomation.map(({ subject, state }) => (
                <article key={`project-recovery:${subject.id}`} className="automation-item">
                  <div className="automation-head">
                    <div>
                      <strong>{subject.name}</strong>
                      <div className="automation-meta">
                        <span>Project automation</span>
                        <span>{state?.lastRunAt ? `Last run ${timeAgo(state.lastRunAt)}` : 'No successful run yet'}</span>
                        <span>{state?.lastResult ? `Result: ${state.lastResult}` : 'No result recorded'}</span>
                      </div>
                    </div>
                    <span className="journey-state is-pending">Subject issue</span>
                  </div>
                  <p>{state?.lastError || 'Project automation reported an error without extra detail.'}</p>
                  <div className="automation-actions">
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => openSubjectInLibrary(subject.id)}
                    >
                      <LibraryBig size={16} />
                      Open subject
                    </button>
                    <button type="button" className="secondary-action compact" onClick={openSettingsView}>
                      <Settings2 size={16} />
                      Open settings
                    </button>
                    {state?.lastError ? (
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void copyTextToClipboard(state.lastError || '', 'Project automation error copied.')}
                      >
                        <Copy size={16} />
                        Copy error
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}

              {failedScheduledTasks.map((task) => {
                const output = toScheduledAutomationOutput(task);
                return (
                  <article key={`scheduled-recovery:${task.id}`} className="automation-item">
                    <div className="automation-head">
                      <div>
                        <strong>{task.name}</strong>
                        <div className="automation-meta">
                          <span>Scheduled task</span>
                          <span>{scheduledModeLabel(task.mode)}</span>
                          <span>{task.lastRunAt ? `Last run ${timeAgo(task.lastRunAt)}` : 'Not run yet'}</span>
                          <span>{task.projectId ? subjectNameMap.get(task.projectId) || task.projectId : 'Unlinked subject'}</span>
                        </div>
                      </div>
                      <span className="journey-state is-pending">Retry recommended</span>
                    </div>
                    <p>{task.lastError || 'This scheduled task ended with an error state.'}</p>
                    <div className="automation-actions">
                      <button
                        type="button"
                        className="primary-action compact"
                        onClick={() => void handleRunScheduledTask(task.id)}
                      >
                        {busy === `scheduled-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        Run now
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => openScheduledTaskInSettings(task)}
                      >
                        <Settings2 size={16} />
                        Edit task
                      </button>
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          Open manuscript
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          Resume session
                        </button>
                      ) : null}
                      {task.lastError ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastError || '', 'Scheduled task error copied.')}
                        >
                          <Copy size={16} />
                          Copy error
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {failedLongCycleTasks.map((task) => {
                const output = toLongCycleAutomationOutput(task);
                return (
                  <article key={`long-cycle-recovery:${task.id}`} className="automation-item">
                    <div className="automation-head">
                      <div>
                        <strong>{task.name}</strong>
                        <div className="automation-meta">
                          <span>Long-cycle task</span>
                          <span>{task.completedRounds} / {task.totalRounds}</span>
                          <span>{task.lastRunAt ? `Last run ${timeAgo(task.lastRunAt)}` : 'Not run yet'}</span>
                          <span>{task.projectId ? subjectNameMap.get(task.projectId) || task.projectId : 'Unlinked subject'}</span>
                        </div>
                      </div>
                      <span className="journey-state is-pending">Retry recommended</span>
                    </div>
                    <p>{task.lastError || 'This long-cycle task ended with an error state.'}</p>
                    <div className="automation-actions">
                      <button
                        type="button"
                        className="primary-action compact"
                        onClick={() => void handleRunLongCycleTask(task.id)}
                      >
                        {busy === `long-cycle-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        Advance one round
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => openLongCycleTaskInSettings(task)}
                      >
                        <Settings2 size={16} />
                        Edit task
                      </button>
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          Open manuscript
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          Resume session
                        </button>
                      ) : null}
                      {task.lastError ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastError || '', 'Long-cycle task error copied.')}
                        >
                          <Copy size={16} />
                          Copy error
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="import-report-note">No recovery actions are waiting. Automation diagnostics are currently in a stable state.</div>
          )}

          {automationWarnings.length ? (
            <div className="activity-list">
              {automationWarnings.map((item) => (
                <article key={item.id} className="activity-item">
                  <div className="activity-dot is-warning" />
                  <div className="activity-body">
                    <div className="activity-item-top">
                      <strong>{item.title}</strong>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                    <div className="activity-kind">{item.kind || 'warning'}</div>
                    <p>{item.detail || 'No additional detail.'}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="import-report-note">No runner warnings or heartbeat issues are currently reported.</div>
          )}

          <div className="settings-actions">
            <button type="button" className="primary-action compact" onClick={() => void handleRefreshDiagnostics()}>
              {busy === 'refresh-diagnostics' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              Refresh diagnostics
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleCopyLogDirectory()}
              disabled={!debugStatus.logDirectory}
            >
              <Copy size={16} />
              Copy log directory
            </button>
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">Trace</div>
          <h3>Automation trace</h3>
          {latestAutomationActivity ? (
            <div className="import-report-note">
              {`Latest event: ${latestAutomationActivity.kind || 'activity'} ${timeAgo(latestAutomationActivity.createdAt)}`}            </div>
          ) : null}

          <div className="activity-list">
            {automationActivities.length ? (
              automationActivities.slice(0, 8).map((item) => (
                <article key={item.id} className="activity-item">
                  <div
                    className={`activity-dot${item.tone === 'success' ? ' is-success' : item.tone === 'warning' ? ' is-warning' : ''}`}
                  />
                  <div className="activity-body">
                    <div className="activity-item-top">
                      <strong>{item.title}</strong>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                    <div className="activity-kind">{item.kind || 'activity'}</div>
                    <p>{item.detail || 'No additional detail.'}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="import-report-note">No automation activity has been recorded yet.</div>
            )}
          </div>

          <div className="subject-form">
            <span>Debug log preview</span>
            <div className="log-preview">
              {debugLines.length ? debugLines.join('\n') : 'No debug log entries yet.'}
            </div>
          </div>
        </section>
      </section>

      <section className="atelier-card">
        <div className="section-tag">Outputs</div>
        <h3>Recent outputs</h3>
        <div className="import-report-note">
          Recent automation manuscripts appear here so you can jump back into the library, continue writing, or open files directly.
        </div>
        <div className="import-report-note">Continue will overwrite the current manuscript, while rewrite will keep the source draft and create a new output branch.</div>
        <div className="archive-chip-row">
          <span className="archive-chip-label">View strategy</span>
          <div className="archive-chip-group" role="group" aria-label="Recent output strategy filters">
            {DRAFT_STRATEGY_FILTER_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`filter-chip ${recentOutputDraftStrategyFilter === item.value ? 'is-active' : ''}`}
                aria-pressed={recentOutputDraftStrategyFilter === item.value}
                onClick={() => setRecentOutputDraftStrategyFilter(item.value)}
              >
                {item.label}
                <span>{recentAutomationOutputCounts[item.value]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="import-report-note">
          {recentAutomationOutputs.length === recentAutomationOutputMatches.length
            ? `Showing ${recentAutomationOutputs.length} automation outputs.`
            : `Showing the latest ${recentAutomationOutputs.length} / ${recentAutomationOutputMatches.length} matching automation outputs.`}
        </div>

        <div className="automation-stack">
          {recentAutomationOutputs.length ? (
            recentAutomationOutputs.map((output) => (
              <article key={output.id} className="automation-item">
                <div className="automation-head">
                  <div>
                    <strong>{output.taskName}</strong>
                    <div className="automation-meta">
                      <span>{output.taskKind === 'scheduled' ? 'Scheduled' : 'Long-cycle'}</span>
                      <span>{output.projectName || 'Unlinked subject'}</span>
                      <span>{output.lastRunAt ? `Last run ${timeAgo(output.lastRunAt)}` : `Updated ${timeAgo(output.updatedAt)}`}</span>
                      <span>{describeDraftStrategy(output.draftStrategy)}</span>
                    </div>
                  </div>
                  <span className={`journey-state ${output.lastResult === 'success' ? 'is-complete' : 'is-pending'}`}>
                    {output.lastResult === 'error' ? 'Error' : output.lastResult === 'skipped' ? 'Skipped' : 'Success'}
                  </span>
                </div>

                <div className="import-report-note">{output.manuscriptPath}</div>
                <div className="import-report-note">{describeDraftStrategyDetail(output)}</div>
                {!canOpenOutputInStudio(output) ? (
                  <div className="import-report-note">
                    This output is not linked to an existing subject yet, so it can only be opened externally for now.                  </div>
                ) : null}

                <div className="automation-actions">
                  {canOpenOutputInStudio(output) ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleOpenAutomationOutputInStudio(output)}
                    >
                      {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      Open manuscript
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(output) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(output, 'continue')}
                    >
                      {busy === `output-redclaw-continue:${output.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                      Continue in RedClaw
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(output) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(output, 'rewrite')}
                    >
                      {busy === `output-redclaw-rewrite:${output.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      Rewrite as new draft
                    </button>
                  ) : null}
                  {canReconnectOutputSession(output) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeAutomationOutputSession(output)}
                    >
                      {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      Resume session
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void handleOpenAutomationOutputExternally(output)}
                  >
                    {busy === `output-external:${output.id}` ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <ExternalLink size={16} />
                    )}
                    Open externally
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void copyTextToClipboard(output.manuscriptPath, 'Manuscript path copied.')}
                  >
                    <Copy size={16} />
                    Copy path
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="import-report-note">No recent automation outputs yet.</div>
          )}
        </div>
      </section>

      <section className="ops-grid">
        <section className="ops-card">
          <div className="section-tag">Current desk</div>
          <h3>Current desk snapshot</h3>
          <ul>
            <li>Space: {spaceName}</li>
            <li>Subjects: {subjects.length}</li>
            <li>Inbox items: {captures.length}</li>
            <li>RedClaw setup: {redClawReady ? 'Ready' : 'Needs setup'}</li>
          </ul>
        </section>

        <section className="ops-card">
          <div className="section-tag">Bridge note</div>
          <h3>Bridge note</h3>
          <p>{pluginStatus.message || 'Export JSON / JSONL from the browser side into the desktop inbox, or drag files here directly.'}</p>
          <div className="settings-actions">
            <button
              type="button"
              className="primary-action compact"
              onClick={() => startTransition(() => setView('capture'))}
            >
              Open capture            </button>
          </div>
        </section>

        <section className="ops-card">
          <div className="section-tag">Content pack</div>
          <h3>XHSSpec pack inside RedClaw</h3>
          <ul>
            <li>Embedded pack: {runnerStatus.contentPackName || 'embedded-xhsspec'}</li>
            <li>Sections: {runnerStatus.contentPackSections || 0}</li>
            <li>Direct generation: {runnerStatus.directGenerationEnabled ? 'Enabled' : 'Finish AI setup first'}</li>
            <li>The pack bundles brand, audience, tone, offer, and taboo guidance for direct generation.</li>
            <li>Templates include note, creation spec, quick brief, and quick draft contract assets.</li>
            <li>Releases stay GitHub-first so validation, bundling, and installers are produced remotely.</li>
          </ul>
        </section>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">Automation</div>
          <h3>Scheduled tasks</h3>
          <div className="subject-form">
            {editingScheduledTaskId ? (
              <div className="import-report-note">You are editing an existing scheduled task. Saving will overwrite its current configuration.</div>
            ) : null}
            {editingScheduledTask || scheduledTaskForm.projectId || activeSubject || !subjects.length ? (
              <div className="task-editor-context">
                <div className="task-editor-head">
                  <div>
                    <span className="subject-workspace-label">Editor context</span>
                    <strong>{editingScheduledTask ? editingScheduledTask.name : 'New scheduled task'}</strong>
                  </div>
                  <span
                    className={`journey-state ${
                      editingScheduledTask?.lastResult === 'success'
                        ? 'is-complete'
                        : editingScheduledTask?.lastResult === 'error'
                          ? 'is-pending'
                          : scheduledEditorSubject
                            ? 'is-complete'
                            : 'is-pending'
                    }`}
                  >
                    {editingScheduledTask?.lastResult === 'error'
                      ? 'Needs recovery'
                      : editingScheduledTask
                        ? 'Existing task'
                        : scheduledEditorSubject
                          ? 'Linked subject ready'
                          : 'Choose a subject'}
                  </span>
                </div>
                <div className="task-editor-meta-grid">
                  <div className="task-editor-meta">
                    <span>Linked subject</span>
                    <strong>{scheduledEditorSubject?.name || 'No linked subject'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Mode</span>
                    <strong>{scheduledModeLabel(scheduledTaskForm.mode)}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Schedule</span>
                    <strong>{scheduledTaskFormSummary}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Last run</span>
                    <strong>{editingScheduledTask?.lastRunAt ? timeAgo(editingScheduledTask.lastRunAt) : 'Not run yet'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Next run</span>
                    <strong>{editingScheduledTask?.nextRunAt ? timeUntil(editingScheduledTask.nextRunAt) : 'Not scheduled yet'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Latest output</span>
                    <strong>{editingScheduledOutput?.manuscriptPath || 'No output yet'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Retry policy</span>
                    <strong>
                      {scheduledTaskForm.maxRetries && Number(scheduledTaskForm.maxRetries) > 0
                        ? `${scheduledTaskForm.maxRetries} retries / ${scheduledTaskForm.retryDelayMinutes || '30'} min`
                        : 'No automatic retries'}
                    </strong>
                  </div>
                </div>
                {editingScheduledTask?.lastError ? (
                  <div className="import-report-note is-warning">{editingScheduledTask.lastError}</div>
                ) : !scheduledEditorSubject && activeSubject ? (
                  <div className="import-report-note">Use the current subject to keep this scheduled task tied to the manuscript you are already editing.</div>
                ) : !scheduledEditorSubject && !subjects.length ? (
                  <div className="import-report-note">Create a subject in Library first if this automation should stay connected to a manuscript workspace.</div>
                ) : !scheduledEditorSubject ? (
                  <div className="import-report-note">You can save this task without a subject, but linking one keeps the output inside the library workflow.</div>
                ) : null}
                <div className="automation-actions">
                  {activeSubject && scheduledTaskForm.projectId !== activeSubject.id ? (
                    <button type="button" className="secondary-action compact" onClick={assignActiveSubjectToScheduledTask}>
                      <LibraryBig size={16} />
                      Use current subject
                    </button>
                  ) : null}
                  {!subjects.length ? (
                    <button type="button" className="secondary-action compact" onClick={startNewSubjectInLibrary}>
                      <Plus size={16} />
                      Create subject
                    </button>
                  ) : null}
                  {scheduledEditorSubject ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => openSubjectInLibrary(scheduledEditorSubject.id)}
                    >
                      <FolderOpen size={16} />
                      Open subject
                    </button>
                  ) : null}
                  {editingScheduledTask ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleRunScheduledTask(editingScheduledTask.id)}
                    >
                      {busy === `scheduled-run:${editingScheduledTask.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                      Run now
                    </button>
                  ) : null}
                  {editingScheduledOutput && canOpenOutputInStudio(editingScheduledOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleOpenAutomationOutputInStudio(editingScheduledOutput)}
                    >
                      {busy === `output-open:${editingScheduledOutput.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      Open latest output
                    </button>
                  ) : null}
                  {editingScheduledOutput && canReconnectOutputSession(editingScheduledOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeAutomationOutputSession(editingScheduledOutput)}
                    >
                      {busy === `output-resume:${editingScheduledOutput.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      Resume session
                    </button>
                  ) : null}
                  {editingScheduledTask?.lastError ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void copyTextToClipboard(editingScheduledTask.lastError || '', 'Scheduled task error copied.')}
                    >
                      <Copy size={16} />
                      Copy error
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="subject-form-grid">
              <label>
                <span>Task name</span>
                <input
                  value={scheduledTaskForm.name}
                  onChange={(event) => setScheduledTaskForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                <span>Target subject</span>
                <select
                  value={scheduledTaskForm.projectId}
                  onChange={(event) => setScheduledTaskForm((current) => ({ ...current, projectId: event.target.value }))}
                >
                  <option value="">No linked subject</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="subject-form-grid">
              <label>
                <span>Mode</span>
                <select
                  value={scheduledTaskForm.mode}
                  onChange={(event) =>
                    setScheduledTaskForm((current) => ({
                      ...current,
                      mode: event.target.value as ScheduledTaskForm['mode'],
                    }))
                  }
                >
                  <option value="interval">Interval</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="once">Once</option>
                </select>
              </label>
              {scheduledTaskForm.mode === 'interval' ? (
                <label>
                  <span>Interval minutes</span>
                  <input
                    type="number"
                    min="1"
                    value={scheduledTaskForm.intervalMinutes}
                    onChange={(event) =>
                      setScheduledTaskForm((current) => ({ ...current, intervalMinutes: event.target.value }))
                    }
                  />
                </label>
              ) : null}
              {scheduledTaskForm.mode === 'daily' || scheduledTaskForm.mode === 'weekly' ? (
                <label>
                  <span>Run time</span>
                  <input
                    type="time"
                    value={scheduledTaskForm.time}
                    onChange={(event) => setScheduledTaskForm((current) => ({ ...current, time: event.target.value }))}
                  />
                </label>
              ) : null}
              {scheduledTaskForm.mode === 'once' ? (
                <label>
                  <span>Run at</span>
                  <input
                    type="datetime-local"
                    value={scheduledTaskForm.runAt}
                    onChange={(event) => setScheduledTaskForm((current) => ({ ...current, runAt: event.target.value }))}
                  />
                </label>
              ) : null}
            </div>

            {scheduledTaskForm.mode === 'weekly' ? (
              <div className="subject-form">
                <span>Weekdays</span>
                <div className="weekday-selector">
                  {WEEKDAY_OPTIONS.map((item) => {
                    const active = scheduledTaskForm.weekdays.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`weekday-chip${active ? ' is-active' : ''}`}
                        onClick={() => toggleScheduledWeekday(item.value)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="subject-form-grid">
              <label>
                <span>Max retries</span>
                <input
                  type="number"
                  min="0"
                  value={scheduledTaskForm.maxRetries}
                  onChange={(event) => setScheduledTaskForm((current) => ({ ...current, maxRetries: event.target.value }))}
                />
              </label>
              <label>
                <span>Retry delay minutes</span>
                <input
                  type="number"
                  min="1"
                  value={scheduledTaskForm.retryDelayMinutes}
                  onChange={(event) =>
                    setScheduledTaskForm((current) => ({ ...current, retryDelayMinutes: event.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              <span>Task prompt</span>
              <textarea
                value={scheduledTaskForm.prompt}
                onChange={(event) => setScheduledTaskForm((current) => ({ ...current, prompt: event.target.value }))}
              />
            </label>
            <div className="import-report-note">
              {scheduledTaskForm.mode === 'interval'
                ? 'Interval mode repeats after the configured number of minutes, which is useful for steady drafting and review loops.'
                : scheduledTaskForm.mode === 'daily'
                  ? 'Daily mode runs at a fixed time, which fits morning planning, evening review, or recurring columns.'
                  : scheduledTaskForm.mode === 'weekly'
                    ? 'Weekly mode runs on selected weekdays, which fits series content and weekly publishing plans.'
                    : 'One-time mode runs only once at the specified time, which fits launch prep and deadline-driven work.'}
            </div>
            <div className={`import-report-note${canSubmitScheduledTask ? '' : ' is-warning'}`}>
              {canSubmitScheduledTask
                ? `Ready to save. ${scheduledTaskFormSummary}. ${scheduledTaskSubjectHint || 'The current task configuration is complete.'}`
                : `Complete these items before saving: ${scheduledTaskFormIssues.join(' ')}`}
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="primary-action compact"
                disabled={!canSubmitScheduledTask || busy === scheduledSubmitBusyKey}
                onClick={() => void handleSubmitScheduledTask()}
              >
                {busy === scheduledSubmitBusyKey ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
                {editingScheduledTaskId ? 'Save scheduled task' : 'New scheduled task'}
              </button>
              {editingScheduledTaskId ? (
                <button type="button" className="secondary-action compact" onClick={resetScheduledTaskEditor}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>

          <div className="automation-stack">
            {scheduledTasks.length ? (
              scheduledTasks.map((task) => {
                const linkedSubject = task.projectId ? subjectMap.get(task.projectId) || null : null;
                const output = toScheduledAutomationOutput(task);
                return (
                  <article key={task.id} className="automation-item">
                    <div className="automation-head">
                      <div>
                        <strong>{task.name}</strong>
                        <div className="automation-meta">
                          <span>{scheduledModeLabel(task.mode)}</span>
                          <span>{scheduledTaskSummary(task)}</span>
                          <span>{linkedSubject?.name || task.projectId || 'Unlinked subject'}</span>
                          <span>
                            {task.maxRetries
                              ? `Retry ${task.retryCount || 0} / ${task.maxRetries}, delay ${task.retryDelayMinutes || 30} min`
                              : 'No automatic retries'}
                          </span>
                          <span>{task.lastRunAt ? `Last run ${timeAgo(task.lastRunAt)}` : 'Not run yet'}</span>
                          <span>{task.nextRunAt ? `Next run ${timeUntil(task.nextRunAt)}` : 'No next run scheduled'}</span>
                        </div>
                      </div>
                      <span className={`journey-state ${task.enabled ? 'is-complete' : 'is-pending'}`}>
                        {task.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p>{task.prompt}</p>
                    {task.lastError ? <div className="import-report-note is-warning">{task.lastError}</div> : null}
                    {task.lastSavedManuscriptPath ? (
                      <div className="import-report-note">Latest output: {task.lastSavedManuscriptPath}</div>
                    ) : null}
                    {output ? <div className="import-report-note">{describeDraftStrategy(output.draftStrategy)} - {describeDraftStrategyDetail(output)}</div> : null}
                    <div className="automation-actions">
                      <button type="button" className="primary-action compact" onClick={() => void handleRunScheduledTask(task.id)}>
                        {busy === `scheduled-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        Run now
                      </button>
                      {linkedSubject ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => openSubjectInLibrary(linkedSubject.id)}
                        >
                          <LibraryBig size={16} />
                          Open subject
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          Open manuscript
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'continue')}
                        >
                          {busy === `output-redclaw-continue:${output.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                          Continue in RedClaw
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'rewrite')}
                        >
                          {busy === `output-redclaw-rewrite:${output.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                          Rewrite as new draft
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          Resume session
                        </button>
                      ) : null}
                      {output ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputExternally(output)}
                        >
                          {busy === `output-external:${output.id}` ? (
                            <Loader2 className="spin" size={16} />
                          ) : (
                            <ExternalLink size={16} />
                          )}
                          Open in system app
                        </button>
                      ) : null}
                      {task.lastSavedManuscriptPath ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastSavedManuscriptPath || '', 'Manuscript path copied.')}
                        >
                          <Copy size={16} />
                          Copy manuscript path
                        </button>
                      ) : null}
                      <button type="button" className="secondary-action compact" onClick={() => startEditingScheduledTask(task)}>
                        <Settings2 size={16} />
                        {editingScheduledTaskId === task.id ? 'Editing' : 'Edit'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleToggleScheduledTask(task)}>
                        {busy === `scheduled-toggle:${task.id}` ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                        {task.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleRemoveScheduledTask(task.id)}>
                        {busy === `scheduled-remove:${task.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="import-report-note">No scheduled tasks yet.</div>
            )}
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">Automation</div>
          <h3>Long-cycle tasks</h3>
          <div className="subject-form">
            {editingLongCycleTaskId ? (
              <div className="import-report-note">You are editing an existing long-cycle task. Saving will overwrite its current configuration.</div>
            ) : null}
            {editingLongCycleTask || longCycleForm.projectId || activeSubject || !subjects.length ? (
              <div className="task-editor-context">
                <div className="task-editor-head">
                  <div>
                    <span className="subject-workspace-label">Editor context</span>
                    <strong>{editingLongCycleTask ? editingLongCycleTask.name : 'New long-cycle task'}</strong>
                  </div>
                  <span
                    className={`journey-state ${
                      editingLongCycleTask?.lastResult === 'success'
                        ? 'is-complete'
                        : editingLongCycleTask?.lastResult === 'error'
                          ? 'is-pending'
                          : longCycleEditorSubject
                            ? 'is-complete'
                            : 'is-pending'
                    }`}
                  >
                    {editingLongCycleTask?.lastResult === 'error'
                      ? 'Needs recovery'
                      : editingLongCycleTask
                        ? 'Existing task'
                        : longCycleEditorSubject
                          ? 'Linked subject ready'
                          : 'Choose a subject'}
                  </span>
                </div>
                <div className="task-editor-meta-grid">
                  <div className="task-editor-meta">
                    <span>Linked subject</span>
                    <strong>{longCycleEditorSubject?.name || 'No linked subject'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Status</span>
                    <strong>{editingLongCycleTask?.status || 'Draft'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Loop plan</span>
                    <strong>{longCycleTaskFormSummary}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Progress</span>
                    <strong>
                      {editingLongCycleTask ? `${editingLongCycleTask.completedRounds} / ${editingLongCycleTask.totalRounds}` : `${longCycleForm.totalRounds || '7'} rounds planned`}
                    </strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Last run</span>
                    <strong>{editingLongCycleTask?.lastRunAt ? timeAgo(editingLongCycleTask.lastRunAt) : 'Not run yet'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Next run</span>
                    <strong>{editingLongCycleTask?.nextRunAt ? timeUntil(editingLongCycleTask.nextRunAt) : 'Not scheduled yet'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>Latest output</span>
                    <strong>{editingLongCycleOutput?.manuscriptPath || 'No output yet'}</strong>
                  </div>
                </div>
                {editingLongCycleTask?.lastError ? (
                  <div className="import-report-note is-warning">{editingLongCycleTask.lastError}</div>
                ) : !longCycleEditorSubject && activeSubject ? (
                  <div className="import-report-note">Use the current subject to keep this long-cycle loop attached to the manuscript you are actively building.</div>
                ) : !longCycleEditorSubject && !subjects.length ? (
                  <div className="import-report-note">Create a subject in Library first if this loop should stay attached to the manuscript workspace.</div>
                ) : !longCycleEditorSubject ? (
                  <div className="import-report-note">You can save this loop without a subject, but linking one keeps each round inside the library workflow.</div>
                ) : null}
                <div className="automation-actions">
                  {activeSubject && longCycleForm.projectId !== activeSubject.id ? (
                    <button type="button" className="secondary-action compact" onClick={assignActiveSubjectToLongCycleTask}>
                      <LibraryBig size={16} />
                      Use current subject
                    </button>
                  ) : null}
                  {!subjects.length ? (
                    <button type="button" className="secondary-action compact" onClick={startNewSubjectInLibrary}>
                      <Plus size={16} />
                      Create subject
                    </button>
                  ) : null}
                  {longCycleEditorSubject ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => openSubjectInLibrary(longCycleEditorSubject.id)}
                    >
                      <FolderOpen size={16} />
                      Open subject
                    </button>
                  ) : null}
                  {editingLongCycleTask ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleRunLongCycleTask(editingLongCycleTask.id)}
                    >
                      {busy === `long-cycle-run:${editingLongCycleTask.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                      Advance one round
                    </button>
                  ) : null}
                  {editingLongCycleOutput && canOpenOutputInStudio(editingLongCycleOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleOpenAutomationOutputInStudio(editingLongCycleOutput)}
                    >
                      {busy === `output-open:${editingLongCycleOutput.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      Open latest output
                    </button>
                  ) : null}
                  {editingLongCycleOutput && canReconnectOutputSession(editingLongCycleOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeAutomationOutputSession(editingLongCycleOutput)}
                    >
                      {busy === `output-resume:${editingLongCycleOutput.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      Resume session
                    </button>
                  ) : null}
                  {editingLongCycleTask?.lastError ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void copyTextToClipboard(editingLongCycleTask.lastError || '', 'Long-cycle task error copied.')}
                    >
                      <Copy size={16} />
                      Copy error
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="subject-form-grid">
              <label>
                <span>Task name</span>
                <input
                  value={longCycleForm.name}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                <span>Target subject</span>
                <select
                  value={longCycleForm.projectId}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, projectId: event.target.value }))}
                >
                  <option value="">No linked subject</option>
                  {subjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="subject-form-grid">
              <label>
                <span>Interval minutes</span>
                <input
                  type="number"
                  min="1"
                  value={longCycleForm.intervalMinutes}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, intervalMinutes: event.target.value }))}
                />
              </label>
              <label>
                <span>Total rounds</span>
                <input
                  type="number"
                  min="1"
                  value={longCycleForm.totalRounds}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, totalRounds: event.target.value }))}
                />
              </label>
            </div>

            <label>
              <span>Objective</span>
              <textarea
                value={longCycleForm.objective}
                onChange={(event) => setLongCycleForm((current) => ({ ...current, objective: event.target.value }))}
              />
            </label>
            <label>
              <span>Step prompt</span>
              <textarea
                value={longCycleForm.stepPrompt}
                onChange={(event) => setLongCycleForm((current) => ({ ...current, stepPrompt: event.target.value }))}
              />
            </label>

            <div className="subject-form-grid">
              <label>
                <span>Max retries</span>
                <input
                  type="number"
                  min="0"
                  value={longCycleForm.maxRetries}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, maxRetries: event.target.value }))}
                />
              </label>
              <label>
                <span>Retry delay minutes</span>
                <input
                  type="number"
                  min="1"
                  value={longCycleForm.retryDelayMinutes}
                  onChange={(event) =>
                    setLongCycleForm((current) => ({ ...current, retryDelayMinutes: event.target.value }))
                  }
                />
              </label>
            </div>

            <div className={`import-report-note${canSubmitLongCycleTask ? '' : ' is-warning'}`}>
              {canSubmitLongCycleTask
                ? `Ready to save. ${longCycleTaskFormSummary}. ${longCycleTaskSubjectHint || 'The current loop configuration is complete.'}`
                : `Complete these items before saving: ${longCycleTaskFormIssues.join(' ')}`}
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="primary-action compact"
                disabled={!canSubmitLongCycleTask || busy === longCycleSubmitBusyKey}
                onClick={() => void handleSubmitLongCycleTask()}
              >
                {busy === longCycleSubmitBusyKey ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
                {editingLongCycleTaskId ? 'Save long-cycle task' : 'New long-cycle task'}
              </button>
              {editingLongCycleTaskId ? (
                <button type="button" className="secondary-action compact" onClick={resetLongCycleEditor}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>

          <div className="automation-stack">
            {longCycleTasks.length ? (
              longCycleTasks.map((task) => {
                const linkedSubject = task.projectId ? subjectMap.get(task.projectId) || null : null;
                const output = toLongCycleAutomationOutput(task);
                return (
                  <article key={task.id} className="automation-item">
                    <div className="automation-head">
                      <div>
                        <strong>{task.name}</strong>
                        <div className="automation-meta">
                          <span>{task.completedRounds} / {task.totalRounds}</span>
                          <span>{task.status}</span>
                          <span>{linkedSubject?.name || task.projectId || 'Unlinked subject'}</span>
                          <span>
                            {task.maxRetries
                              ? `Retry ${task.retryCount || 0} / ${task.maxRetries}, delay ${task.retryDelayMinutes || 30} min`
                              : 'No automatic retries'}
                          </span>
                          <span>{task.lastRunAt ? `Last run ${timeAgo(task.lastRunAt)}` : 'Not run yet'}</span>
                          <span>{task.nextRunAt ? `Next run ${timeUntil(task.nextRunAt)}` : 'No next run scheduled'}</span>
                        </div>
                      </div>
                      <span className={`journey-state ${task.enabled ? 'is-complete' : 'is-pending'}`}>
                        {task.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p>{task.objective}</p>
                    {task.lastError ? <div className="import-report-note is-warning">{task.lastError}</div> : null}
                    {task.lastSavedManuscriptPath ? (
                      <div className="import-report-note">Latest output: {task.lastSavedManuscriptPath}</div>
                    ) : null}
                    {output ? <div className="import-report-note">{describeDraftStrategy(output.draftStrategy)} - {describeDraftStrategyDetail(output)}</div> : null}
                    <div className="automation-actions">
                      <button type="button" className="primary-action compact" onClick={() => void handleRunLongCycleTask(task.id)}>
                        {busy === `long-cycle-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        Advance one round
                      </button>
                      {linkedSubject ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => openSubjectInLibrary(linkedSubject.id)}
                        >
                          <LibraryBig size={16} />
                          Open subject
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          Open manuscript
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'continue')}
                        >
                          {busy === `output-redclaw-continue:${output.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                          Continue in RedClaw
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'rewrite')}
                        >
                          {busy === `output-redclaw-rewrite:${output.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                          Rewrite as new draft
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          Resume session
                        </button>
                      ) : null}
                      {output ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputExternally(output)}
                        >
                          {busy === `output-external:${output.id}` ? (
                            <Loader2 className="spin" size={16} />
                          ) : (
                            <ExternalLink size={16} />
                          )}
                          Open in system app
                        </button>
                      ) : null}
                      {task.lastSavedManuscriptPath ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastSavedManuscriptPath || '', 'Manuscript path copied.')}
                        >
                          <Copy size={16} />
                          Copy manuscript path
                        </button>
                      ) : null}
                      <button type="button" className="secondary-action compact" onClick={() => startEditingLongCycleTask(task)}>
                        <Settings2 size={16} />
                        {editingLongCycleTaskId === task.id ? 'Editing' : 'Edit'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleToggleLongCycleTask(task)}>
                        {busy === `long-cycle-toggle:${task.id}` ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                        {task.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleRemoveLongCycleTask(task.id)}>
                        {busy === `long-cycle-remove:${task.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="import-report-note">No long-cycle tasks yet.</div>
            )}
          </div>
        </section>
      </section>
    </section>
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    void load()
      .catch((error) => setNotice({ tone: 'warning', text: String(error) }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingNew) {
      setDraft(DEFAULT_DRAFT);
      return;
    }

    if (subjects.length && (!selectedId || !subjects.some((item) => item.id === selectedId))) {
      setSelectedId(subjects[0].id);
      return;
    }

    const current = subjects.find((item) => item.id === selectedId);
    if (!current) {
      setDraft(DEFAULT_DRAFT);
      return;
    }

    setDraft({
      id: current.id,
      name: current.name,
      categoryId: current.categoryId || '',
      description: current.description || '',
      tagsText: current.tags.join(', '),
      attributes: current.attributes || [],
    });
  }, [editingNew, selectedId, subjects]);

  useEffect(() => {
    setRunnerConfigForm({
      intervalMinutes: String(runnerStatus.intervalMinutes || 30),
      maxProjectsPerTick: String(runnerStatus.maxProjectsPerTick || 1),
      maxAutomationPerTick: String(runnerStatus.maxAutomationPerTick || 1),
      keepAliveWhenNoWindow: Boolean(runnerStatus.keepAliveWhenNoWindow),
      heartbeatEnabled: Boolean(runnerStatus.heartbeat?.enabled),
      heartbeatIntervalMinutes: String(runnerStatus.heartbeat?.intervalMinutes || 180),
      heartbeatSuppressEmptyReport: runnerStatus.heartbeat?.suppressEmptyReport ?? true,
      heartbeatReportToMainSession: runnerStatus.heartbeat?.reportToMainSession ?? false,
      heartbeatPrompt: runnerStatus.heartbeat?.prompt || '',
    });
  }, [runnerStatus]);

  useEffect(() => {
    setSettingsConnectionStatus(null);
  }, [settings.aiModel, settings.aiEndpoint, settings.aiApiKey]);

  useEffect(() => {
    const projectStates = runnerStatus.projectStates || {};
    const nextDrafts = Object.fromEntries(
      subjects.map((subject) => [
        subject.id,
        {
          enabled: projectStates[subject.id]?.enabled ?? true,
          prompt: projectStates[subject.id]?.prompt || '',
        },
      ]),
    ) as Record<string, ProjectAutomationDraft>;
    setProjectAutomationDrafts(nextDrafts);
  }, [subjects, runnerStatus.projectStates]);

  useEffect(() => {
    if (!activeSubject) {
      setManuscriptPath('');
      setManuscriptContent('');
      setRedClawFollowUpPrompt('');
      setMessages([]);
      setRuntimeState(EMPTY_RUNTIME);
      setContextUsage(EMPTY_CONTEXT);
      return;
    }

    const path = manuscriptLinks[activeSubject.id] || '';
    if (!path) {
      setManuscriptPath('');
      setManuscriptContent('');
      setRedClawFollowUpPrompt('');
      return;
    }

    void readManuscriptFile(path)
      .then((result) => {
        setManuscriptPath(result.path || path);
        setManuscriptContent(result.content || '');
      })
      .catch((error) => setNotice({ tone: 'warning', text: String(error) }));
  }, [activeSubject, manuscriptLinks]);

  useEffect(() => {
    if (!linkedSession) {
      setRedClawFollowUpPrompt('');
      setMessages([]);
      setRuntimeState(EMPTY_RUNTIME);
      setContextUsage(EMPTY_CONTEXT);
      return;
    }

    void refreshSessionInsights(linkedSession, true);
    const timer = window.setInterval(
      () => {
        void refreshSessionInsights(linkedSession, true);
      },
      runtimeState.isProcessing ? 1400 : 4200,
    );

    return () => window.clearInterval(timer);
  }, [linkedSession, runtimeState.isProcessing]);

  useEffect(() => {
    setRedClawFollowUpPrompt('');
  }, [activeSubject?.id, linkedSession]);

  useEffect(() => {
    if (!runnerStatus.isTicking || view === 'settings') {
      return;
    }

    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
      if (linkedSession) {
        void refreshSessionInsights(linkedSession, true);
      }
    }, 10000);

    return () => window.clearInterval(timer);
  }, [linkedSession, runnerStatus.isTicking, view]);

  if (loading) {
    return (
      <div className="atelier-main">
        <div className="atelier-loading">
          <Loader2 className="spin" size={18} />
          Loading desktop workspace...        </div>
      </div>
    );
  }

  return (
    <div className="atelier-shell">
      <aside className="atelier-rail">
        <div>
          <div className="atelier-brand">
            <div className="atelier-brand-mark">
              <img src="/Box.png" alt="XHS Atelier" />
            </div>
            <div>
              <div className="atelier-brand-name">XHS Atelier</div>
              <div className="atelier-brand-subtitle">A Tauri desktop studio for capture, library, and RedClaw writing</div>
            </div>
          </div>

          <nav className="atelier-nav">
            {NAV_ITEMS.map(({ id, label, caption, Icon }) => (
              <button
                key={id}
                type="button"
                className={`atelier-nav-item${view === id ? ' is-active' : ''}`}
                onClick={() => startTransition(() => setView(id))}
              >
                <Icon className="atelier-nav-icon" size={18} />
                <div>
                  <div className="atelier-nav-label">{label}</div>
                  <div className="atelier-nav-caption">{caption}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="atelier-rail-foot">
          <button
            type="button"
            className="atelier-theme-toggle"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <MoonStar size={16} /> : <SunMedium size={16} />}
            <span>{theme === 'light' ? 'Switch to dark' : 'Switch to light'}</span>
          </button>

          <button
            type="button"
            className="atelier-subtle-link"
            onClick={() => void handleOpenGitHubReleases()}
          >
            {busy === 'open-releases' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            <span>GitHub Releases</span>
          </button>
          <button
            type="button"
            className="atelier-subtle-link"
            onClick={() => void handleOpenIssueTracker()}
          >
            {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            <span>Issue Tracker</span>
          </button>
        </div>
      </aside>

      <main className="atelier-main">
        <header className="atelier-header">
          <div>
            <div className="atelier-header-eyebrow">Desktop MVP</div>
            <div className="atelier-header-title-row">
              <h1>{VIEW_META[view].title}</h1>
            </div>
            <p>{VIEW_META[view].summary}</p>
          </div>

          <div className="atelier-header-meta">
            <div className="atelier-meta-chip">
              <span>Space</span>
              <strong>{spaceName}</strong>
            </div>
            <div className="atelier-meta-chip">
              <span>Version</span>
              <strong>{appVersion}</strong>
            </div>
            <div className="atelier-meta-chip">
              <span>RedClaw</span>
              <strong>{redClawReady ? 'Configured' : 'Needs setup'}</strong>
            </div>
          </div>
        </header>

        {notice ? (
          <div className={`atelier-notice is-${notice.tone}`}>
            {notice.tone === 'success' ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
            <span>{notice.text}</span>
          </div>
        ) : null}

        {view === 'overview' ? overviewView : null}
        {view === 'capture' ? captureView : null}
        {view === 'library' ? libraryView : null}
        {view === 'settings' ? settingsView : null}
      </main>
    </div>
  );
}



