import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App.jsx';
import 'antd/dist/reset.css';
import './index.css';
import { InterviewProvider } from './contexts/InterviewContext.jsx';
import { validateEnvironment, validateRuntimeConfig } from './utils/envValidator.js';

// Validate environment variables on startup
try {
  validateEnvironment();
  const runtimeConfig = validateRuntimeConfig();
  console.log('Runtime configuration:', runtimeConfig);
} catch (error) {
  console.error('Environment validation failed:', error.message);
  // In a real app, you might want to show a user-friendly error message
  // For now, we'll just log it and continue
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider>
      <InterviewProvider>
        <App />
      </InterviewProvider>
    </ConfigProvider>
  </React.StrictMode>
);