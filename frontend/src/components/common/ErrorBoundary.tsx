import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React render boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">
              Đã xảy ra lỗi giao diện không mong muốn
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-mono break-words bg-slate-50 p-2 rounded border border-slate-200">
              {this.state.error?.message || 'Lỗi render không xác định'}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 text-xs font-medium text-white bg-brand-700 hover:bg-brand-800 px-4 py-2 rounded transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
