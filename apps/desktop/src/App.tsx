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
const LAUNCH_CHECKLIST_URL = `${REPOSITORY_URL}/blob/main/docs/desktop-launch-checklist.md`;
const RELEASE_FLOW_URL = `${REPOSITORY_URL}/blob/main/docs/desktop-release-flow.md`;
const CONTRIBUTING_URL = `${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`;
const SECURITY_POLICY_URL = `${REPOSITORY_URL}/blob/main/SECURITY.md`;
const BUILD_STEPS = [
  '将桌面端改动推送到 GitHub 仓库',
  '等待 `desktop-validate` 工作流通过',
  '创建 `desktop-v*` 标签或发布版本',
  '在 GitHub 发布页下载安装包',
];
const REDCLAW_FOLLOW_UP_PRESETS = [
  {
    label: '强化开头',
    prompt: '保留原有核心角度，把开头改得更抓人，第一屏就说明读者为什么要继续看下去。',
  },
  {
    label: '压缩重复',
    prompt: '删除重复表达和空话，保留核心信息，让整篇稿件更紧凑更利落。',
  },
  {
    label: '提升转化',
    prompt: '保留正文结构，把结尾 CTA 改得更明确，增加收藏、评论或私信的行动引导。',
  },
  {
    label: '口语润色',
    prompt: '把表达改得更自然口语，但不要牺牲专业度和信息密度。',
  },
] as const;

const VIEW_META: Record<StudioView, { title: string; summary: string }> = {
  overview: {
    title: '从采集到资料库再到 RedClaw 的一体化流程',
    summary: '桌面端围绕采集、沉淀与创作组织工作流，校验与安装包产物统一由 GitHub Actions 远程生成。',
  },
  capture: {
    title: '浏览器桥接、手动采集与 JSON 导入共用一个收件箱',
    summary: '浏览器桥接输入、手动采集和本地 JSON 导入都会先进入同一个收件箱，再转化为可复用的主题。',
  },
  library: {
    title: '从主题卡片直接进入稿件区与 RedClaw',
    summary: '每个主题都可以生成创作 Brief、写入稿件区，并把上下文直接带入 RedClaw 写作会话。',
  },
  settings: {
    title: '统一管理 AI 设置与 GitHub Actions 发布链路',
    summary: '桌面端负责配置、创作与复核，依赖安装、校验、打包与安装包发布统一留在 GitHub Actions 中执行。',
  },
};

const OUTPUT_ARCHIVE_SOURCE_OPTIONS: Array<{ value: OutputArchiveSourceFilter; label: string }> = [
  { value: 'all', label: '全部来源' },
  { value: 'manual', label: '手动生成' },
  { value: 'scheduled', label: '定时任务' },
  { value: 'longCycle', label: '长周期任务' },
];

const DRAFT_STRATEGY_FILTER_OPTIONS: Array<{ value: DraftStrategyFilter; label: string }> = [
  { value: 'all', label: '全部策略' },
  { value: 'fresh', label: '新建草稿' },
  { value: 'continue', label: '续写覆盖' },
  { value: 'rewrite', label: '改写分支' },
];

const NAV_ITEMS: Array<{ id: StudioView; label: string; caption: string; Icon: LucideIcon }> = [
  { id: 'overview', label: '总览', caption: '工作台', Icon: Sparkles },
  { id: 'capture', label: '采集', caption: '收件箱', Icon: Inbox },
  { id: 'library', label: '资料库', caption: '主题资产', Icon: LibraryBig },
  { id: 'settings', label: '设置', caption: '发布与自动化', Icon: Settings2 },
];

const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'OpenAI 兼容接口',
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
    issues.push('请填写 RedClaw 模型名称。');
  }
  if (!normalized.aiEndpoint) {
    issues.push('请填写 RedClaw 接口地址。');
  } else {
    try {
      const parsed = new URL(normalized.aiEndpoint);
      if (!/^https?:$/.test(parsed.protocol)) {
        issues.push('RedClaw 接口地址必须以 http:// 或 https:// 开头。');
      }
    } catch {
      issues.push('RedClaw 接口地址必须是有效 URL，例如 https://api.example.com/v1。');
    }
  }
  if (!normalized.aiApiKey) {
    issues.push('请填写 RedClaw 接口密钥。');
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
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
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
    return `${diffMinutes} 分钟前`;
  }
  if (diffMinutes < 1440) {
    return `${Math.round(diffMinutes / 60)} 小时前`;
  }
  return `${Math.round(diffMinutes / 1440)} 天前`;
};

