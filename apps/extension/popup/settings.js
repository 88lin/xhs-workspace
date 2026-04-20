const el = (id) => document.getElementById(id);

const DEFAULT_CONFIG = {
  imageLimit: { detail: 6, feed: 8, profile: 8 },
  videoFrameCount: 6,
  rateLimit: { maxPerMinute: 25, maxPer5Min: 80, minInterval: 2500 },
  scrollBehavior: { upScrollChance: 0.1, longPauseChance: 0.15, fatigueThreshold1: 50, fatigueThreshold2: 100 },
  apiConfig: {
    provider: 'openrouter',
    apiKey: '',
    apiModel: 'google/gemini-2.0-flash-001',
    customEndpoint: '',
    customModel: '',
  },
  customPrompts: [],
};

const API_PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    keyPlaceholder: 'sk-or-v1-...',
    hint: [
      'Your API key stays in local browser storage.',
      'Supports multiple model families behind one endpoint.',
      'Get a key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">OpenRouter</a>.',
    ],
    models: [
      ['google/gemini-2.0-flash-001', 'Gemini 2.0 Flash (Recommended)'],
      ['google/gemini-2.0-flash-thinking-exp', 'Gemini 2.0 Flash Thinking'],
      ['anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet'],
      ['anthropic/claude-3-opus', 'Claude 3 Opus'],
      ['openai/gpt-4o', 'GPT-4o'],
      ['openai/gpt-4o-mini', 'GPT-4o Mini (Low cost)'],
      ['openai/gpt-4-turbo', 'GPT-4 Turbo'],
      ['meta-llama/llama-3.3-70b-instruct', 'Llama 3.3 70B'],
    ],
  },
  anthropic: {
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-ant-...',
    hint: [
      'Direct Claude API from Anthropic.',
      'Requires an Anthropic account.',
      'Get a key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic Console</a>.',
    ],
    models: [
      ['claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet (Recommended)'],
      ['claude-3-opus-20240229', 'Claude 3 Opus'],
      ['claude-3-haiku-20240307', 'Claude 3 Haiku (Low cost)'],
    ],
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    hint: [
      'Direct GPT API from OpenAI.',
      'Requires an OpenAI account.',
      'Get a key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI Platform</a>.',
    ],
    models: [
      ['gpt-4o', 'GPT-4o (Recommended)'],
      ['gpt-4o-mini', 'GPT-4o Mini (Low cost)'],
      ['gpt-4-turbo', 'GPT-4 Turbo'],
      ['gpt-4', 'GPT-4'],
    ],
  },
  google: {
    name: 'Google AI',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyPlaceholder: 'AIza...',
    hint: [
      'Direct Gemini API from Google.',
      'Requires a Google AI Studio key.',
      'Get a key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.',
    ],
    models: [
      ['gemini-2.0-flash-exp', 'Gemini 2.0 Flash (Recommended)'],
      ['gemini-1.5-pro', 'Gemini 1.5 Pro'],
      ['gemini-1.5-flash', 'Gemini 1.5 Flash (Low cost)'],
    ],
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    hint: [
      'DeepSeek official API.',
      'Text analysis only. Image analysis is not supported.',
      'Get a key from <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">DeepSeek Platform</a>.',
    ],
    models: [
      ['deepseek-chat', 'DeepSeek Chat (Recommended)'],
      ['deepseek-reasoner', 'DeepSeek Reasoner'],
    ],
  },
  qwen: {
    name: 'Qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    hint: [
      'Alibaba Cloud Qwen API.',
      'Supports multimodal analysis on VL models.',
      'Get a key from <a href="https://help.aliyun.com/zh/model-studio/getting-started/first-api-call-to-qwen" target="_blank" rel="noreferrer">Alibaba Cloud Model Studio</a>.',
    ],
    models: [
      ['qwen-vl-max-latest', 'Qwen VL Max (Multimodal, Recommended)'],
      ['qwen-vl-plus-latest', 'Qwen VL Plus (Multimodal)'],
      ['qwen-max', 'Qwen Max (Text)'],
      ['qwen-plus', 'Qwen Plus (Text)'],
      ['qwen-turbo', 'Qwen Turbo (Text, Low cost)'],
    ],
  },
  minimax: {
    name: 'MiniMax',
    endpoint: 'https://api.minimax.io/anthropic',
    keyPlaceholder: 'Paste your API key',
    hint: [
      'MiniMax official API.',
      'Text analysis only. Image analysis is not supported.',
      'Get a key from <a href="https://platform.minimax.io" target="_blank" rel="noreferrer">MiniMax Platform</a>.',
    ],
    models: [
      ['MiniMax-M2.7', 'MiniMax M2.7 (Recommended)'],
      ['MiniMax-M2.7-highspeed', 'MiniMax M2.7 High Speed'],
      ['MiniMax-M2.5', 'MiniMax M2.5'],
      ['MiniMax-M2.5-highspeed', 'MiniMax M2.5 High Speed'],
    ],
  },
  custom: {
    name: 'Custom endpoint',
    endpoint: '',
    keyPlaceholder: 'Paste your API key',
    hint: [
      'Use any OpenAI-compatible endpoint.',
      'The endpoint should support the model format you expect.',
      'If you need image analysis, make sure the endpoint accepts multimodal input.',
      'Specify the final model in the Model ID field below.',
    ],
    models: [['custom-model', 'Custom model']],
  },
};

