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
      '接口密钥只保存在浏览器本地存储中。',
      '一个接口下可以切换多种模型。',
      '前往 <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">OpenRouter</a> 获取接口密钥。',
    ],
    models: [
      ['google/gemini-2.0-flash-001', 'Gemini 2.0 Flash（推荐）'],
      ['google/gemini-2.0-flash-thinking-exp', 'Gemini 2.0 Flash Thinking'],
      ['anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet'],
      ['anthropic/claude-3-opus', 'Claude 3 Opus'],
      ['openai/gpt-4o', 'GPT-4o'],
      ['openai/gpt-4o-mini', 'GPT-4o Mini（低成本）'],
      ['openai/gpt-4-turbo', 'GPT-4 Turbo'],
      ['meta-llama/llama-3.3-70b-instruct', 'Llama 3.3 70B'],
    ],
  },
  anthropic: {
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    keyPlaceholder: 'sk-ant-...',
    hint: [
      '直接使用 Anthropic 官方 Claude 接口。',
      '需要你拥有 Anthropic 账户。',
      '前往 <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic Console</a> 获取接口密钥。',
    ],
    models: [
      ['claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet（推荐）'],
      ['claude-3-opus-20240229', 'Claude 3 Opus'],
      ['claude-3-haiku-20240307', 'Claude 3 Haiku（低成本）'],
    ],
  },
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    hint: [
      '直接使用 OpenAI 官方 GPT 接口。',
      '需要你拥有 OpenAI 账户。',
      '前往 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI Platform</a> 获取接口密钥。',
    ],
    models: [
      ['gpt-4o', 'GPT-4o（推荐）'],
      ['gpt-4o-mini', 'GPT-4o Mini（低成本）'],
      ['gpt-4-turbo', 'GPT-4 Turbo'],
      ['gpt-4', 'GPT-4'],
    ],
  },
  google: {
    name: 'Google AI',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    keyPlaceholder: 'AIza...',
    hint: [
      '直接使用 Google 官方 Gemini 接口。',
      '需要 Google AI Studio 的接口密钥。',
      '前往 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noreferrer">Google AI Studio</a> 获取接口密钥。',
    ],
    models: [
      ['gemini-2.0-flash-exp', 'Gemini 2.0 Flash（推荐）'],
      ['gemini-1.5-pro', 'Gemini 1.5 Pro'],
      ['gemini-1.5-flash', 'Gemini 1.5 Flash（低成本）'],
    ],
  },
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    hint: [
      'DeepSeek 官方 API。',
      '仅支持文本分析，不支持图像分析。',
      '前往 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">DeepSeek Platform</a> 获取接口密钥。',
    ],
    models: [
      ['deepseek-chat', 'DeepSeek Chat（推荐）'],
      ['deepseek-reasoner', 'DeepSeek Reasoner'],
    ],
  },
  qwen: {
    name: 'Qwen',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    hint: [
      '阿里云通义千问接口。',
      'VL 模型支持多模态分析。',
      '前往 <a href="https://help.aliyun.com/zh/model-studio/getting-started/first-api-call-to-qwen" target="_blank" rel="noreferrer">阿里云百炼</a> 获取接口密钥。',
    ],
    models: [
      ['qwen-vl-max-latest', 'Qwen VL Max（多模态，推荐）'],
      ['qwen-vl-plus-latest', 'Qwen VL Plus（多模态）'],
      ['qwen-max', 'Qwen Max（文本）'],
      ['qwen-plus', 'Qwen Plus（文本）'],
      ['qwen-turbo', 'Qwen Turbo（文本，低成本）'],
    ],
  },
  minimax: {
    name: 'MiniMax',
    endpoint: 'https://api.minimax.io/anthropic',
    keyPlaceholder: '粘贴你的接口密钥',
    hint: [
      'MiniMax 官方 API。',
      '仅支持文本分析，不支持图像分析。',
      '前往 <a href="https://platform.minimax.io" target="_blank" rel="noreferrer">MiniMax Platform</a> 获取接口密钥。',
    ],
    models: [
      ['MiniMax-M2.7', 'MiniMax M2.7（推荐）'],
      ['MiniMax-M2.7-highspeed', 'MiniMax M2.7 High Speed'],
      ['MiniMax-M2.5', 'MiniMax M2.5'],
      ['MiniMax-M2.5-highspeed', 'MiniMax M2.5 High Speed'],
    ],
  },
  custom: {
    name: '自定义接口',
    endpoint: '',
    keyPlaceholder: '粘贴你的接口密钥',
    hint: [
      '可接入任意兼容 OpenAI 协议的接口。',
      '请确认接口支持你预期的模型格式。',
      '如果你要做图像分析，请确认接口支持多模态输入。',
      '最终模型名称请在下方的模型 ID 中填写。',
    ],
    models: [['custom-model', '自定义模型']],
  },
};

