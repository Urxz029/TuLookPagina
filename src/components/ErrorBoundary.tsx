import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocurrió un error inesperado.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary captured error:', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#141413] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-white border border-[#E2DED5] p-8 space-y-4">
            <h1 className="font-editorial text-2xl font-semibold text-[#141413]">
              Ocurrió un problema en TU LOOK
            </h1>
            <p className="text-sm text-[#524F49] leading-relaxed">
              La operación fue detenida por las reglas de seguridad o conectividad.
              Puedes recargar la página para continuar.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-[#6E6A61] break-words bg-[#F3F1EC] p-3 rounded-lg">
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#7F1D3A] text-white text-sm font-medium hover:bg-[#67162E] transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
