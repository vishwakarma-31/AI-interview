import React, { useMemo, useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { useInterview } from '../contexts/InterviewContext.jsx';

export default function WelcomeBackModal() {
  const { 
    activeCandidate, 
    activeSession,
    abandonActiveInterview
  } = useInterview();
  
  const shouldShow = useMemo(() => {
    return !!(activeSession && activeCandidate && activeCandidate.status === 'in-progress');
  }, [activeSession, activeCandidate]);

  const [visible, setVisible] = useState(shouldShow);

  useEffect(() => {
    setVisible(shouldShow);
  }, [shouldShow]);

  const onResume = () => {
    // Timer logic is now handled locally in the IntervieweeView component
    setVisible(false);
  };

  const onStartNew = () => {
    abandonActiveInterview();
    setVisible(false);
  };

  return (
    <Modal
      title="Welcome Back"
      open={visible}
      onOk={onResume}
      onCancel={onStartNew}
      okText="Resume"
      cancelText="Start New"
      maskClosable={false}
      destroyOnClose
    >
      You have an unfinished interview. Would you like to resume?
    </Modal>
  );
}