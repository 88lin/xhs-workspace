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
  xiaohongshu: '小红书',
  wechat_official_account: '微信公众号',
};

const TASK_LABEL: Record<AuthoringTaskType, string> = {
  direct_write: '直接写作',
  expand_from_xhs: '基于小红书扩写',
};

export function buildRedClawAuthoringMessage(input: BuildAuthoringMessageInput) {
  const brief = String(input.brief || '').trim();
  const draftDirective = String(input.draftDirective || '').trim();
  const sourceTitle = String(input.sourceTitle || '').trim();
  const sourceContent = String(input.sourceContent || '').trim();
  const sourceBlocks: string[] = [];

  if (sourceTitle) {
    sourceBlocks.push(`来源标题：${sourceTitle}`);
  }
  if (input.sourceNoteId) {
    sourceBlocks.push(`来源笔记 ID：${input.sourceNoteId}`);
  }
  if (input.sourceManuscriptPath) {
    sourceBlocks.push(`主稿路径：${input.sourceManuscriptPath}`);
  }
  if (input.referenceManuscriptPath && input.referenceManuscriptPath !== input.sourceManuscriptPath) {
    sourceBlocks.push(`参考稿路径：${input.referenceManuscriptPath}`);
  }
  if (sourceContent) {
    sourceBlocks.push('来源内容：');
    sourceBlocks.push(sourceContent);
  }

  const content = [
    brief || `开始一个新的${PLATFORM_LABEL[input.platform]}写作任务。`,
    draftDirective ? `写作指令：\n${draftDirective}` : '',
    sourceBlocks.length > 0 ? ['参考资料：', ...sourceBlocks].join('\n') : '',
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
