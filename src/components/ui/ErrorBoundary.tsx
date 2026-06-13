"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error("[JMind] Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-zinc-50">
              {this.props.fallbackTitle || "Something went wrong"}
            </h2>
            <p className="max-w-md text-sm text-zinc-500">
              JMind encountered an unexpected error. Your data is likely safe in local storage. 
              Try refreshing the page to recover.
            </p>
            {this.state.error && (
               <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-black/40 p-4 text-left text-[10px] text-rose-300/60 font-mono">
                 {this.state.error.message}
               </pre>
            )}
          </div>
          <Button 
            onClick={this.handleReset}
            className="gap-2"
          >
            <RefreshCw size={16} />
            Refresh JMind
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
