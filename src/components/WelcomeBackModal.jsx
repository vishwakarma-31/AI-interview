import React, { useMemo, useState } from 'react';
import { Modal } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { abandonActiveInterview, resumeTimerIfNeeded } from '../features/interview/interviewSlice.js';

export default function WelcomeBackModal() {
  const dispatch = useDispatch();
  const { candidates, activeCandidateId } = useSelector(s => s.interview);
  const activeCandidate = useMemo(() => candidates.find(c => c.id === activeCandidateId), [candidates, activeCandidateId]);
  const shouldShow = !!(activeCandidate && activeCandidate.status === 'in-progress');
  const [visible, setVisible] = useState(shouldShow);

  React.useEffect(() => {
    setVisible(shouldShow);
  }, [shouldShow]);

  const onResume = () => {
    if (activeCandidateId) {
      dispatch(resumeTimerIfNeeded({ candidateId: activeCandidateId }));
    }
    setVisible(false);
  };

  const onStartNew = () => {
    dispatch(abandonActiveInterview());
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


