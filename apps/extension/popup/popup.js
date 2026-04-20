let statsRefreshTimer = null;

const EXPORT_LABELS = {
  atelier: 'XHS Atelier import package',
  json: 'JSON',
  jsonl: 'JSONL',
  markdown: 'Markdown',
  training: 'Training data',
};

const SOURCE_LABELS = {
  homefeed: 'Home feed',
  search: 'Search',
  detail: 'Detail page',
  user_profile: 'Profile page',
  dom_feed: 'DOM cards',
  dom_detail: 'DOM detail',
};

const PAGE_TYPE_LABELS = {
  detail: 'Detail page',
  feed: 'Feed',
  profile: 'Profile page',
};

const BATCH_PROMPTS = {
  'Content Overview': {
    pageType: 'feed',
    prompt: [
      'Analyze the following Xiaohongshu posts as a group.',
      '1. Summarize the main topic clusters.',
      '2. Explain what the higher-engagement posts have in common.',
      '3. Describe the dominant content style.',
      '4. Give 3 practical creation suggestions.',
      'Reply in concise Chinese.',
    ].join('\n'),
  },
  'Potential Winners': {
    pageType: 'feed',
    prompt: [
      'Review the following Xiaohongshu posts and identify breakout potential.',
      '1. Pick the 3 strongest posts and explain why they stand out.',
      '2. Summarize repeatable patterns behind strong performance.',
      '3. Turn the patterns into a reusable content formula.',
      'Reply in concise Chinese.',
    ].join('\n'),
  },
  'Tag Patterns': {
    pageType: 'feed',
    prompt: [
      'Review the following Xiaohongshu posts from a tagging perspective.',
      '1. List the most frequent tags.',
      '2. Explain how tags relate to engagement.',
      '3. Recommend stronger tag combinations for future posts.',
      'Reply in concise Chinese.',
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
    container.innerHTML = '<div class="source-empty">No data yet</div>';
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
      text.textContent = 'Connected to Xiaohongshu';
      return;
    }

    dot.className = 'status-dot inactive';
    text.textContent = 'Open a Xiaohongshu page first';
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
      showToast('Auto browse started.');
      startStatsRefresh();
    });
  });

  document.getElementById('btnStopScroll').addEventListener('click', () => {
    sendToActiveTab({ type: 'STOP_AUTO_SCROLL' }, () => {
      document.getElementById('btnStartScroll').disabled = false;
      document.getElementById('btnStopScroll').disabled = true;
      showToast('Auto browse stopped.');
      stopStatsRefresh();
      loadStats();
    });
  });

  document.getElementById('btnScanNow').addEventListener('click', () => {
    sendToActiveTab({ type: 'SCAN_DOM' }, () => {
      showToast('DOM scan finished.');
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
            showToast(result.guidance || 'Exported an XHS Atelier import package.');
          } else {
            showToast(`Exported ${EXPORT_LABELS[format] || result.filename}.`);
          }
          return;
        }

        showToast(`Export failed: ${result?.error || 'Unknown error'}`);
      });
    });
  });

  document.getElementById('btnClear').addEventListener('click', () => {
    if (!confirm('Clear all collected data? This cannot be undone.')) {
      return;
    }

    chrome.runtime.sendMessage({ type: 'CLEAR_DATA' }, () => {
      showToast('All collected data has been cleared.');
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

    showToast('Auto browse finished.');

    const autoAnalyze = document.getElementById('autoAnalyze');
    if (autoAnalyze?.checked) {
      setTimeout(() => triggerAutoAnalysis(), 1500);
    }
  }

  if (message.type === 'AUTO_ANALYSIS_DONE') {
    showToast(`Auto analysis finished: ${message.label}`);
  }
});

window.addEventListener('unload', stopStatsRefresh);

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
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
    textEl.textContent = `Storage is full (${info.current}/${info.limit} items). Clean up data before collecting more.`;
    return;
  }

  if (info.isNearLimit) {
    warningEl.style.display = 'flex';
    warningEl.classList.remove('critical');
    textEl.textContent = `Storage is almost full (${info.current}/${info.limit}, ${info.percentage}% used).`;
    return;
  }

  warningEl.style.display = 'none';
}