const PRESETS = {
  safe: {
    name: 'Conservative',
    imageLimit: { detail: 6, feed: 8, profile: 8 },
    rateLimit: { maxPerMinute: 20, maxPer5Min: 60, minInterval: 3000 },
    scrollBehavior: { upScrollChance: 0.1, longPauseChance: 0.2, fatigueThreshold1: 40, fatigueThreshold2: 80 },
  },
  balanced: {
    name: 'Balanced',
    imageLimit: { detail: 6, feed: 8, profile: 8 },
    rateLimit: { maxPerMinute: 25, maxPer5Min: 80, minInterval: 2500 },
    scrollBehavior: { upScrollChance: 0.1, longPauseChance: 0.15, fatigueThreshold1: 50, fatigueThreshold2: 100 },
  },
  fast: {
    name: 'Fast capture',
    imageLimit: { detail: 10, feed: 15, profile: 15 },
    rateLimit: { maxPerMinute: 35, maxPer5Min: 100, minInterval: 2000 },
    scrollBehavior: { upScrollChance: 0.08, longPauseChance: 0.1, fatigueThreshold1: 60, fatigueThreshold2: 120 },
  },
  unlimited: {
    name: 'Unlimited images',
    imageLimit: { detail: 0, feed: 0, profile: 0 },
    rateLimit: { maxPerMinute: 25, maxPer5Min: 80, minInterval: 2500 },
    scrollBehavior: { upScrollChance: 0.1, longPauseChance: 0.15, fatigueThreshold1: 50, fatigueThreshold2: 100 },
  },
};

const PAGE_TYPE_OPTIONS = [
  { value: 'detail', label: 'Detail page' },
  { value: 'feed', label: 'Feed' },
  { value: 'profile', label: 'Profile page' },
];

const DEFAULT_PROMPT_NAMES = new Set([
  '📊 内容分析', '✍️ 仿写文案', '🔥 爆款潜力', '🏷️ 标签建议', '🎨 视觉诊断',
  '🎬 视频分析', '🔥 完播率诊断', '✍️ 仿拍脚本', '📊 爆款对标',
  '📈 趋势洞察', '🎯 选题推荐', '🏆 爆文拆解', '📊 数据报告',
  '👤 博主画像', '📐 运营策略', '🔥 爆款复盘', '🎯 对标建议',
  'Content Overview', 'Potential Winners', 'Tag Patterns',
]);

let apiTestStatus = { tested: false, success: false, lastTestedConfig: null };

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  bindEvents();
  updateProviderUI();
  updateFormSteps();
});

function providerModels(provider) {
  return (API_PROVIDERS[provider]?.models || []).map(([value, label]) => ({ value, label }));
}

function updateFormSteps() {
  const provider = el('apiProvider').value;
  const apiKey = el('apiKey').value.trim();
  el('apiKey').disabled = !provider;
  el('btnTogglePassword').disabled = !provider;
  el('btnTestAPI').disabled = !provider;
  el('apiKey').placeholder = provider ? API_PROVIDERS[provider].keyPlaceholder : 'Choose a provider first';
  el('apiModel').disabled = !(provider && apiKey) || provider === 'custom';
  el('customModel').disabled = !(provider && apiKey);
  el('customEndpoint').disabled = !(provider === 'custom' && apiKey);
  if (!apiKey) {
    el('customModel').placeholder = 'Enter your API key first';
  }
}