const PRESETS = {
  safe: {
    name: '稳妥',
    imageLimit: { detail: 6, feed: 8, profile: 8 },
    rateLimit: { maxPerMinute: 20, maxPer5Min: 60, minInterval: 3000 },
    scrollBehavior: { upScrollChance: 0.1, longPauseChance: 0.2, fatigueThreshold1: 40, fatigueThreshold2: 80 },
  },
  balanced: {
    name: '均衡',
    imageLimit: { detail: 6, feed: 8, profile: 8 },
    rateLimit: { maxPerMinute: 25, maxPer5Min: 80, minInterval: 2500 },
    scrollBehavior: { upScrollChance: 0.1, longPauseChance: 0.15, fatigueThreshold1: 50, fatigueThreshold2: 100 },
  },
  fast: {
    name: '高速采集',
    imageLimit: { detail: 10, feed: 15, profile: 15 },
    rateLimit: { maxPerMinute: 35, maxPer5Min: 100, minInterval: 2000 },
    scrollBehavior: { upScrollChance: 0.08, longPauseChance: 0.1, fatigueThreshold1: 60, fatigueThreshold2: 120 },
  },
  unlimited: {
    name: '不限图片',
    imageLimit: { detail: 0, feed: 0, profile: 0 },
    rateLimit: { maxPerMinute: 25, maxPer5Min: 80, minInterval: 2500 },
    scrollBehavior: { upScrollChance: 0.1, longPauseChance: 0.15, fatigueThreshold1: 50, fatigueThreshold2: 100 },
  },
};

const PAGE_TYPE_OPTIONS = [
  { value: 'detail', label: '详情页' },
  { value: 'feed', label: '信息流' },
  { value: 'profile', label: '主页' },
];

const DEFAULT_PROMPT_NAMES = new Set([
  '内容分析', '仿写文案', '爆款潜力', '标签建议', '视觉诊断',
  '视频分析', '完播率诊断', '仿拍脚本', '爆款对标',
  '趋势洞察', '选题推荐', '爆文拆解', '数据报告',
  '博主画像', '运营策略', '爆款复盘', '对标建议',
  '📊 内容分析', '✍️ 仿写文案', '🔥 爆款潜力', '🏷️ 标签建议', '🎨 视觉诊断',
  '🎬 视频分析', '🔥 完播率诊断', '✍️ 仿拍脚本', '📊 爆款对标',
  '📈 趋势洞察', '🧠 选题推荐', '🧩 爆文拆解', '📊 数据报告',
  '👤 博主画像', '📋 运营策略', '🔥 爆款复盘', '🧭 对标建议',
  '内容总览', '潜力爆款', '标签规律',
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
  el('apiKey').placeholder = provider ? API_PROVIDERS[provider].keyPlaceholder : '请先选择服务提供方';
  el('apiModel').disabled = !(provider && apiKey) || provider === 'custom';
  el('customModel').disabled = !(provider && apiKey);
  el('customEndpoint').disabled = !(provider === 'custom' && apiKey);

  if (!apiKey) {
    el('customModel').placeholder = '请先输入接口密钥';
  }
}

function updateProviderUI() {
  const provider = el('apiProvider').value || 'openrouter';
  const config = API_PROVIDERS[provider];

  el('apiKey').placeholder = config.keyPlaceholder;
  el('apiKeyHint').textContent = `用于 ${config.name} 的接口认证`;
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
    console.error('加载设置失败:', error);
    showToast('加载设置失败。');
  }
}

