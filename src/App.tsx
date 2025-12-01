import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Result, Spin } from 'antd';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import WelcomeBackModal from './components/WelcomeBackModal';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorToast from './components/GlobalErrorToast';
import { ToastProvider } from './components/ToastContainer';

// @ts-expect-error - Lazy import issue
const IntervieweeView = lazy(() => import('./features/interview/IntervieweeView'));
// @ts-expect-error - Lazy import issue
const InterviewerDashboard = lazy(() => import('./features/interview/InterviewerDashboard'));

const { Header, Content } = Layout;

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabKey, setTabKey] = useState('/');

  useEffect(() => {
    setTabKey(location.pathname);
  }, [location.pathname, setTabKey]);

  const items = useMemo(
    () => [
      {
        key: '/',
        label: <Link to="/">Interviewee</Link>,
      },
      {
        key: '/dashboard',
        label: <Link to="/dashboard">Dashboard</Link>,
      },
    ],
    []
  );

  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="app-title">AI Interview Assistant</div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[tabKey]}
          items={items}
          onClick={e => {
            navigate(e.key);
          }}
        />
      </Header>
      <Content className="app-content">
        {/* @ts-expect-error - Type issue with GlobalErrorToast */}
        <GlobalErrorToast />
        {/* @ts-expect-error - Type issue with ErrorBoundary */}
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
        {/* @ts-expect-error - Type issue with WelcomeBackModal */}
        <WelcomeBackModal />
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* @ts-expect-error - Type issue with ToastProvider */}
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </BrowserRouter>
  );
}
