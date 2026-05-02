import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 font-sans selection:bg-primary/30">
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-red-500/5 pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl glass-dark border border-red-500/20 rounded-[3rem] p-12 relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.1)]"
          >
            {/* Scanline Effect */}
            <div className="absolute inset-0 animate-scanline pointer-events-none opacity-20 bg-gradient-to-b from-transparent via-red-500/10 to-transparent" />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="w-20 h-20 skeuo-raised rounded-3xl flex items-center justify-center bg-red-500/10 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
                  System <span className="text-red-500">Critical Failure</span>
                </h1>
                <p className="text-sm text-white/40 font-black uppercase tracking-[0.4em]">Intelligence Feed Compromised</p>
              </div>

              <div className="w-full bg-black/60 p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-red-400/70 text-left overflow-auto max-h-40 skeuo-pressed whitespace-pre-wrap uppercase tracking-wider">
                {this.state.error?.toString() || 'Unknown Kernel Panic'}
                <br />
                {this.state.error?.stack?.slice(0, 500)}...
              </div>

              <div className="flex flex-wrap gap-4 w-full pt-4">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1 flex items-center justify-center gap-3 skeuo-button border border-white/10 bg-white/5 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] text-white/60 hover:text-white transition-all"
                >
                  <Home className="w-4 h-4" />
                  Base Camp
                </button>
                <button 
                  onClick={this.handleReset}
                  className="flex-[1.5] flex items-center justify-center gap-3 skeuo-button border border-red-500/20 bg-red-500/10 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] text-white shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:bg-red-500/20 transition-all border-glow-red"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Re-Calibrate Terminal
                </button>
              </div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="w-1 h-1 bg-red-500 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
