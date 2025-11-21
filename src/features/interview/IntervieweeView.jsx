import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Button, Input, Form, Card, Space, message, Select, Alert, Spin, Modal } from 'antd';
import InputMask from 'react-input-mask';
import { InboxOutlined, PhoneFilled, PauseOutlined, PlayCircleOutlined, AudioMutedOutlined, AudioOutlined, VideoCameraOutlined, StopOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, pauseTimer, resumeTimer, saveDraft, startInterview, submitAnswer } from './interviewSlice.js';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';

// Mock AI avatar component
const AIAvatar = ({ isSpeaking }) => (
  <div className="ai-avatar-container">
    <motion.div 
      className="ai-avatar"
      animate={isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 1.5, repeat: isSpeaking ? Infinity : 0 }}
    >
      <div className="avatar-placeholder">
        <VideoCameraOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        <div className="avatar-label">AI Interviewer</div>
      </div>
    </motion.div>
  </div>
);

// Waveform animation for speaking
const Waveform = () => (
  <div className="waveform">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="bar"
        animate={{
          height: [10, 25, 10],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.05,
        }}
      />
    ))}
  </div>
);

// Timer component with pulse effect
const InterviewTimer = ({ timeLeft, totalTime, isRunning }) => {
  const isCritical = timeLeft <= 10 && timeLeft > 0;
  
  return (
    <div className={`interview-timer ${isCritical ? 'critical' : ''}`}>
      <motion.div
        animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
        transition={isCritical ? { duration: 1, repeat: Infinity } : {}}
      >
        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
      </motion.div>
    </div>
  );
};