const timeUntil = (value?: string | number | null) => {
  const diffMinutes = Math.round((toTimestamp(value) - Date.now()) / 60000);
  if (diffMinutes <= 0) {
    return '即将执行';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟后`;
  }
  if (diffMinutes < 1440) {
    return `${Math.round(diffMinutes / 60)} 小时后`;
  }
  return `${Math.round(diffMinutes / 1440)} 天后`;
};

const formatDateTime = (value?: string | number | null) =>
  value ? new Date(toTimestamp(value)).toLocaleString('zh-CN', { hour12: false }) : '未设置';

const scheduledModeLabel = (mode: ScheduledTaskRecord['mode']) =>
  ({ interval: '间隔执行', daily: '每日', weekly: '每周', once: '一次性' })[mode];

const describeRunResult = (result?: 'success' | 'error' | 'skipped' | string) =>
  ({ success: '成功', error: '失败', skipped: '已跳过' })[String(result || '') as 'success' | 'error' | 'skipped'] || String(result || '未知');

const describeLongCycleStatus = (status?: LongCycleTaskRecord['status'] | string) =>
  ({ running: '运行中', paused: '已暂停', completed: '已完成' })[String(status || '') as 'running' | 'paused' | 'completed']
  || String(status || '草稿');

const describeActivityKind = (kind?: string) =>
  ({
    activity: '活动',
    warning: '告警',
    redclaw: 'RedClaw',
    runner: '运行器',
    heartbeat: '心跳',
    scheduled: '定时任务',
    'long-cycle': '长周期任务',
    long_cycle: '长周期任务',
    project: '主题自动化',
    output: '输出',
    capture: '采集',
    import: '导入',
    archive: '归档',
  }[String(kind || '').toLowerCase()]) || String(kind || '活动');

const scheduledTaskSummary = (task: ScheduledTaskRecord) => {
  if (task.mode === 'interval') {
    return `每 ${task.intervalMinutes || 0} 分钟执行一次`;
  }
  if (task.mode === 'daily') {
    return `每天 ${task.time || '--:--'}`;
  }
  if (task.mode === 'weekly') {
    const weekdayText = (task.weekdays || [])
      .map((value) => WEEKDAY_OPTIONS.find((item) => item.value === value)?.label || `星期 ${value}`)
      .join(' / ');
    return `每周 ${weekdayText || '未设置'} ${task.time || '--:--'}`;
  }
  return `单次执行 ${formatDateTime(task.runAt)}`;
};

const describeScheduledTaskForm = (form: ScheduledTaskForm) => {
  if (form.mode === 'interval') {
    return `每 ${parsePositiveInt(form.intervalMinutes, 1440)} 分钟执行一次`;
  }
  if (form.mode === 'daily') {
    return `每天 ${form.time || '--:--'}`;
  }
  if (form.mode === 'weekly') {
    const weekdayText = form.weekdays
      .map((value) => WEEKDAY_OPTIONS.find((item) => item.value === value)?.label || `星期 ${value}`)
      .join(' / ');
    return `每周 ${weekdayText || '未选择星期'} ${form.time || '--:--'}`;
  }
  return form.runAt ? `单次执行 ${formatDateTime(form.runAt)}` : '未设置单次执行时间';
};

const getScheduledTaskFormIssues = (form: ScheduledTaskForm) => {
  const issues: string[] = [];
  if (!form.name.trim()) {
    issues.push('请填写任务名称。');
  }
  if (!form.prompt.trim()) {
    issues.push('请填写任务提示词。');
  }
  if ((form.mode === 'daily' || form.mode === 'weekly') && !form.time) {
    issues.push('请选择执行时间。');
  }
  if (form.mode === 'weekly' && !form.weekdays.length) {
    issues.push('请至少选择一个星期。');
  }
  if (form.mode === 'once' && !form.runAt) {
    issues.push('请选择执行日期和时间。');
  }
  return issues;
};

const describeLongCycleTaskForm = (form: LongCycleTaskForm) =>
  `每 ${parsePositiveInt(form.intervalMinutes, 1440)} 分钟执行一次，共 ${parsePositiveInt(form.totalRounds, 7)} 轮`;

const getLongCycleTaskFormIssues = (form: LongCycleTaskForm) => {
  const issues: string[] = [];
  if (!form.name.trim()) {
    issues.push('请填写任务名称。');
  }
  if (!form.objective.trim()) {
    issues.push('请填写任务目标。');
  }
  if (!form.stepPrompt.trim()) {
    issues.push('请填写单轮提示词。');
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
    '## 创作目标',
    '请根据以下信息产出一篇可继续编辑与发布的小红书草稿。',
    '',
    `- 主题：${subject.name}`,
    `- 分类：${categoryName || '未分类'}`,
    `- 摘要：${subject.description || '请先补充选题角度、目标人群与预期结果。'}`,
    subject.tags.length ? `- 标签：${subject.tags.map((item) => `#${item}`).join(' ')}` : '',
    ...subject.attributes.map((item) => `- ${item.key}: ${item.value}`),
    '',
    '- 输出需包含标题、正文结构、结尾 CTA 和推荐标签。',
    '- 不要保留占位符，也不要输出无关的说明性元话语。',
  ]
    .filter(Boolean)
    .join('\n');

const buildManuscriptTemplate = (subject: SubjectRecord, categoryName: string) => {
  const normalizedCategory = categoryName || '未分类';
  const attributeLines = subject.attributes.length
    ? subject.attributes.map((item) => `- ${item.key}: ${item.value}`)
    : ['- 目标人群：', '- 预期动作：', '- 关键证据：'];
  const tagLine = subject.tags.length ? subject.tags.map((item) => `#${item}`).join(' ') : '#小红书创作';

  return [
    `# ${subject.name}`,
    '',
    '> 稿件状态：待完善',
    `> 主题分类：${normalizedCategory}`,
    '',
    '## 一句话角度',
    subject.description || '请先用一句话写清这篇内容最核心的观点、承诺或结果。',
    '',
    '## 标题备选',
    '- ',
    '- ',
    '- ',
    '',
    '## 开头钩子',
    '先用一个问题、反常识观察或具体场景开头，把读者拉进来。',
    '',
    '## 正文结构',
    '### 1. 核心观点',
    '- ',
    '',
    '### 2. 关键展开',
    '- ',
    '- ',
    '- ',
    '',
    '### 3. 收尾 CTA',
    '给出一个明确动作，引导收藏、评论、私信或下一步行为。',
    '',
    '## 参考信息',
    `- 主题：${subject.name}`,
    `- 分类：${normalizedCategory}`,
    ...attributeLines,
    '',
    '## 推荐标签',
    tagLine,
  ].join('\n');
};

const formatMarkdownInline = (value: string) =>
  value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/(\*\*|__|~~|`)/g, '')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1$2')
    .replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1$2')
    .trim();

const renderMarkdownPreview = (value: string, emptyText = '暂无内容') => {
  const source = value.replace(/\r\n/g, '\n').trim();
  if (!source) {
    return <p className="markdown-preview-empty">{emptyText}</p>;
  }

  const lines = source.split('\n');
  const blocks: JSX.Element[] = [];
  let paragraph: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];
  let quoteLines: string[] = [];
  let codeLines: string[] | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }
    blocks.push(<p key={`p-${blocks.length}`}>{formatMarkdownInline(paragraph.join(' '))}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }

    const listKey = `list-${blocks.length}`;
    if (listType === 'ul') {
      blocks.push(
        <ul key={listKey}>
          {listItems.map((item, index) => (
            <li key={`${listKey}-${index}`}>{formatMarkdownInline(item)}</li>
          ))}
        </ul>,
      );
    } else {
      blocks.push(
        <ol key={listKey}>
          {listItems.map((item, index) => (
            <li key={`${listKey}-${index}`}>{formatMarkdownInline(item)}</li>
          ))}
        </ol>,
      );
    }

    listType = null;
    listItems = [];
  };

  const flushQuote = () => {
    if (!quoteLines.length) {
      return;
    }
    blocks.push(<blockquote key={`quote-${blocks.length}`}>{formatMarkdownInline(quoteLines.join(' '))}</blockquote>);
    quoteLines = [];
  };

  const flushCode = () => {
    if (!codeLines) {
      return;
    }
    blocks.push(
      <pre key={`code-${blocks.length}`} className="markdown-preview-code">
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
    codeLines = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();
      flushQuote();
      if (codeLines) {
        flushCode();
      } else {
        codeLines = [];
      }
      continue;
    }

    if (codeLines) {
      codeLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      const text = formatMarkdownInline(headingMatch[2]);
      if (headingMatch[1].length === 1) {
        blocks.push(<h1 key={`h-${blocks.length}`}>{text}</h1>);
      } else if (headingMatch[1].length === 2) {
        blocks.push(<h2 key={`h-${blocks.length}`}>{text}</h2>);
      } else {
        blocks.push(<h3 key={`h-${blocks.length}`}>{text}</h3>);
      }
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== 'ul') {
        flushList();
      }
      listType = 'ul';
      listItems.push(bulletMatch[1]);
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (listType && listType !== 'ol') {
        flushList();
      }
      listType = 'ol';
      listItems.push(orderedMatch[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushQuote();
  flushCode();

  return <div className="markdown-preview-content">{blocks}</div>;
};

const buildContextId = (spaceName: string, subject: SubjectRecord, manuscriptPath: string) =>
  ['redclaw', spaceName || 'default', subject.id, manuscriptPath || subject.name]
    .join('::')
    .replace(/[\\/ ]+/g, '-');

const compactPath = (value: string, segmentCount = 4) => {
  const normalized = String(value || '').trim().replace(/\\/g, '/');
  if (!normalized) {
    return '';
  }

  const parts = normalized.split('/').filter(Boolean);
  if (parts.length <= segmentCount) {
    return normalized;
  }

  return `.../${parts.slice(-segmentCount).join('/')}`;
};

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
  const [spaceName, setSpaceName] = useState('默认空间');
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
  const [savedManuscriptContent, setSavedManuscriptContent] = useState('');
  const [manuscriptSyncedAt, setManuscriptSyncedAt] = useState<number | null>(null);
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
  const activeSubjectCategoryName = activeSubject ? categoryNameMap.get(activeSubject.categoryId || '') || '' : '';
  const linkedPath = activeSubject ? manuscriptLinks[activeSubject.id] || '' : '';
  const linkedSession = activeSubject ? sessionLinks[activeSubject.id] || '' : '';
  const brief = activeSubject ? buildBrief(activeSubject, activeSubjectCategoryName) : '';
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
    !hasCompleteRedClawConfig ? '请先补全 RedClaw 模型、接口地址和接口密钥。' : '',
    ...settingsSaveIssues,
    !subjects.length ? '请至少创建一个主题，保证工作台有可复用的创作入口。' : '',
    (runnerStatus.contentPackSections || 0) <= 0 ? '内置内容包尚未加载完成，当前构建还不具备发布条件。' : '',
  ].filter(Boolean);
  const launchWarnings = [
    !settingsConnectionStatus ? '发布前请至少完成一次真实的 AI 连接测试。' : '',
    settingsConnectionStatus?.tone === 'warning' ? `最近一次 AI 连接测试失败：${settingsConnectionStatus.detail}` : '',
    !pluginStatus.bridgeDirectory ? '浏览器桥接目录尚未准备完成，但手动采集和本地导入仍可正常使用。' : '',
    !normalizedSettings.exportDirectory ? '当前未设置自定义导出目录，桌面端会回退到工作区目录。' : '',
  ].filter(Boolean);
  const launchChecklist = [
    {
      id: 'ai-settings',
      done: redClawReady,
      title: 'RedClaw 直连配置',
      detail: redClawReady
        ? `${normalizedSettings.aiModel} - ${normalizedSettings.aiEndpoint}`
        : '模型、接口地址和接口密钥仍需补全并验证。',
    },
    {
      id: 'ai-test',
      done: settingsConnectionStatus?.tone === 'success',
      title: '模型连接测试',
      detail: settingsConnectionStatus
        ? `${settingsConnectionStatus.detail}${settingsConnectionStatus.latencyMs ? ` · ${settingsConnectionStatus.latencyMs} ms` : ''}`
        : '发布前请完成一次真实 API 连接测试，确认 Key、路由与模型均可正常工作。',
    },
    {
      id: 'content-pack',
      done: (runnerStatus.contentPackSections || 0) > 0,
      title: '内置内容包',
      detail:
        (runnerStatus.contentPackSections || 0) > 0
          ? `${runnerStatus.contentPackName || 'embedded-xhsspec'} 已加载，共 ${runnerStatus.contentPackSections || 0} 个分区。`
          : '当前尚未检测到可用的内置内容包。',
    },
    {
      id: 'subject-library',
      done: subjects.length > 0,
      title: '主题资料库',
      detail: subjects.length ? `当前已有 ${subjects.length} 个主题可直接进入稿件区 / RedClaw。` : '请先创建至少一个主题。',
    },
    {
      id: 'release-flow',
      done: true,
      title: 'GitHub 发布流程',
      detail: '桌面端校验、打包与安装包发布统一通过 GitHub Actions 执行。',
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
    sourceKind === 'manual' ? '手动生成' : sourceKind === 'scheduled' ? '定时任务' : '长周期任务';
  const describeOutputMode = (sourceKind: OutputArchiveRecord['sourceKind']) => (sourceKind === 'manual' ? '手动' : '自动化');
  const normalizeDraftStrategy = (draftStrategy?: DraftStrategy): DraftStrategy => draftStrategy || 'fresh';
  const describeDraftStrategy = (draftStrategy?: DraftStrategy) =>
    normalizeDraftStrategy(draftStrategy) === 'continue'
      ? '续写并覆盖'
      : normalizeDraftStrategy(draftStrategy) === 'rewrite'
        ? '改写为新分支'
        : '新建草稿';
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
  }, options?: { compactPaths?: boolean; segmentCount?: number }) => {
    const formatPath = (value?: string) => {
      if (!value) {
        return '';
      }
      return options?.compactPaths ? compactPath(value, options.segmentCount ?? 5) : value;
    };
    const normalizedDraftStrategy = normalizeDraftStrategy(output.draftStrategy);
    if (normalizedDraftStrategy === 'rewrite') {
      return output.referenceManuscriptPath
        ? `参考稿件：${formatPath(output.referenceManuscriptPath)}`
        : '该草稿基于更早的稿件改写为一个新的分支版本。';
    }
    if (normalizedDraftStrategy === 'continue') {
      return `覆盖目标：${formatPath(output.referenceManuscriptPath || output.manuscriptPath)}`;
    }
    return '该草稿为从零生成。';
  };
  const outputDisplayTitle = (output: OutputArchiveRecord | AutomationOutputRecord) =>
    ('title' in output ? output.title : output.taskName) || '未命名草稿';
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
  const compactActiveSubjectWorkingPath = compactPath(activeSubjectWorkingPath, 5);
  const hasActiveSubjectWorkingPath = Boolean(activeSubjectWorkingPath.trim());
  const isManuscriptLoaded = Boolean(manuscriptPath.trim());
  const isManuscriptDirty = Boolean(isManuscriptLoaded && manuscriptContent !== savedManuscriptContent);
  const manuscriptWorkspaceDirectory = activeSubjectWorkingPath
    ? compactPath(manuscriptParentPath(activeSubjectWorkingPath) || activeSubjectWorkingPath, 5)
    : '';
  const manuscriptSyncLabel = manuscriptSyncedAt
    ? `最近同步 ${timeAgo(manuscriptSyncedAt)}`
    : isManuscriptLoaded
      ? '已载入当前稿件'
      : '尚未载入稿件';
  const canSendRedClawFollowUp = Boolean(
    activeSubject && linkedSession && hasActiveSubjectWorkingPath && redClawReady && !runtimeState.isProcessing,
  );
  const redClawFollowUpHint = !linkedSession
    ? activeSubjectRecoverableOutput
      ? '请先从上方流程引导中恢复最近一次会话，再在这里继续同一篇草稿。'
      : '请先在 RedClaw 中打开稿件，再从这里发送后续指令。'
    : !hasActiveSubjectWorkingPath
      ? '发送后续请求前，请先创建或重新打开稿件。'
      : runtimeState.isProcessing
        ? '请等待当前这一轮生成完成，再发送新的后续指令。'
        : !redClawReady
          ? '继续会话前，请先在设置页补全 RedClaw 配置。'
          : '后续提示词会直接在当前稿件上修改；如果你需要保留原稿并生成新版本，请使用“改写为新草稿”。';
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
      ? '关联一个主题后，生成出来的稿件会继续留在资料库工作流中。'
      : '如果希望这条自动化始终挂在稿件工作区上，请先去资料库创建主题。'
    : '';
  const longCycleTaskSubjectHint = !longCycleForm.projectId
    ? subjects.length
      ? '关联一个主题后，每一轮结果都会持续沉淀在同一资料库工作区中。'
      : '如果希望这条长周期任务基于可复用稿件持续推进，请先去资料库创建主题。'
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

  const persistManuscriptContent = async (path: string, content: string) => {
    const result = (await window.ipcRenderer.invoke('manuscripts:save', {
      path,
      content,
    })) as { success?: boolean; error?: string };

    if (!result.success) {
      throw new Error(result.error || '保存稿件失败。');
    }
  };

  const saveManuscriptIfDirty = async (successText?: string) => {
    if (!manuscriptPath || !isManuscriptDirty) {
      return false;
    }

    await persistManuscriptContent(manuscriptPath, manuscriptContent);
    setSavedManuscriptContent(manuscriptContent);
    setManuscriptSyncedAt(Date.now());

    if (successText) {
      setNotice({ tone: 'success', text: successText });
    }

    return true;
  };

  const loadManuscriptIntoStudio = async (path: string) => {
    const result = await readManuscriptFile(path);
    const normalizedPath = result.path || path;
    const nextContent = result.content || '';
    setManuscriptPath(normalizedPath);
    setManuscriptContent(nextContent);
    setSavedManuscriptContent(nextContent);
    setManuscriptSyncedAt(Date.now());
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
    const debugPayload = (debug as Partial<DebugStatus>) || {};

    setAppVersion(version || '0.1.0');
    setSettings(normalizeAppSettings({ ...DEFAULT_SETTINGS, ...((rawSettings as Record<string, string>) || {}) }));
    setSpaceName(spacePayload.spaces?.find((item) => item.id === spacePayload.activeSpaceId)?.name || '默认空间');
    setPluginStatus((plugin as PluginStatus) || {});
    setDebugStatus({
      enabled: debugPayload.enabled ?? true,
      logDirectory: debugPayload.logDirectory || '',
    });
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
        throw new Error(result.error || `打开${label}失败。`);
      }

      setNotice({ tone: 'success', text: successText });
    });
  };

  const handleOpenGitHubReleases = async () =>
    handleOpenExternalResource('open-releases', RELEASES_URL, '已打开安装包发布页。', '安装包发布页');

  const handleOpenLaunchChecklist = async () =>
    handleOpenExternalResource(
      'open-launch-checklist',
      LAUNCH_CHECKLIST_URL,
      '已打开桌面端上线检查清单。',
      '桌面端上线检查清单',
    );

  const handleOpenReleaseFlow = async () =>
    handleOpenExternalResource(
      'open-release-flow',
      RELEASE_FLOW_URL,
      '已打开桌面端发布流程文档。',
      '桌面端发布流程文档',
    );

  const handleOpenRepository = async () =>
    handleOpenExternalResource('open-repository', REPOSITORY_URL, '已打开项目仓库。', '项目仓库');

  const handleOpenContributingGuide = async () =>
    handleOpenExternalResource(
      'open-contributing',
      CONTRIBUTING_URL,
      '已打开贡献指南。',
      '贡献指南',
    );

  const handleOpenSecurityPolicy = async () =>
    handleOpenExternalResource(
      'open-security',
      SECURITY_POLICY_URL,
      '已打开安全策略。',
      '安全策略',
    );

  const handleOpenIssueTracker = async () =>
    handleOpenExternalResource('open-issues', ISSUE_TRACKER_URL, '已打开问题反馈页面。', '问题反馈页面');

  const refreshAll = async () => {
    await runAction('refresh', async () => {
      await Promise.all([load(), refreshSessionInsights(linkedSession, true)]);
      setNotice({ tone: 'success', text: '工作台已刷新。' });
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
        text: readyAfterSave ? 'RedClaw 设置已保存，现在可以测试连接。' : '设置已保存。',
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
          title: '连接测试失败',
          detail: result.error || 'RedClaw 连接测试失败。',
          checkedAt: Date.now(),
          resolvedEndpoint: result.resolvedEndpoint,
          model: result.model,
          latencyMs: result.latencyMs,
          reply: result.reply,
        });
        throw new Error(result.error || 'RedClaw 连接测试失败。');
      }

      const detail = `已连接到 ${result.model || nextSettings.aiModel} · ${result.resolvedEndpoint || nextSettings.aiEndpoint}`;
      setSettingsConnectionStatus({
        tone: 'success',
        title: '连接测试通过',
        detail,
        checkedAt: Date.now(),
        resolvedEndpoint: result.resolvedEndpoint || nextSettings.aiEndpoint,
        model: result.model || nextSettings.aiModel,
        latencyMs: result.latencyMs,
        reply: result.reply,
      });
      setNotice({
        tone: 'success',
        text: result.reply ? `RedClaw 连接测试通过：${result.reply}` : 'RedClaw 连接测试通过。',
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
        throw new Error(result.error || '打开导出目录失败。');
      }

      setNotice({
        tone: 'success',
        text: result.usedFallbackDirectory
          ? `已打开回退导出目录：${result.path || '应用工作区'}`
          : `已打开导出目录：${result.path || normalizedSettings.exportDirectory}`,
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
        throw new Error(result.error || '打开工作区目录失败。');
      }

      setNotice({
        tone: 'success',
        text: `已打开工作区目录：${result.path || 'XHSAtelier'}`,
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
        throw new Error(result.error || '创建工作区备份失败。');
      }

      setNotice({
        tone: 'success',
        text: result.path
          ? `工作区备份已保存：${result.path}`
          : '工作区备份已保存，请前往导出目录查看快照。',
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
      '现在恢复这份工作区备份吗？这会替换当前桌面端状态，但不会恢复本地稿件文件或媒体文件。',
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
        throw new Error(result.error || '恢复工作区备份失败。');
      }

      resetScheduledTaskEditor();
      resetLongCycleEditor();
      setEditingNew(false);
      setSelectedId('');
      applyWorkspaceBackupClientState(result.clientState);
      await load();
      setNotice({
        tone: 'success',
        text: `工作区备份已恢复，现已载入 ${result.counts?.subjects || 0} 个主题和 ${result.counts?.captures || 0} 条采集记录。再次执行生成前，请重新填写 RedClaw 接口密钥。`,
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
        throw new Error(result.error || '保存自动化运行器设置失败。');
      }

      await load();
      setNotice({ tone: 'success', text: '自动化运行器设置已保存。' });
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
        throw new Error(result.error || '启动自动化运行器失败。');
      }

      await load();
      setNotice({ tone: 'success', text: '自动化运行器已启动。' });
    });
  };

  const handleStopRunner = async () => {
    await runAction('runner-stop', async () => {
      const result = (await window.ipcRenderer.redclawRunner.stop()) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || '停止自动化运行器失败。');
      }

      await load();
      setNotice({ tone: 'success', text: '自动化运行器已停止。' });
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
        throw new Error(result.error || '保存主题自动化设置失败。');
      }

      await load();
      setNotice({ tone: 'success', text: '主题自动化设置已保存。' });
    });
  };

  const handleSubmitScheduledTask = async () => {
    const currentTaskId = editingScheduledTaskId;
    await runAction(currentTaskId ? `scheduled-save:${currentTaskId}` : 'add-scheduled', async () => {
      if (!scheduledTaskForm.name.trim() || !scheduledTaskForm.prompt.trim()) {
        throw new Error('请填写定时任务名称和提示词。');
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
          throw new Error('每日任务必须设置执行时间。');
        }
        payload.time = scheduledTaskForm.time;
      }

      if (scheduledTaskForm.mode === 'weekly') {
        if (!scheduledTaskForm.time) {
          throw new Error('每周任务必须设置执行时间。');
        }
        if (!scheduledTaskForm.weekdays.length) {
          throw new Error('每周任务至少需要选择一个星期。');
        }
        payload.time = scheduledTaskForm.time;
        payload.weekdays = scheduledTaskForm.weekdays.slice();
      }

      if (scheduledTaskForm.mode === 'once') {
        if (!scheduledTaskForm.runAt) {
          throw new Error('一次性任务必须设置执行时间。');
        }
        payload.runAt = scheduledTaskForm.runAt;
      }

      const result = (currentTaskId
        ? await window.ipcRenderer.redclawRunner.updateScheduled({ taskId: currentTaskId, ...payload })
        : await window.ipcRenderer.redclawRunner.addScheduled(payload)) as { success?: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || (currentTaskId ? '更新定时任务失败。' : '创建定时任务失败。'));
      }

      resetScheduledTaskEditor();
      await load();
      if (currentTaskId) {
        setNotice({ tone: 'success', text: '定时任务已更新。' });
        return;
      }
      setNotice({ tone: 'success', text: '定时任务已创建。' });
    });
  };

  const handleSubmitLongCycleTask = async () => {
    const currentTaskId = editingLongCycleTaskId;
    await runAction(currentTaskId ? `long-cycle-save:${currentTaskId}` : 'add-long-cycle', async () => {
      if (!longCycleForm.name.trim() || !longCycleForm.objective.trim() || !longCycleForm.stepPrompt.trim()) {
        throw new Error('请补全长周期任务名称、任务目标和单轮提示词。');
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
        throw new Error(result.error || (currentTaskId ? '更新长周期任务失败。' : '创建长周期任务失败。'));
      }

      resetLongCycleEditor();
      await load();
      if (currentTaskId) {
        setNotice({ tone: 'success', text: '长周期任务已更新。' });
        return;
      }
      setNotice({ tone: 'success', text: '长周期任务已创建。' });
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
        throw new Error(result.error || '立即执行定时任务失败。');
      }
      await load();
      if (linkedSession) {
        await refreshSessionInsights(linkedSession, true);
      }
      setNotice({ tone: 'success', text: '定时任务已开始执行。' });
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
        throw new Error(result.error || '推进长周期任务失败。');
      }
      await load();
      if (linkedSession) {
        await refreshSessionInsights(linkedSession, true);
      }
      setNotice({ tone: 'success', text: '长周期任务已推进一轮。' });
    });
  };

  const handleToggleScheduledTask = async (task: ScheduledTaskRecord) => {
    await runAction(`scheduled-toggle:${task.id}`, async () => {
      const result = (await window.ipcRenderer.redclawRunner.setScheduledEnabled({
        taskId: task.id,
        enabled: !task.enabled,
      })) as { success?: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || '切换定时任务状态失败。');
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
        throw new Error(result.error || '切换长周期任务状态失败。');
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
        throw new Error(result.error || '删除定时任务失败。');
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
        throw new Error(result.error || '删除长周期任务失败。');
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
        throw new Error('请填写主题名称。');
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
        throw new Error(result.error || '保存主题失败。');
      }

      await load();
      if (result.subject?.id) {
        setEditingNew(false);
        setSelectedId(result.subject.id);
      }
      setNotice({ tone: 'success', text: '主题已保存。' });
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
        throw new Error(result.error || '导出 Markdown 失败。');
      }

      setNotice({ tone: 'success', text: `Markdown 已导出：${result.path}` });
    });
  };

  const handleOpenOrCreateManuscript = async () => {
    if (!activeSubject) {
      return;
    }

    await runAction('manuscript', async () => {
      if (linkedPath) {
        await saveManuscriptIfDirty('重新打开前已自动保存当前稿件。');
        await loadManuscriptIntoStudio(linkedPath);
        setNotice({ tone: 'success', text: '当前稿件已载入编辑区。' });
        return;
      }

      const created = (await window.ipcRenderer.invoke('manuscripts:create-file', {
        parentPath: 'xhs-atelier/redclaw-drafts',
        name: activeSubject.name,
        content: buildManuscriptTemplate(activeSubject, activeSubjectCategoryName),
      })) as { success?: boolean; error?: string; path?: string };

      if (!created.success || !created.path) {
        throw new Error(created.error || '创建稿件失败。');
      }

      rememberManuscript(activeSubject.id, created.path);
      await loadManuscriptIntoStudio(created.path);
      setNotice({ tone: 'success', text: '已创建新的稿件草稿。' });
    });
  };

  const handleSaveManuscript = async () => {
    if (!manuscriptPath) {
      return;
    }
    if (!isManuscriptDirty) {
      setNotice({ tone: 'info', text: '当前稿件没有新的改动。' });
      return;
    }

    await runAction('save-manuscript', async () => {
      await persistManuscriptContent(manuscriptPath, manuscriptContent);
      setSavedManuscriptContent(manuscriptContent);
      setManuscriptSyncedAt(Date.now());
      setNotice({ tone: 'success', text: '稿件已保存。' });
    });
  };

  const handleOpenCurrentManuscriptExternally = async () => {
    const sourcePath = manuscriptPath || linkedPath || '';
    if (!sourcePath) {
      setNotice({ tone: 'warning', text: '当前还没有可打开的稿件。' });
      return;
    }

    await runAction('manuscript-external', async () => {
      await saveManuscriptIfDirty('已先保存当前稿件。');
      const result = await readManuscriptFile(sourcePath);
      if (!result.absolutePath) {
        throw new Error('当前没有可用的稿件绝对路径。');
      }

      const openResult = (await window.ipcRenderer.openAppPath(result.absolutePath)) as {
        success?: boolean;
        error?: string;
      };

      if (!openResult.success) {
        throw new Error(openResult.error || '在系统应用中打开稿件失败。');
      }

      setNotice({ tone: 'success', text: '已在系统应用中打开当前稿件。' });
    });
  };

  const handleCopyBrief = async () => {
    await copyTextToClipboard(brief, '创作 Brief 已复制。');
  };

  const copyTextToClipboard = async (text: string, successText: string) => {
    try {
      const result = (await window.ipcRenderer.invoke('clipboard:write-html', {
        text,
      })) as { success?: boolean; error?: string };

      if (result.success === false) {
        throw new Error(result.error || '复制失败。');
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
      throw new Error(result.error || '预留新稿件路径失败。');
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
      setNotice({ tone: 'warning', text: '请先在设置页补全 RedClaw 的模型、接口地址和接口密钥。' });
      return;
    }

    await runAction(busyKey, async () => {
      await saveManuscriptIfDirty(mode === 'rewrite' ? '改写前已自动保存当前稿件。' : '发送到 RedClaw 前已自动保存当前稿件。');
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
        title: `RedClaw · ${subject.name}`,
        initialContext: `${REDCLAW_CONTEXT}\nCurrent subject: ${subject.name}`,
      });

      if (!session?.id) {
        throw new Error('创建 RedClaw 会话失败。');
      }

      rememberSession(subject.id, session.id);
      setRuntimeState({
        sessionId: session.id,
        isProcessing: true,
        partialResponse: 'RedClaw 正在准备写作请求...',
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
        throw new Error(result.error || '发送稿件到 RedClaw 失败。');
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
        `继续优化 ${subject.name} 当前的小红书稿件，并保持一个清晰、可发布的核心角度。`,
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
      setNotice({ tone: 'warning', text: '这份稿件尚未关联到已有主题，因此暂时不能从这里发起 RedClaw 生成。' });
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
        successText: mode === 'continue' ? '已基于当前稿件继续生成。' : '已将当前稿件改写为新的草稿分支。',
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
      setNotice({ tone: 'warning', text: options.missingSessionText || '当前稿件暂时没有可恢复的 RedClaw 会话。' });
      return;
    }

    await runAction(`${options.action === 'resume' ? 'output-resume' : 'output-open'}:${output.id}`, async () => {
      await saveManuscriptIfDirty('切换稿件前已自动保存当前稿件。');
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
        throw new Error('当前没有可用的稿件绝对路径。');
      }

      const openResult = (await window.ipcRenderer.openAppPath(result.absolutePath)) as {
        success?: boolean;
        error?: string;
      };
      if (!openResult.success) {
        throw new Error(openResult.error || '在系统应用中打开稿件失败。');
      }

      setNotice({ tone: 'success', text: successText });
    });
  };

  const handleOpenAutomationOutputInStudio = async (output: AutomationOutputRecord) =>
    connectOutputToLibrary(output, {
      action: 'open',
      successText: '已切换到最近一次自动化生成的稿件。',
      missingSubjectText: '当前输出尚未关联到已有主题，所以暂时只能在外部应用中打开。',
    });

  const handleResumeAutomationOutputSession = async (output: AutomationOutputRecord) =>
    connectOutputToLibrary(output, {
      action: 'resume',
      successText: '已恢复最近一次自动化输出对应的 RedClaw 会话。',
      missingSubjectText: '当前输出尚未关联到已有主题，因此不能在这里恢复会话。',
      missingSessionText: '当前输出暂时没有可恢复的 RedClaw 会话。',
    });

  const handleOpenAutomationOutputExternally = async (output: AutomationOutputRecord) =>
    openOutputExternally(output, '已在系统应用中打开稿件。');

  const handleOpenArchivedOutputInStudio = async (output: OutputArchiveRecord) => {
    await connectOutputToLibrary(output, {
      action: 'open',
      successText: '已切换到归档稿件。',
      missingSubjectText: '这份归档稿件尚未关联到已有主题，所以暂时只能在外部应用中打开。',
    });
  };

  const handleResumeArchivedOutputSession = async (output: OutputArchiveRecord) =>
    connectOutputToLibrary(output, {
      action: 'resume',
      successText: '已恢复归档稿件对应的 RedClaw 会话。',
      missingSubjectText: '这份归档稿件尚未关联到已有主题，因此不能在这里恢复会话。',
      missingSessionText: '这份归档稿件暂时没有可恢复的 RedClaw 会话。',
    });

  const handleOpenArchivedOutputExternally = async (output: OutputArchiveRecord) =>
    openOutputExternally(output, '已在系统应用中打开归档稿件。');

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
        throw new Error(result.error || '删除归档草稿失败。');
      }

      await load();
      setNotice({ tone: 'success', text: '归档草稿已删除。' });
    });
  };

  const handleClearVisibleArchive = async () => {
    if (!visibleOutputArchive.length) {
      setNotice({ tone: 'warning', text: '当前筛选条件下没有可清理的归档草稿。' });
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
          throw new Error(result.error || '清空归档草稿失败。');
        }
        await load();
        setNotice({ tone: 'success', text: `已清理 ${result.removedCount || 0} 份归档草稿。` });
        return;
      }

      if (canBulkClearVisibleArchive && archiveSourceFilter !== 'all') {
        const result = (await window.ipcRenderer.redclawRunner.clearOutputArchive({
          sourceKind: archiveSourceFilter,
        })) as { success?: boolean; error?: string; removedCount?: number };
        if (!result.success) {
          throw new Error(result.error || '按来源清理归档草稿失败。');
        }
        await load();
        setNotice({ tone: 'success', text: `已清理 ${result.removedCount || 0} 份归档草稿。` });
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
        throw new Error(failedRemoval.error || '清理当前可见归档草稿时发生错误。');
      }
      await load();
      setNotice({ tone: 'success', text: `已清理 ${visibleOutputArchive.length} 份归档草稿。` });
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
        throw new Error(result.error || '清理当前主题关联草稿失败。');
      }

      await load();
      setNotice({ tone: 'success', text: `已清理当前主题下的 ${result.removedCount || 0} 份草稿。` });
    });
  };

  const handleCopyLogDirectory = async () => {
    if (!debugStatus.logDirectory) {
      setNotice({ tone: 'warning', text: '当前还没有可用的日志目录。' });
      return;
    }

    await copyTextToClipboard(debugStatus.logDirectory, '日志目录已复制。');
  };

  const handleRefreshDiagnostics = async () => {
    await runAction('refresh-diagnostics', async () => {
      await load();
      setNotice({ tone: 'success', text: '诊断信息已刷新。' });
    });
  };

  const openSettingsView = () => {
    startTransition(() => setView('settings'));
  };

  const startNewSubjectInLibrary = async () => {
    try {
      await saveManuscriptIfDirty('切换到新建主题前已自动保存当前稿件。');
      setEditingNew(true);
      setSelectedId('');
      startTransition(() => setView('library'));
      return true;
    } catch (error) {
      setNotice({ tone: 'warning', text: String(error) });
      return false;
    }
  };

  const openSubjectInLibrary = async (subjectId: string) => {
    try {
      await saveManuscriptIfDirty('切换主题前已自动保存当前稿件。');
      setEditingNew(false);
      setSelectedId(subjectId);
      startTransition(() => setView('library'));
      return true;
    } catch (error) {
      setNotice({ tone: 'warning', text: String(error) });
      return false;
    }
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
      successText: 'RedClaw 已完成一轮生成。',
    });
  };

  const handleSendRedClawFollowUp = async () => {
    if (!activeSubject) {
      return;
    }
    if (!linkedSession) {
      setNotice({ tone: 'warning', text: '当前还没有关联中的 RedClaw 会话，请先在 RedClaw 中打开稿件。' });
      return;
    }
    if (!hasActiveSubjectWorkingPath) {
      setNotice({ tone: 'warning', text: '请先创建或重新打开稿件，再发送后续修改指令。' });
      return;
    }

    const instruction = redClawFollowUpPrompt.trim();
    if (!instruction) {
      setNotice({ tone: 'warning', text: '请先输入发给 RedClaw 的后续修改指令。' });
      return;
    }
    if (!redClawReady) {
      startTransition(() => setView('settings'));
      setNotice({ tone: 'warning', text: '继续当前会话前，请先补全 RedClaw 设置。' });
      return;
    }

    await runAction('redclaw-follow-up', async () => {
      await saveManuscriptIfDirty('发送后续指令前已自动保存当前稿件。');
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
        partialResponse: 'RedClaw 正在修改当前稿件...',
        updatedAt: Date.now(),
      });

      const result = (await window.ipcRenderer.chat.sendMessage({
        sessionId: linkedSession,
        message: packet.content,
        displayContent: `后续修改 / ${activeSubject.name}`,
        taskHints: packet.taskHints,
      })) as {
        success?: boolean;
        error?: string;
        savedManuscriptPath?: string;
      };

      if (!result.success) {
        throw new Error(result.error || '向 RedClaw 发送后续修改请求失败。');
      }

      if (result.savedManuscriptPath) {
        rememberManuscript(activeSubject.id, result.savedManuscriptPath);
        await loadManuscriptIntoStudio(result.savedManuscriptPath);
      }

      await Promise.all([refreshSessionInsights(linkedSession, true), load()]);
      setRedClawFollowUpPrompt('');
      setNotice({ tone: 'success', text: 'RedClaw 已将后续修改指令应用到当前稿件。' });
    });
  };

  const handleRewriteCurrentManuscript = async () => {
    if (!activeSubject) {
      return;
    }

    const sourcePath = manuscriptPath || linkedPath || '';
    if (!sourcePath.trim()) {
      setNotice({ tone: 'warning', text: '请先创建或打开稿件，再使用“改写为新草稿”。' });
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
      successText: 'RedClaw 已基于当前稿件生成新的改写版本。',
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
        throw new Error(result.error || result.failed?.[0]?.error || '导入文件失败。');
      }

      await load();
      setNotice({ tone: 'success', text: 'Files imported into inbox.' });
    });
  };

  const overviewView = (
    <section className="atelier-view">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker">当前重点</div>
          <h2>创作 Brief -&gt; 稿件区 -&gt; RedClaw</h2>
          <p>桌面端现在已经把创作 Brief、稿件编辑和 RedClaw 生成串成一个连续工作流，普通用户也可以直接上手使用。</p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={() => void refreshAll()}>
              {busy === 'refresh' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              刷新工作台
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => startTransition(() => setView('library'))}
            >
              打开资料库
            </button>
          </div>
        </div>

        <div className="hero-orbit">
          <div className="hero-orbit-card">
            <div className="hero-orbit-label">就绪度</div>
            <div className="hero-orbit-value">
              {subjects.length} 个主题 / {captures.length} 条收件箱记录 / {pluginStatus.pendingItems || 0} 个待导入桥接文件
            </div>
            <ul>
              <li>桥接目录：{pluginStatus.bridgeDirectory ? '已准备' : '未准备'}</li>
              <li>AI 连接：{redClawReady ? '已配置' : '待配置'}</li>
              <li>内置内容包：{runnerStatus.contentPackName || 'embedded-xhsspec'} / {runnerStatus.contentPackSections || 0} 个分区</li>
              <li>桌面端校验和发布统一通过 GitHub Actions 执行</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">收件箱</div>
          <div className="stat-value">{captures.length}</div>
          <div className="stat-detail">浏览器桥接、手动采集和文件导入都会先汇总到这里。</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">资料库</div>
          <div className="stat-value">{subjects.length}</div>
          <div className="stat-detail">这里存放可直接进入稿件区和 RedClaw 的主题资产。</div>
        </article>
        <article className="stat-card">
          <div className="stat-label">RedClaw</div>
          <div className="stat-value">{runtimeState.isProcessing ? '运行中' : '空闲'}</div>
          <div className="stat-detail">{runtimeState.partialResponse || '这里会显示当前生成状态。'}</div>
        </article>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">最近动态</div>
          <h3>近期活动</h3>
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
                    <div className="activity-kind">{describeActivityKind(item.kind)}</div>
                    <p>{item.detail || '暂无更多说明。'}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="import-report-note">当前还没有最近活动记录。</div>
            )}
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">桌面端发布</div>
          <h3>GitHub Actions 发布流程</h3>
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
              打开发布页
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenLaunchChecklist()}
            >
              {busy === 'open-launch-checklist' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
              打开上线清单
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenIssueTracker()}
            >
              {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
              反馈问题
            </button>
          </div>
        </section>
      </section>

      <section className="atelier-card">
        <div className="section-tag">归档</div>
        <h3>最近输出归档</h3>
        <div className="info-grid">
          <div className="info-item">
            <span>总输出数</span>
            <strong>{outputArchive.length}</strong>
          </div>
          <div className="info-item">
            <span>手动输出</span>
            <strong>{manualOutputArchiveCount}</strong>
          </div>
          <div className="info-item">
            <span>自动化输出</span>
            <strong>{automatedOutputArchiveCount}</strong>
          </div>
          <div className="info-item">
            <span>最近输出</span>
            <strong>{outputArchive[0] ? timeAgo(outputArchive[0].createdAt) : '暂无记录'}</strong>
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
            清空当前结果
          </button>
        </div>

        <div className="import-report-note">
          {visibleOutputArchive.length === outputArchive.length
            ? `当前展示全部 ${outputArchive.length} 条归档输出。`
            : `当前展示 ${visibleOutputArchive.length} / ${outputArchive.length} 条归档输出。`}
        </div>
        <div className="import-report-note">“续写覆盖”会覆盖当前稿件，“改写分支”会保留原稿并新建一个 RedClaw 分支草稿。</div>

        <div className="automation-stack">
          {visibleOutputArchive.length ? (
            visibleOutputArchive.map((item) => (
              <article key={item.id} className="automation-item">
                <div className="automation-head">
                  <div>
                    <strong>{item.title}</strong>
                    <div className="automation-meta">
                      <span>{describeOutputSourceKind(item.sourceKind)}</span>
                      <span>{item.projectName || '未关联主题'}</span>
                      <span>{timeAgo(item.createdAt)}</span>
                      <span>{describeDraftStrategy(item.draftStrategy)}</span>
                    </div>
                  </div>
                  <span className={`journey-state ${item.sourceKind === 'manual' ? 'is-pending' : 'is-complete'}`}>
                    {describeOutputMode(item.sourceKind)}
                  </span>
                </div>
                <div className="import-report-note workspace-path-note" title={item.manuscriptPath}>
                  {compactPath(item.manuscriptPath, 5)}
                </div>
                <div className="import-report-note workspace-path-note" title={describeDraftStrategyDetail(item)}>
                  {describeDraftStrategyDetail(item, { compactPaths: true, segmentCount: 5 })}
                </div>
                {item.summary ? <p>{item.summary}</p> : null}
                <div className="automation-actions">
                  {canOpenOutputInStudio(item) ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleOpenArchivedOutputInStudio(item)}
                    >
                      {busy === `output-open:${item.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      打开稿件
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(item) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(item, 'continue')}
                    >
                      {busy === `output-redclaw-continue:${item.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                      在 RedClaw 中继续
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(item) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(item, 'rewrite')}
                    >
                      {busy === `output-redclaw-rewrite:${item.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      改写为新草稿
                    </button>
                  ) : null}
                  {canReconnectOutputSession(item) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeArchivedOutputSession(item)}
                    >
                      {busy === `output-resume:${item.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      恢复会话
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void handleOpenArchivedOutputExternally(item)}
                  >
                    {busy === `output-external:${item.id}` ? <Loader2 className="spin" size={16} /> : <ExternalLink size={16} />}
                    用系统应用打开
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void copyTextToClipboard(item.manuscriptPath, '稿件路径已复制。')}
                  >
                    <Copy size={16} />
                    复制路径
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void handleRemoveArchivedOutput(item.id)}
                  >
                    {busy === `output-remove:${item.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                    删除
                  </button>
                </div>
              </article>
            ))
          ) : outputArchive.length ? (
            <div className="import-report-note">当前筛选条件下没有匹配的归档输出，可以换个关键词或来源再试。</div>
          ) : (
            <div className="import-report-note">当前还没有归档输出。等你把草稿发给 RedClaw 或运行自动化任务后，历史版本会逐步沉淀到这里。</div>
          )}
        </div>
      </section>
    </section>
  );
  const captureView = (
    <section className="atelier-view">
      <section className="capture-grid">
        <section className="capture-card">
          <div className="section-tag">手动采集</div>
          <h3>手动录入到收件箱</h3>
          <div className="subject-form">
            <label>
              <span>来源链接</span>
              <input
                value={captureForm.sourceUrl}
                onChange={(event) => setCaptureForm((current) => ({ ...current, sourceUrl: event.target.value }))}
              />
            </label>
            <label>
              <span>标题</span>
              <input
                value={captureForm.title}
                onChange={(event) => setCaptureForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label>
              <span>标签</span>
              <input
                value={captureForm.tagsText}
                onChange={(event) => setCaptureForm((current) => ({ ...current, tagsText: event.target.value }))}
              />
            </label>
            <label>
              <span>摘要</span>
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
                    throw new Error(result.error || '创建收件箱记录失败。');
                }

                setCaptureForm(DEFAULT_CAPTURE);
                await load();
                setNotice({ tone: 'success', text: '收件箱记录已添加。' });
              })
            }
          >
            {busy === 'capture' ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
            添加到收件箱
          </button>
        </section>

        <section className="capture-card">
          <div className="section-tag">桥接</div>
          <h3>浏览器桥接</h3>
          <div className="info-grid">
            <div className="info-item">
              <span>桥接目录</span>
              <strong>{pluginStatus.bridgeDirectory || '尚未准备'}</strong>
            </div>
            <div className="info-item">
              <span>待处理</span>
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
                    throw new Error(result.error || '准备桥接目录失败。');
                  }
                  await load();
                  setNotice({ tone: 'success', text: '桥接目录已准备。' });
                })
              }
            >
              {busy === 'bridge' ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
              准备桥接目录
            </button>

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
                    throw new Error(result.error || '导入桥接文件失败。');
                  }
                  await load();
                  setNotice({ tone: 'success', text: '桥接文件已导入。' });
                })
              }
            >
              {busy === 'import-bridge' ? <Loader2 className="spin" size={16} /> : <Upload size={16} />}
              从桥接目录导入
            </button>
          </div>
        </section>

        <section className="capture-card">
          <div className="section-tag">JSON 导入</div>
          <h3>导入 JSON / JSONL 文件</h3>
          <button type="button" className="file-dropzone" onClick={() => fileRef.current?.click()}>
            <div className="file-dropzone-head">
              <span>本地导入</span>
              <Upload size={16} />
            </div>
            <strong>{busy === 'import-files' ? '正在导入文件...' : '拖拽或选择本地 JSON / JSONL 文件'}</strong>
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
        <div className="section-tag">收件箱</div>
        <h3>收件箱条目</h3>
        <div className="capture-list">
          {captures.length ? (
            captures.map((item) => (
              <article key={item.id} className="capture-item">
                <div className="capture-item-top">
                  <div>
                    <h4>{item.title || '未命名条目'}</h4>
                    <p>{item.description || '暂无描述'}</p>
                  </div>
                  <span className={`journey-state ${item.status === 'converted' ? 'is-complete' : 'is-pending'}`}>
                    {item.status === 'converted' ? '已转主题' : '待处理'}
                  </span>
                </div>
                <div className="capture-item-meta">
                  <span>{item.authorName || '未知作者'}</span>
                  <span>{item.sourceUrl || '无来源链接'}</span>
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
                          throw new Error(result.error || '将收件箱条目提升为主题失败。');
                        }

                        await load();
                        if (result.subject?.id) {
                          const switched = await openSubjectInLibrary(result.subject.id);
                          if (!switched) {
                            return;
                          }
                        } else {
                          startTransition(() => setView('library'));
                        }
                        setNotice({ tone: 'success', text: '收件箱条目已转为主题。' });
                      })
                    }
                  >
                    {busy === item.id ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                    转为主题
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="import-report-note">当前还没有收件箱内容。</div>
          )}
        </div>
      </section>
    </section>
  );
  const libraryView = (
    <section className="atelier-view atelier-view-wide">
      <section className="library-grid">
        <section className="atelier-card">
          <div className="library-header">
            <div>
              <div className="section-tag">主题架</div>
              <h3>主题资料库</h3>
            </div>
            <div className="search-field">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索主题、标签或摘要" />
            </div>
          </div>

          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void startNewSubjectInLibrary()}
          >
            <Plus size={16} />
            新建主题
          </button>

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
                    onClick={() => void openSubjectInLibrary(item.id)}
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
                            {categoryNameMap.get(item.categoryId || '') || '未分类'}
                          </div>
                          <h4>{item.name}</h4>
                        </div>
                        <span className={`subject-status-chip ${!editingNew && item.id === activeSubject?.id ? 'is-editing' : 'is-draft'}`}>
                          {!editingNew && item.id === activeSubject?.id ? '编辑中' : '主题'}
                        </span>
                      </div>
                      <p>{item.description || '暂无摘要'}</p>
                      <div className="subject-card-meta">
                        <span>{timeAgo(item.updatedAt)}</span>
                      </div>
                    </div>
                  </button>
                </article>
              ))
            ) : (
              <div className="import-report-note">当前还没有主题。先创建一个主题，才能进入完整创作工作流。</div>
            )}
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">编辑器</div>
          <h3>{editingNew ? '新建主题' : '编辑当前主题'}</h3>
          <div className="subject-form">
            <div className="subject-form-grid">
              <label>
                <span>主题名称</span>
                <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>标签</span>
                <input
                  value={draft.tagsText}
                  onChange={(event) => setDraft((current) => ({ ...current, tagsText: event.target.value }))}
                />
              </label>
            </div>

            <div className="subject-editor-meta-grid">
              <label>
                <span>分类</span>
                <select
                  value={draft.categoryId}
                  onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                >
                  <option value="">未分类</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>关联稿件</span>
                <input value={linkedPath || '尚未关联'} readOnly />
              </label>
              <label>
                <span>RedClaw 会话</span>
                <input value={linkedSession || '尚未关联'} readOnly />
              </label>
            </div>

            <label>
              <span>摘要</span>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              />
            </label>

            <div className="subject-editor-actions">
              <button type="button" className="primary-action" onClick={() => void handleSaveSubject()}>
                {busy === 'subject' ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                {draft.id ? '保存主题' : '创建主题'}
              </button>
              <button type="button" className="secondary-action" disabled={!activeSubject} onClick={() => void handleExportSubject()}>
                {busy === 'export' ? <Loader2 className="spin" size={16} /> : <FileDown size={16} />}
                导出 Markdown
              </button>
            </div>
          </div>
        </section>
      </section>

      {activeSubject ? (
        <section className="atelier-card">
          <div className="section-tag">创作工作区</div>
          <div className="workspace-shell">
            <div className="workspace-shell-head">
              <div>
                <h3>{activeSubject.name} 的创作工作台</h3>
                <p className="workspace-shell-summary">
                  这里把 Brief、稿件编辑和 RedClaw 会话放在同一个宽屏工作区里。桌面端会优先保护当前稿件，切换主题、
                  恢复历史稿件、在系统中打开或发送到 RedClaw 前，都会先尝试保存当前内容。
                </p>
              </div>

              <div className="workspace-shell-actions">
                <button type="button" className="secondary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                  {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                  {hasActiveSubjectWorkingPath ? '打开稿件' : '创建稿件'}
                </button>
                <button
                  type="button"
                  className="secondary-action compact"
                  disabled={!isManuscriptLoaded}
                  onClick={() => void handleSaveManuscript()}
                >
                  {busy === 'save-manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                  保存稿件
                </button>
                <button
                  type="button"
                  className="secondary-action compact"
                  disabled={!hasActiveSubjectWorkingPath}
                  onClick={() => void handleOpenCurrentManuscriptExternally()}
                >
                  {busy === 'manuscript-external' ? <Loader2 className="spin" size={16} /> : <ExternalLink size={16} />}
                  系统打开
                </button>
                <button type="button" className="primary-action compact" onClick={() => void handleSendToRedClaw()}>
                  {busy === 'redclaw' ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                  {linkedSession ? '继续 RedClaw' : '发送到 RedClaw'}
                </button>
              </div>
            </div>

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
                    <span className="subject-workspace-label">步骤 1</span>
                    <h4>连接检查</h4>
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
                      ? '待配置'
                      : settingsConnectionStatus?.tone === 'success'
                        ? '已验证'
                        : settingsConnectionStatus?.tone === 'warning'
                          ? '需重试'
                          : '未测试'}
                  </span>
                </div>
                <p className="workspace-guide-summary">
                  {!redClawReady
                    ? settingsSaveIssues[0] || '开始生成前，请先补全模型、接口地址和接口密钥。'
                    : settingsConnectionStatus?.tone === 'success'
                      ? `${settingsConnectionStatus.model || normalizedSettings.aiModel} 已通过 ${
                          settingsConnectionStatus.resolvedEndpoint || normalizedSettings.aiEndpoint
                        } 连接就绪。`
                      : settingsConnectionStatus?.tone === 'warning'
                        ? settingsConnectionStatus.detail
                        : '把主题送入 RedClaw 前，建议先跑一次真实连接测试。'}
                </p>
                <div className="subject-workspace-actions">
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => startTransition(() => setView('settings'))}
                  >
                    <Settings2 size={16} />
                    打开设置
                  </button>
                  {redClawReady ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleTestRedClawConnection()}
                    >
                      {busy === 'settings-test' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                      {settingsConnectionStatus?.tone === 'success' ? '重新测试连接' : '测试连接'}
                    </button>
                  ) : null}
                </div>
              </article>

              <article className={`workspace-guide-card ${hasActiveSubjectWorkingPath ? 'is-ready' : 'is-info'}`}>
                <div className="workspace-guide-top">
                  <div>
                    <span className="subject-workspace-label">步骤 2</span>
                    <h4>稿件区</h4>
                  </div>
                  <span className={`workspace-guide-status ${hasActiveSubjectWorkingPath ? 'is-ready' : 'is-info'}`}>
                    {hasActiveSubjectWorkingPath ? '已就绪' : '先创建'}
                  </span>
                </div>
                <p className="workspace-guide-summary">
                  {hasActiveSubjectWorkingPath
                    ? '当前主题已经关联到可编辑稿件，适合继续打磨、保存和分支改写。'
                    : '先根据 Brief 创建稿件，这样桌面端才能保存编辑、重新打开草稿并继续派生改写版本。'}
                </p>
                {hasActiveSubjectWorkingPath ? (
                  <div className="import-report-note workspace-path-note" title={activeSubjectWorkingPath}>
                    {compactActiveSubjectWorkingPath}
                  </div>
                ) : null}
                <div className="subject-workspace-actions">
                  <button type="button" className="secondary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                    {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                    {hasActiveSubjectWorkingPath ? '重新载入稿件' : '创建稿件'}
                  </button>
                  {hasActiveSubjectWorkingPath ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void copyTextToClipboard(activeSubjectWorkingPath, '稿件路径已复制。')}
                    >
                      <Copy size={16} />
                      复制稿件路径
                    </button>
                  ) : (
                    <button type="button" className="secondary-action compact" onClick={() => void handleCopyBrief()}>
                      <Copy size={16} />
                      复制 Brief
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
                    <span className="subject-workspace-label">步骤 3</span>
                    <h4>RedClaw 会话</h4>
                  </div>
                  <span
                    className={`workspace-guide-status ${
                      linkedSession ? 'is-ready' : activeSubjectRecoverableOutput ? 'is-warning' : 'is-info'
                    }`}
                  >
                    {linkedSession ? '已关联' : activeSubjectRecoverableOutput ? '可恢复' : '未开始'}
                  </span>
                </div>
                <p className="workspace-guide-summary">
                  {linkedSession
                    ? runtimeState.isProcessing
                      ? '当前会话正在生成中。你可以刷新运行状态查看最新上下文，也可以继续编辑当前稿件。'
                      : '当前主题已经关联到 RedClaw 会话，你可以随时继续当前草稿，或另起一个改写分支。'
                    : activeSubjectRecoverableOutput
                      ? `检测到来自 ${outputDisplayTitle(activeSubjectRecoverableOutput)} 的可恢复会话，可以直接接回，无需从头开始。`
                      : activeSubjectLatestOutput
                        ? '这个主题已经有草稿，但当前没有活跃会话。你可以打开最新草稿，或者基于当前稿件重新发起一轮。'
                        : hasActiveSubjectWorkingPath
                          ? '当前还没有 RedClaw 会话。把稿件发送给 RedClaw 后，就会创建第一条实时写作会话。'
                          : '请先创建稿件，再送到 RedClaw 开始实时写作流程。'}
                </p>
                <div className="subject-workspace-actions">
                  {linkedSession ? (
                    <>
                      <button type="button" className="primary-action compact" onClick={() => void handleSendToRedClaw()}>
                        {busy === 'redclaw' ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        在 RedClaw 中继续
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void refreshSessionInsights(linkedSession)}
                      >
                        <RefreshCw size={16} />
                        刷新状态
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
                        恢复最近会话
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
                        打开最近草稿
                      </button>
                    </>
                  ) : hasActiveSubjectWorkingPath ? (
                    <button type="button" className="primary-action compact" onClick={() => void handleSendToRedClaw()}>
                      {busy === 'redclaw' ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                      打开 RedClaw
                    </button>
                  ) : (
                    <button type="button" className="secondary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                      {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      先创建稿件
                    </button>
                  )}
                </div>
              </article>
            </div>

            <div className="subject-workspace-grid">
              <div className="subject-workspace-card">
                <div className="subject-workspace-head">
                  <div>
                    <span className="subject-workspace-label">创作 Brief</span>
                    <strong>{activeSubject.name}</strong>
                  </div>
                  <div className="subject-workspace-actions">
                    <button type="button" className="secondary-action compact" onClick={() => void handleCopyBrief()}>
                      <Copy size={16} />
                      复制 Brief
                    </button>
                    <button type="button" className="secondary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                      {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      {linkedPath ? '打开稿件' : '创建稿件'}
                    </button>
                  </div>
                </div>
                <div className="workspace-brief-meta">
                  <span>{activeSubjectCategoryName || '未分类'}</span>
                  <span>{activeSubject.tags.length ? `标签 ${activeSubject.tags.length}` : '暂无标签'}</span>
                  <span>{activeSubject.attributes.length ? `字段 ${activeSubject.attributes.length}` : '未补充结构化字段'}</span>
                </div>
                <div className="markdown-preview-pane workspace-brief-pane">
                  <div className="workspace-preview-paper">
                    {renderMarkdownPreview(brief, '当前主题还没有可预览的创作 Brief。')}
                  </div>
                </div>
              </div>

              <div className="subject-workspace-card workspace-priority-card">
                <div className="subject-workspace-head">
                  <div>
                    <span className="subject-workspace-label">稿件区</span>
                    <strong>{hasActiveSubjectWorkingPath ? '当前工作稿件' : '尚未创建稿件'}</strong>
                  </div>
                  <div className="subject-workspace-actions">
                    <button
                      type="button"
                      className="secondary-action compact"
                      disabled={!isManuscriptLoaded}
                      onClick={() => void handleSaveManuscript()}
                    >
                      {busy === 'save-manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      保存稿件
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      disabled={!hasActiveSubjectWorkingPath}
                      onClick={() => void handleOpenCurrentManuscriptExternally()}
                    >
                      {busy === 'manuscript-external' ? <Loader2 className="spin" size={16} /> : <ExternalLink size={16} />}
                      系统打开
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      disabled={!hasActiveSubjectWorkingPath}
                      onClick={() => void copyTextToClipboard(activeSubjectWorkingPath, '稿件路径已复制。')}
                    >
                      <Copy size={16} />
                      复制路径
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      disabled={!hasActiveSubjectWorkingPath}
                      onClick={() => void handleRewriteCurrentManuscript()}
                    >
                      {busy === 'redclaw-rewrite' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                      改写为新草稿
                    </button>
                  </div>
                </div>

                <div className="workspace-editor-meta">
                  <span className={`workspace-meta-chip ${hasActiveSubjectWorkingPath ? 'is-ready' : 'is-warning'}`}>
                    {hasActiveSubjectWorkingPath ? '稿件已关联' : '还未创建稿件'}
                  </span>
                  {hasActiveSubjectWorkingPath ? (
                    <span className={`workspace-meta-chip ${isManuscriptDirty ? 'is-warning' : 'is-ready'}`}>
                      {isManuscriptDirty ? '有未保存修改' : '稿件已保存'}
                    </span>
                  ) : null}
                  {hasActiveSubjectWorkingPath ? <span>快捷保存 Ctrl/Cmd + S</span> : null}
                  <span>{manuscriptSyncLabel}</span>
                  {manuscriptWorkspaceDirectory ? <span title={activeSubjectWorkingPath}>{manuscriptWorkspaceDirectory}</span> : null}
                </div>

                <p className="workspace-editor-note">
                  编辑区会优先给正文留出足够宽度，适合大屏连续写作；预览区放在下方，用来检查段落节奏、标题层级和 CTA 是否顺手。
                </p>

                {hasActiveSubjectWorkingPath ? (
                  <>
                    <div className="import-report-note workspace-path-note" title={activeSubjectWorkingPath}>
                      {compactActiveSubjectWorkingPath}
                    </div>
                    <div className="workspace-editor-stack">
                      <div className="markdown-preview-column">
                        <span className="subject-workspace-label">正文编辑区</span>
                        <textarea
                          className="subject-workspace-editor workspace-editor-textarea"
                          value={manuscriptContent}
                          onChange={(event) => setManuscriptContent(event.target.value)}
                          placeholder="从这里开始继续完善你的正文。"
                        />
                      </div>

                      <div className="markdown-preview-column">
                        <div className="workspace-preview-head">
                          <div>
                            <span className="subject-workspace-label">格式预览</span>
                            <strong>按发布阅读效果检查版式</strong>
                          </div>
                          <div className="workspace-preview-tip">
                            这里用于检查段落长短、标题层级和列表节奏，不会压缩上方编辑区的宽度。
                          </div>
                        </div>
                        <div className="markdown-preview-pane workspace-preview-pane">
                          <div className="workspace-preview-paper">
                            {renderMarkdownPreview(manuscriptContent, '稿件内容为空，暂时没有可预览内容。')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="workspace-editor-empty">
                    <strong>先创建一份可编辑稿件</strong>
                    <p>创建后会直接生成一份正文模板，并进入宽屏编辑模式。你可以先改正文，再发给 RedClaw 做续写或改写。</p>
                    <div className="subject-workspace-actions">
                      <button type="button" className="primary-action compact" onClick={() => void handleOpenOrCreateManuscript()}>
                        {busy === 'manuscript' ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                        创建稿件
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="subject-workspace-grid">
              <div className="subject-workspace-card runtime-panel">
                <div className="subject-workspace-head">
                  <div>
                    <span className="subject-workspace-label">运行状态</span>
                    <strong>{linkedSession || '未关联会话'}</strong>
                  </div>
                  <div className="subject-workspace-actions">
                    <button
                      type="button"
                      className="secondary-action compact"
                      disabled={!linkedSession}
                      onClick={() => void refreshSessionInsights(linkedSession)}
                    >
                      <RefreshCw size={16} />
                      刷新状态
                    </button>
                  </div>
                </div>

                <div className="runtime-summary">
                  <div className={`runtime-chip ${!linkedSession ? 'is-warning' : runtimeState.isProcessing ? 'is-live' : 'is-idle'}`}>
                    {!linkedSession ? '未连接' : runtimeState.isProcessing ? '生成中' : '空闲'}
                  </div>
                  <div className="runtime-summary-text">
                    {!linkedSession
                      ? activeSubjectRecoverableOutput
                        ? '当前没有活跃会话，可以从上方流程区恢复最近一次可接续的会话。'
                        : '当前还没有活跃会话，请先把稿件发到 RedClaw。'
                      : runtimeState.partialResponse || '当前还没有流式输出。'}
                  </div>
                </div>

                <div className="runtime-meter">
                  <span style={{ width: `${compactPercent}%` }} />
                </div>

                <div className="runtime-grid">
                  <div className="runtime-stat">
                    <span>上下文</span>
                    <strong>{contextUsage.contextType || 'xhs-atelier:redclaw-entry'}</strong>
                  </div>
                  <div className="runtime-stat">
                    <span>消息数</span>
                    <strong>{contextUsage.messageCount || 0}</strong>
                  </div>
                  <div className="runtime-stat">
                    <span>预估令牌</span>
                    <strong>{contextUsage.estimatedTotalTokens || 0}</strong>
                  </div>
                  <div className="runtime-stat">
                    <span>阈值</span>
                    <strong>{contextUsage.compactThreshold || 24000}</strong>
                  </div>
                  <div className="runtime-stat">
                    <span>内容包令牌</span>
                    <strong>{contextUsage.embeddedPromptTokens || 0}</strong>
                  </div>
                  <div className="runtime-stat">
                    <span>历史令牌</span>
                    <strong>{contextUsage.activeHistoryTokens || 0}</strong>
                  </div>
                  <div className="runtime-stat">
                    <span>更新时间</span>
                    <strong>{runtimeState.updatedAt ? timeAgo(runtimeState.updatedAt) : '刚刚更新'}</strong>
                  </div>
                </div>
              </div>

              <div className="subject-workspace-card">
                <div className="subject-workspace-head">
                  <div>
                    <span className="subject-workspace-label">RedClaw 会话</span>
                    <strong>{linkedSession || '未关联会话'}</strong>
                  </div>
                </div>

                <div className="subject-redclaw-log">
                  {messages.length ? (
                    messages.map((item) => (
                      <article key={item.id} className={`subject-redclaw-message${item.role === 'user' ? ' is-user' : ''}`}>
                        <div className="subject-redclaw-meta">
                          <span>{item.role === 'user' ? '你' : 'RedClaw'}</span>
                          <span>{timeAgo(item.created_at)}</span>
                        </div>
                        {item.displayContent || item.display_content ? (
                          <div className="subject-redclaw-display">{item.displayContent || item.display_content}</div>
                        ) : null}
                        <div className="markdown-preview-pane is-compact">
                          {renderMarkdownPreview(item.content, '暂无消息内容。')}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="subject-redclaw-empty">
                      <strong>当前还没有对话记录</strong>
                      <p>先把稿件发送给 RedClaw，后续就可以在这里继续续写、压缩、润色或派生改写版本。</p>
                    </div>
                  )}
                </div>

                <div className="subject-redclaw-composer">
                  <div className="subject-workspace-head">
                    <div>
                      <span className="subject-workspace-label">后续指令</span>
                      <strong>{linkedSession ? '继续当前会话' : '当前还未关联会话'}</strong>
                    </div>
                  </div>

                  <div className="workspace-follow-up-presets">
                    <div className="workspace-follow-up-label">常用补充指令</div>
                    <div className="workspace-follow-up-chip-row">
                      {REDCLAW_FOLLOW_UP_PRESETS.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          className="workspace-follow-up-chip"
                          disabled={!linkedSession}
                          onClick={() => setRedClawFollowUpPrompt(item.prompt)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="subject-redclaw-input"
                    value={redClawFollowUpPrompt}
                    onChange={(event) => setRedClawFollowUpPrompt(event.target.value)}
                    placeholder="例如：开头更抓人，保留原结构，并把结尾 CTA 写得更有行动感。"
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
                      发送指令
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      disabled={!redClawFollowUpPrompt}
                      onClick={() => setRedClawFollowUpPrompt('')}
                    >
                      <CircleDashed size={16} />
                      清空
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="subject-form">
            <div className="subject-workspace-head">
              <div>
                <span className="subject-workspace-label">草稿历史</span>
                <strong>{activeSubjectOutputArchive.length ? `共 ${activeSubjectOutputArchive.length} 份最近草稿` : '暂时还没有归档草稿'}</strong>
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
                    清空当前主题历史
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
                    <div className="import-report-note workspace-path-note" title={item.manuscriptPath}>
                      {compactPath(item.manuscriptPath, 5)}
                    </div>
                    <div className="import-report-note workspace-path-note" title={describeDraftStrategyDetail(item)}>
                      {describeDraftStrategyDetail(item, { compactPaths: true, segmentCount: 5 })}
                    </div>
                    {item.summary ? <p>{item.summary}</p> : null}
                    <div className="automation-actions">
                      {canOpenOutputInStudio(item) ? (
                        <button
                          type="button"
                          className="primary-action compact"
                          onClick={() => void handleOpenArchivedOutputInStudio(item)}
                        >
                          {busy === `output-open:${item.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          打开稿件
                        </button>
                      ) : null}
                      {canOpenOutputInStudio(item) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(item, 'continue')}
                        >
                          {busy === `output-redclaw-continue:${item.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                          在 RedClaw 中续写
                        </button>
                      ) : null}
                      {canOpenOutputInStudio(item) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(item, 'rewrite')}
                        >
                          {busy === `output-redclaw-rewrite:${item.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                          改写为新草稿
                        </button>
                      ) : null}
                      {canReconnectOutputSession(item) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeArchivedOutputSession(item)}
                        >
                          {busy === `output-resume:${item.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          恢复会话
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void handleOpenArchivedOutputExternally(item)}
                      >
                        {busy === `output-external:${item.id}` ? <Loader2 className="spin" size={16} /> : <ExternalLink size={16} />}
                        在系统中打开
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void copyTextToClipboard(item.manuscriptPath, '稿件路径已复制。')}
                      >
                        <Copy size={16} />
                        复制路径
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void handleRemoveArchivedOutput(item.id)}
                      >
                        {busy === `output-remove:${item.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                        删除
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="import-report-note">当前主题还没有归档草稿。等你执行 RedClaw 或自动化任务后，历史版本会逐步沉淀在这里。</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="atelier-card">
          <div className="section-tag">创作工作区</div>
          <h3>先选择一个主题开始</h3>
          <div className="import-report-note">先创建或选中一个主题，然后就可以生成创作 Brief、打开稿件，并进入 RedClaw 创作流程。</div>
        </section>
      )}
    </section>
  );
  const settingsView = (
    <section className="atelier-view">
      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">RedClaw</div>
          <h3>智能连接设置</h3>
          <div className="settings-grid">
            <label>
              <span>接口类型</span>
              <input
                value={settings.aiProvider}
                onChange={(event) => setSettings((current) => ({ ...current, aiProvider: event.target.value }))}
              />
            </label>
            <label>
              <span>模型名称</span>
              <input
                value={settings.aiModel}
                placeholder="例如：gpt-4.1-mini"
                onChange={(event) => setSettings((current) => ({ ...current, aiModel: event.target.value }))}
              />
            </label>
            <label>
              <span>接口地址</span>
              <input
                value={settings.aiEndpoint}
                placeholder="例如：https://api.example.com/v1 或 /v1/responses"
                onChange={(event) => setSettings((current) => ({ ...current, aiEndpoint: event.target.value }))}
              />
            </label>
            <label>
              <span>接口密钥</span>
              <input
                type="password"
                value={settings.aiApiKey}
                onChange={(event) => setSettings((current) => ({ ...current, aiApiKey: event.target.value }))}
              />
            </label>
            <label>
              <span>导出目录</span>
              <input
                value={settings.exportDirectory}
                onChange={(event) => setSettings((current) => ({ ...current, exportDirectory: event.target.value }))}
              />
            </label>
          </div>

          <div className="import-report-note">桌面端支持填写 OpenAI 兼容的基础地址，也支持完整的 `/chat/completions` 或 `/responses` 地址。上面的“接口类型”主要用于记录与区分当前配置。</div>
          <div className="info-grid">
            <div className="info-item">
              <span>当前状态</span>
              <strong>{redClawReady ? '已可直接生成' : '仍需补全设置'}</strong>
            </div>
            <div className="info-item">
              <span>阻塞项</span>
              <strong>{settingsSaveIssues.length || runnerStatus.configurationIssues?.length ? `${settingsSaveIssues.length || runnerStatus.configurationIssues?.length} 项` : '暂无阻塞'}</strong>
            </div>
            <div className="info-item">
              <span>最近测试</span>
              <strong>{settingsConnectionStatus ? timeAgo(new Date(settingsConnectionStatus.checkedAt).toISOString()) : '尚未测试'}</strong>
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
              保存设置
            </button>
            <button type="button" className="secondary-action" onClick={() => void handleTestRedClawConnection()}>
              {busy === 'settings-test' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
              测试连接
            </button>
            <button type="button" className="secondary-action" onClick={() => void handleOpenExportDirectory()}>
              {busy === 'open-export-directory' ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
              打开导出目录
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => startTransition(() => setView('library'))}
            >
              前往资料库
            </button>
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">发布</div>
          <h3>GitHub Actions 发布准备</h3>
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
              <span>桥接目录</span>
              <strong>{pluginStatus.bridgeDirectory || '尚未准备桥接目录'}</strong>
            </div>
            <div className="info-item">
              <span>待处理项</span>
              <strong>{pluginStatus.pendingItems || 0}</strong>
            </div>
            <div className="info-item">
              <span>最近同步</span>
              <strong>{pluginStatus.lastSyncAt ? timeAgo(pluginStatus.lastSyncAt) : '尚未同步'}</strong>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenGitHubReleases()}
            >
              {busy === 'open-releases' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
              打开安装包发布页
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleOpenReleaseFlow()}
            >
              {busy === 'open-release-flow' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
              打开发布流程
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() =>
                void runAction('open-bridge', async () => {
                  const result = await window.ipcRenderer.browserPlugin.openDir();
                  if (!result.success) {
                    throw new Error(result.error || '打开桥接目录失败。');
                  }
                })
              }
            >
              <FolderOpen size={15} />
              打开桥接目录
            </button>
          </div>
        </section>
      </section>

      <section className="atelier-card">
        <div className="section-tag">备份</div>
        <h3>工作区快照</h3>
        <div className="import-report-note">
          在大规模导入、换机迁移或发布测试前，建议先创建一份 JSON 快照。快照会保存应用状态、自动化配置、归档历史，以及本地稿件和会话的关联关系；RedClaw 接口密钥与原始稿件/媒体文件不会被包含进去。
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
            创建备份快照
          </button>
          <button type="button" className="secondary-action compact" onClick={() => backupFileRef.current?.click()}>
            {busy === 'workspace-backup-import' ? <Loader2 className="spin" size={15} /> : <Upload size={15} />}
            恢复快照
          </button>
          <button type="button" className="secondary-action compact" onClick={() => void handleOpenWorkspaceDirectory()}>
            {busy === 'open-workspace-directory' ? <Loader2 className="spin" size={15} /> : <FolderOpen size={15} />}
            打开工作区目录
          </button>
        </div>
        <div className="import-report-note">
          恢复快照会覆盖当前桌面端状态。若要完整迁移，请同时保留工作区目录和导出目录，再配合这份 JSON 快照一起转移。
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
        <div className="section-tag">上线准备</div>
        <h3>发布前检查清单</h3>
        <div className="import-report-note">这个面板只追踪真正会阻塞发布的问题和需要人工确认的风险项。当阻塞项归零后，就可以通过 `desktop-v*` 标签触发 GitHub Actions 生成安装包。</div>
        <div className="settings-actions">
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenLaunchChecklist()}
          >
            {busy === 'open-launch-checklist' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
            查看清单
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenIssueTracker()}
          >
            {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            提交阻塞问题
          </button>
        </div>

        <div className="info-grid launch-info-grid">
          <div className="info-item">
            <span>当前状态</span>
            <strong>{!launchBlockers.length ? '已具备发布候选条件' : `还有 ${launchBlockers.length} 项阻塞`}</strong>
          </div>
          <div className="info-item">
            <span>提醒项</span>
            <strong>{launchWarnings.length ? `还有 ${launchWarnings.length} 项待确认` : '暂无额外提醒'}</strong>
          </div>
          <div className="info-item">
            <span>桥接状态</span>
            <strong>{pluginStatus.bridgeDirectory ? '已准备' : '可选，尚未准备'}</strong>
          </div>
          <div className="info-item">
            <span>发布方式</span>
            <strong>仅通过 GitHub Actions</strong>
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
              <span>当前阻塞项已全部清零，桌面端已进入可准备打标签发布的状态。</span>
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
        <div className="section-tag">支持</div>
        <h3>文档与社区入口</h3>
        <div className="import-report-note">安装、配置和发布说明统一以仓库文档为准。Bug 和功能请求统一走 GitHub Issue 表单；如果涉及敏感问题，请先阅读安全策略后再公开反馈。</div>
        <div className="info-grid launch-info-grid">
          <div className="info-item">
            <span>仓库</span>
            <strong>开源主仓库</strong>
          </div>
          <div className="info-item">
            <span>贡献</span>
            <strong>PR 规范与范围说明</strong>
          </div>
          <div className="info-item">
            <span>安全</span>
            <strong>优先私下披露</strong>
          </div>
          <div className="info-item">
            <span>问题入口</span>
            <strong>已启用 GitHub 表单</strong>
          </div>
        </div>
        <div className="settings-actions">
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenRepository()}
          >
            {busy === 'open-repository' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            打开仓库
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenContributingGuide()}
          >
            {busy === 'open-contributing' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
            打开贡献指南
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenSecurityPolicy()}
          >
            {busy === 'open-security' ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
            打开安全策略
          </button>
          <button
            type="button"
            className="secondary-action compact"
            onClick={() => void handleOpenIssueTracker()}
          >
            {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            打开 Issue 表单
          </button>
        </div>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">自动化控制</div>
          <h3>RedClaw 自动化运行器</h3>
          <div className="info-grid">
            <div className="info-item">
              <span>运行器</span>
              <strong>{runnerStatus.isTicking ? '运行中' : '已停止'}</strong>
            </div>
            <div className="info-item">
              <span>下次轮询</span>
              <strong>{runnerStatus.nextTickAt ? timeUntil(runnerStatus.nextTickAt) : '尚未安排'}</strong>
            </div>
            <div className="info-item">
              <span>心跳上报</span>
              <strong>{runnerStatus.heartbeat?.enabled ? '已开启' : '已关闭'}</strong>
            </div>
            <div className="info-item">
              <span>下次自动化</span>
              <strong>{runnerStatus.nextAutomationFireAt ? timeUntil(runnerStatus.nextAutomationFireAt) : '暂无待执行任务'}</strong>
            </div>
            <div className="info-item">
              <span>最近轮询</span>
              <strong>{runnerStatus.lastTickAt ? timeAgo(runnerStatus.lastTickAt) : '暂无最近记录'}</strong>
            </div>
          </div>

          <div className="import-report-note">
            Rust 运行器负责调度、排队和后台执行。这里集中管理轮询频率、心跳上报以及主题级自动化配置。
          </div>

          <div className="subject-form">
            <div className="subject-form-grid">
              <label>
                <span>轮询间隔（分钟）</span>
                <input
                  type="number"
                  min="1"
                  value={runnerConfigForm.intervalMinutes}
                  onChange={(event) => setRunnerConfigForm((current) => ({ ...current, intervalMinutes: event.target.value }))}
                />
              </label>
              <label>
                <span>每轮最多处理主题数</span>
                <input
                  type="number"
                  min="1"
                  value={runnerConfigForm.maxProjectsPerTick}
                  onChange={(event) => setRunnerConfigForm((current) => ({ ...current, maxProjectsPerTick: event.target.value }))}
                />
              </label>
              <label>
                <span>每轮最多处理自动化任务数</span>
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
                <span>无窗口时保持运行</span>
                <select
                  value={runnerConfigForm.keepAliveWhenNoWindow ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      keepAliveWhenNoWindow: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="false">否</option>
                  <option value="true">是</option>
                </select>
              </label>
              <label>
                <span>启用心跳</span>
                <select
                  value={runnerConfigForm.heartbeatEnabled ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      heartbeatEnabled: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="false">否</option>
                  <option value="true">是</option>
                </select>
              </label>
              <label>
                <span>心跳间隔（分钟）</span>
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
                <span>无内容时不发送心跳</span>
                <select
                  value={runnerConfigForm.heartbeatSuppressEmptyReport ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      heartbeatSuppressEmptyReport: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">是</option>
                  <option value="false">否</option>
                </select>
              </label>
              <label>
                <span>同步到主会话</span>
                <select
                  value={runnerConfigForm.heartbeatReportToMainSession ? 'true' : 'false'}
                  onChange={(event) =>
                    setRunnerConfigForm((current) => ({
                      ...current,
                      heartbeatReportToMainSession: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="false">否</option>
                  <option value="true">是</option>
                </select>
              </label>
              <label>
                <span>下次心跳</span>
                <input
                  readOnly
                  value={runnerStatus.heartbeat?.nextRunAt ? timeUntil(runnerStatus.heartbeat.nextRunAt) : '尚未安排'}
                />
              </label>
            </div>

            <label>
              <span>心跳提示词</span>
              <textarea
                value={runnerConfigForm.heartbeatPrompt}
                onChange={(event) => setRunnerConfigForm((current) => ({ ...current, heartbeatPrompt: event.target.value }))}
                placeholder="可选：说明心跳报告需要总结哪些内容。"
              />
            </label>
          </div>

          {runnerStatus.lastError ? <div className="import-report-note is-warning">{runnerStatus.lastError}</div> : null}

          <div className="settings-actions">
            <button type="button" className="primary-action compact" onClick={() => void handleSaveRunnerConfig()}>
              {busy === 'runner-config' ? <Loader2 className="spin" size={16} /> : <Settings2 size={16} />}
              保存运行器设置
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleStartRunner()}
              disabled={Boolean(runnerStatus.isTicking)}
            >
              {busy === 'runner-start' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              {runnerStatus.isTicking ? '运行器运行中' : '启动运行器'}
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleStopRunner()}
              disabled={!runnerStatus.isTicking}
            >
              {busy === 'runner-stop' ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
              停止运行器
            </button>
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">主题自动化</div>
          <h3>主题级自动化</h3>
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
                          <span>{categoryNameMap.get(subject.categoryId || '') || '未分类'}</span>
                          <span>{projectState?.lastRunAt ? `最近运行 ${timeAgo(projectState.lastRunAt)}` : '尚未运行'}</span>
                          <span>{projectState?.lastResult ? `最近结果：${describeRunResult(projectState.lastResult)}` : '暂无运行结果'}</span>
                        </div>
                      </div>
                      <span className={`journey-state ${draft.enabled ? 'is-complete' : 'is-pending'}`}>
                        {draft.enabled ? '已启用' : '已停用'}
                      </span>
                    </div>

                    <div className="subject-form">
                      <div className="subject-form-grid">
                        <label>
                          <span>自动化状态</span>
                          <select
                            value={draft.enabled ? 'enabled' : 'disabled'}
                            onChange={(event) =>
                              patchProjectAutomationDraft(subject.id, { enabled: event.target.value === 'enabled' })
                            }
                          >
                            <option value="enabled">启用</option>
                            <option value="disabled">停用</option>
                          </select>
                        </label>
                        <label>
                          <span>当前来源</span>
                          <input
                            readOnly
                            value={manuscriptLinks[subject.id] ? '稿件 + 主题 Brief' : '仅主题 Brief'}
                          />
                        </label>
                      </div>

                      <label>
                        <span>主题提示词</span>
                        <textarea
                          value={draft.prompt}
                          onChange={(event) => patchProjectAutomationDraft(subject.id, { prompt: event.target.value })}
                          placeholder="可选：为这个主题补充长期自动化提示词，例如方向、节奏、约束和参考依据。"
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
                        保存设置
                      </button>
                      {subject.id === activeSubject?.id ? (
                        <button type="button" className="secondary-action compact" onClick={() => startTransition(() => setView('library'))}>
                          打开主题
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="import-report-note">请先创建至少一个主题，再配置主题级自动化。</div>
            )}
          </div>
        </section>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">诊断</div>
          <h3>诊断总览</h3>
          <div className="info-grid">
            <div className="info-item">
              <span>活动数</span>
              <strong>{automationActivities.length}</strong>
            </div>
            <div className="info-item">
              <span>告警数</span>
              <strong>{automationWarnings.length ? `${automationWarnings.length} 项` : '无'}</strong>
            </div>
            <div className="info-item">
              <span>调试日志</span>
              <strong>{debugStatus.enabled ? '已开启' : '已关闭'}</strong>
            </div>
            <div className="info-item">
              <span>最近活动</span>
              <strong>{latestAutomationActivity ? timeAgo(latestAutomationActivity.createdAt) : '暂时没有记录'}</strong>
            </div>
          </div>

          <label>
            <span>调试日志目录</span>
            <input readOnly value={debugStatus.logDirectory || '暂无日志目录'} />
          </label>

          <div className="import-report-note">
            出现故障时，优先使用下面的恢复队列直接跳到对应处理入口，而不是自己去翻日志和表单。
          </div>

          {diagnosticsRecoveryCount ? (
            <div className="automation-stack">
              {redClawRecoveryNeeded ? (
                <article className="automation-item">
                  <div className="automation-head">
                    <div>
                      <strong>RedClaw 设置或连接需要处理</strong>
                      <div className="automation-meta">
                        <span>{runnerConfigurationIssues.length ? `${runnerConfigurationIssues.length} 项配置问题` : '还没有连接测试结果'}</span>
                        <span>{settingsConnectionStatus?.checkedAt ? `最近检测 ${timeAgo(settingsConnectionStatus.checkedAt)}` : '尚未通过测试'}</span>
                      </div>
                    </div>
                    <span className="journey-state is-pending">需要处理</span>
                  </div>
                  <p>
                    {runnerConfigurationIssues[0]
                      || (settingsConnectionStatus?.tone === 'warning'
                        ? settingsConnectionStatus.detail
                        : '在依赖手动生成或自动化生成之前，请先做一次真实的 RedClaw 连接测试。')}
                  </p>
                  <div className="automation-actions">
                    <button type="button" className="primary-action compact" onClick={openSettingsView}>
                      <Settings2 size={16} />
                      打开设置
                    </button>
                    {redClawReady ? (
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void handleTestRedClawConnection()}
                      >
                        {busy === 'settings-test' ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                        {settingsConnectionStatus ? '重新测试连接' : '测试连接'}
                      </button>
                    ) : null}
                    {runnerConfigurationIssues.length ? (
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void copyTextToClipboard(runnerConfigurationIssues.join('\n'), '配置问题已复制。')}
                      >
                        <Copy size={16} />
                        复制问题
                      </button>
                    ) : null}
                  </div>
                </article>
              ) : null}

              {runnerStatus.lastError ? (
                <article className="automation-item">
                  <div className="automation-head">
                    <div>
                      <strong>自动化运行器出现错误</strong>
                      <div className="automation-meta">
                        <span>{runnerStatus.isTicking ? '运行器运行中' : '运行器已停止'}</span>
                        <span>{runnerStatus.lastTickAt ? `最近轮询 ${timeAgo(runnerStatus.lastTickAt)}` : '暂无最近轮询'}</span>
                      </div>
                    </div>
                    <span className="journey-state is-pending">运行器异常</span>
                  </div>
                  <p>{runnerStatus.lastError}</p>
                  <div className="automation-actions">
                    <button type="button" className="primary-action compact" onClick={() => void handleRefreshDiagnostics()}>
                      {busy === 'refresh-diagnostics' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                      刷新诊断
                    </button>
                    <button type="button" className="secondary-action compact" onClick={openSettingsView}>
                      <Settings2 size={16} />
                      打开设置
                    </button>
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void copyTextToClipboard(runnerStatus.lastError || '', '运行器错误已复制。')}
                    >
                      <Copy size={16} />
                      复制错误
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
                        <span>主题自动化</span>
                        <span>{state?.lastRunAt ? `最近运行 ${timeAgo(state.lastRunAt)}` : '还没有成功运行过'}</span>
                        <span>{state?.lastResult ? `结果：${describeRunResult(state.lastResult)}` : '暂无结果记录'}</span>
                      </div>
                    </div>
                    <span className="journey-state is-pending">主题异常</span>
                  </div>
                  <p>{state?.lastError || '主题自动化报告了错误，但没有额外细节。'}</p>
                  <div className="automation-actions">
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void openSubjectInLibrary(subject.id)}
                    >
                      <LibraryBig size={16} />
                      打开主题
                    </button>
                    <button type="button" className="secondary-action compact" onClick={openSettingsView}>
                      <Settings2 size={16} />
                      打开设置
                    </button>
                    {state?.lastError ? (
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => void copyTextToClipboard(state.lastError || '', '主题自动化错误已复制。')}
                      >
                        <Copy size={16} />
                        复制错误
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
                          <span>定时任务</span>
                          <span>{scheduledModeLabel(task.mode)}</span>
                          <span>{task.lastRunAt ? `最近运行 ${timeAgo(task.lastRunAt)}` : '尚未运行'}</span>
                          <span>{task.projectId ? subjectNameMap.get(task.projectId) || task.projectId : '未关联主题'}</span>
                        </div>
                      </div>
                      <span className="journey-state is-pending">建议重试</span>
                    </div>
                    <p>{task.lastError || '这条定时任务以上次执行报错结束。'}</p>
                    <div className="automation-actions">
                      <button
                        type="button"
                        className="primary-action compact"
                        onClick={() => void handleRunScheduledTask(task.id)}
                      >
                        {busy === `scheduled-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        立即执行
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => openScheduledTaskInSettings(task)}
                      >
                        <Settings2 size={16} />
                        编辑任务
                      </button>
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          打开稿件
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          恢复会话
                        </button>
                      ) : null}
                      {task.lastError ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastError || '', '定时任务错误已复制。')}
                        >
                          <Copy size={16} />
                          复制错误
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
                          <span>长周期任务</span>
                          <span>{task.completedRounds} / {task.totalRounds}</span>
                          <span>{task.lastRunAt ? `最近运行 ${timeAgo(task.lastRunAt)}` : '尚未运行'}</span>
                          <span>{task.projectId ? subjectNameMap.get(task.projectId) || task.projectId : '未关联主题'}</span>
                        </div>
                      </div>
                      <span className="journey-state is-pending">建议重试</span>
                    </div>
                    <p>{task.lastError || '这条长周期任务以上次执行报错结束。'}</p>
                    <div className="automation-actions">
                      <button
                        type="button"
                        className="primary-action compact"
                        onClick={() => void handleRunLongCycleTask(task.id)}
                      >
                        {busy === `long-cycle-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        推进一轮
                      </button>
                      <button
                        type="button"
                        className="secondary-action compact"
                        onClick={() => openLongCycleTaskInSettings(task)}
                      >
                        <Settings2 size={16} />
                        编辑任务
                      </button>
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          打开稿件
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          恢复会话
                        </button>
                      ) : null}
                      {task.lastError ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastError || '', '长周期任务错误已复制。')}
                        >
                          <Copy size={16} />
                          复制错误
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="import-report-note">当前没有待处理的恢复动作，自动化诊断处于稳定状态。</div>
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
                    <div className="activity-kind">{describeActivityKind(item.kind || 'warning')}</div>
                    <p>{item.detail || '暂无更多细节。'}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="import-report-note">当前没有新的运行器告警或心跳异常。</div>
          )}

          <div className="settings-actions">
            <button type="button" className="primary-action compact" onClick={() => void handleRefreshDiagnostics()}>
              {busy === 'refresh-diagnostics' ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              刷新诊断
            </button>
            <button
              type="button"
              className="secondary-action compact"
              onClick={() => void handleCopyLogDirectory()}
              disabled={!debugStatus.logDirectory}
            >
              <Copy size={16} />
              复制日志目录
            </button>
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">追踪</div>
          <h3>自动化轨迹</h3>
          {latestAutomationActivity ? (
            <div className="import-report-note">
              {`最近事件：${describeActivityKind(latestAutomationActivity.kind)}，发生于 ${timeAgo(latestAutomationActivity.createdAt)}`}
            </div>
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
                    <div className="activity-kind">{describeActivityKind(item.kind || 'activity')}</div>
                    <p>{item.detail || '暂无更多细节。'}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="import-report-note">暂时还没有记录到自动化活动。</div>
            )}
          </div>

          <div className="subject-form">
            <span>日志预览</span>
            <div className="log-preview">
              {debugLines.length ? debugLines.join('\n') : '暂时还没有调试日志。'}
            </div>
          </div>
        </section>
      </section>

      <section className="atelier-card">
        <div className="section-tag">输出</div>
        <h3>最近输出</h3>
        <div className="import-report-note">
          最近自动化生成的稿件会汇总在这里，方便你快速回到资料库继续编辑，或者直接打开文件。
        </div>
        <div className="import-report-note">“续写”会覆盖当前稿件内容，“改写为新草稿”则会保留原稿，并生成一个新的分支版本。</div>
        <div className="archive-chip-row">
          <span className="archive-chip-label">查看策略</span>
          <div className="archive-chip-group" role="group" aria-label="最近输出策略筛选">
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
            ? `当前展示 ${recentAutomationOutputs.length} 份自动化输出。`
            : `当前展示最近 ${recentAutomationOutputs.length} / ${recentAutomationOutputMatches.length} 份匹配的自动化输出。`}
        </div>

        <div className="automation-stack">
          {recentAutomationOutputs.length ? (
            recentAutomationOutputs.map((output) => (
              <article key={output.id} className="automation-item">
                <div className="automation-head">
                  <div>
                    <strong>{output.taskName}</strong>
                    <div className="automation-meta">
                      <span>{output.taskKind === 'scheduled' ? '定时任务' : '长周期任务'}</span>
                      <span>{output.projectName || '未关联主题'}</span>
                      <span>{output.lastRunAt ? `最近运行 ${timeAgo(output.lastRunAt)}` : `最近更新 ${timeAgo(output.updatedAt)}`}</span>
                      <span>{describeDraftStrategy(output.draftStrategy)}</span>
                    </div>
                  </div>
                  <span className={`journey-state ${output.lastResult === 'success' ? 'is-complete' : 'is-pending'}`}>
                    {output.lastResult === 'error' ? '失败' : output.lastResult === 'skipped' ? '已跳过' : '成功'}
                  </span>
                </div>

                <div className="import-report-note workspace-path-note" title={output.manuscriptPath}>
                  {compactPath(output.manuscriptPath, 5)}
                </div>
                <div className="import-report-note workspace-path-note" title={describeDraftStrategyDetail(output)}>
                  {describeDraftStrategyDetail(output, { compactPaths: true, segmentCount: 5 })}
                </div>
                {!canOpenOutputInStudio(output) ? (
                  <div className="import-report-note">
                    这份输出暂时还没有关联到已有主题，因此目前只能从外部应用中打开。
                  </div>
                ) : null}

                <div className="automation-actions">
                  {canOpenOutputInStudio(output) ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleOpenAutomationOutputInStudio(output)}
                    >
                      {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      打开稿件
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(output) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(output, 'continue')}
                    >
                      {busy === `output-redclaw-continue:${output.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                      在 RedClaw 中续写
                    </button>
                  ) : null}
                  {canOpenOutputInStudio(output) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleGenerateOutputWithRedClaw(output, 'rewrite')}
                    >
                      {busy === `output-redclaw-rewrite:${output.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                      改写为新草稿
                    </button>
                  ) : null}
                  {canReconnectOutputSession(output) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeAutomationOutputSession(output)}
                    >
                      {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      恢复会话
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
                    外部打开
                  </button>
                  <button
                    type="button"
                    className="secondary-action compact"
                    onClick={() => void copyTextToClipboard(output.manuscriptPath, '稿件路径已复制。')}
                  >
                    <Copy size={16} />
                    复制路径
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="import-report-note">暂时还没有最近的自动化输出。</div>
          )}
        </div>
      </section>

      <section className="ops-grid">
        <section className="ops-card">
          <div className="section-tag">当前工作台</div>
          <h3>当前工作台概览</h3>
          <ul>
            <li>空间：{spaceName}</li>
            <li>主题数：{subjects.length}</li>
            <li>收件箱数量：{captures.length}</li>
            <li>RedClaw 配置：{redClawReady ? '已就绪' : '仍需设置'}</li>
          </ul>
        </section>

        <section className="ops-card">
          <div className="section-tag">桥接说明</div>
          <h3>桥接说明</h3>
          <p>{pluginStatus.message || '可以把浏览器端导出的 JSON / JSONL 投递到桌面收件箱，也可以直接把文件拖到这里。'}</p>
          <div className="settings-actions">
            <button
              type="button"
              className="primary-action compact"
              onClick={() => startTransition(() => setView('capture'))}
            >
              打开采集页
            </button>
          </div>
        </section>

        <section className="ops-card">
          <div className="section-tag">内容包</div>
          <h3>RedClaw 内置 XHSSpec 内容包</h3>
          <ul>
            <li>内置包名称：{runnerStatus.contentPackName || 'embedded-xhsspec'}</li>
            <li>内容区块数：{runnerStatus.contentPackSections || 0}</li>
            <li>直接生成：{runnerStatus.directGenerationEnabled ? '已启用' : '请先完成 AI 设置'}</li>
            <li>这个内容包内置了品牌、人群、语气、卖点和禁忌等直接生成所需约束。</li>
            <li>模板资产包含笔记模板、创作规范、快速 Brief 和快速草稿契约。</li>
            <li>发布仍坚持 GitHub 优先，校验、打包和安装包产出都在远端工作流完成。</li>
          </ul>
        </section>
      </section>

      <section className="split-grid">
        <section className="atelier-card">
          <div className="section-tag">自动化</div>
          <h3>定时任务</h3>
          <div className="subject-form">
            {editingScheduledTaskId ? (
              <div className="import-report-note">你正在编辑一条已有的定时任务，保存后会覆盖当前配置。</div>
            ) : null}
            {editingScheduledTask || scheduledTaskForm.projectId || activeSubject || !subjects.length ? (
              <div className="task-editor-context">
                <div className="task-editor-head">
                  <div>
                    <span className="subject-workspace-label">编辑上下文</span>
                    <strong>{editingScheduledTask ? editingScheduledTask.name : '新建定时任务'}</strong>
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
                      ? '待恢复'
                      : editingScheduledTask
                        ? '现有任务'
                        : scheduledEditorSubject
                          ? '已关联主题'
                          : '请选择主题'}
                    </span>
                </div>
                <div className="task-editor-meta-grid">
                  <div className="task-editor-meta">
                    <span>关联主题</span>
                    <strong>{scheduledEditorSubject?.name || '未关联主题'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>执行模式</span>
                    <strong>{scheduledModeLabel(scheduledTaskForm.mode)}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>执行计划</span>
                    <strong>{scheduledTaskFormSummary}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>最近运行</span>
                    <strong>{editingScheduledTask?.lastRunAt ? timeAgo(editingScheduledTask.lastRunAt) : '尚未运行'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>下次运行</span>
                    <strong>{editingScheduledTask?.nextRunAt ? timeUntil(editingScheduledTask.nextRunAt) : '尚未安排'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>最近输出</span>
                    <strong
                      className={editingScheduledOutput?.manuscriptPath ? 'workspace-path-note' : undefined}
                      title={editingScheduledOutput?.manuscriptPath || undefined}
                    >
                      {editingScheduledOutput?.manuscriptPath
                        ? compactPath(editingScheduledOutput.manuscriptPath, 5)
                        : '暂无输出'}
                    </strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>重试策略</span>
                    <strong>
                      {scheduledTaskForm.maxRetries && Number(scheduledTaskForm.maxRetries) > 0
                        ? `${scheduledTaskForm.maxRetries} 次重试 / 间隔 ${scheduledTaskForm.retryDelayMinutes || '30'} 分钟`
                        : '不自动重试'}
                    </strong>
                  </div>
                </div>
                {editingScheduledTask?.lastError ? (
                  <div className="import-report-note is-warning">{editingScheduledTask.lastError}</div>
                ) : !scheduledEditorSubject && activeSubject ? (
                  <div className="import-report-note">可以直接使用当前主题，这样定时任务会继续挂在你正在编辑的稿件工作区上。</div>
                ) : !scheduledEditorSubject && !subjects.length ? (
                  <div className="import-report-note">如果希望自动化始终关联稿件工作区，请先去资料库创建主题。</div>
                ) : !scheduledEditorSubject ? (
                  <div className="import-report-note">这条任务可以不关联主题直接保存，但关联主题后输出会自动沉淀到资料库工作流里。</div>
                ) : null}
                <div className="automation-actions">
                  {activeSubject && scheduledTaskForm.projectId !== activeSubject.id ? (
                    <button type="button" className="secondary-action compact" onClick={assignActiveSubjectToScheduledTask}>
                      <LibraryBig size={16} />
                      使用当前主题
                    </button>
                  ) : null}
                  {!subjects.length ? (
                    <button type="button" className="secondary-action compact" onClick={startNewSubjectInLibrary}>
                      <Plus size={16} />
                      创建主题
                    </button>
                  ) : null}
                  {scheduledEditorSubject ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void openSubjectInLibrary(scheduledEditorSubject.id)}
                    >
                      <FolderOpen size={16} />
                      打开主题
                    </button>
                  ) : null}
                  {editingScheduledTask ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleRunScheduledTask(editingScheduledTask.id)}
                    >
                      {busy === `scheduled-run:${editingScheduledTask.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                      立即执行
                    </button>
                  ) : null}
                  {editingScheduledOutput && canOpenOutputInStudio(editingScheduledOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleOpenAutomationOutputInStudio(editingScheduledOutput)}
                    >
                      {busy === `output-open:${editingScheduledOutput.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      打开最近输出
                    </button>
                  ) : null}
                  {editingScheduledOutput && canReconnectOutputSession(editingScheduledOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeAutomationOutputSession(editingScheduledOutput)}
                    >
                      {busy === `output-resume:${editingScheduledOutput.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      恢复会话
                    </button>
                  ) : null}
                  {editingScheduledTask?.lastError ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void copyTextToClipboard(editingScheduledTask.lastError || '', '定时任务错误已复制。')}
                    >
                      <Copy size={16} />
                      复制错误
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="subject-form-grid">
              <label>
                <span>任务名称</span>
                <input
                  value={scheduledTaskForm.name}
                  onChange={(event) => setScheduledTaskForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                <span>目标主题</span>
                <select
                  value={scheduledTaskForm.projectId}
                  onChange={(event) => setScheduledTaskForm((current) => ({ ...current, projectId: event.target.value }))}
                >
                  <option value="">不关联主题</option>
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
                <span>执行模式</span>
                <select
                  value={scheduledTaskForm.mode}
                  onChange={(event) =>
                    setScheduledTaskForm((current) => ({
                      ...current,
                      mode: event.target.value as ScheduledTaskForm['mode'],
                    }))
                  }
                >
                  <option value="interval">间隔执行</option>
                  <option value="daily">每日</option>
                  <option value="weekly">每周</option>
                  <option value="once">一次性</option>
                </select>
              </label>
              {scheduledTaskForm.mode === 'interval' ? (
                <label>
                  <span>间隔分钟数</span>
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
                  <span>执行时间</span>
                  <input
                    type="time"
                    value={scheduledTaskForm.time}
                    onChange={(event) => setScheduledTaskForm((current) => ({ ...current, time: event.target.value }))}
                  />
                </label>
              ) : null}
              {scheduledTaskForm.mode === 'once' ? (
                <label>
                  <span>执行日期时间</span>
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
                <span>执行星期</span>
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
                <span>最大重试次数</span>
                <input
                  type="number"
                  min="0"
                  value={scheduledTaskForm.maxRetries}
                  onChange={(event) => setScheduledTaskForm((current) => ({ ...current, maxRetries: event.target.value }))}
                />
              </label>
              <label>
                <span>重试间隔（分钟）</span>
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
              <span>任务提示词</span>
              <textarea
                value={scheduledTaskForm.prompt}
                onChange={(event) => setScheduledTaskForm((current) => ({ ...current, prompt: event.target.value }))}
              />
            </label>
            <div className="import-report-note">
              {scheduledTaskForm.mode === 'interval'
                ? '间隔执行会按设定分钟数反复运行，适合持续写作、补稿和复查。'
                : scheduledTaskForm.mode === 'daily'
                  ? '每日模式会在固定时间执行，适合晨间规划、晚间复盘或日更栏目。'
                  : scheduledTaskForm.mode === 'weekly'
                    ? '每周模式会在指定星期执行，适合系列内容与周更计划。'
                    : '一次性模式只会在指定时刻运行一次，适合发版前准备和截止期任务。'}
            </div>
            <div className={`import-report-note${canSubmitScheduledTask ? '' : ' is-warning'}`}>
              {canSubmitScheduledTask
                ? `可以保存。${scheduledTaskFormSummary}。${scheduledTaskSubjectHint || '当前任务配置已经完整。'}`
                : `保存前请先补全这些内容：${scheduledTaskFormIssues.join(' ')}`}
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="primary-action compact"
                disabled={!canSubmitScheduledTask || busy === scheduledSubmitBusyKey}
                onClick={() => void handleSubmitScheduledTask()}
              >
                {busy === scheduledSubmitBusyKey ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
                {editingScheduledTaskId ? '保存定时任务' : '新建定时任务'}
              </button>
              {editingScheduledTaskId ? (
                <button type="button" className="secondary-action compact" onClick={resetScheduledTaskEditor}>
                  取消编辑
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
                          <span>{linkedSubject?.name || task.projectId || '未关联主题'}</span>
                          <span>
                            {task.maxRetries
                              ? `重试 ${task.retryCount || 0} / ${task.maxRetries}，间隔 ${task.retryDelayMinutes || 30} 分钟`
                              : '不自动重试'}
                          </span>
                          <span>{task.lastRunAt ? `最近运行 ${timeAgo(task.lastRunAt)}` : '尚未运行'}</span>
                          <span>{task.nextRunAt ? `下次运行 ${timeUntil(task.nextRunAt)}` : '尚未安排下次运行'}</span>
                        </div>
                      </div>
                      <span className={`journey-state ${task.enabled ? 'is-complete' : 'is-pending'}`}>
                        {task.enabled ? '已启用' : '已停用'}
                      </span>
                    </div>
                    <p>{task.prompt}</p>
                    {task.lastError ? <div className="import-report-note is-warning">{task.lastError}</div> : null}
                    {task.lastSavedManuscriptPath ? (
                      <div className="import-report-note workspace-path-note" title={task.lastSavedManuscriptPath}>
                        最近输出：{compactPath(task.lastSavedManuscriptPath, 5)}
                      </div>
                    ) : null}
                    {output ? (
                      <div
                        className="import-report-note workspace-path-note"
                        title={`${describeDraftStrategy(output.draftStrategy)} - ${describeDraftStrategyDetail(output)}`}
                      >
                        {describeDraftStrategy(output.draftStrategy)} - {describeDraftStrategyDetail(output, { compactPaths: true, segmentCount: 5 })}
                      </div>
                    ) : null}
                    <div className="automation-actions">
                      <button type="button" className="primary-action compact" onClick={() => void handleRunScheduledTask(task.id)}>
                        {busy === `scheduled-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        立即执行
                      </button>
                      {linkedSubject ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void openSubjectInLibrary(linkedSubject.id)}
                        >
                          <LibraryBig size={16} />
                          打开主题
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          打开稿件
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'continue')}
                        >
                          {busy === `output-redclaw-continue:${output.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                          在 RedClaw 中续写
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'rewrite')}
                        >
                          {busy === `output-redclaw-rewrite:${output.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                          改写为新草稿
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          恢复会话
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
                          在系统中打开
                        </button>
                      ) : null}
                      {task.lastSavedManuscriptPath ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastSavedManuscriptPath || '', '稿件路径已复制。')}
                        >
                          <Copy size={16} />
                          复制稿件路径
                        </button>
                      ) : null}
                      <button type="button" className="secondary-action compact" onClick={() => startEditingScheduledTask(task)}>
                        <Settings2 size={16} />
                        {editingScheduledTaskId === task.id ? '编辑中' : '编辑'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleToggleScheduledTask(task)}>
                        {busy === `scheduled-toggle:${task.id}` ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                        {task.enabled ? '停用' : '启用'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleRemoveScheduledTask(task.id)}>
                        {busy === `scheduled-remove:${task.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                        删除
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="import-report-note">暂时还没有定时任务。</div>
            )}
          </div>
        </section>

        <section className="atelier-card">
          <div className="section-tag">自动化</div>
          <h3>长周期任务</h3>
          <div className="subject-form">
            {editingLongCycleTaskId ? (
              <div className="import-report-note">你正在编辑一条已有的长周期任务，保存后会覆盖当前配置。</div>
            ) : null}
            {editingLongCycleTask || longCycleForm.projectId || activeSubject || !subjects.length ? (
              <div className="task-editor-context">
                <div className="task-editor-head">
                  <div>
                    <span className="subject-workspace-label">编辑上下文</span>
                    <strong>{editingLongCycleTask ? editingLongCycleTask.name : '新建长周期任务'}</strong>
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
                      ? '待恢复'
                      : editingLongCycleTask
                        ? '现有任务'
                        : longCycleEditorSubject
                          ? '已关联主题'
                          : '请选择主题'}
                    </span>
                </div>
                <div className="task-editor-meta-grid">
                  <div className="task-editor-meta">
                    <span>关联主题</span>
                    <strong>{longCycleEditorSubject?.name || '未关联主题'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>状态</span>
                    <strong>{describeLongCycleStatus(editingLongCycleTask?.status)}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>循环计划</span>
                    <strong>{longCycleTaskFormSummary}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>进度</span>
                    <strong>
                      {editingLongCycleTask ? `${editingLongCycleTask.completedRounds} / ${editingLongCycleTask.totalRounds}` : `计划 ${longCycleForm.totalRounds || '7'} 轮`}
                    </strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>最近运行</span>
                    <strong>{editingLongCycleTask?.lastRunAt ? timeAgo(editingLongCycleTask.lastRunAt) : '尚未运行'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>下次运行</span>
                    <strong>{editingLongCycleTask?.nextRunAt ? timeUntil(editingLongCycleTask.nextRunAt) : '尚未安排'}</strong>
                  </div>
                  <div className="task-editor-meta">
                    <span>最近输出</span>
                    <strong
                      className={editingLongCycleOutput?.manuscriptPath ? 'workspace-path-note' : undefined}
                      title={editingLongCycleOutput?.manuscriptPath || undefined}
                    >
                      {editingLongCycleOutput?.manuscriptPath
                        ? compactPath(editingLongCycleOutput.manuscriptPath, 5)
                        : '暂无输出'}
                    </strong>
                  </div>
                </div>
                {editingLongCycleTask?.lastError ? (
                  <div className="import-report-note is-warning">{editingLongCycleTask.lastError}</div>
                ) : !longCycleEditorSubject && activeSubject ? (
                  <div className="import-report-note">可以直接使用当前主题，这样长周期任务会持续关联你正在构建的稿件工作区。</div>
                ) : !longCycleEditorSubject && !subjects.length ? (
                  <div className="import-report-note">如果希望这条循环任务始终关联稿件工作区，请先去资料库创建主题。</div>
                ) : !longCycleEditorSubject ? (
                  <div className="import-report-note">这条循环任务可以不关联主题直接保存，但关联主题后，每一轮输出都会自动沉淀到资料库里。</div>
                ) : null}
                <div className="automation-actions">
                  {activeSubject && longCycleForm.projectId !== activeSubject.id ? (
                    <button type="button" className="secondary-action compact" onClick={assignActiveSubjectToLongCycleTask}>
                      <LibraryBig size={16} />
                      使用当前主题
                    </button>
                  ) : null}
                  {!subjects.length ? (
                    <button type="button" className="secondary-action compact" onClick={startNewSubjectInLibrary}>
                      <Plus size={16} />
                      创建主题
                    </button>
                  ) : null}
                  {longCycleEditorSubject ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void openSubjectInLibrary(longCycleEditorSubject.id)}
                    >
                      <FolderOpen size={16} />
                      打开主题
                    </button>
                  ) : null}
                  {editingLongCycleTask ? (
                    <button
                      type="button"
                      className="primary-action compact"
                      onClick={() => void handleRunLongCycleTask(editingLongCycleTask.id)}
                    >
                      {busy === `long-cycle-run:${editingLongCycleTask.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                      推进一轮
                    </button>
                  ) : null}
                  {editingLongCycleOutput && canOpenOutputInStudio(editingLongCycleOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleOpenAutomationOutputInStudio(editingLongCycleOutput)}
                    >
                      {busy === `output-open:${editingLongCycleOutput.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                      打开最近输出
                    </button>
                  ) : null}
                  {editingLongCycleOutput && canReconnectOutputSession(editingLongCycleOutput) ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void handleResumeAutomationOutputSession(editingLongCycleOutput)}
                    >
                      {busy === `output-resume:${editingLongCycleOutput.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                      恢复会话
                    </button>
                  ) : null}
                  {editingLongCycleTask?.lastError ? (
                    <button
                      type="button"
                      className="secondary-action compact"
                      onClick={() => void copyTextToClipboard(editingLongCycleTask.lastError || '', '长周期任务错误已复制。')}
                    >
                      <Copy size={16} />
                      复制错误
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="subject-form-grid">
              <label>
                <span>任务名称</span>
                <input
                  value={longCycleForm.name}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                <span>目标主题</span>
                <select
                  value={longCycleForm.projectId}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, projectId: event.target.value }))}
                >
                  <option value="">不关联主题</option>
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
                <span>间隔分钟数</span>
                <input
                  type="number"
                  min="1"
                  value={longCycleForm.intervalMinutes}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, intervalMinutes: event.target.value }))}
                />
              </label>
              <label>
                <span>总轮数</span>
                <input
                  type="number"
                  min="1"
                  value={longCycleForm.totalRounds}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, totalRounds: event.target.value }))}
                />
              </label>
            </div>

            <label>
              <span>目标</span>
              <textarea
                value={longCycleForm.objective}
                onChange={(event) => setLongCycleForm((current) => ({ ...current, objective: event.target.value }))}
              />
            </label>
            <label>
              <span>单轮提示词</span>
              <textarea
                value={longCycleForm.stepPrompt}
                onChange={(event) => setLongCycleForm((current) => ({ ...current, stepPrompt: event.target.value }))}
              />
            </label>

            <div className="subject-form-grid">
              <label>
                <span>最大重试次数</span>
                <input
                  type="number"
                  min="0"
                  value={longCycleForm.maxRetries}
                  onChange={(event) => setLongCycleForm((current) => ({ ...current, maxRetries: event.target.value }))}
                />
              </label>
              <label>
                <span>重试间隔（分钟）</span>
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
                ? `可以保存。${longCycleTaskFormSummary}。${longCycleTaskSubjectHint || '当前循环任务配置已经完整。'}`
                : `保存前请先补全这些内容：${longCycleTaskFormIssues.join(' ')}`}
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="primary-action compact"
                disabled={!canSubmitLongCycleTask || busy === longCycleSubmitBusyKey}
                onClick={() => void handleSubmitLongCycleTask()}
              >
                {busy === longCycleSubmitBusyKey ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
                {editingLongCycleTaskId ? '保存长周期任务' : '新建长周期任务'}
              </button>
              {editingLongCycleTaskId ? (
                <button type="button" className="secondary-action compact" onClick={resetLongCycleEditor}>
                  取消编辑
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
                          <span>{describeLongCycleStatus(task.status)}</span>
                          <span>{linkedSubject?.name || task.projectId || '未关联主题'}</span>
                          <span>
                            {task.maxRetries
                              ? `重试 ${task.retryCount || 0} / ${task.maxRetries}，间隔 ${task.retryDelayMinutes || 30} 分钟`
                              : '不自动重试'}
                          </span>
                          <span>{task.lastRunAt ? `最近运行 ${timeAgo(task.lastRunAt)}` : '尚未运行'}</span>
                          <span>{task.nextRunAt ? `下次运行 ${timeUntil(task.nextRunAt)}` : '尚未安排下次运行'}</span>
                        </div>
                      </div>
                      <span className={`journey-state ${task.enabled ? 'is-complete' : 'is-pending'}`}>
                        {task.enabled ? '已启用' : '已停用'}
                      </span>
                    </div>
                    <p>{task.objective}</p>
                    {task.lastError ? <div className="import-report-note is-warning">{task.lastError}</div> : null}
                    {task.lastSavedManuscriptPath ? (
                      <div className="import-report-note workspace-path-note" title={task.lastSavedManuscriptPath}>
                        最近输出：{compactPath(task.lastSavedManuscriptPath, 5)}
                      </div>
                    ) : null}
                    {output ? (
                      <div
                        className="import-report-note workspace-path-note"
                        title={`${describeDraftStrategy(output.draftStrategy)} - ${describeDraftStrategyDetail(output)}`}
                      >
                        {describeDraftStrategy(output.draftStrategy)} - {describeDraftStrategyDetail(output, { compactPaths: true, segmentCount: 5 })}
                      </div>
                    ) : null}
                    <div className="automation-actions">
                      <button type="button" className="primary-action compact" onClick={() => void handleRunLongCycleTask(task.id)}>
                        {busy === `long-cycle-run:${task.id}` ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                        推进一轮
                      </button>
                      {linkedSubject ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void openSubjectInLibrary(linkedSubject.id)}
                        >
                          <LibraryBig size={16} />
                          打开主题
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleOpenAutomationOutputInStudio(output)}
                        >
                          {busy === `output-open:${output.id}` ? <Loader2 className="spin" size={16} /> : <FolderOpen size={16} />}
                          打开稿件
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'continue')}
                        >
                          {busy === `output-redclaw-continue:${output.id}` ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                          在 RedClaw 中续写
                        </button>
                      ) : null}
                      {output && canOpenOutputInStudio(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleGenerateOutputWithRedClaw(output, 'rewrite')}
                        >
                          {busy === `output-redclaw-rewrite:${output.id}` ? <Loader2 className="spin" size={16} /> : <FileText size={16} />}
                          改写为新草稿
                        </button>
                      ) : null}
                      {output && canReconnectOutputSession(output) ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void handleResumeAutomationOutputSession(output)}
                        >
                          {busy === `output-resume:${output.id}` ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                          恢复会话
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
                          在系统中打开
                        </button>
                      ) : null}
                      {task.lastSavedManuscriptPath ? (
                        <button
                          type="button"
                          className="secondary-action compact"
                          onClick={() => void copyTextToClipboard(task.lastSavedManuscriptPath || '', '稿件路径已复制。')}
                        >
                          <Copy size={16} />
                          复制稿件路径
                        </button>
                      ) : null}
                      <button type="button" className="secondary-action compact" onClick={() => startEditingLongCycleTask(task)}>
                        <Settings2 size={16} />
                        {editingLongCycleTaskId === task.id ? '编辑中' : '编辑'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleToggleLongCycleTask(task)}>
                        {busy === `long-cycle-toggle:${task.id}` ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                        {task.enabled ? '停用' : '启用'}
                      </button>
                      <button type="button" className="secondary-action compact" onClick={() => void handleRemoveLongCycleTask(task.id)}>
                        {busy === `long-cycle-remove:${task.id}` ? <Loader2 className="spin" size={16} /> : <CircleDashed size={16} />}
                        删除
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="import-report-note">暂时还没有长周期任务。</div>
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
      setSavedManuscriptContent('');
      setManuscriptSyncedAt(null);
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
      setSavedManuscriptContent('');
      setManuscriptSyncedAt(null);
      setRedClawFollowUpPrompt('');
      return;
    }

    void loadManuscriptIntoStudio(path).catch((error) => setNotice({ tone: 'warning', text: String(error) }));
  }, [activeSubject, manuscriptLinks]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isManuscriptDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isManuscriptDirty]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }

      if (!manuscriptPath) {
        return;
      }

      event.preventDefault();
      if (busy === 'save-manuscript') {
        return;
      }

      void handleSaveManuscript();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, manuscriptPath, manuscriptContent, isManuscriptDirty]);

  useEffect(() => {
    if (!linkedSession) {
      setRedClawFollowUpPrompt('');
      setMessages([]);
      setRuntimeState(EMPTY_RUNTIME);
      setContextUsage(EMPTY_CONTEXT);
      return;
    }

    if (view !== 'library') {
      return;
    }

    void refreshSessionInsights(linkedSession, true);
    const timer = window.setInterval(
      () => {
        void refreshSessionInsights(linkedSession, true);
      },
      runtimeState.isProcessing ? 3200 : 9000,
    );

    return () => window.clearInterval(timer);
  }, [linkedSession, runtimeState.isProcessing, view]);

  useEffect(() => {
    setRedClawFollowUpPrompt('');
  }, [activeSubject?.id, linkedSession]);

  useEffect(() => {
    if (!runnerStatus.isTicking || view === 'library') {
      return;
    }

    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [runnerStatus.isTicking, view]);

  if (loading) {
    return (
      <div className="atelier-main">
        <div className="atelier-loading">
          <Loader2 className="spin" size={18} />
          正在加载桌面工作台...
        </div>
      </div>
    );
  }

  return (
    <div className="atelier-shell">
      <aside className="atelier-rail">
        <div>
          <div className="atelier-brand">
            <div className="atelier-brand-mark">
              <img src="/Box.png" alt="小红书创作台" />
            </div>
            <div>
              <div className="atelier-brand-name">小红书创作台</div>
              <div className="atelier-brand-subtitle">采集、资料沉淀、稿件整理与 RedClaw 创作的一体化桌面工作台</div>
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
            <span>{theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}</span>
          </button>

          <button
            type="button"
            className="atelier-subtle-link"
            onClick={() => void handleOpenGitHubReleases()}
          >
            {busy === 'open-releases' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            <span>发布包下载</span>
          </button>
          <button
            type="button"
            className="atelier-subtle-link"
            onClick={() => void handleOpenIssueTracker()}
          >
            {busy === 'open-issues' ? <Loader2 className="spin" size={15} /> : <ExternalLink size={15} />}
            <span>问题反馈</span>
          </button>
        </div>
      </aside>

      <main className="atelier-main">
        <header className="atelier-header">
          <div>
            <div className="atelier-header-eyebrow">桌面端</div>
            <div className="atelier-header-title-row">
              <h1>{VIEW_META[view].title}</h1>
            </div>
            <p>{VIEW_META[view].summary}</p>
          </div>

          <div className="atelier-header-meta">
            <div className="atelier-meta-chip">
              <span>空间</span>
              <strong>{spaceName}</strong>
            </div>
            <div className="atelier-meta-chip">
              <span>版本</span>
              <strong>{appVersion}</strong>
            </div>
            <div className="atelier-meta-chip">
              <span>RedClaw</span>
              <strong>{redClawReady ? '已配置' : '待配置'}</strong>
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



