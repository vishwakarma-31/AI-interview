import React from 'react';
import { Result, Button } from 'antd';
import { FrownOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('App error boundary:', error, errorInfo);
  }

  render() {
    const { children } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return (
        <div
          style={{
            padding: 24,
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Result
            status="error"
            title="Something went wrong"
            subTitle={
              <div>
                <p>We&apos;re sorry, but something went wrong. Please try refreshing the page.</p>
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
              </Button>,
            ]}
          />
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
