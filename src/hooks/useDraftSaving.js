import { useRef, useCallback } from 'react';

// Custom hook for debouncing
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Custom hook for draft saving with debounce
export const useDraftSaving = (saveDraft, activeSession) => {
  // Debounced draft saving function
  const debouncedSaveDraft = useDebounce((questionIndex, draft) => {
    saveDraft(questionIndex, draft);
  }, 1000); // Save draft after 1 second of inactivity
  
  // Save draft immediately
  const saveDraftImmediately = useCallback((questionIndex, draft) => {
    saveDraft(questionIndex, draft);
  }, [saveDraft]);
  
  // Initialize transcript from draft when session or question changes
  const initializeTranscriptFromDraft = useCallback((currentQuestion) => {
    if (currentQuestion) {
      // Initialize transcript from draft if it exists
      if (currentQuestion.draft) {
        return currentQuestion.draft;
      } else if (currentQuestion.answer) {
        return currentQuestion.answer;
      } else {
        return '';
      }
    }
    return '';
  }, []);
  
  return {
    debouncedSaveDraft,
    saveDraftImmediately,
    initializeTranscriptFromDraft
  };
};