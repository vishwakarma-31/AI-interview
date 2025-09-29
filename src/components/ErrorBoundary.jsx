import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App error boundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 24 }}>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}


