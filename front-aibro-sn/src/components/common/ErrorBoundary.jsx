// src/components/common/ErrorBoundary.jsx
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could also send to a monitoring service like Sentry here
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="mb-2">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {this.props.resetErrorBoundary && (
            <button
              onClick={this.props.resetErrorBoundary}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;