import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ToastNotification({ message, type = 'info', duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after component mounts
    const entranceTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        const exitTimer = setTimeout(onClose, 300); // Wait for exit animation
        return () => clearTimeout(exitTimer);
      }
    }, duration);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  if (!isVisible && !onClose) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'rgba(246, 255, 237, 0.85)',
          border: '1px solid rgba(183, 235, 143, 0.5)',
          color: '#52c41a',
          accentColor: '#52c41a',
        };
      case 'error':
        return {
          backgroundColor: 'rgba(255, 242, 240, 0.85)',
          border: '1px solid rgba(255, 204, 199, 0.5)',
          color: '#ff4d4f',
          accentColor: '#ff4d4f',
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(255, 251, 230, 0.85)',
          border: '1px solid rgba(255, 229, 143, 0.5)',
          color: '#faad14',
          accentColor: '#faad14',
        };
      default:
        return {
          backgroundColor: 'rgba(230, 247, 255, 0.85)',
          border: '1px solid rgba(145, 213, 255, 0.5)',
          color: '#1890ff',
          accentColor: '#1890ff',
        };
    }
  };

  const styles = {
    container: {
      minWidth: '300px',
      maxWidth: '500px',
      padding: '16px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'flex-start',
      ...getTypeStyles(),
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.3s ease-in-out',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      opacity: isVisible ? 1 : 0,
      position: 'relative',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden',
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '4px',
      backgroundColor: getTypeStyles().accentColor,
    },
    icon: {
      marginRight: '12px',
      fontSize: '20px',
      flexShrink: 0,
      alignSelf: 'center',
    },
    content: {
      flex: 1,
      fontSize: '14px',
      fontWeight: 500,
      wordBreak: 'break-word',
    },
    close: {
      marginLeft: '12px',
      background: 'none',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer',
      color: 'inherit',
      opacity: 0.7,
      flexShrink: 0,
      padding: 0,
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div style={styles.container} role="alert" aria-live="polite">
      <div style={styles.accentBar} />
      <div style={styles.icon}>{getIcon()}</div>
      <div style={styles.content}>{message}</div>
      <button
        type="button"
        style={styles.close}
        onClick={() => {
          setIsVisible(false);
          if (onClose) {
            setTimeout(onClose, 300); // Wait for exit animation
          }
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

ToastNotification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
};

ToastNotification.defaultProps = {
  type: 'info',
  duration: 5000,
  onClose: undefined,
};

export default ToastNotification;
