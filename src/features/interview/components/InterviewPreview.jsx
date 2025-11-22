import React, { useState } from 'react';
import { Button, Card, List, Modal, Steps } from 'antd';
import { EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const InterviewPreview = ({ interviewData, onStartInterview, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showStartModal, setShowStartModal] = useState(false);

  // Define PropTypes for better type checking
  InterviewPreview.propTypes = {
    interviewData: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      role: PropTypes.string,
      questions: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        difficulty: PropTypes.string.isRequired,
        timeLimit: PropTypes.number.isRequired,
      })).isRequired,
    }),
    onStartInterview: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };

  const questions = interviewData?.questions || [];
  const role = interviewData?.role || 'Frontend Developer';

  const handleStartInterview = () => {
    setShowStartModal(true);
  };

  const confirmStart = () => {
    setShowStartModal(false);
    onStartInterview();
  };

  return (
    <div className="interview-preview-container">
      <div className="preview-header">
        <h2>Interview Preview</h2>
        <p>Review the interview details before starting</p>
      </div>

      {/* Progress indicator */}
      <div style={{ marginBottom: 24 }}>
        <Steps 
          size="small" 
          current={2}
          items={[
            { title: 'Setup' },
            { title: 'Preview' },
            { title: 'Questions' },
            { title: 'Complete' }
          ]}
        />
      </div>

      <div className="preview-content">
        <Card className="preview-card" title="Interview Details">
          <div className="interview-info">
            <div className="info-item">
              <label>Role:</label>
              <span>{role}</span>
            </div>
            <div className="info-item">
              <label>Questions:</label>
              <span>{questions.length} questions</span>
            </div>
            <div className="info-item">
              <label>Estimated Time:</label>
              <span>{questions.length * 2} minutes</span>
            </div>
          </div>
        </Card>

        <Card className="preview-card" title="Questions Preview">
          <List
            dataSource={questions}
            renderItem={(question, index) => (
              <List.Item className="question-preview-item">
                <div className="question-preview-content">
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-text">{question.text}</div>
                  <div className="question-meta">
                    <span className={`difficulty ${question.difficulty?.toLowerCase()}`}>
                      {question.difficulty}
                    </span>
                    <span className="time-limit">{question.timeLimit}s</span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <div className="preview-actions">
          <Button 
            onClick={onCancel}
            size="large"
            aria-label="Back to setup"
          >
            Back
          </Button>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />}
            onClick={handleStartInterview}
            size="large"
            aria-label="Start interview"
          >
            Start Interview
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="Start Interview"
        open={showStartModal}
        onOk={confirmStart}
        onCancel={() => setShowStartModal(false)}
        okText="Start"
        cancelText="Cancel"
        aria-label="Start interview confirmation"
      >
        <p>Are you ready to start the interview?</p>
        <p>Make sure your camera and microphone are working properly.</p>
      </Modal>
    </div>
  );
};

export default InterviewPreview;