function showCleanupDialog() {
  const options = [
    { label: 'Remove data older than 7 days', action: 'old', days: 7 },
    { label: 'Remove data older than 30 days', action: 'old', days: 30 },
    { label: 'Remove exported data only', action: 'exported' },
    { label: 'Remove the oldest 100 items', action: 'oldest', count: 100 },
    { label: 'Remove the oldest 500 items', action: 'oldest', count: 500 },
  ];

  const message = [
    'Choose a cleanup action:',
    '',
    ...options.map((option, index) => `${index + 1}. ${option.label}`),
    '',
    'Enter a number from 1 to 5, or cancel.',
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
      showToast(`Removed ${result.deleted} items.`);
      loadStats();
      return;
    }

    showToast(`Cleanup failed: ${result?.error || 'Unknown error'}`);
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
        showToast('Failed to load recent posts.');
        return;
      }

      const posts = response.posts || [];
      if (!posts.length) {
        showToast('No posts available yet. Capture some content first.');
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
            <span>Batch analysis</span>
            <button class="history-close">x</button>
          </div>
          <div class="batch-prompt-select">
            <label for="batchPromptKey">Prompt</label>
            <select id="batchPromptKey">
              ${Object.keys(BATCH_PROMPTS)
                .map((key) => `<option value="${escapeAttr(key)}">${escapeHtml(key)}</option>`)
                .join('')}
              ${
                customPrompts.length
                  ? `<optgroup label="Custom prompts">
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
            <span class="batch-count">Selected <strong id="batchSelectedCount">0</strong> / ${posts.length}</span>
            <button class="batch-select-all">Select all</button>
          </div>
          <div class="history-list batch-list">
            ${posts
              .map((post) => {
                const noteId = String(post.noteId || '');
                const title = (post.title || 'Untitled').slice(0, 36);
                const author = post.authorName || 'Unknown author';
                const likes = String(post.likedCount || 0);
                return `
                  <label class="batch-item">
                    <input type="checkbox" class="batch-check" value="${escapeAttr(noteId)}">
                    <div class="batch-item-info">
                      <div class="batch-item-title">${escapeHtml(title)}</div>
                      <div class="batch-item-meta">${escapeHtml(author)} / ${escapeHtml(likes)} likes / ${timeAgo(post.capturedAt)}</div>
                    </div>
                  </label>
                `;
              })
              .join('')}
          </div>
          <div class="batch-footer">
            <button class="btn btn-primary batch-run" id="btnRunBatch" disabled>Run analysis</button>
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

      const updateCount = () => {
        const checked = overlay.querySelectorAll('.batch-check:checked').length;
        countEl.textContent = checked;
        runBtn.disabled = checked === 0;
      };

      overlay.querySelectorAll('.batch-check').forEach((checkbox) => {
        checkbox.addEventListener('change', updateCount);
      });

      overlay.querySelector('.batch-select-all').addEventListener('click', () => {
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
  showToast(`Running batch analysis for ${posts.length} posts...`);

  sendToActiveTab(
    {
      type: 'BATCH_ANALYZE',
      posts,
      promptKey,
      prompt,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        showToast('Open a Xiaohongshu page first.');
        return;
      }

      if (response?.error === 'NO_API_KEY') {
        showToast('Configure an API key in Settings first.');
      } else if (response?.ok) {
        showToast('Batch analysis started. Open History to review the result later.');
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
      showToast('Auto analysis started.');
    } else if (response?.error === 'NO_API_KEY') {
      showToast('Configure an API key in Settings first.');
    } else if (response?.error === 'NO_DATA') {
      showToast('No captured data is available for analysis.');
    }
  });
}

function showAnalysisHistory() {
  if (document.querySelector('.history-overlay')) {
    return;
  }

  chrome.runtime.sendMessage({ type: 'GET_ANALYSES', limit: 20 }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      showToast('Failed to load analysis history.');
      return;
    }

    const list = response.list || [];
    const overlay = document.createElement('div');
    overlay.className = 'history-overlay';

    overlay.innerHTML = `
      <div class="history-panel">
        <div class="history-header">
          <span>Analysis history</span>
          <button class="history-close">x</button>
        </div>
        <div class="history-list">
          ${
            list.length === 0
              ? '<div class="history-empty">No saved analysis yet.</div>'
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
                          <button class="history-copy" data-id="${safeId}">Copy</button>
                          <button class="history-delete" data-id="${safeId}">Delete</button>
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
          .then(() => showToast('Copied to clipboard.'))
          .catch(() => showToast('Copy failed.'));
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
          showToast('Deleted.');
        });
      });
    });
  });
}
