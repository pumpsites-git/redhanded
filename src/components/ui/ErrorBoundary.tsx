'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="bg-[var(--bg-card)] border border-red-900 rounded-xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
          <p className="text-[var(--text-muted)] text-sm">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="mt-4 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-sm text-[var(--text-secondary)] hover:border-[var(--red-primary)] transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
