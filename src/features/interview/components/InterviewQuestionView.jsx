import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Input, Card, Alert } from 'antd';
import {
  StopOutlined,
  AudioOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import Webcam from 'react-webcam';
import { AIAvatar, Waveform } from './InterviewComponents';
import { useToast } from '../../../components/ToastContainer';

function InterviewQuestionView({
  activeSession,
  timeLeft,
  isRecording,
  isSpeaking,
  transcript,
  isSpeechRecognitionSupported,
  loadingStates,
  isTimerRunning,
  isTimerPaused,
  toggleRecording,
  handleTextChange,
  handleSubmitAnswer,
  handleSkip,
  handlePause,
  handleResume,
  handleEndCall,
}) {
  // Define PropTypes for better type checking
  InterviewQuestionView.propTypes = {
    activeSession: PropTypes.shape({
      questions: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          difficulty: PropTypes.string,
          timeLimit: PropTypes.number,
        })
      ).isRequired,
      currentQuestionIndex: PropTypes.number.isRequired,
    }).isRequired,
    timeLeft: PropTypes.number.isRequired,
    isRecording: PropTypes.bool.isRequired,
    isSpeaking: PropTypes.bool.isRequired,
    transcript: PropTypes.string.isRequired,
    isSpeechRecognitionSupported: PropTypes.bool.isRequired,
    loadingStates: PropTypes.shape({
      submitAnswer: PropTypes.bool,
    }).isRequired,
    isTimerRunning: PropTypes.bool.isRequired,
    isTimerPaused: PropTypes.bool.isRequired,
    toggleRecording: PropTypes.func.isRequired,
    handleTextChange: PropTypes.func.isRequired,
    handleSubmitAnswer: PropTypes.func.isRequired,
    handleSkip: PropTypes.func.isRequired,
    handlePause: PropTypes.func.isRequired,
    handleResume: PropTypes.func.isRequired,
    handleEndCall: PropTypes.func.isRequired,
  };

  const { addToast } = useToast();
  const [webcamPermissionDenied, setWebcamPermissionDenied] = useState(false);
  const [webcamRetryKey, setWebcamRetryKey] = useState(0); // Key to force re-render of webcam
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = activeSession.questions[activeSession.currentQuestionIndex];
  const question = currentQuestion || {};

  // Refs for focus management
  const recordingButtonRef = useRef(null);
  const pauseButtonRef = useRef(null);
  const skipButtonRef = useRef(null);
  const submitButtonRef = useRef(null);
  const endButtonRef = useRef(null);
  const textAreaRef = useRef(null);

  const handleRetryWebcam = () => {
    setWebcamPermissionDenied(false);
    setWebcamRetryKey(prev => prev + 1); // Force re-render of webcam component
    addToast('Retrying camera access', 'info');
  };

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = e => {
      // Only handle keyboard shortcuts if not in a text input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'r':
        case 'R':
          e.preventDefault();
          toggleRecording();
          addToast(isRecording ? 'Stopped recording' : 'Started recording', 'info');
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          if (isTimerRunning && !isTimerPaused) {
            handlePause();
            addToast('Interview paused', 'info');
          } else {
            handleResume();
            addToast('Interview resumed', 'info');
          }
          break;
        case 's':
        case 'S':
          e.preventDefault();
          handleSkip();
          addToast('Question skipped', 'info');
          break;
        case 'Enter':
          e.preventDefault();
          if (transcript.trim()) {
            setIsSubmitting(true);
            handleSubmitAnswer(transcript);
            addToast('Answer submitted', 'success');
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleEndCall();
          addToast('Ending interview', 'info');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    toggleRecording,
    isTimerRunning,
    isTimerPaused,
    handlePause,
    handleResume,
    handleSkip,
    handleSubmitAnswer,
    handleEndCall,
    transcript,
    isRecording,
    addToast,
  ]);

  // Focus management when component mounts
  useEffect(() => {
    if (recordingButtonRef.current) {
      recordingButtonRef.current.focus();
    }
  }, []);

  // Announce question changes
  useEffect(() => {
    if (question.text) {
      addToast(`Question ${activeSession.currentQuestionIndex + 1}: ${question.text}`, 'info');
    }
  }, [question.text, activeSession.currentQuestionIndex, addToast]);

  return (
    <div className="video-interview-container" role="main" aria-label="Video Interview">
      {!isSpeechRecognitionSupported && (
        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 1000 }}>
          <Alert
            message="Speech Recognition Not Supported"
            description={
              'Speech Recognition is not supported in this browser. Please use Google Chrome or ' +
              'Microsoft Edge for the full AI experience. You can still type your answers manually.'
            }
            type="warning"
            showIcon
            closable
            role="alert"
            aria-live="polite"
          />
        </div>
      )}

      {/* Split Screen Layout */}
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
        }}
      >
        {/* Left Side - Webcam Feed */}
        <div
          className="user-webcam-container"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            position: 'relative',
            borderRight: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className={isSpeaking ? 'user-webcam-speaking' : 'user-webcam'}
            style={{
              width: '80%',
              height: '80%',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: isSpeaking
                ? '0 0 0 4px rgba(30, 144, 255, 0.8), 0 0 30px rgba(30, 144, 255, 0.6)'
                : '0 0 20px rgba(0, 0, 0, 0.5)',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            {webcamPermissionDenied ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000',
                  color: '#fff',
                  textAlign: 'center',
                  padding: '10px',
                }}
              >
                <div>
                  <VideoCameraOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                  <div>Camera access denied</div>
                  <div style={{ fontSize: '12px', marginTop: '4px', marginBottom: '12px' }}>
                    Please enable camera permissions
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    onClick={handleRetryWebcam}
                    style={{ fontSize: '12px' }}
                    aria-label="Retry camera access"
                    ref={recordingButtonRef}
                  >
                    Retry Camera
                  </Button>
                </div>
              </div>
            ) : (
              <Webcam
                key={webcamRetryKey} // Use key to force re-render
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                onUserMediaError={() => {
                  setWebcamPermissionDenied(true);
                  addToast('Camera access denied. Please enable camera permissions.', 'error');
                }}
                aria-label="Webcam feed"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        </div>

        {/* Right Side - AI/Question Interface */}
        <div
          className="ai-interviewer-container"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0c1427, #1a2332)',
            padding: '20px',
            position: 'relative',
          }}
        >
          {/* AI Interviewer Avatar */}
          <div
            className="ai-interviewer"
            role="region"
            aria-label="AI Interviewer"
            style={{ marginBottom: '40px' }}
          >
            <AIAvatar isSpeaking={isSpeaking} />
            {isSpeaking && <Waveform />}
          </div>

          {/* Question Display */}
          <div className="question-display" role="region" aria-label="Current Interview Question">
            <div className="question-header">
              <span
                className="question-number"
                aria-label={`Question ${activeSession.currentQuestionIndex + 1} of ${activeSession.questions.length}`}
              >
                {`Question ${activeSession.currentQuestionIndex + 1} of ${activeSession.questions.length}`}
              </span>
              <span
                className={`question-difficulty ${question.difficulty?.toLowerCase()}`}
                aria-label={`Difficulty: ${question.difficulty}`}
              >
                {question.difficulty}
              </span>
            </div>
            <h2 className="question-text" id="current-question">
              {question.text}
            </h2>
            <div className="question-timer" aria-live="polite">
              Time remaining:{' '}
              <span className={timeLeft < 30 ? 'timer-warning' : ''}>{timeLeft}s</span>
            </div>
          </div>

          {/* Answer Input */}
          <div
            className="answer-section"
            role="region"
            aria-label="Answer Section"
            style={{ width: '100%', maxWidth: '600px', marginTop: '40px' }}
          >
            <Card title="Your Answer" className="answer-card">
              <div style={{ marginTop: 16 }}>
                <Input.TextArea
                  ref={textAreaRef}
                  value={transcript}
                  onChange={handleTextChange}
                  placeholder="Type or record your answer here..."
                  autoSize={{ minRows: 4, maxRows: 6 }}
                  aria-label="Your answer"
                  aria-describedby="current-question"
                  onKeyDown={e => {
                    // Allow Ctrl+Enter to submit
                    if (e.ctrlKey && e.key === 'Enter' && transcript.trim()) {
                      e.preventDefault();
                      setIsSubmitting(true);
                      handleSubmitAnswer(transcript);
                      addToast('Answer submitted', 'success');
                    }
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Dock Controls */}
      <div
        className="call-controls"
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '25px',
          alignItems: 'center',
          zIndex: 20,
          background: 'rgba(12, 18, 32, 0.7)',
          padding: '15px 25px',
          borderRadius: '30px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Button
          icon={isRecording ? <StopOutlined /> : <AudioOutlined />}
          onClick={toggleRecording}
          type={isRecording ? 'primary' : 'default'}
          danger={isRecording}
          loading={loadingStates.submitAnswer && isRecording}
          aria-label={isRecording ? 'Stop recording (Press R)' : 'Start recording (Press R)'}
          aria-pressed={isRecording}
          ref={recordingButtonRef}
          className="control-button"
          style={{
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: isRecording ? '#ff4d4f' : 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            fontSize: '20px',
            position: 'relative',
          }}
          onMouseEnter={e => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'scale(1)';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleRecording();
            }
          }}
        />

        {isTimerRunning && !isTimerPaused ? (
          <Button
            icon={<PauseOutlined />}
            onClick={handlePause}
            type="default"
            aria-label="Pause interview timer (Press P)"
            ref={pauseButtonRef}
            className="control-button"
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              fontSize: '20px',
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'scale(1)';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePause();
              }
            }}
          />
        ) : (
          <Button
            icon={<PlayCircleOutlined />}
            onClick={handleResume}
            type="primary"
            aria-label="Resume interview timer (Press P)"
            ref={pauseButtonRef}
            className="control-button"
            style={{
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '50%',
              background: '#1890ff',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              fontSize: '20px',
            }}
            onMouseEnter={e => {
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'scale(1)';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleResume();
              }
            }}
          />
        )}

        <Button
          onClick={handleSkip}
          loading={loadingStates.submitAnswer}
          aria-label="Skip current question (Press S)"
          ref={skipButtonRef}
          className="control-button skip-button"
          style={{
            width: 'auto',
            padding: '0 25px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '30px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            fontSize: '16px',
          }}
          onMouseEnter={e => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'scale(1)';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSkip();
            }
          }}
        >
          Skip Question
        </Button>

        <Button
          type="primary"
          onClick={() => {
            if (transcript.trim()) {
              setIsSubmitting(true);
              handleSubmitAnswer(transcript);
              addToast('Answer submitted', 'success');
            }
          }}
          disabled={!transcript.trim()}
          loading={loadingStates.submitAnswer || isSubmitting}
          aria-label="Submit your answer (Press Enter)"
          ref={submitButtonRef}
          className="control-button"
          style={{
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: transcript.trim() ? '#52c41a' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            cursor: transcript.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            fontSize: '20px',
          }}
          onMouseEnter={e => {
            if (transcript.trim()) {
              e.target.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'scale(1)';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (transcript.trim()) {
                setIsSubmitting(true);
                handleSubmitAnswer(transcript);
                addToast('Answer submitted', 'success');
              }
            }
          }}
        >
          <PlayCircleOutlined />
        </Button>

        <Button
          danger
          onClick={handleEndCall}
          loading={loadingStates.submitAnswer}
          aria-label="End interview (Press Escape)"
          ref={endButtonRef}
          className="control-button end-button"
          style={{
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: '#ff4d4f',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            fontSize: '20px',
          }}
          onMouseEnter={e => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'scale(1)';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleEndCall();
            }
          }}
        >
          <PhoneOutlined />
        </Button>
      </div>
    </div>
  );
}

export default InterviewQuestionView;