function validateConfig(config) {
  const errors = [];

  if (config.imageLimit.detail < 0 || config.imageLimit.detail > 50) errors.push('详情页图片数量必须在 0 到 50 之间。');
  if (config.imageLimit.feed < 0 || config.imageLimit.feed > 50) errors.push('信息流图片数量必须在 0 到 50 之间。');
  if (config.imageLimit.profile < 0 || config.imageLimit.profile > 50) errors.push('主页图片数量必须在 0 到 50 之间。');
  if (config.rateLimit.maxPerMinute < 5 || config.rateLimit.maxPerMinute > 60) errors.push('每分钟最大请求数必须在 5 到 60 之间。');
  if (config.rateLimit.maxPer5Min < 20 || config.rateLimit.maxPer5Min > 300) errors.push('每 5 分钟最大请求数必须在 20 到 300 之间。');
  if (config.rateLimit.minInterval < 1000 || config.rateLimit.minInterval > 10000) errors.push('最小间隔必须在 1000 到 10000 毫秒之间。');
  if (config.scrollBehavior.upScrollChance < 0 || config.scrollBehavior.upScrollChance > 1) errors.push('向上回滚概率必须在 0 到 1 之间。');
  if (config.scrollBehavior.longPauseChance < 0 || config.scrollBehavior.longPauseChance > 1) errors.push('长暂停概率必须在 0 到 1 之间。');
  if (config.scrollBehavior.fatigueThreshold1 < 10 || config.scrollBehavior.fatigueThreshold1 > 200) errors.push('疲劳阈值 1 必须在 10 到 200 之间。');
  if (config.scrollBehavior.fatigueThreshold2 < 20 || config.scrollBehavior.fatigueThreshold2 > 300) errors.push('疲劳阈值 2 必须在 20 到 300 之间。');
  if (config.scrollBehavior.fatigueThreshold2 <= config.scrollBehavior.fatigueThreshold1) errors.push('疲劳阈值 2 必须大于疲劳阈值 1。');

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
      showToast('请先填写接口密钥。');
      el('apiKey').focus();
      return;
    }
    if (provider === 'custom' && !customEndpoint) {
      showToast('请先填写自定义接口地址。');
      el('customEndpoint').focus();
      return;
    }
    if (provider === 'custom' && !customModel) {
      showToast('请先填写模型 ID。');
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
      showToast('保存前请先完成 API 连接测试。');
      const testButton = el('btnTestAPI');
      testButton.focus();
      testButton.style.animation = 'pulse 0.5s ease-in-out 3';
      setTimeout(() => {
        testButton.style.animation = '';
      }, 1500);
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
      alert(['配置校验未通过：', '', ...validationErrors].join('\n'));
      showToast('配置校验失败，请检查填写内容。');
      return;
    }

    await chrome.storage.sync.set({ userConfig: config });
    const tabs = await chrome.tabs.query({ url: 'https://www.xiaohongshu.com/*' });
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_CONFIG', config }).catch(() => {});
    });

    showToast('设置已保存。');
    setTimeout(showSuccessModal, 500);
  } catch (error) {
    console.error('保存设置失败:', error);
    showToast('保存失败。');
  }
}