function updateProviderUI() {
  const provider = el('apiProvider').value || 'openrouter';
  const config = API_PROVIDERS[provider];
  el('apiKey').placeholder = config.keyPlaceholder;
  el('apiKeyHint').textContent = `Used for ${config.name}`;
  el('customEndpointContainer').style.display = provider === 'custom' ? 'flex' : 'none';
  el('customModelContainer').style.display = provider === 'custom' ? 'flex' : 'none';
  el('apiModelContainer').style.display = provider === 'custom' ? 'none' : 'flex';
  el('apiModel').innerHTML = '';
  providerModels(provider).forEach((model) => {
    const option = document.createElement('option');
    option.value = model.value;
    option.textContent = model.label;
    el('apiModel').appendChild(option);
  });
  el('apiHintList').innerHTML = config.hint.map((hint) => `<li>${hint}</li>`).join('');
  updateFormSteps();
}

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('userConfig');
    const config = result.userConfig || DEFAULT_CONFIG;
    el('imageDetail').value = config.imageLimit.detail;
    el('imageFeed').value = config.imageLimit.feed;
    el('imageProfile').value = config.imageLimit.profile;
    el('videoFrameCount').value = config.videoFrameCount ?? 6;
    el('rateMaxPerMinute').value = config.rateLimit.maxPerMinute;
    el('rateMaxPer5Min').value = config.rateLimit.maxPer5Min;
    el('rateMinInterval').value = config.rateLimit.minInterval;
    el('scrollUpChance').value = Math.round(config.scrollBehavior.upScrollChance * 100);
    el('scrollLongPauseChance').value = Math.round(config.scrollBehavior.longPauseChance * 100);
    el('scrollFatigue1').value = config.scrollBehavior.fatigueThreshold1;
    el('scrollFatigue2').value = config.scrollBehavior.fatigueThreshold2;

    if (config.apiConfig) {
      el('apiProvider').value = config.apiConfig.provider || 'openrouter';
      updateProviderUI();
      el('apiKey').value = config.apiConfig.apiKey || '';
      el('apiModel').value = config.apiConfig.apiModel || 'google/gemini-2.0-flash-001';
      el('customEndpoint').value = config.apiConfig.customEndpoint || '';
      el('customModel').value = config.apiConfig.customModel || '';
      if (config.apiConfig.apiKey) {
        apiTestStatus = {
          tested: true,
          success: true,
          lastTestedConfig: {
            provider: config.apiConfig.provider || 'openrouter',
            apiKey: config.apiConfig.apiKey || '',
            apiModel: config.apiConfig.apiModel || 'google/gemini-2.0-flash-001',
            customEndpoint: config.apiConfig.customEndpoint || '',
            customModel: config.apiConfig.customModel || '',
          },
        };
      }
    }

    renderCustomPrompts(config.customPrompts || []);
    updateFormSteps();
  } catch (error) {
    console.error('Failed to load settings:', error);
    showToast('Failed to load settings.');
  }
}

function validateConfig(config) {
  const errors = [];
  if (config.imageLimit.detail < 0 || config.imageLimit.detail > 50) errors.push('Detail page image limit must be between 0 and 50.');
  if (config.imageLimit.feed < 0 || config.imageLimit.feed > 50) errors.push('Feed image limit must be between 0 and 50.');
  if (config.imageLimit.profile < 0 || config.imageLimit.profile > 50) errors.push('Profile page image limit must be between 0 and 50.');
  if (config.rateLimit.maxPerMinute < 5 || config.rateLimit.maxPerMinute > 60) errors.push('Max requests per minute must be between 5 and 60.');
  if (config.rateLimit.maxPer5Min < 20 || config.rateLimit.maxPer5Min > 300) errors.push('Max requests per 5 minutes must be between 20 and 300.');
  if (config.rateLimit.minInterval < 1000 || config.rateLimit.minInterval > 10000) errors.push('Minimum interval must be between 1000 and 10000 ms.');
  if (config.scrollBehavior.upScrollChance < 0 || config.scrollBehavior.upScrollChance > 1) errors.push('Up-scroll chance must be between 0 and 1.');
  if (config.scrollBehavior.longPauseChance < 0 || config.scrollBehavior.longPauseChance > 1) errors.push('Long pause chance must be between 0 and 1.');
  if (config.scrollBehavior.fatigueThreshold1 < 10 || config.scrollBehavior.fatigueThreshold1 > 200) errors.push('Fatigue threshold 1 must be between 10 and 200.');
  if (config.scrollBehavior.fatigueThreshold2 < 20 || config.scrollBehavior.fatigueThreshold2 > 300) errors.push('Fatigue threshold 2 must be between 20 and 300.');
  if (config.scrollBehavior.fatigueThreshold2 <= config.scrollBehavior.fatigueThreshold1) errors.push('Fatigue threshold 2 must be greater than fatigue threshold 1.');
  return errors;
}

