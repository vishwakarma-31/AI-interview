import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Result } from 'antd';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
const IntervieweeView = lazy(() => import('./features/interview/IntervieweeView.jsx'));
const InterviewerDashboard = lazy(() => import('./features/interview/InterviewerDashboard.jsx'));
import WelcomeBackModal from './components/WelcomeBackModal.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import GlobalErrorToast from './components/GlobalErrorToast.jsx';
import { ToastProvider } from './components/ToastContainer.jsx';

const { Header, Content } = Layout;

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabKey, setTabKey] = useState('/');

  useEffect(() => {
    setTabKey(location.pathname);
  }, [location.pathname]);

  const items = useMemo(() => (
    [
      { key: '/', label: <Link to="/">Interviewee</Link> },
      { key: '/dashboard', label: <Link to="/dashboard">Dashboard</Link> },
    ]
  ), []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 600, marginRight: 24 }}>AI Interview Assistant</div>
        <Menu theme="dark" mode="horizontal" selectedKeys={[tabKey]} items={items} onClick={(e) => navigate(e.key)} />
      </Header>
      <Content style={{ padding: 24 }}>
        <GlobalErrorToast />
        <ErrorBoundary>
          <Suspense fallback={<div />}> 
            <Routes>
              <Route path="/" element={<IntervieweeView />} />
              <Route path="/dashboard" element={<InterviewerDashboard />} />
              <Route path="*" element={<Result status="404" title="Not Found" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <WelcomeBackModal />
      </Content>
    </Layout>
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