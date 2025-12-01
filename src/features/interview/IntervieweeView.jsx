import React, { useEffect, useState, useCallback } from 'react';
import { Form, Button, Spin, message, Result, Typography, Tag } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { useInterview } from '../../contexts/InterviewContext';
import IntervieweeErrorBoundary from '../../components/IntervieweeErrorBoundary';
import InterviewSetupForm from './components/InterviewSetupForm';
import InterviewQuestionView from './components/InterviewQuestionView';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useInterviewTimer } from '../../hooks/useInterviewTimer';
import { useDraftSaving } from '../../hooks/useDraftSaving';
import { useToast } from '../../components/ToastContainer';

// Helper function to get tag color based on difficulty
const getDifficultyColor = difficulty => {
  switch (difficulty) {
    case 'Easy':
      return 'green';
    case 'Medium':
      return 'orange';
    default:
      return 'red';
  }
};

const { Title, Text } = Typography;

export default function IntervieweeView() {
  return (
    <IntervieweeErrorBoundary>
      <IntervieweeViewContent />
    </IntervieweeErrorBoundary>
  );
}

function IntervieweeViewContent() {
  const {
    activeCandidate,
    activeSession,
    loadingStates,
    error,
    errors,
    clearError,
    saveDraft,
    startInterview,
    submitAnswer,
  } = useInterview();

  const { addToast } = useToast();

  const [prefill, setPrefill] = useState({ name: '', email: '' });
  const [form] = Form.useForm();
  const [resumeFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [showPreview, setShowPreview] = useState(false); // New state for preview mode
  const [previewData, setPreviewData] = useState(null); // New state for preview data

  // Handle API errors
  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
      addToast(error, 'error');
    }
  }, [error, clearError, addToast]);

  // Handle specific API errors with retry option
  useEffect(() => {
    if (errors.startInterview) {
      const content = (
        <div>
          <div>Failed to start interview: {errors.startInterview}</div>
          <Button
            type="link"
            icon={<RedoOutlined />}
            onClick={() => form.submit()}
            size="small"
            style={{ padding: 0, marginTop: 4 }}
          >
            Retry
          </Button>
        </div>
      );
      message.error({
        content,
        duration: 0, // Keep the message until manually closed
        key: 'startInterviewError',
      });
      addToast(`Failed to start interview: ${errors.startInterview}`, 'error');
    }

    if (errors.submitAnswer) {
      const content = (
        <div>
          <div>Failed to submit answer: {errors.submitAnswer}</div>
          <Button
            type="link"
            icon={<RedoOutlined />}
            onClick={() => {
              if (activeSession) {
                submitAnswer({
                  sessionId: activeSession.id,
                  answerText: transcript,
                });
              }
            }}
            size="small"
            style={{ padding: 0, marginTop: 4 }}
          >
            Retry
          </Button>
        </div>
      );
      message.error({
        content,
        duration: 0, // Keep the message until manually closed
        key: 'submitAnswerError',
      });
      addToast(`Failed to submit answer: ${errors.submitAnswer}`, 'error');
    }
  }, [errors, form, transcript, activeSession, submitAnswer, addToast]);

  // Use custom hooks
  const { debouncedSaveDraft, initializeTranscriptFromDraft } = useDraftSaving(
    saveDraft,
    activeSession
  );

  const handleSubmitAnswer = useCallback(
    text => {
      if (!activeSession) return;

      // Call submit answer function directly
      submitAnswer({
        sessionId: activeSession.id,
        answerText: text || transcript,
      });

      setTranscript('');
      addToast('Answer submitted successfully', 'success');
    },
    [activeSession, submitAnswer, transcript, addToast]
  );

  const { timeLeft, isTimerRunning, isTimerPaused, pauseTimer, resumeTimer } = useInterviewTimer(
    activeSession,
    handleSubmitAnswer,
    transcript
  );

  const { isRecording, isSpeechRecognitionSupported, toggleRecording } = useSpeechRecognition(
    newTranscript => setTranscript(newTranscript),
    handleSubmitAnswer,
    activeSession,
    saveDraft
  );

  // Initialize transcript from draft when session or question changes
  useEffect(() => {
    if (activeSession && activeSession.questions && activeSession.questions.length > 0) {
      const question = activeSession.questions[activeSession.currentQuestionIndex];
      const initialTranscript = initializeTranscriptFromDraft(question);
      setTranscript(initialTranscript);
    }
  }, [activeSession, initializeTranscriptFromDraft]);

  const onStart = useCallback(async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const { name, email, phone, role } = values;
    if (!name || !email || !phone) {
      message.warning('Please provide Name, Email and Phone to start.');
      addToast('Please provide Name, Email and Phone to start.', 'warning');
      return;
    }

    // For preview mode, just show the preview without starting the interview
    if (showPreview) {
      setPreviewData({
        name,
        email,
        phone,
        role,
        questions: [
          {
            text: 'Explain the concept of React hooks and their advantages.',
            difficulty: 'Medium',
            timeLimit: 120,
          },
          {
            text: 'How would you optimize the performance of a React application?',
            difficulty: 'Hard',
            timeLimit: 180,
          },
          {
            text: 'Describe the difference between state and props in React.',
            difficulty: 'Easy',
            timeLimit: 90,
          },
          {
            text: 'What is the purpose of Redux in a React application?',
            difficulty: 'Medium',
            timeLimit: 150,
          },
          {
            text: 'How do you handle side effects in React components?',
            difficulty: 'Medium',
            timeLimit: 120,
          },
        ],
      });
      return;
    }

    // Call start interview function directly
    try {
      await startInterview({
        name,
        email,
        phone,
        role,
        resume: resumeFile,
      });
      addToast('Interview started successfully', 'success');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to start interview:', err);
      addToast('Failed to start interview. Please try again.', 'error');
    }
  }, [form, showPreview, startInterview, resumeFile, addToast]);

  // Reset form when candidate is abandoned
  useEffect(() => {
    if (!activeCandidate) {
      form.resetFields();
      setPrefill({ name: '', email: '' });
    }
  }, [activeCandidate, form]);

  // Handle before unload to warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = e => {
      if (activeSession && activeSession.status === 'in-progress') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSession]);

  // Render different views based on state
  if (loadingStates.startInterview) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100%',
        }}
      >
        <Spin size="large" tip="Starting interview..." />
      </div>
    );
  }

  // Show preview if in preview mode
  if (previewData) {
    return (
      <div
        style={{
          padding: '24px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          minHeight: '100vh',
        }}
      >
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title
              level={2}
              style={{
                marginBottom: '8px',
                color: 'var(--text-main)',
                fontWeight: 700,
              }}
            >
              Interview Preview
            </Title>
            <Text
              style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
              }}
            >
              Review your interview details before starting
            </Text>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '30px',
            }}
          >
            <div className="card">
              <Title
                level={4}
                style={{
                  margin: 0,
                  marginBottom: '16px',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                Candidate Information
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Text strong>Name:</Text> {previewData.name}
                </div>
                <div>
                  <Text strong>Email:</Text> {previewData.email}
                </div>
                <div>
                  <Text strong>Phone:</Text> {previewData.phone}
                </div>
                <div>
                  <Text strong>Role:</Text> {previewData.role || 'Not specified'}
                </div>
              </div>
            </div>

            <div className="card">
              <Title
                level={4}
                style={{
                  margin: 0,
                  marginBottom: '16px',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                Interview Details
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <Text strong>Questions:</Text> {previewData.questions.length}
                </div>
                <div>
                  <Text strong>Estimated Duration:</Text>{' '}
                  {Math.round(previewData.questions.reduce((sum, q) => sum + q.timeLimit, 0) / 60)}{' '}
                  minutes
                </div>
                <div>
                  <Text strong>Difficulty Levels:</Text>{' '}
                  {Array.from(new Set(previewData.questions.map(q => q.difficulty))).join(', ')}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <Title
              level={4}
              style={{
                margin: 0,
                marginBottom: '16px',
                color: 'var(--text-main)',
                fontWeight: 600,
              }}
            >
              Interview Questions
            </Title>
            {previewData.questions.map((question, index) => (
              <div
                key={question.text}
                style={{
                  padding: '16px 0',
                  borderBottom:
                    index < previewData.questions.length - 1
                      ? '1px solid var(--border-light)'
                      : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <Text strong>Question {index + 1}</Text>
                  <Tag
                    color={getDifficultyColor(question.difficulty)}
                    style={{
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 12px',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    {question.difficulty}
                  </Tag>
                </div>
                <Text>{question.text}</Text>
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Time limit: {question.timeLimit} seconds
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '30px',
            }}
          >
            <Button
              size="large"
              onClick={() => setPreviewData(null)}
              style={{
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                transition: 'all var(--transition-fast)',
                border: '1px solid var(--border-medium)',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              Back to Form
            </Button>
            <Button type="primary" size="large" onClick={onStart} className="btn-primary">
              Start Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show completion screen if interview is completed
  if (activeSession && activeSession.status === 'completed') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: 'var(--bg-body)',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Result
            status="success"
            title="Interview Completed!"
            subTitle="Thank you for completing the interview. Your responses have been recorded."
          />
          <div style={{ marginBottom: '24px' }}>
            <Text
              strong
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '18px',
              }}
            >
              Your Score
            </Text>
            <Text
              style={{
                fontSize: '48px',
                fontWeight: 700,
                color: 'var(--primary-color)',
              }}
            >
              {activeSession.finalScore ?? 'N/A'}
            </Text>
          </div>
          {activeSession.summary && (
            <div
              className="card"
              style={{
                textAlign: 'left',
                marginBottom: '24px',
              }}
            >
              <Title
                level={4}
                style={{
                  margin: 0,
                  marginBottom: '16px',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                }}
              >
                Interview Summary
              </Title>
              <Text>{activeSession.summary}</Text>
            </div>
          )}
          <Button
            type="primary"
            size="large"
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  // Show question view if we have an active session
  if (activeSession && activeSession.status === 'in-progress') {
    return (
      <InterviewQuestionView
        session={activeSession}
        transcript={transcript}
        setTranscript={setTranscript}
        isRecording={isRecording}
        isSpeechRecognitionSupported={isSpeechRecognitionSupported}
        toggleRecording={toggleRecording}
        timeLeft={timeLeft}
        isTimerRunning={isTimerRunning}
        isTimerPaused={isTimerPaused}
        pauseTimer={pauseTimer}
        resumeTimer={resumeTimer}
        handleSubmitAnswer={handleSubmitAnswer}
        debouncedSaveDraft={debouncedSaveDraft}
      />
    );
  }

  // Show setup form by default
  return (
    <InterviewSetupForm
      form={form}
      prefill={prefill}
      setPrefill={setPrefill}
      onStart={onStart}
      showPreview={showPreview}
      setShowPreview={setShowPreview}
      loadingStates={loadingStates}
    />
  );
}