async function saveSettings() {
  try {
    const provider = el('apiProvider').value;
    const apiKey = el('apiKey').value.trim();
    const apiModel = el('apiModel').value;
    const customEndpoint = el('customEndpoint').value.trim();
    const customModel = el('customModel').value.trim();
    const resolvedModel = provider === 'custom' ? customModel : apiModel;

    if (!apiKey) {
      showToast('Add an API key first.');
      el('apiKey').focus();
      return;
    }
    if (provider === 'custom' && !customEndpoint) {
      showToast('Enter a custom API endpoint first.');
      el('customEndpoint').focus();
      return;
    }
    if (provider === 'custom' && !customModel) {
      showToast('Enter a model ID first.');
      el('customModel').focus();
      return;
    }

    const currentAPIConfig = { provider, apiKey, apiModel: resolvedModel, customEndpoint, customModel };
    let apiConfigChanged = false;
    if (apiTestStatus.lastTestedConfig) {
      apiConfigChanged =
        apiTestStatus.lastTestedConfig.provider !== currentAPIConfig.provider ||
        apiTestStatus.lastTestedConfig.apiKey !== currentAPIConfig.apiKey ||
        apiTestStatus.lastTestedConfig.apiModel !== currentAPIConfig.apiModel ||
        apiTestStatus.lastTestedConfig.customEndpoint !== currentAPIConfig.customEndpoint ||
        apiTestStatus.lastTestedConfig.customModel !== currentAPIConfig.customModel;
    }

    if (!apiTestStatus.tested || !apiTestStatus.success || apiConfigChanged) {
      showToast('Run the API connection test before saving.');
      const testButton = el('btnTestAPI');
      testButton.focus();
      testButton.style.animation = 'pulse 0.5s ease-in-out 3';
      setTimeout(() => { testButton.style.animation = ''; }, 1500);
      return;
    }

    const config = {
      imageLimit: {
        detail: parseInt(el('imageDetail').value, 10) || 0,
        feed: parseInt(el('imageFeed').value, 10) || 0,
        profile: parseInt(el('imageProfile').value, 10) || 0,
      },
      videoFrameCount: Math.min(12, Math.max(2, parseInt(el('videoFrameCount').value, 10) || 6)),
      rateLimit: {
        maxPerMinute: parseInt(el('rateMaxPerMinute').value, 10) || 25,
        maxPer5Min: parseInt(el('rateMaxPer5Min').value, 10) || 80,
        minInterval: parseInt(el('rateMinInterval').value, 10) || 2500,
      },
      scrollBehavior: {
        upScrollChance: parseInt(el('scrollUpChance').value, 10) / 100 || 0.1,
        longPauseChance: parseInt(el('scrollLongPauseChance').value, 10) / 100 || 0.15,
        fatigueThreshold1: parseInt(el('scrollFatigue1').value, 10) || 50,
        fatigueThreshold2: parseInt(el('scrollFatigue2').value, 10) || 100,
      },
      apiConfig: {
        provider,
        apiKey,
        apiModel: resolvedModel,
        customEndpoint,
        customModel,
        endpoint: provider === 'custom' ? customEndpoint : API_PROVIDERS[provider].endpoint,
      },
      customPrompts: collectCustomPrompts(),
    };

    const validationErrors = validateConfig(config);
    if (validationErrors.length) {
      alert(['Configuration validation failed:', '', ...validationErrors].join('\n'));
      showToast('Validation failed. Review the fields and try again.');
      return;
    }

    await chrome.storage.sync.set({ userConfig: config });
    const tabs = await chrome.tabs.query({ url: 'https://www.xiaohongshu.com/*' });
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CONFIG', config }).catch(() => {});
    });

    showToast('Settings saved.');
    setTimeout(showSuccessModal, 500);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Save failed.');
  }
}

