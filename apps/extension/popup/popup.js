let statsRefreshTimer = null;

const EXPORT_LABELS = {
  atelier: 'XHS Atelier 导入包',
  json: 'JSON 数据',
  jsonl: 'JSONL 逐行数据',
  markdown: 'Markdown 文档',
  training: '训练数据',
};

const SOURCE_LABELS = {
  homefeed: '首页信息流',
  search: '搜索结果',
  detail: '详情页',
  user_profile: '主页',
  dom_feed: '页面卡片',
  dom_detail: '页面详情',
};

const PAGE_TYPE_LABELS = {
  detail: '详情页',
  feed: '信息流',
  profile: '主页',
};

const BATCH_PROMPTS = {
  内容总览: {
    pageType: 'feed',
    prompt: [
      '请把以下小红书帖子作为一个整体进行分析。',
      '1. 总结主要主题簇。',
      '2. 说明高互动帖子有哪些共同点。',
      '3. 描述当前主导的内容风格。',
      '4. 给出 3 条可执行的创作建议。',
      '请用简洁中文回答。',
    ].join('\n'),
  },
  潜力爆款: {
    pageType: 'feed',
    prompt: [
      '请审阅以下小红书帖子，并识别其中最有爆发潜力的内容。',
      '1. 选出最强的 3 条帖子，并说明原因。',
      '2. 总结高表现内容背后的可复用规律。',
      '3. 将这些规律整理成可重复执行的内容公式。',
      '请用简洁中文回答。',
    ].join('\n'),
  },
  标签规律: {
    pageType: 'feed',
    prompt: [
      '请从标签角度审阅以下小红书帖子。',
      '1. 列出出现频率最高的标签。',
      '2. 说明标签和互动表现之间的关系。',
      '3. 推荐更适合后续发布的标签组合。',
      '请用简洁中文回答。',
    ].join('\n'),
  },
};

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  checkPageStatus();
  bindEvents();
});

function startStatsRefresh() {
  stopStatsRefresh();
  statsRefreshTimer = setInterval(loadStats, 2000);
}

function stopStatsRefresh() {
  if (statsRefreshTimer) {
    clearInterval(statsRefreshTimer);
    statsRefreshTimer = null;
  }
}

async function loadStats() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }, (stats) => {
    if (chrome.runtime.lastError || stats?.error) {
      return;
    }

    document.getElementById('totalPosts').textContent = stats.totalPosts || 0;
    document.getElementById('sessionCaptures').textContent = stats.sessionCaptures || 0;

    if (stats.lastCaptureAt) {
      document.getElementById('lastCapture').textContent = timeAgo(stats.lastCaptureAt);
    }

    renderSourceBars(stats.bySource || {});
  });

  chrome.runtime.sendMessage({ type: 'GET_CAPACITY_INFO' }, (info) => {
    if (chrome.runtime.lastError || info?.error) {
      return;
    }

    updateCapacityWarning(info);
  });
}

function renderSourceBars(bySource) {
  const container = document.getElementById('sourceBars');
  const total = Object.values(bySource).reduce((sum, value) => sum + value, 0);

  if (!total) {
    container.innerHTML = '<div class="source-empty">暂无数据</div>';
    return;
  }

  const sorted = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const max = sorted[0][1];

  container.innerHTML = sorted
    .map(([source, count]) => {
      const label = SOURCE_LABELS[source] || source;
      const width = ((count / max) * 100).toFixed(0);
      return `
        <div class="source-row">
          <span class="source-name">${escapeHtml(label)}</span>
          <div class="source-bar-wrap">
            <div class="source-bar" style="width: ${width}%"></div>
          </div>
          <span class="source-count">${escapeHtml(String(count))}</span>
        </div>
      `;
    })
    .join('');
}

function checkPageStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const isXhs = tab?.url?.includes('xiaohongshu.com');

    const statusEl = document.getElementById('status');
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    if (isXhs) {
      dot.className = 'status-dot active';
      text.textContent = '已连接到小红书页面';
      return;
    }

    dot.className = 'status-dot inactive';
    text.textContent = '请先打开小红书页面';
    document.getElementById('btnStartScroll').disabled = true;
    document.getElementById('btnScanNow').disabled = true;
  });
}

