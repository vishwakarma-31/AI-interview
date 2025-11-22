import React from 'react';
import { Button, Result, Alert } from 'antd';

export default class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Dashboard error boundary:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // In a real application, you might want to send this to an error reporting service
    // like Sentry, Bugsnag, etc.
  }

  handleRetry = () => {
    // Reset the error state and try to re-render
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle="We encountered an error while displaying the dashboard. Please try again."
            extra={[
              <Button type="primary" key="retry" onClick={this.handleRetry}>
                Try Again
              </Button>,
              <Button 
                key="refresh" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            ]}
          />
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert 
              message="Error Details (Development Only)"
              description={
                <div>
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  <p><strong>Component Stack:</strong></p>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </div>
              }
              type="error"
              style={{ marginTop: 24 }}
            />
          )}
        </div>
      );
    }

    return this.props.children;
  }
}