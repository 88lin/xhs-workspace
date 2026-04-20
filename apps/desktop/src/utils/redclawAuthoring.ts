export type AuthoringPlatform = 'xiaohongshu' | 'wechat_official_account';
export type AuthoringTaskType = 'direct_write' | 'expand_from_xhs';
export type AuthoringSourceMode = 'manual' | 'knowledge' | 'manuscript';
export type AuthoringFormatTarget = 'markdown' | 'wechat_rich_text';
export type AuthoringDraftStrategy = 'fresh' | 'continue' | 'rewrite';

export interface AuthoringTaskHints {
  intent?: string;
  forceMultiAgent?: boolean;
  forceLongRunningTask?: boolean;
  projectId?: string;
  platform?: AuthoringPlatform;
  taskType?: AuthoringTaskType;
  formatTarget?: AuthoringFormatTarget;
  sourcePlatform?: AuthoringPlatform;
  sourceNoteId?: string;
  sourceMode?: AuthoringSourceMode;
  draftStrategy?: AuthoringDraftStrategy;
  sourceTitle?: string;
  sourceManuscriptPath?: string;
  referenceManuscriptPath?: string;
}

interface BuildAuthoringMessageInput {
  platform: AuthoringPlatform;
  taskType: AuthoringTaskType;
  brief?: string;
  draftDirective?: string;
  sourceMode?: AuthoringSourceMode;
  draftStrategy?: AuthoringDraftStrategy;
  sourcePlatform?: AuthoringPlatform;
  sourceNoteId?: string;
  projectId?: string;
  sourceTitle?: string;
  sourceManuscriptPath?: string;
  referenceManuscriptPath?: string;
  sourceContent?: string;
}

const PLATFORM_LABEL: Record<AuthoringPlatform, string> = {
  xiaohongshu: 'Xiaohongshu',
  wechat_official_account: 'WeChat Official Account',
};

const TASK_LABEL: Record<AuthoringTaskType, string> = {
  direct_write: 'Direct Draft',
  expand_from_xhs: 'Expand From XHS',
};

export function buildRedClawAuthoringMessage(input: BuildAuthoringMessageInput) {
  const brief = String(input.brief || '').trim();
  const draftDirective = String(input.draftDirective || '').trim();
  const sourceTitle = String(input.sourceTitle || '').trim();
  const sourceContent = String(input.sourceContent || '').trim();
  const sourceBlocks: string[] = [];

  if (sourceTitle) {
    sourceBlocks.push(`Source title: ${sourceTitle}`);
  }
  if (input.sourceNoteId) {
    sourceBlocks.push(`Source note ID: ${input.sourceNoteId}`);
  }
  if (input.sourceManuscriptPath) {
    sourceBlocks.push(`Primary manuscript: ${input.sourceManuscriptPath}`);
  }
  if (input.referenceManuscriptPath && input.referenceManuscriptPath !== input.sourceManuscriptPath) {
    sourceBlocks.push(`Reference manuscript: ${input.referenceManuscriptPath}`);
  }
  if (sourceContent) {
    sourceBlocks.push('Source content:');
    sourceBlocks.push(sourceContent);
  }

  const content = [
    brief || `Start a new ${PLATFORM_LABEL[input.platform]} authoring task.`,
    draftDirective ? `Draft directive:\n${draftDirective}` : '',
    sourceBlocks.length > 0 ? ['Reference material:', ...sourceBlocks].join('\n') : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();

  const displayContent = `${PLATFORM_LABEL[input.platform]} · ${TASK_LABEL[input.taskType]}${sourceTitle ? ` · ${sourceTitle}` : ''}`;

  return {
    content,
    displayContent,
    taskHints: {
      intent: 'manuscript_creation',
      projectId: input.projectId,
      platform: input.platform,
      taskType: input.taskType,
      formatTarget: 'markdown' as const,
      sourceMode: input.sourceMode,
      draftStrategy: input.draftStrategy,
      sourcePlatform: input.sourcePlatform,
      sourceNoteId: input.sourceNoteId,
      sourceTitle: sourceTitle || undefined,
      sourceManuscriptPath: input.sourceManuscriptPath,
      referenceManuscriptPath: input.referenceManuscriptPath,
    } satisfies AuthoringTaskHints,
  };
}
