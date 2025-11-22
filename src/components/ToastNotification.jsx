import React, { useState, useEffect } from 'react';

const ToastNotification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          color: '#52c41a'
        };
      case 'error':
        return {
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          color: '#ff4d4f'
        };
      case 'warning':
        return {
          backgroundColor: '#fffbe6',
          border: '1px solid #ffe58f',
          color: '#faad14'
        };
      default:
        return {
          backgroundColor: '#e6f7ff',
          border: '1px solid #91d5ff',
          color: '#1890ff'
        };
    }
  };

  const styles = {
    container: {
      minWidth: '300px',
      maxWidth: '500px',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'flex-start', // Changed to flex-start for better alignment
      ...getTypeStyles(),
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      opacity: isVisible ? 1 : 0,
      position: 'relative' // Changed from fixed to relative since it's now in a container
    },
    icon: {
      marginRight: '12px',
      fontSize: '20px',
      flexShrink: 0 // Prevent icon from shrinking
    },
    content: {
      flex: 1,
      fontSize: '14px',
      fontWeight: 500,
      wordBreak: 'break-word' // Handle long words
    },
    close: {
      marginLeft: '12px',
      background: 'none',
      border: 'none',
      fontSize: '16px',
      cursor: 'pointer',
      color: 'inherit',
      opacity: 0.7,
      flexShrink: 0, // Prevent close button from shrinking
      padding: 0,
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
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
      <div style={styles.icon}>{getIcon()}</div>
      <div style={styles.content}>{message}</div>
      <button 
        style={styles.close} 
        onClick={() => {
          setIsVisible(false);
          if (onClose) onClose();
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default ToastNotification;