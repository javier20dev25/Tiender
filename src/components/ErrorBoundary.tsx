import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-[30px] p-10 max-w-md w-full shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-3 tracking-tight">
                            Algo salió mal
                        </h1>
                        <p className="text-zinc-400 text-sm font-medium mb-8 leading-relaxed">
                            Ocurrió un error inesperado. Puedes intentar recargar la página o volver al inicio.
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="w-full py-4 bg-brand-neon text-brand-dark font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