function showSuccessModal() {
  const modal = document.createElement('div');
  modal.className = 'success-modal';
  modal.innerHTML = `
    <div class="success-modal__card">
      <div class="success-modal__mark">XA</div>
      <h2 class="success-modal__title">Settings saved</h2>
      <p class="success-modal__body">Your collector is ready. Open Xiaohongshu and start capturing content.</p>
      <button id="btnGoToXHS" class="success-modal__primary">Open Xiaohongshu -></button>
      <button id="btnCloseModal" class="success-modal__secondary">Maybe later</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#btnGoToXHS').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.xiaohongshu.com/explore' });
    window.close();
  });
  modal.querySelector('#btnCloseModal').addEventListener('click', () => {
    modal.remove();
    window.close();
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.remove();
      window.close();
    }
  });
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  el('imageDetail').value = preset.imageLimit.detail;
  el('imageFeed').value = preset.imageLimit.feed;
  el('imageProfile').value = preset.imageLimit.profile;
  el('rateMaxPerMinute').value = preset.rateLimit.maxPerMinute;
  el('rateMaxPer5Min').value = preset.rateLimit.maxPer5Min;
  el('rateMinInterval').value = preset.rateLimit.minInterval;
  el('scrollUpChance').value = Math.round(preset.scrollBehavior.upScrollChance * 100);
  el('scrollLongPauseChance').value = Math.round(preset.scrollBehavior.longPauseChance * 100);
  el('scrollFatigue1').value = preset.scrollBehavior.fatigueThreshold1;
  el('scrollFatigue2').value = preset.scrollBehavior.fatigueThreshold2;
  showToast(`Applied the "${preset.name}" preset.`);
}

function bindEvents() {
  el('btnBack').addEventListener('click', () => window.close());
  el('btnSave').addEventListener('click', saveSettings);
  el('apiProvider').addEventListener('change', () => {
    updateProviderUI();
    resetAPITestStatus();
    setTimeout(() => el('apiKey').focus(), 100);
  });
  el('apiKey').addEventListener('input', () => { resetAPITestStatus(); updateFormSteps(); });
  el('apiKey').addEventListener('blur', updateFormSteps);
  el('apiModel').addEventListener('change', resetAPITestStatus);
  el('customEndpoint').addEventListener('input', () => { resetAPITestStatus(); updateFormSteps(); });
  el('customModel').addEventListener('input', resetAPITestStatus);
  el('btnTogglePassword').addEventListener('click', () => {
    const input = el('apiKey');
    el('btnTogglePassword').textContent = input.type === 'password' ? 'Hide' : 'Show';
    input.type = input.type === 'password' ? 'text' : 'password';
  });
  document.querySelectorAll('.preset-btn').forEach((button) => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset));
  });
  el('btnTestAPI').addEventListener('click', testAPIConnection);
  el('btnAddPrompt').addEventListener('click', addCustomPromptRow);
}

function resetAPITestStatus() {
  apiTestStatus = { tested: false, success: false, lastTestedConfig: null };
  const resultDiv = el('apiTestResult');
  resultDiv.style.display = 'none';
  resultDiv.textContent = '';
  resultDiv.className = '';
}

async function testAPIConnection() {
  const provider = el('apiProvider').value;
  const apiKey = el('apiKey').value.trim();
  const apiModel = el('apiModel').value;
  const customEndpoint = el('customEndpoint').value.trim();
  const customModel = el('customModel').value.trim();
  const resultDiv = el('apiTestResult');
  const testBtn = el('btnTestAPI');
  const resolvedModel = provider === 'custom' ? customModel : apiModel;

  if (!apiKey) return showApiError('Please enter an API key first.');
  if (provider === 'custom' && !customEndpoint) return showApiError('Please enter a custom endpoint first.');
  if (provider === 'custom' && !customModel) return showApiError('Please enter a model ID first.');

  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';
  resultDiv.textContent = 'Testing the API connection...';
  resultDiv.className = '';
  resultDiv.style.display = 'block';

  try {
    const endpoint = provider === 'custom' ? customEndpoint : API_PROVIDERS[provider].endpoint;
    let response;
    if (provider === 'anthropic') {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: resolvedModel, max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }),
      });
    } else if (provider === 'google') {
      response = await fetch(`${endpoint}/${resolvedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      });
    } else {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: resolvedModel, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 10 }),
      });
    }

    if (response.ok) {
      resultDiv.textContent = 'Connection succeeded. You can save the settings now.';
      resultDiv.className = 'success';
      apiTestStatus = {
        tested: true,
        success: true,
        lastTestedConfig: { provider, apiKey, apiModel: resolvedModel, customEndpoint, customModel },
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
      showApiError(`Connection failed: ${message}`);
    }
  } catch (error) {
    showApiError(`Connection failed: ${error.message}`);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test connection';
  }

  function showApiError(text) {
    resultDiv.textContent = text;
    resultDiv.className = 'error';
    resultDiv.style.display = 'block';
    apiTestStatus = { tested: true, success: false, lastTestedConfig: null };
  }
}