export default function IntervieweeView() {
  const dispatch = useDispatch();
  const { activeCandidate, activeSession, timers, loading, error } = useSelector(s => s.interview);
  const [prefill, setPrefill] = useState({ name: '', email: '' });
  const [form] = Form.useForm();
  const [resumeFile, setResumeFile] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  
  const answerRef = useRef();
  const webcamRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Handle API errors
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Timer effect
  useEffect(() => {
    if (activeSession && isTimerRunning) {
      const timer = timers[activeSession.id];
      if (timer && !timer.paused) {
        const updateTimer = () => {
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((timer.deadlineMs - now) / 1000));
          setTimeLeft(remaining);
          
          if (remaining <= 0) {
            // Time's up, submit empty answer
            handleSubmitAnswer('');
          }
        };
        
        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);
        
        return () => {
          if (timerRef.current) clearInterval(timerRef.current);
        };
      }
    }
  }, [activeSession, timers, isTimerRunning]);

  // Text-to-Speech effect
  useEffect(() => {
    if (activeSession && !isMuted) {
      const question = activeSession.questions[activeSession.currentQuestionIndex];
      if (question && question.text) {
        speakText(question.text);
      }
    }
    
    return () => {
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, [activeSession, activeSession?.currentQuestionIndex, isMuted]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(prev => prev + finalTranscript);
        
        // Reset silence timer when speech is detected
        if (finalTranscript || interimTranscript) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          
          // Set timer to auto-submit after 3 seconds of silence
          silenceTimerRef.current = setTimeout(() => {
            if (transcript.trim()) {
              handleSubmitAnswer(transcript);
            }
          }, 3000);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const speakText = (text) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    if (text && !isMuted) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && activeSession) {
      // If unmuting, speak the current question
      const question = activeSession.questions[activeSession.currentQuestionIndex];
      if (question && question.text) {
        speakText(question.text);
      }
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      message.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
      
      // Set timer to auto-submit after 3 seconds of silence
      silenceTimerRef.current = setTimeout(() => {
        if (transcript.trim()) {
          handleSubmitAnswer(transcript);
        }
      }, 3000);
    }
  };

  const beforeUpload = (file) => {
    const isValid = file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx') || file.name.endsWith('.pdf');
    if (!isValid) {
      message.error('Only PDF or DOCX files are allowed');
      return Upload.LIST_IGNORE;
    }
    
    // Extract name and email from filename (simplified)
    const base = file?.name || '';
    const name = base.split('.')[0].replace(/[_-]/g, ' ').trim() || 'John Doe';
    const email = name.toLowerCase().replace(/\s+/g, '.') + '@example.com';
    
    setPrefill({ name, email });
    setResumeFile(file);
    form.setFieldsValue({ name, email });
    message.success('Resume selected. Details pre-filled.');
    return false; // Prevent automatic upload
  };

  const onStart = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    
    const { name, email, phone, role } = values;
    if (!name || !email || !phone) {
      message.warning('Please provide Name, Email and Phone to start.');
      return;
    }
    
    // Dispatch start interview action
    dispatch(startInterview({ 
      name, 
      email, 
      phone, 
      role,
      resume: resumeFile
    }));
  };

  const handleSubmitAnswer = (text) => {
    if (!activeSession) return;
    
    dispatch(submitAnswer({ 
      sessionId: activeSession.id, 
      answerText: text || transcript 
    }));
    
    setTranscript('');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  const handleSkip = () => {
    if (!activeSession) return;
    
    dispatch(submitAnswer({ 
      sessionId: activeSession.id, 
      answerText: '[Skipped]' 
    }));
  };

  const handlePause = () => {
    if (!activeSession) return;
    dispatch(pauseTimer({ sessionId: activeSession.id }));
    setIsTimerRunning(false);
    message.info('Interview paused');
  };

  const handleResume = () => {
    if (!activeSession) return;
    dispatch(resumeTimer({ sessionId: activeSession.id }));
    setIsTimerRunning(true);
    message.success('Resumed');
  };

  const handleEndCall = () => {
    if (!activeSession) return;
    
    Modal.confirm({
      title: 'End Interview',
      content: 'Are you sure you want to end this interview?',
      onOk: () => {
        handleSubmitAnswer(transcript || '[No answer provided]');
      }
    });
  };

  // Show loading spinner when starting interview
  if (loading && !activeSession) {
    return (
      <div className="video-interview-container">
        <div className="loading-overlay">
          <Spin size="large" tip="Starting interview..." />
        </div>
      </div>
    );
  }

  // Show interview setup form if no active session or session not in progress
  if (!activeSession || activeCandidate?.status !== 'in-progress') {
    return (
      <div className="interview-setup-container">
        <div className="setup-card">
          <h2>Start a New Interview</h2>
          <Upload.Dragger 
            multiple={false} 
            beforeUpload={beforeUpload} 
            accept=".pdf,.docx"
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag a resume to upload (optional)</p>
          </Upload.Dragger>
          <Form 
            form={form} 
            layout="vertical" 
            style={{ marginTop: 16 }} 
            initialValues={{ name: prefill.name, email: prefill.email, phone: '', role: 'Frontend' }}
          >
            <Form.Item 
              label="Name" 
              name="name" 
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input placeholder="Your full name" />
            </Form.Item>
            <Form.Item 
              label="Email" 
              name="email" 
              rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
            >
              <Input placeholder="you@example.com" />
            </Form.Item>
            <Form.Item 
              label="Phone" 
              name="phone" 
              rules={[
                { required: true, message: 'Please enter your phone number' },
                { validator: (_, v) => {
                  const digits = (v || '').replace(/\D/g, '');
                  return digits.length >= 10 ? Promise.resolve() : Promise.reject(new Error('Enter a valid phone number'));
                }}
              ]}
            >
              <InputMask mask="(999) 999-9999" maskChar={null}>
                {(inputProps) => <Input {...inputProps} placeholder="(555) 123-4567" />}
              </InputMask>
            </Form.Item>
            <Form.Item 
              label="Role" 
              name="role" 
              rules={[{ required: true }]}
            >
              <Select 
                options={[{ value: 'Frontend' }, { value: 'Backend' }]} 
                style={{ width: 200 }} 
              />
            </Form.Item>
            <Button 
              type="primary" 
              onClick={onStart} 
              loading={loading}
              size="large"
            >
              Start Interview
            </Button>
          </Form>
        </div>
      </div>
    );
  }

  const question = activeSession.questions[activeSession.currentQuestionIndex];
  const timer = timers[activeSession.id];
  const isPaused = timer?.paused;

  // Completion view
  if (activeCandidate.status === 'completed') {
    return (
      <div className="video-interview-container">
        <div className="completion-screen">
          <h2>Interview Completed</h2>
          <div className="score-display">
            <div className="score-label">Your final score:</div>
            <div className="score-value">{activeSession.score}</div>
          </div>
          <div className="summary">
            <h3>Summary</h3>
            <p>{activeSession.summary}</p>
          </div>
          <Button type="primary" onClick={() => window.location.reload()}>
            Start New Interview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-interview-container">
      {/* AI Interviewer Avatar */}
      <div className="ai-interviewer">
        <AIAvatar isSpeaking={isSpeaking} />
        {isSpeaking && <Waveform />}
      </div>
      
      {/* Question Display */}
      <div className="question-display">
        <div className="question-header">
          <span className="question-number">
            Question {activeSession.currentQuestionIndex + 1} of {activeSession.questions.length}
          </span>
          <span className={`question-difficulty ${question.difficulty.toLowerCase()}`}>
            {question.difficulty}
          </span>
        </div>
        <div className="question-text">
          {question.text}
        </div>
      </div>
      
      {/* Timer */}
      <InterviewTimer 
        timeLeft={timeLeft} 
        totalTime={question.time} 
        isRunning={!isPaused && isTimerRunning} 
      />
      
      {/* Live Transcript */}
      <div className="transcript-container">
        <div className="transcript-header">
          Your Answer
        </div>
        <div className="transcript-content">
          {transcript || '[Start speaking to provide your answer]'}
        </div>
      </div>
      
      {/* Call Controls */}
      <div className="call-controls">
        <Button
          type="ghost"
          shape="circle"
          icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
          onClick={toggleMute}
          className="control-button mute-button"
        />
        
        <Button
          type={isRecording ? "primary" : "ghost"}
          shape="circle"
          icon={isRecording ? <StopOutlined /> : <PhoneFilled />}
          onClick={toggleRecording}
          className={`control-button record-button ${isRecording ? 'recording' : ''}`}
        />
        
        <Button
          type="ghost"
          shape="circle"
          icon={isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
          onClick={isPaused ? handleResume : handlePause}
          className="control-button pause-button"
        />
        
        <Button
          type="ghost"
          shape="circle"
          icon={<PhoneFilled />}
          onClick={handleEndCall}
          className="control-button end-button"
        />
        
        <Button
          type="ghost"
          onClick={handleSkip}
          className="control-button skip-button"
        >
          Skip Question
        </Button>
      </div>
      
      {/* User Webcam */}
      <div className="user-webcam">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
        />
      </div>
      
      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <Spin size="large" tip="Processing answer..." />
        </div>
      )}
    </div>
  );
}