import React, { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Tabs } from 'antd';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import IntervieweeView from './features/interview/IntervieweeView.jsx';
import InterviewerDashboard from './features/interview/InterviewerDashboard.jsx';
import WelcomeBackModal from './components/WelcomeBackModal.jsx';
import { useSelector } from 'react-redux';

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
        <Routes>
          <Route path="/" element={<IntervieweeView />} />
          <Route path="/dashboard" element={<InterviewerDashboard />} />
        </Routes>
        <WelcomeBackModal />
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}


