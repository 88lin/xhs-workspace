import './ipc/bootstrap';
import React, { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const THEME_STORAGE_KEY = 'xhs-studio:theme-mode:v1';

function initializeThemeMode() {
  try {
    const saved = String(window.localStorage.getItem(THEME_STORAGE_KEY) || '').trim().toLowerCase();
    const mode = saved === 'light' || saved === 'dark'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
}

type ErrorBoundaryState = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('小红书创作台渲染错误:', error, errorInfo);
    this.setState({ errorInfo });
  }

  override render() {
    const { error, errorInfo } = this.state;

    if (error) {
      return (
        <div className="fatal-shell">
          <section className="fatal-panel">
            <div className="fatal-kicker">桌面端错误</div>
            <h1>界面启动失败</h1>
            <p>
              这是前端渲染层出现的异常，当前不会清空你的本地数据或设置。请先尝试重新加载；如果仍然失败，
              再根据下方错误详情继续排查。
            </p>

            <div className="fatal-actions">
              <button
                type="button"
                className="fatal-button"
                onClick={() => window.location.reload()}
              >
                重新加载界面
              </button>
            </div>

            <details className="fatal-meta">
              <summary>查看错误详情</summary>
              <pre>{error.stack || error.message}</pre>
              {errorInfo?.componentStack ? <pre>{errorInfo.componentStack}</pre> : null}
            </details>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

initializeThemeMode();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('未找到根容器 "#root"。');
}

const appTree = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

const isDevRuntime = window.location.protocol !== 'file:';

ReactDOM.createRoot(rootElement).render(
  isDevRuntime ? <StrictMode>{appTree}</StrictMode> : appTree,
);
