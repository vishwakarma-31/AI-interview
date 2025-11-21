import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Button, Input, Form, Card, Space, message, Select, Alert, Spin } from 'antd';
import InputMask from 'react-input-mask';
import { InboxOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { clearError, pauseTimer, resumeTimer, saveDraft, startInterview, submitAnswer } from './interviewSlice.js';
import QuestionTimer from '../../components/QuestionTimer.jsx';

export default function IntervieweeView() {
  const dispatch = useDispatch();
  const { activeCandidate, activeSession, timers, loading, error } = useSelector(s => s.interview);
  const [prefill, setPrefill] = useState({ name: '', email: '' });
  const [form] = Form.useForm();
  const [resumeFile, setResumeFile] = useState(null);
  const answerRef = useRef();

  // Handle API errors
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

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

  const onSubmitAnswer = () => {
    if (!activeSession) return;
    
    const text = answerRef.current?.resizableTextArea?.textArea?.value || '';
    dispatch(submitAnswer({ 
      sessionId: activeSession.id, 
      answerText: text 
    }));
    
    if (answerRef.current) {
      answerRef.current.resizableTextArea.textArea.value = '';
    }
  };

  const onTimeExpire = () => {
    if (!activeSession) return;
    
    dispatch(submitAnswer({ 
      sessionId: activeSession.id, 
      answerText: '' 
    }));
  };

  const onPause = () => {
    if (!activeSession) return;
    dispatch(pauseTimer({ sessionId: activeSession.id }));
    message.info('Interview paused');
  };

  const onResume = () => {
    if (!activeSession) return;
    dispatch(resumeTimer({ sessionId: activeSession.id }));
    message.success('Resumed');
  };

  const onSkip = () => {
    if (!activeSession) return;
    
    dispatch(submitAnswer({ 
      sessionId: activeSession.id, 
      answerText: '[Skipped]' 
    }));
  };

  // Show loading spinner when starting interview
  if (loading && !activeSession) {
    return (
      <div className="chat-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Starting interview..." />
      </div>
    );
  }

  // Show interview setup form if no active session or session not in progress
  if (!activeSession || activeCandidate?.status !== 'in-progress') {
    return (
      <div className="chat-container">
        <Card title="Start a New Interview" style={{ marginBottom: 16 }}>
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
            >
              Start Interview
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  const question = activeSession.questions[activeSession.currentQuestionIndex];
  const timer = timers[activeSession.id];
  const deadlineMs = timer?.deadlineMs ?? (Date.now() + (question?.time ?? 20) * 1000);
  const paused = !!timer?.paused;

  // Completion view
  if (activeCandidate.status === 'completed') {
    return (
      <div className="chat-container">
        <Card title="Interview Completed">
          <div style={{ marginBottom: 8 }}>Your final score: <b>{activeSession.score}</b></div>
          <div>Summary: {activeSession.summary}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Card 
        title={`Question ${activeSession.currentQuestionIndex + 1} of ${activeSession.questions.length}`} 
        extra={
          <Space>
            <Button onClick={onSkip}>Skip</Button>
            {!paused ? 
              <Button onClick={onPause}>Pause</Button> : 
              <Button type="primary" onClick={onResume}>Resume</Button>
            }
          </Space>
        }
      >
        {loading && (
          <Spin tip="Processing answer..." style={{ marginBottom: 16 }} />
        )}
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className="chat-bubble">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{question.difficulty} • {question.time}s</div>
            <div>{question.text}</div>
          </div>
          {!paused && <QuestionTimer deadlineMs={deadlineMs} totalSeconds={question.time} onExpire={onTimeExpire} />}
          <Input.TextArea
            ref={answerRef}
            rows={4}
            className="answer-input"
            placeholder="Type your answer here..."
            onChange={(e) => dispatch(saveDraft({ 
              questionIndex: activeSession.currentQuestionIndex, 
              draft: e.target.value 
            }))}
            defaultValue={question.draft || ''}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                onSubmitAnswer();
              }
            }}
            disabled={loading}
          />
          <Button 
            type="primary" 
            onClick={onSubmitAnswer}
            loading={loading}
          >
            Submit Answer
          </Button>
        </Space>
      </Card>
    </div>
  );
}