function bindEvents() {
  document.getElementById('btnSettings').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/settings.html') });
  });

  document.getElementById('btnStartScroll').addEventListener('click', () => {
    const speedMap = {
      slow: { minInterval: 4000, maxInterval: 10000, pauseChance: 0.25 },
      normal: { minInterval: 2000, maxInterval: 6000, pauseChance: 0.15 },
      fast: { minInterval: 1000, maxInterval: 3000, pauseChance: 0.08 },
    };

    const speed = document.getElementById('scrollSpeed').value;
    const maxScrolls = parseInt(document.getElementById('maxScrolls').value, 10) || 100;
    const config = {
      ...speedMap[speed],
      maxScrolls,
      scrollDistance: 400,
    };

    sendToActiveTab({ type: 'START_AUTO_SCROLL', config }, () => {
      document.getElementById('btnStartScroll').disabled = true;
      document.getElementById('btnStopScroll').disabled = false;
      showToast('自动浏览已开始。');
      startStatsRefresh();
    });
  });

  document.getElementById('btnStopScroll').addEventListener('click', () => {
    sendToActiveTab({ type: 'STOP_AUTO_SCROLL' }, () => {
      document.getElementById('btnStartScroll').disabled = false;
      document.getElementById('btnStopScroll').disabled = true;
      showToast('自动浏览已停止。');
      stopStatsRefresh();
      loadStats();
    });
  });

  document.getElementById('btnScanNow').addEventListener('click', () => {
    sendToActiveTab({ type: 'SCAN_DOM' }, () => {
      showToast('页面扫描已完成。');
      setTimeout(loadStats, 500);
    });
  });

  document.querySelectorAll('.export-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const format = button.dataset.format;
      button.disabled = true;
      button.style.opacity = '0.5';

      chrome.runtime.sendMessage({ type: 'EXPORT_DATA', format }, (result) => {
        button.disabled = false;
        button.style.opacity = '1';

        if (result?.ok) {
          if (format === 'atelier') {
            showToast(result.guidance || '已导出 XHS Atelier 导入包。');
          } else {
            showToast(`已导出 ${EXPORT_LABELS[format] || result.filename}。`);
          }
          return;
        }

        showToast(`导出失败：${result?.error || '未知错误'}`);
      });
    });
  });

  document.getElementById('btnClear').addEventListener('click', () => {
    if (!confirm('确定要清空全部采集数据吗？此操作无法撤销。')) {
      return;
    }

    chrome.runtime.sendMessage({ type: 'CLEAR_DATA' }, () => {
      showToast('已清空全部采集数据。');
      loadStats();
    });
  });

  document.getElementById('btnCleanup').addEventListener('click', showCleanupDialog);
  document.getElementById('btnHistory').addEventListener('click', showAnalysisHistory);
  document.getElementById('btnBatchAnalyze').addEventListener('click', showBatchAnalyzePanel);
}

function sendToActiveTab(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, message, callback);
      return;
    }

    if (callback) {
      callback(null);
    }
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTO_SCROLL_STOPPED') {
    stopStatsRefresh();
    loadStats();

    const startBtn = document.getElementById('btnStartScroll');
    const stopBtn = document.getElementById('btnStopScroll');
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;

    showToast('自动浏览已完成。');

    const autoAnalyze = document.getElementById('autoAnalyze');
    if (autoAnalyze?.checked) {
      setTimeout(() => triggerAutoAnalysis(), 1500);
    }
  }

  if (message.type === 'AUTO_ANALYSIS_DONE') {
    showToast(`自动分析已完成：${message.label}`);
  }
});

window.addEventListener('unload', stopStatsRefresh);

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  return `${Math.floor(hours / 24)} 天前`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function showToast(text) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function updateCapacityWarning(info) {
  const warningEl = document.getElementById('capacityWarning');
  const textEl = document.getElementById('capacityWarningText');

  if (!warningEl || !textEl) {
    return;
  }

  if (info.isReached) {
    warningEl.style.display = 'flex';
    warningEl.classList.add('critical');
    textEl.textContent = `存储已满（${info.current}/${info.limit} 条），请先清理后再继续采集。`;
    return;
  }

  if (info.isNearLimit) {
    warningEl.style.display = 'flex';
    warningEl.classList.remove('critical');
    textEl.textContent = `存储空间接近上限（${info.current}/${info.limit} 条，已使用 ${info.percentage}%）。`;
    return;
  }

  warningEl.style.display = 'none';
}

function showCleanupDialog() {
  const options = [
    { label: '删除 7 天前的数据', action: 'old', days: 7 },
    { label: '删除 30 天前的数据', action: 'old', days: 30 },
    { label: '仅删除已导出的数据', action: 'exported' },
    { label: '删除最早的 100 条数据', action: 'oldest', count: 100 },
    { label: '删除最早的 500 条数据', action: 'oldest', count: 500 },
  ];

  const message = [
    '请选择清理方式：',
    '',
    ...options.map((option, index) => `${index + 1}. ${option.label}`),
    '',
    '请输入 1 到 5 之间的数字，或直接取消。',
  ].join('\n');

  const choice = prompt(message);
  const index = parseInt(choice, 10) - 1;

  if (index >= 0 && index < options.length) {
    executeCleanup(options[index]);
  }
}

