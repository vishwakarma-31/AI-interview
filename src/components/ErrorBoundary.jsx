import React from 'react';
import { Result, Button } from 'antd';
import { FrownOutlined } from '@ant-design/icons';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App error boundary:', error, info);
    this.setState({ errorInfo: info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle={
              <div>
                <p>We're sorry, but something went wrong. Please try refreshing the page.</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div style={{ marginTop: 20, textAlign: 'left', background: '#f0f0f0', padding: 12, borderRadius: 4 }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                )}
              </div>
            }
            extra={[
              <Button 
                type="primary" 
                key="refresh" 
                onClick={() => window.location.reload()}
                icon={<FrownOutlined />}
              >
                Refresh Page
              </Button>
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}