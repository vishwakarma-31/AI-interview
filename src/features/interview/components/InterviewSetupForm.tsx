import React, { useState, useRef, useEffect } from 'react';
import { Upload, Button, Input, Form, Space, message, Select } from 'antd';
import InputMask from 'react-input-mask';
import { InboxOutlined, PhoneFilled } from '@ant-design/icons';
import { useToast } from '../../../components/ToastContainer';
import type { UploadProps } from 'antd';

interface Prefill {
  name?: string;
  email?: string;
}

interface LoadingStates {
  startInterview: boolean;
  submitAnswer: boolean;
}

interface FormValues {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface InterviewSetupFormProps {
  onStart: (values: FormValues) => Promise<void>;
  loadingStates: LoadingStates;
  prefill: Prefill;
  setPrefill: React.Dispatch<React.SetStateAction<Prefill>>;
  form: any;
  showPreview: boolean;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
}

const InterviewSetupForm: React.FC<InterviewSetupFormProps> = ({ 
  onStart, 
  loadingStates, 
  prefill, 
  setPrefill, 
  form, 
  showPreview, 
  setShowPreview 
}) => {
  const { addToast } = useToast();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for focus management
  const nameInputRef = useRef<any>(null);
  const emailInputRef = useRef<any>(null);
  const phoneInputRef = useRef<any>(null);
  const roleSelectRef = useRef<any>(null);
  const startButtonRef = useRef<any>(null);
  const previewButtonRef = useRef<any>(null);
  const uploadRef = useRef<any>(null);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isPdfOrDocx = file.type === 'application/pdf' || 
                        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                        file.name.endsWith('.pdf') || 
                        file.name.endsWith('.docx');
    
    if (!isPdfOrDocx) {
      message.error('You can only upload PDF or DOCX files!');
      addToast('You can only upload PDF or DOCX files!', 'error');
      return false;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      addToast('File must be smaller than 10MB!', 'error');
      return false;
    }
    
    // Extract text from file name to prefill form
    const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const email = name.toLowerCase().replace(/\s+/g, '.') + '@example.com';
    
    setPrefill({ name, email });
    setResumeFile(file);
    form.setFieldsValue({ name, email });
    message.success('Resume selected. Details pre-filled.');
    addToast('Resume selected. Details pre-filled.', 'success');
    return false; // Prevent automatic upload
  };

  // Focus management when component mounts
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await onStart(values);
      addToast('Starting interview', 'info');
    } catch (error) {
      addToast('Error starting interview. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="interview-setup-container" role="main" aria-label="Interview Setup">
      <div className="setup-card">
        <h2>Start a New Interview</h2>
        <Upload.Dragger 
          multiple={false} 
          beforeUpload={beforeUpload} 
          accept=".pdf,.docx"
          maxCount={1}
          aria-label="Upload resume (optional)"
          ref={uploadRef}
        >
          <p className="ant-upload-drag-icon" aria-hidden="true">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a resume to upload (optional)</p>
          <p className="ant-upload-hint">Support for single PDF or DOCX file upload. Max size: 10MB</p>
        </Upload.Dragger>
        <Form 
          form={form} 
          layout="vertical" 
          style={{ marginTop: 16 }} 
          onFinish={handleSubmit}
          aria-label="Interview setup form"
        >
          <Form.Item 
            label="Full Name" 
            name="name" 
            initialValue={prefill.name}
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input 
              placeholder="John Doe" 
              aria-label="Full name" 
              ref={nameInputRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  emailInputRef.current?.focus();
                }
              }}
            />
          </Form.Item>
          
          <Form.Item 
            label="Email" 
            name="email" 
            initialValue={prefill.email}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              placeholder="john.doe@example.com" 
              aria-label="Email address" 
              ref={emailInputRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  phoneInputRef.current?.focus();
                }
              }}
            />
          </Form.Item>
          
          <Form.Item 
            label="Phone" 
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <InputMask mask="+1 (999) 999-9999">
              {(inputProps: any) => (
                <Input 
                  {...inputProps} 
                  placeholder="+1 (555) 123-4567" 
                  prefix={<PhoneFilled />} 
                  aria-label="Phone number" 
                  ref={phoneInputRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      roleSelectRef.current?.focus();
                    }
                  }}
                />
              )}
            </InputMask>
          </Form.Item>
          
          <Form.Item 
            label="Role Applying For" 
            name="role"
          >
            <Select 
              placeholder="Select a role" 
              aria-label="Role applying for"
              ref={roleSelectRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  startButtonRef.current?.focus();
                }
              }}
            >
              <Select.Option value="Frontend Developer">Frontend Developer</Select.Option>
              <Select.Option value="Backend Developer">Backend Developer</Select.Option>
              <Select.Option value="Fullstack Developer">Fullstack Developer</Select.Option>
              <Select.Option value="DevOps Engineer">DevOps Engineer</Select.Option>
              <Select.Option value="Data Scientist">Data Scientist</Select.Option>
            </Select>
          </Form.Item>
          
          <Space style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
            <Button 
              type="default" 
              onClick={() => setShowPreview(!showPreview)}
              ref={previewButtonRef}
              aria-label={showPreview ? "Back to setup" : "Preview interview"}
            >
              {showPreview ? "Back to Setup" : "Preview Interview"}
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isSubmitting || loadingStates.startInterview}
              ref={startButtonRef}
              aria-label="Start interview"
            >
              {showPreview ? "Start Interview" : "Begin Interview"}
            </Button>
          </Space>
        </Form>
      </div>
    </div>
  );
};

export default InterviewSetupForm;