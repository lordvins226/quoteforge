import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="rounded-lg border border-line bg-ink-2 p-6 my-8 max-w-2xl">
        <p className="font-mono text-xs text-mint uppercase tracking-wider mb-2">
          Page failed to load
        </p>
        <p className="text-fog-2 text-sm mb-4 leading-relaxed">
          A chunk may have been purged after a recent deploy. Reloading the page will fetch the latest version.
        </p>
        {import.meta.env.DEV && this.state.error && (
          <p className="font-mono text-xs text-fog-3 mb-4 break-all">{this.state.error}</p>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-mint text-ink text-sm font-medium hover:bg-mint-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-mint focus:ring-offset-2 focus:ring-offset-ink"
        >
          Reload page
        </button>
      </div>
    );
  }
}
