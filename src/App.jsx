import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Menu, Result, Spin } from 'antd';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import WelcomeBackModal from './components/WelcomeBackModal';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorToast from './components/GlobalErrorToast';
import { ToastProvider } from './components/ToastContainer';

const IntervieweeView = lazy(() => import('./features/interview/IntervieweeView'));
const InterviewerDashboard = lazy(() => import('./features/interview/InterviewerDashboard'));

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabKey, setTabKey] = useState('/');

  useEffect(() => {
    setTabKey(location.pathname);
  }, [location.pathname]);

  const items = useMemo(
    () => [
      { key: '/', label: <Link to="/">Interviewee</Link> },
      { key: '/dashboard', label: <Link to="/dashboard">Dashboard</Link> },
    ],
    []
  );

  return (
    <div className="app-shell">
      <nav className="app-navbar glass-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              color: 'var(--text-main)',
              fontWeight: 700,
              fontSize: '1.5rem',
              marginRight: '24px',
            }}
          >
            AI Interview Assistant
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={[tabKey]}
            items={items}
            onClick={e => navigate(e.key)}
            style={{
              background: 'transparent',
              borderBottom: 'none',
              flex: 1,
            }}
          />
        </div>
      </nav>
      <main className="app-content">
        <GlobalErrorToast />
        <ErrorBoundary>
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  minHeight: '200px',
                }}
              >
                <Spin size="large" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<IntervieweeView />} />
              <Route path="/dashboard" element={<InterviewerDashboard />} />
              <Route path="*" element={<Result status="404" title="Not Found" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <WelcomeBackModal />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </BrowserRouter>
  );
}
