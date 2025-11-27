import React, { useState, useRef, useEffect } from 'react';
import { Upload, Button, Input, Form, message, Select, Steps, Card, Row, Col, Typography, Divider } from 'antd';
import InputMask from 'react-input-mask';
import { PhoneFilled, UserOutlined, MailOutlined, IdcardOutlined, SolutionOutlined, PlayCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useToast } from '../../../components/ToastContainer';
import PropTypes from 'prop-types';

const { Title, Text } = Typography;

const InterviewSetupForm = ({ onStart, loadingStates: loadingStatesProp, prefill, setPrefill, form, showPreview, setShowPreview }) => {
  const { addToast } = useToast();
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define PropTypes for better type checking
  InterviewSetupForm.propTypes = {
    onStart: PropTypes.func.isRequired,
    loadingStates: PropTypes.shape({
      startInterview: PropTypes.bool,
    }),
    prefill: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
    }).isRequired,
    setPrefill: PropTypes.func.isRequired,
    form: PropTypes.shape({
      setFieldsValue: PropTypes.func,
    }).isRequired,
    showPreview: PropTypes.bool.isRequired,
    setShowPreview: PropTypes.func.isRequired,
  };
  
  InterviewSetupForm.defaultProps = {
    loadingStates: {},
  };
  
  // Refs for focus management
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const roleSelectRef = useRef(null);
  const startButtonRef = useRef(null);
  const previewButtonRef = useRef(null);
  const uploadRef = useRef(null);
  
  const beforeUpload = (file) => {
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
    if (form && form.setFieldsValue) {
      form.setFieldsValue({ name, email });
    }
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
  
  const handleSubmit = async (values) => {
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
      <div className="setup-card" style={{ animation: 'fadeInUp 0.6s ease-out' }} tabIndex="-1">
        {/* Progress indicator */}
        <div style={{ marginBottom: 24, animation: 'slideInDown 0.5s ease-out' }} aria-live="polite">
          <Steps 
            size="small" 
            current={showPreview ? 1 : 0}
            items={[
              { title: 'Setup' },
              { title: 'Preview' },
              { title: 'Questions' },
              { title: 'Complete' }
            ]}
          />
        </div>
        
        <Card className="setup-form-card" style={{ animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{ textAlign: 'center', marginBottom: 24, animation: 'zoomIn 0.7s ease-out' }}>
            <Title level={2} style={{ marginBottom: 8, animation: 'fadeIn 1s ease-out', color: '#ffffff' }} id="form-title">
              {showPreview ? "Review Your Details" : "Start a New Interview"}
            </Title>
            <Text style={{ fontSize: 16, animation: 'fadeIn 1.2s ease-out', color: 'rgba(255, 255, 255, 0.85)' }}>
              {showPreview 
                ? "Please review your information before starting the interview" 
                : "Fill in your details to begin your AI-powered interview"}
            </Text>
          </div>
          
          <Divider style={{ margin: '16px 0', animation: 'fadeIn 0.9s ease-out' }} />
          
          <Upload.Dragger 
            multiple={false} 
            beforeUpload={beforeUpload} 
            accept=".pdf,.docx"
            maxCount={1}
            aria-label="Upload resume (optional)"
            ref={uploadRef}
            style={{ marginBottom: 24, animation: 'slideInUp 1.0s ease-out' }}
            tabIndex="0"
          >
            <p className="ant-upload-drag-icon" aria-hidden="true" style={{ animation: 'bounceIn 1.2s ease-out' }}>
              <IdcardOutlined style={{ fontSize: '48px', color: '#1e90ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, animation: 'fadeIn 1.3s ease-out', color: '#ffffff' }}>
              {resumeFile ? "Resume Uploaded Successfully!" : "Upload Your Resume"}
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 14, marginBottom: 8, animation: 'fadeIn 1.4s ease-out', color: 'rgba(255, 255, 255, 0.85)' }}>
              {resumeFile 
                ? <span style={{ color: '#2ed573' }}><CheckCircleOutlined style={{ marginRight: 8, color: '#2ed573' }} />{resumeFile.name} • {(resumeFile.size / 1024 / 1024).toFixed(2)}MB</span>
                : "Click or drag a resume to upload (optional)"}
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 12, animation: 'fadeIn 1.5s ease-out', color: 'rgba(255, 255, 255, 0.6)' }}>
              Support for single PDF or DOCX file upload. Max size: 10MB
            </p>
          </Upload.Dragger>
          
          <Form 
            form={form} 
            layout="vertical" 
            style={{ marginTop: 16 }} 
            onFinish={handleSubmit}
            aria-label="Interview setup form"
            aria-describedby="form-title"
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="Full Name" 
                  name="name" 
                  initialValue={prefill.name}
                  rules={[
                    { 
                      required: true, 
                      message: (
                        <span>
                          <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                          Please enter your full name
                        </span>
                      )
                    },
                    { 
                      min: 2, 
                      message: (
                        <span>
                          <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                          Name must be at least 2 characters
                        </span>
                      )
                    }
                  ]}
                >
                  <Input 
                    placeholder="John Doe" 
                    aria-label="Full name" 
                    ref={nameInputRef}
                    prefix={<UserOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        emailInputRef.current?.focus();
                      }
                    }}
                    style={{ animation: 'fadeInLeft 0.5s ease-out' }}
                    tabIndex="0"
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="Email" 
                  name="email" 
                  initialValue={prefill.email}
                  rules={[
                    { 
                      required: true, 
                      message: (
                        <span>
                          <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                          Please enter your email address
                        </span>
                      )
                    },
                    { 
                      type: 'email', 
                      message: (
                        <span>
                          <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                          Please enter a valid email address
                        </span>
                      )
                    }
                  ]}
                >
                  <Input 
                    placeholder="john.doe@example.com" 
                    aria-label="Email address" 
                    ref={emailInputRef}
                    prefix={<MailOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        phoneInputRef.current?.focus();
                      }
                    }}
                    style={{ animation: 'fadeInRight 0.5s ease-out' }}
                    tabIndex="0"
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="Phone" 
                  name="phone"
                  rules={[
                    { 
                      required: true, 
                      message: (
                        <span>
                          <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                          Please enter your phone number
                        </span>
                      )
                    },
                    {
                      pattern: /^\+1 \(\d{3}\) \d{3}-\d{4}$/,
                      message: (
                        <span>
                          <ExclamationCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                          Please enter a valid US phone number
                        </span>
                      )
                    }
                  ]}
                >
                  <InputMask mask="+1 (999) 999-9999">
                    {(inputProps) => (
                      <Input 
                        placeholder="+1 (555) 123-4567" 
                        prefix={<PhoneFilled style={{ color: 'rgba(255, 255, 255, 0.7)' }} />} 
                        aria-label="Phone number" 
                        ref={phoneInputRef}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            roleSelectRef.current?.focus();
                          }
                        }}
                        style={{ animation: 'fadeInLeft 0.7s ease-out' }}
                        tabIndex="0"
                        {...inputProps}
                      />
                    )}
                  </InputMask>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item 
                  label="Role Applying For" 
                  name="role"
                  rules={[
                    { 
                      required: false
                    }
                  ]}
                >
                  <Select 
                    placeholder="Select a role" 
                    aria-label="Role applying for"
                    ref={roleSelectRef}
                    suffixIcon={<SolutionOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        startButtonRef.current?.focus();
                      }
                    }}
                    allowClear
                    style={{ animation: 'fadeInRight 0.7s ease-out' }}
                    tabIndex="0"
                  >
                    <Select.Option value="Frontend Developer">Frontend Developer</Select.Option>
                    <Select.Option value="Backend Developer">Backend Developer</Select.Option>
                    <Select.Option value="Fullstack Developer">Fullstack Developer</Select.Option>
                    <Select.Option value="DevOps Engineer">DevOps Engineer</Select.Option>
                    <Select.Option value="Data Scientist">Data Scientist</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }} role="group" aria-label="Form actions">
                <Button 
                  type="default" 
                  onClick={() => setShowPreview(!showPreview)}
                  aria-label={showPreview ? "Back to setup" : "Show preview"}
                  ref={previewButtonRef}
                  size="large"
                  icon={<SolutionOutlined style={{ color: 'rgba(255, 255, 255, 0.9)' }} />}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                  }}
                  style={{
                    transition: 'all 0.3s ease',
                    animation: 'fadeInUp 1s ease-out'
                  }}
                  tabIndex="0"
                >
                  {showPreview ? "Back to Edit" : "Preview Details"}
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={(loadingStatesProp && loadingStatesProp.startInterview) || isSubmitting} 
                  aria-label="Start interview"
                  ref={startButtonRef}
                  size="large"
                  icon={showPreview ? <PlayCircleOutlined style={{ color: '#ffffff' }} /> : null}
                  onMouseEnter={(e) => {
                    if (!e.target.classList.contains('ant-btn-loading')) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 16px rgba(30, 144, 255, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.target.classList.contains('ant-btn-loading')) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  style={{
                    transition: 'all 0.3s ease',
                    animation: 'fadeInUp 1s ease-out'
                  }}
                  tabIndex="0"
                >
                  {showPreview ? "Start Interview" : "Continue"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default InterviewSetupForm;