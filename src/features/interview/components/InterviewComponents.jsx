import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { VideoCameraOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

// Mock AI avatar component with React.memo for performance optimization
export const AIAvatar = memo(({ isSpeaking }) => (
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
));

AIAvatar.propTypes = {
  isSpeaking: PropTypes.bool.isRequired,
};

// Add displayName for debugging
AIAvatar.displayName = 'AIAvatar';

// Waveform animation for speaking with React.memo for performance optimization
export const Waveform = memo(() => (
  <div className="waveform">
    {Array.from({ length: 15 }, (_, i) => (
      <motion.div
        key={`waveform-bar-${Date.now()}-${i}`}
        className="bar"
        animate={{
          height: [10, 25, 10],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
    ))}
  </div>
));

// Add displayName for debugging
Waveform.displayName = 'Waveform';
