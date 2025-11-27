import React, { useEffect, useState, useCallback } from 'react';
import { Form, Button, Spin, message, Result, Card } from 'antd';
import { RedoOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { useInterview } from '../../contexts/InterviewContext';
import IntervieweeErrorBoundary from '../../components/IntervieweeErrorBoundary';
import InterviewSetupForm from './components/InterviewSetupForm';
import InterviewQuestionView from './components/InterviewQuestionView';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useInterviewTimer } from '../../hooks/useInterviewTimer';
import { useDraftSaving } from '../../hooks/useDraftSaving';
import { useToast } from '../../components/ToastContainer';

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
          { text: "Explain the concept of React hooks and their advantages.", difficulty: "Medium", timeLimit: 120 },
          { text: "How would you optimize the performance of a React application?", difficulty: "Hard", timeLimit: 180 },
          { text: "Describe the difference between state and props in React.", difficulty: "Easy", timeLimit: 90 },
          { text: "What is the purpose of Redux in a React application?", difficulty: "Medium", timeLimit: 150 },
          { text: "How do you handle side effects in React components?", difficulty: "Medium", timeLimit: 120 }
        ]
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
    const handleBeforeUnload = (e) => {
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
        <Spin size="large" tip="Starting interview..." />
      </div>
    );
  }

  // Show preview if in preview mode
  if (previewData) {
    return (
      <div className="interview-preview-container">
        <div className="preview-header">
          <h2>Interview Preview</h2>
          <p>Review your interview details before starting</p>
        </div>
        
        <div className="preview-content">
          <Card className="preview-card">
            <div className="interview-info">
              <div className="info-item">
                <span className="label">Name</span>
                <span>{previewData.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Email</span>
                <span>{previewData.email}</span>
              </div>
              <div className="info-item">
                <span className="label">Phone</span>
                <span>{previewData.phone}</span>
              </div>
              <div className="info-item">
                <span className="label">Role</span>
                <span>{previewData.role}</span>
              </div>
            </div>
          </Card>
          
          <Card 
            className="preview-card"
            title="Interview Questions"
          >
            {previewData.questions.map((question, index) => (
              <div key={`question-${question.text}-${index}`} className="question-preview-item">
                <div className="question-number">Question {index + 1}</div>
                <div className="question-text">{question.text}</div>
                <div className="question-meta">
                  <span className={`difficulty ${question.difficulty.toLowerCase()}`}>
                    {question.difficulty}
                  </span>
                  <span className="time-limit">{question.timeLimit}s</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
        
        <div className="preview-actions">
          <Button onClick={() => setPreviewData(null)}>
            Back to Form
          </Button>
          <Button 
            type="primary" 
            onClick={onStart}
          >
            Start Interview
          </Button>
        </div>
      </div>
    );
  }

  // Show completion screen if interview is completed
  if (activeSession && activeSession.status === 'completed') {
    return (
      <div className="completion-screen">
        <Result
          status="success"
          title="Interview Completed!"
          subTitle="Thank you for completing the interview. Your responses have been recorded."
        />
        <div className="score-display">
          <div className="score-label">Your Score</div>
          <div className="score-value">{activeSession.finalScore ?? 'N/A'}</div>
        </div>
        {activeSession.summary && (
          <div className="summary">
            <h3>Interview Summary</h3>
            <p>{activeSession.summary}</p>
          </div>
        )}
        <Button type="primary" size="large" onClick={() => window.location.reload()}>
          Start New Interview
        </Button>
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
    <div className="interview-setup-container">
      <div className="setup-card">
        <h2>
          <VideoCameraOutlined style={{ marginRight: 12 }} />
          AI Interview Assistant
        </h2>
        <p style={{ textAlign: 'center', marginBottom: 30, color: 'rgba(255,255,255,0.7)' }}>
          Prepare for your interview with our AI-powered assistant. 
          Please fill in your details to get started.
        </p>
        
        {errors.startInterview && (
          <div style={{ marginBottom: 20 }}>
            <Result
              status="error"
              title="Failed to Start Interview"
              subTitle={errors.startInterview}
              extra={[
                <Button 
                  type="primary" 
                  key="retry" 
                  onClick={onStart}
                  icon={<RedoOutlined />}
                >
                  Retry
                </Button>
              ]}
            />
          </div>
        )}
        
        <InterviewSetupForm
          form={form}
          prefill={prefill}
          setPrefill={setPrefill}
          onStart={onStart}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          loadingStates={loadingStates}
        />
      </div>
    </div>
  );
}