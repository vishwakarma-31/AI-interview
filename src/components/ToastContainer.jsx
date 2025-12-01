import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import ToastNotification from './ToastNotification';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Define removeToast first to avoid ESLint warning
  const removeToast = useCallback(id => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Define addToast after removeToast
  const addToast = useCallback(
    (message, type = 'info', duration = 5000) => {
      const id = Date.now() + Math.random();
      const newToast = { id, message, type, duration };

      setToasts(prevToasts => [...prevToasts, newToast]);

      // Auto remove toast after duration
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      addToast,
      removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px',
        }}
      >
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
