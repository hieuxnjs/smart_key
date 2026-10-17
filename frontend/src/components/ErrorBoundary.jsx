import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  // Tự động reset trạng thái lỗi khi đổi tab hoặc resetTrigger thay đổi
  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-white/90 rounded-3xl border border-rose-200 shadow-sm text-center my-4 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-7 h-7 stroke-[2]" />
          </div>

          <div className="max-w-md space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {this.props.fallbackTitle || 'Không thể hiển thị nội dung này'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Đã xảy ra sự cố trong quá trình nạp dữ liệu. Các chức năng và trang khác của khóa cửa vẫn đang hoạt động an toàn.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-rose-500 bg-rose-50/70 p-2 rounded-xl border border-rose-100 mt-2 break-all">
                {this.state.error.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử Tải Lại</span>
            </button>

            {this.props.onGoHome && (
              <button
                onClick={this.props.onGoHome}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về Trang Chủ</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