function showToast(text) {
  el('toast').textContent = text;
  el('toast').classList.add('show');
  setTimeout(() => el('toast').classList.remove('show'), 2000);
}

function renderCustomPrompts(prompts) {
  const container = el('customPromptList');
  container.innerHTML = '';
  if (!prompts.length) {
    container.innerHTML = '<p class="empty-prompt-hint">No custom prompts yet. Use the button below to add one.</p>';
    return;
  }
  prompts.forEach((prompt, index) => container.appendChild(createPromptRow(prompt, index)));
}

function createPromptRow(prompt, index) {
  const row = document.createElement('div');
  row.className = 'custom-prompt-row';
  row.dataset.index = index;
  row.innerHTML = `
    <div class="prompt-row-header">
      <input type="text" class="prompt-name-input" placeholder="Prompt label (for example: Competitor teardown)" value="${escapeAttr(prompt.name || '')}">
      <select class="prompt-type-select">
        ${PAGE_TYPE_OPTIONS.map((option) => `<option value="${option.value}" ${prompt.pageType === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
      </select>
      <button class="btn-remove-prompt" title="Remove">X</button>
    </div>
    <textarea class="prompt-content-input" placeholder="Write the prompt that should run against the current page data..." rows="3">${escapeAttr(prompt.content || '')}</textarea>
    <div class="prompt-hint">
      <span class="prompt-char-count">${(prompt.content || '').length} characters</span>
      <span class="prompt-tip">Keep prompts under 500 characters when possible to reduce timeout risk.</span>
    </div>
  `;
  row.querySelector('.btn-remove-prompt').addEventListener('click', () => {
    row.remove();
    if (!document.querySelectorAll('.custom-prompt-row').length) {
      el('customPromptList').innerHTML = '<p class="empty-prompt-hint">No custom prompts yet. Use the button below to add one.</p>';
    }
  });
  const textarea = row.querySelector('.prompt-content-input');
  const charCount = row.querySelector('.prompt-char-count');
  textarea.addEventListener('input', () => {
    const length = textarea.value.length;
    charCount.textContent = `${length} characters`;
    charCount.style.color = length > 500 ? '#ff3b30' : '';
    charCount.style.fontWeight = length > 500 ? 'bold' : '';
  });
  return row;
}

function addCustomPromptRow() {
  const container = el('customPromptList');
  container.querySelector('.empty-prompt-hint')?.remove();
  container.appendChild(createPromptRow({ name: '', pageType: 'detail', content: '' }, container.querySelectorAll('.custom-prompt-row').length));
}

function collectCustomPrompts() {
  const rows = document.querySelectorAll('.custom-prompt-row');
  const prompts = [];
  const seenNames = new Set();
  rows.forEach((row) => {
    const name = row.querySelector('.prompt-name-input').value.trim();
    const pageType = row.querySelector('.prompt-type-select').value;
    const content = row.querySelector('.prompt-content-input').value.trim();
    if (!name || !content) return;
    if (DEFAULT_PROMPT_NAMES.has(name)) {
      showToast(`"${name}" conflicts with a built-in prompt name.`);
      row.querySelector('.prompt-name-input').style.borderColor = '#ff3b30';
      throw new Error(`Prompt name "${name}" conflicts with a built-in prompt.`);
    }
    if (seenNames.has(name)) {
      showToast(`"${name}" is duplicated. Use a unique prompt name.`);
      row.querySelector('.prompt-name-input').style.borderColor = '#ff3b30';
      throw new Error(`Prompt name "${name}" is duplicated.`);
    }
    seenNames.add(name);
    row.querySelector('.prompt-name-input').style.borderColor = '';
    prompts.push({ name, pageType, content });
  });
  return prompts;
}

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
