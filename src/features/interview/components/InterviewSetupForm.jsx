import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Upload,
  Button,
  Input,
  Form,
  message,
  Select,
  Steps,
  Row,
  Col,
  Typography,
  Divider,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  SolutionOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
// eslint-disable-next-line import/no-extraneous-dependencies
import PhoneInput from 'react-phone-number-input/input';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'react-phone-number-input/style.css';
import { useToast } from '../../../components/ToastContainer';

const { Title, Text } = Typography;

// Validation functions
const validateName = name => {
  return name && name.trim().length >= 2;
};

const validateEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = phone => {
  // Basic validation - check if phone exists and has reasonable length
  return phone && phone.length >= 8;
};

const validateRole = role => {
  return !role || role.trim().length >= 2;
};

const validateResume = file => {
  if (!file) return { valid: true }; // Resume is optional

  const isPdfOrDocx =
    file.type === 'application/pdf' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.docx');

  if (!isPdfOrDocx) {
    return { valid: false, message: 'You can only upload PDF or DOCX files!' };
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    return { valid: false, message: 'File must be smaller than 5MB!' };
  }

  return { valid: true };
};

function InterviewSetupForm({
  onStart,
  loadingStates: loadingStatesProp,
  prefill,
  setPrefill,
  form,
  showPreview,
  setShowPreview,
}) {
  const { addToast } = useToast();
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Refs for focus management
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const roleSelectRef = useRef(null);
  const startButtonRef = useRef(null);
  const previewButtonRef = useRef(null);
  const uploadRef = useRef(null);

  const beforeUpload = file => {
    const validation = validateResume(file);
    if (!validation.valid) {
      message.error(validation.message);
      addToast(validation.message, 'error');
      return false;
    }

    // Extract text from file name to prefill form
    const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

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

  const validateForm = values => {
    const errors = {};

    if (!validateName(values.name)) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!validateEmail(values.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!validatePhone(phoneValue)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (values.role && !validateRole(values.role)) {
      errors.role = 'Role must be at least 2 characters';
    }

    return errors;
  };

  const handleSubmit = async values => {
    const errors = validateForm(values);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show first error message
      const firstError = Object.values(errors)[0];
      addToast(firstError, 'error');
      return;
    }

    // Clear errors if validation passes
    setFormErrors({});

    setIsSubmitting(true);
    try {
      // Pass the phone value directly since it's managed separately
      await onStart({ ...values, phone: phoneValue });
      addToast('Starting interview', 'info');
    } catch (error) {
      addToast('Error starting interview. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          maxWidth: '700px',
          width: '100%',
          padding: '2rem',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        {/* Progress indicator */}
        <div style={{ marginBottom: '24px' }}>
          <Steps
            size="small"
            current={showPreview ? 1 : 0}
            items={[
              { title: 'Setup' },
              { title: 'Preview' },
              { title: 'Questions' },
              { title: 'Complete' },
            ]}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title
            level={2}
            style={{
              marginBottom: '8px',
              color: 'var(--text-main)',
              fontSize: '2rem',
              fontWeight: 700,
            }}
          >
            {showPreview ? 'Review Your Details' : 'Setup Interview'}
          </Title>
          <Text
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
            }}
          >
            {showPreview
              ? 'Please review your information before starting the interview'
              : 'Fill in your details to begin your AI-powered interview'}
          </Text>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Upload.Dragger
          multiple={false}
          beforeUpload={beforeUpload}
          accept=".pdf,.docx"
          maxCount={1}
          aria-label="Upload resume (optional)"
          ref={uploadRef}
          style={{ marginBottom: '24px' }}
        >
          <p className="ant-upload-drag-icon">
            <IdcardOutlined style={{ fontSize: '48px', color: 'var(--primary-color)' }} />
          </p>
          <p
            className="ant-upload-text"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '8px',
              color: 'var(--text-main)',
            }}
          >
            {resumeFile ? 'Resume Uploaded Successfully!' : 'Upload Your Resume'}
          </p>
          <p
            className="ant-upload-hint"
            style={{
              fontSize: '14px',
              marginBottom: '8px',
              color: 'var(--text-secondary)',
            }}
          >
            {resumeFile ? (
              <span style={{ color: 'var(--secondary-color)' }}>
                <CheckCircleOutlined
                  style={{ marginRight: '8px', color: 'var(--secondary-color)' }}
                />
                {resumeFile.name} • {(resumeFile.size / 1024 / 1024).toFixed(2)}MB
              </span>
            ) : (
              'Click or drag a resume to upload (optional)'
            )}
          </p>
          <p
            className="ant-upload-hint"
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            Support for single PDF or DOCX file upload. Max size: 5MB
          </p>
        </Upload.Dragger>

        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '16px' }}
          onFinish={handleSubmit}
          aria-label="Interview setup form"
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Full Name</span>
                }
                name="name"
                initialValue={prefill.name}
                validateStatus={formErrors.name ? 'error' : ''}
                help={
                  formErrors.name ? (
                    <span>
                      <ExclamationCircleOutlined
                        style={{ marginRight: '8px', color: 'var(--danger-color)' }}
                      />
                      {formErrors.name}
                    </span>
                  ) : null
                }
              >
                <Input
                  placeholder="John Doe"
                  aria-label="Full name"
                  ref={nameInputRef}
                  prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      emailInputRef.current?.focus();
                    }
                  }}
                  className="input-modern"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Email</span>}
                name="email"
                initialValue={prefill.email}
                validateStatus={formErrors.email ? 'error' : ''}
                help={
                  formErrors.email ? (
                    <span>
                      <ExclamationCircleOutlined
                        style={{ marginRight: '8px', color: 'var(--danger-color)' }}
                      />
                      {formErrors.email}
                    </span>
                  ) : null
                }
              >
                <Input
                  placeholder="john.doe@example.com"
                  aria-label="Email address"
                  ref={emailInputRef}
                  prefix={<MailOutlined style={{ color: 'var(--text-muted)' }} />}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      roleSelectRef.current?.focus();
                    }
                  }}
                  className="input-modern"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={<span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Phone</span>}
                name="phone"
                validateStatus={formErrors.phone ? 'error' : ''}
                help={
                  formErrors.phone ? (
                    <span role="alert">
                      <ExclamationCircleOutlined
                        style={{ marginRight: '8px', color: 'var(--danger-color)' }}
                      />
                      {formErrors.phone}
                    </span>
                  ) : null
                }
              >
                <PhoneInput
                  international
                  country="US"
                  value={phoneValue}
                  onChange={setPhoneValue}
                  aria-label="Phone number"
                  className="phone-input-modern"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label={
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    Role Applying For
                  </span>
                }
                name="role"
                validateStatus={formErrors.role ? 'error' : ''}
                help={
                  formErrors.role ? (
                    <span>
                      <ExclamationCircleOutlined
                        style={{ marginRight: '8px', color: 'var(--danger-color)' }}
                      />
                      {formErrors.role}
                    </span>
                  ) : null
                }
              >
                <Select
                  placeholder="Select a role"
                  aria-label="Role applying for"
                  ref={roleSelectRef}
                  suffixIcon={<SolutionOutlined style={{ color: 'var(--text-muted)' }} />}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      startButtonRef.current?.focus();
                    }
                  }}
                  allowClear
                  className="input-modern role-select"
                  style={{ width: '100%' }}
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
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginTop: '24px',
              }}
              role="group"
              aria-label="Form actions"
            >
              <Button
                type="default"
                onClick={() => setShowPreview(!showPreview)}
                aria-label={showPreview ? 'Back to setup' : 'Show preview'}
                ref={previewButtonRef}
                size="large"
                icon={<SolutionOutlined style={{ color: 'var(--text-main)' }} />}
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
                {showPreview ? 'Back to Edit' : 'Preview Details'}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={(loadingStatesProp && loadingStatesProp.startInterview) || isSubmitting}
                aria-label="Start interview"
                ref={startButtonRef}
                size="large"
                icon={
                  showPreview ? (
                    <PlayCircleOutlined style={{ color: 'var(--text-inverse)' }} />
                  ) : null
                }
                className="btn-primary"
                style={{
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {showPreview ? 'Start Interview' : 'Continue'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

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

export default InterviewSetupForm;
