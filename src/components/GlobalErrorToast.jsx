import React, { useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useInterview } from '../contexts/InterviewContext.jsx';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

/**
 * Global error toast component that displays error messages from the InterviewContext
 * Shows toast notifications for all API errors in the application
 */
export default function GlobalErrorToast() {
  const { error, errors, clearError, clearErrors } = useInterview();

  // Handle single error (general error)
  const handleError = useCallback(() => {
    if (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      message.error({
        content: friendlyMessage,
        key: 'globalError',
        duration: 5
      });
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    handleError();
  }, [handleError]);

  // Handle specific errors with context
  const handleSpecificErrors = useCallback(() => {
    // Show start interview errors
    if (errors.startInterview) {
      const friendlyMessage = getFriendlyErrorMessage(errors.startInterview);
      message.error({
        content: `Interview Start Error: ${friendlyMessage}`,
        key: 'startInterviewError',
        duration: 0 // Keep until manually closed
      });
    }
    
    // Show submit answer errors
    if (errors.submitAnswer) {
      const friendlyMessage = getFriendlyErrorMessage(errors.submitAnswer);
      message.error({
        content: `Answer Submission Error: ${friendlyMessage}`,
        key: 'submitAnswerError',
        duration: 0 // Keep until manually closed
      });
    }
    
    // Show fetch candidates errors
    if (errors.fetchCandidates) {
      const friendlyMessage = getFriendlyErrorMessage(errors.fetchCandidates);
      message.error({
        content: `Candidate Load Error: ${friendlyMessage}`,
        key: 'fetchCandidatesError',
        duration: 0 // Keep until manually closed
      });
    }
  }, [errors]);

  useEffect(() => {
    handleSpecificErrors();
  }, [handleSpecificErrors]);

  // Clear all errors when component unmounts
  useEffect(() => {
    return () => {
      clearErrors();
    };
  }, [clearErrors]);

  // This component doesn't render anything visible, it only handles error toasts
  return null;
}