import React, { useMemo, useRef, useState } from 'react';
import { Upload, Button, Input, Form, Card, Space, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { recordAnswerAndNext, startNewCandidate } from './interviewSlice.js';
import QuestionTimer from '../../components/QuestionTimer.jsx';

function mockExtractFromResume(file) {
  // Simulate parsing: for demo, return a fixed name/email based on filename
  const base = file?.name || '';
  const name = base.split('.')[0].replace(/[_-]/g, ' ').trim() || 'John Doe';
  const email = name.toLowerCase().replace(/\s+/g, '.') + '@example.com';
  return { name, email };
}

export default function IntervieweeView() {
  const dispatch = useDispatch();
  const { candidates, activeCandidateId, timers } = useSelector(s => s.interview);
  const activeCandidate = useMemo(() => candidates.find(c => c.id === activeCandidateId), [candidates, activeCandidateId]);
  const [prefill, setPrefill] = useState({ name: '', email: '' });
  const [form] = Form.useForm();
  const answerRef = useRef();

  const beforeUpload = (file) => {
    const isValid = file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx') || file.name.endsWith('.pdf');
    if (!isValid) {
      message.error('Only PDF or DOCX files are allowed');
      return Upload.LIST_IGNORE;
    }
    const extracted = mockExtractFromResume(file);
    setPrefill(extracted);
    form.setFieldsValue({ name: extracted.name, email: extracted.email });
    message.success('Resume uploaded. Details pre-filled.');
    return Upload.LIST_IGNORE; // prevent actual upload
  };

  const onStart = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const { name, email, phone } = values;
    if (!name || !email || !phone) {
      message.warning('Please provide Name, Email and Phone to start.');
      return;
    }
    dispatch(startNewCandidate({ name, email, phone }));
  };

  const onSubmitAnswer = () => {
    if (!activeCandidate) return;
    const idx = activeCandidate.currentQuestionIndex;
    const text = answerRef.current?.resizableTextArea?.textArea?.value || '';
    dispatch(recordAnswerAndNext({ candidateId: activeCandidate.id, answerText: text }));
    if (answerRef.current) {
      answerRef.current.resizableTextArea.textArea.value = '';
    }
  };

  const onTimeExpire = () => {
    if (!activeCandidate) return;
    dispatch(recordAnswerAndNext({ candidateId: activeCandidate.id, answerText: '', timeUp: true }));
  };

  if (!activeCandidate || activeCandidate.status !== 'in-progress') {
    return (
      <div className="chat-container">
        <Card title="Start a New Interview" style={{ marginBottom: 16 }}>
          <Upload.Dragger multiple={false} beforeUpload={beforeUpload} accept=".pdf,.docx">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag a resume to upload (optional)</p>
          </Upload.Dragger>
          <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ name: prefill.name, email: prefill.email, phone: '' }}>
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter your name' }]}>
              <Input placeholder="Your full name" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
              <Input placeholder="you@example.com" />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true, message: 'Please enter your phone number' }]}>
              <Input placeholder="Phone number" />
            </Form.Item>
            <Button type="primary" onClick={onStart}>Start Interview</Button>
          </Form>
        </Card>
      </div>
    );
  }

  const question = activeCandidate.questions[activeCandidate.currentQuestionIndex];
  const timer = timers[activeCandidate.id];
  const deadlineMs = timer?.deadlineMs ?? (Date.now() + (question?.time ?? 20) * 1000);

  // Completion view
  if (activeCandidate.status === 'completed') {
    return (
      <div className="chat-container">
        <Card title="Interview Completed">
          <div style={{ marginBottom: 8 }}>Your final score: <b>{activeCandidate.score}</b></div>
          <div>Summary: {activeCandidate.summary}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Card title={`Question ${activeCandidate.currentQuestionIndex + 1} of ${activeCandidate.questions.length}`}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className="chat-bubble">
            <div style={{ marginBottom: 8, fontWeight: 600 }}>{question.difficulty} • {question.time}s</div>
            <div>{question.text}</div>
          </div>
          <QuestionTimer deadlineMs={deadlineMs} totalSeconds={question.time} onExpire={onTimeExpire} />
          <Input.TextArea ref={answerRef} rows={4} className="answer-input" placeholder="Type your answer here..." />
          <Button type="primary" onClick={onSubmitAnswer}>Submit Answer</Button>
        </Space>
      </Card>

    </div>
  );
}