function executeCleanup(option) {
  let messageType;
  let params = {};

  if (option.action === 'old') {
    messageType = 'CLEAR_OLD_DATA';
    params = { days: option.days };
  } else if (option.action === 'exported') {
    messageType = 'CLEAR_EXPORTED_DATA';
  } else if (option.action === 'oldest') {
    messageType = 'CLEAR_OLDEST_DATA';
    params = { count: option.count };
  } else {
    return;
  }

  chrome.runtime.sendMessage({ type: messageType, ...params }, (result) => {
    if (result?.ok) {
      showToast(`已删除 ${result.deleted} 条数据。`);
      loadStats();
      return;
    }

    showToast(`清理失败：${result?.error || '未知错误'}`);
  });
}

function showBatchAnalyzePanel() {
  if (document.querySelector('.history-overlay')) {
    return;
  }

  chrome.storage.sync.get('userConfig', (result) => {
    const customPrompts = result.userConfig?.customPrompts || [];

    chrome.runtime.sendMessage({ type: 'GET_RECENT_POSTS', limit: 50 }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        showToast('加载最近采集内容失败。');
        return;
      }

      const posts = response.posts || [];
      if (!posts.length) {
        showToast('还没有可分析的内容，请先采集一些笔记。');
        return;
      }

      const allPrompts = { ...BATCH_PROMPTS };
      customPrompts.forEach((prompt) => {
        if (prompt.name && prompt.content) {
          allPrompts[prompt.name] = {
            pageType: prompt.pageType,
            prompt: prompt.content,
          };
        }
      });

      const overlay = document.createElement('div');
      overlay.className = 'history-overlay';
      overlay.innerHTML = `
        <div class="history-panel batch-panel">
          <div class="history-header">
            <span>批量分析</span>
            <button class="history-close">关闭</button>
          </div>
          <div class="batch-prompt-select">
            <label for="batchPromptKey">分析模板</label>
            <select id="batchPromptKey">
              ${Object.keys(BATCH_PROMPTS)
                .map((key) => `<option value="${escapeAttr(key)}">${escapeHtml(key)}</option>`)
                .join('')}
              ${
                customPrompts.length
                  ? `<optgroup label="自定义提示词">
                      ${customPrompts
                        .filter((prompt) => prompt.name && prompt.content)
                        .map((prompt) => `<option value="${escapeAttr(prompt.name)}">${escapeHtml(prompt.name)}</option>`)
                        .join('')}
                    </optgroup>`
                  : ''
              }
            </select>
          </div>
          <div class="batch-select-bar">
            <span class="batch-count">已选 <strong id="batchSelectedCount">0</strong> / ${posts.length}</span>
            <button class="batch-select-all">全选</button>
          </div>
          <div class="history-list batch-list">
            ${posts
              .map((post) => {
                const noteId = String(post.noteId || '');
                const title = (post.title || '未命名').slice(0, 36);
                const author = post.authorName || '未知作者';
                const likes = String(post.likedCount || 0);
                return `
                  <label class="batch-item">
                    <input type="checkbox" class="batch-check" value="${escapeAttr(noteId)}">
                    <div class="batch-item-info">
                      <div class="batch-item-title">${escapeHtml(title)}</div>
                      <div class="batch-item-meta">${escapeHtml(author)} / ${escapeHtml(likes)} 赞 / ${timeAgo(post.capturedAt)}</div>
                    </div>
                  </label>
                `;
              })
              .join('')}
          </div>
          <div class="batch-footer">
            <button class="btn btn-primary batch-run" id="btnRunBatch" disabled>开始分析</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelector('.history-close').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          overlay.remove();
        }
      });

      const countEl = overlay.querySelector('#batchSelectedCount');
      const runBtn = overlay.querySelector('#btnRunBatch');
      const selectAllBtn = overlay.querySelector('.batch-select-all');

      const updateCount = () => {
        const checked = overlay.querySelectorAll('.batch-check:checked').length;
        countEl.textContent = checked;
        runBtn.disabled = checked === 0;
        const total = overlay.querySelectorAll('.batch-check').length;
        selectAllBtn.textContent = checked === total ? '取消全选' : '全选';
      };

      overlay.querySelectorAll('.batch-check').forEach((checkbox) => {
        checkbox.addEventListener('change', updateCount);
      });

      selectAllBtn.addEventListener('click', () => {
        const checkboxes = [...overlay.querySelectorAll('.batch-check')];
        const allChecked = checkboxes.every((checkbox) => checkbox.checked);
        checkboxes.forEach((checkbox) => {
          checkbox.checked = !allChecked;
        });
        updateCount();
      });

      runBtn.addEventListener('click', () => {
        const selectedIds = new Set(
          [...overlay.querySelectorAll('.batch-check:checked')].map((checkbox) => String(checkbox.value)),
        );
        const selectedPosts = posts.filter((post) => selectedIds.has(String(post.noteId || '')));
        const promptKey = overlay.querySelector('#batchPromptKey').value;
        const promptConfig = allPrompts[promptKey];

        overlay.remove();
        executeBatchAnalysis(selectedPosts, promptKey, promptConfig.prompt);
      });
    });
  });
}

function executeBatchAnalysis(posts, promptKey, prompt) {
  showToast(`正在为 ${posts.length} 条内容启动批量分析...`);

  sendToActiveTab(
    {
      type: 'BATCH_ANALYZE',
      posts,
      promptKey,
      prompt,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showToast('请先打开小红书页面。');
        return;
      }

      if (response?.error === 'NO_API_KEY') {
        showToast('请先在设置中配置接口密钥。');
      } else if (response?.ok) {
        showToast('批量分析已开始，可稍后在历史记录中查看结果。');
      }
    },
  );
}

function triggerAutoAnalysis() {
  sendToActiveTab({ type: 'AUTO_ANALYZE' }, (response) => {
    if (chrome.runtime.lastError) {
      return;
    }

    if (response?.ok) {
      showToast('自动分析已开始。');
    } else if (response?.error === 'NO_API_KEY') {
      showToast('请先在设置中配置接口密钥。');
    } else if (response?.error === 'NO_DATA') {
      showToast('当前没有可供分析的采集数据。');
    }
  });
}

function showAnalysisHistory() {
  if (document.querySelector('.history-overlay')) {
    return;
  }

  chrome.runtime.sendMessage({ type: 'GET_ANALYSES', limit: 20 }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      showToast('加载分析历史失败。');
      return;
    }

    const list = response.list || [];
    const overlay = document.createElement('div');
    overlay.className = 'history-overlay';

    overlay.innerHTML = `
      <div class="history-panel">
        <div class="history-header">
          <span>分析历史</span>
          <button class="history-close">关闭</button>
        </div>
        <div class="history-list">
          ${
            list.length === 0
              ? '<div class="history-empty">还没有保存的分析记录。</div>'
              : list
                  .map((item) => {
                    const safeId = Number(item.id) || 0;
                    const preview = (item.markdown || '').slice(0, 80).replace(/[#*`]/g, '');
                    return `
                      <div class="history-item" data-id="${safeId}">
                        <div class="history-item-meta">
                          <span class="history-label">${escapeHtml(item.label)}</span>
                          <span class="history-type">${escapeHtml(PAGE_TYPE_LABELS[item.pageType] || item.pageType)}</span>
                          <span class="history-time">${timeAgo(item.createdAt)}</span>
                        </div>
                        <div class="history-item-preview">${escapeHtml(preview)}...</div>
                        <div class="history-item-actions">
                          <button class="history-copy" data-id="${safeId}">复制</button>
                          <button class="history-delete" data-id="${safeId}">删除</button>
                        </div>
                      </div>
                    `;
                  })
                  .join('')
          }
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.history-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    overlay.querySelectorAll('.history-copy').forEach((button) => {
      button.addEventListener('click', () => {
        const id = parseInt(button.dataset.id, 10);
        const item = list.find((entry) => entry.id === id);
        if (!item) {
          return;
        }

        navigator.clipboard
          .writeText(item.markdown)
          .then(() => showToast('已复制到剪贴板。'))
          .catch(() => showToast('复制失败。'));
      });
    });

    overlay.querySelectorAll('.history-delete').forEach((button) => {
      button.addEventListener('click', () => {
        if (button.disabled) {
          return;
        }

        button.disabled = true;
        const id = parseInt(button.dataset.id, 10);
        chrome.runtime.sendMessage({ type: 'DELETE_ANALYSIS', id }, () => {
          const item = button.closest('.history-item');
          if (item) {
            item.remove();
          }
          const historyList = overlay.querySelector('.history-list');
          if (historyList && !historyList.querySelector('.history-item')) {
            historyList.innerHTML = '<div class="history-empty">还没有保存的分析记录。</div>';
          }
          showToast('已删除。');
        });
      });
    });
  });
}