function showSuccessModal() {
  const modal = document.createElement('div');
  modal.className = 'success-modal';
  modal.innerHTML = `
    <div class="success-modal__card">
      <div class="success-modal__mark">XA</div>
      <h2 class="success-modal__title">设置已保存</h2>
      <p class="success-modal__body">采集器已经准备就绪。打开小红书即可开始采集与分析。</p>
      <button id="btnGoToXHS" class="success-modal__primary">打开小红书</button>
      <button id="btnCloseModal" class="success-modal__secondary">稍后再说</button>
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
  showToast(`已应用「${preset.name}」预设。`);
}

function bindEvents() {
  el('btnBack').addEventListener('click', () => window.close());
  el('btnSave').addEventListener('click', saveSettings);

  el('apiProvider').addEventListener('change', () => {
    updateProviderUI();
    resetAPITestStatus();
    setTimeout(() => el('apiKey').focus(), 100);
  });

  el('apiKey').addEventListener('input', () => {
    resetAPITestStatus();
    updateFormSteps();
  });
  el('apiKey').addEventListener('blur', updateFormSteps);
  el('apiModel').addEventListener('change', resetAPITestStatus);
  el('customEndpoint').addEventListener('input', () => {
    resetAPITestStatus();
    updateFormSteps();
  });
  el('customModel').addEventListener('input', resetAPITestStatus);

  el('btnTogglePassword').addEventListener('click', () => {
    const input = el('apiKey');
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    el('btnTogglePassword').textContent = reveal ? '隐藏' : '显示';
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

  if (!apiKey) return showApiError('请先输入接口密钥。');
  if (provider === 'custom' && !customEndpoint) return showApiError('请先填写自定义接口地址。');
  if (provider === 'custom' && !customModel) return showApiError('请先填写模型 ID。');

  testBtn.disabled = true;
  testBtn.textContent = '测试中...';
  resultDiv.textContent = '正在测试 API 连接...';
  resultDiv.className = '';
  resultDiv.style.display = 'block';

  try {
    const endpoint = provider === 'custom' ? customEndpoint : API_PROVIDERS[provider].endpoint;
    let response;

    if (provider === 'anthropic') {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: resolvedModel, max_tokens: 10, messages: [{ role: 'user', content: '你好' }] }),
      });
    } else if (provider === 'google') {
      response = await fetch(`${endpoint}/${resolvedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: '你好' }] }] }),
      });
    } else {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: resolvedModel, messages: [{ role: 'user', content: '你好' }], max_tokens: 10 }),
      });
    }

    if (response.ok) {
      resultDiv.textContent = '连接成功，现在可以保存设置了。';
      resultDiv.className = 'success';
      apiTestStatus = {
        tested: true,
        success: true,
        lastTestedConfig: { provider, apiKey, apiModel: resolvedModel, customEndpoint, customModel },
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
      showApiError(`连接失败：${message}`);
    }
  } catch (error) {
    showApiError(`连接失败：${error.message}`);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '测试连接';
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
    container.innerHTML = '<p class="empty-prompt-hint">还没有自定义提示词，点击下方按钮新增。</p>';
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
      <input type="text" class="prompt-name-input" placeholder="提示词名称，例如：竞品拆解" value="${escapeAttr(prompt.name || '')}">
      <select class="prompt-type-select">
        ${PAGE_TYPE_OPTIONS.map((option) => `<option value="${option.value}" ${prompt.pageType === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
      </select>
      <button class="btn-remove-prompt" title="删除">X</button>
    </div>
    <textarea class="prompt-content-input" placeholder="填写要基于当前页面数据执行的提示词..." rows="3">${escapeAttr(prompt.content || '')}</textarea>
    <div class="prompt-hint">
      <span class="prompt-char-count">${(prompt.content || '').length} 字</span>
      <span class="prompt-tip">建议控制在 500 字以内，降低超时风险。</span>
    </div>
  `;

  row.querySelector('.btn-remove-prompt').addEventListener('click', () => {
    row.remove();
    if (!document.querySelectorAll('.custom-prompt-row').length) {
      el('customPromptList').innerHTML = '<p class="empty-prompt-hint">还没有自定义提示词，点击下方按钮新增。</p>';
    }
  });

  const textarea = row.querySelector('.prompt-content-input');
  const charCount = row.querySelector('.prompt-char-count');
  textarea.addEventListener('input', () => {
    const length = textarea.value.length;
    charCount.textContent = `${length} 字`;
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
      showToast(`「${name}」与内置提示词重名，请换一个名称。`);
      row.querySelector('.prompt-name-input').style.borderColor = '#ff3b30';
      throw new Error(`提示词名称「${name}」与内置提示词重名。`);
    }

    if (seenNames.has(name)) {
      showToast(`「${name}」重复了，请使用唯一名称。`);
      row.querySelector('.prompt-name-input').style.borderColor = '#ff3b30';
      throw new Error(`提示词名称「${name}」重复。`);
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
