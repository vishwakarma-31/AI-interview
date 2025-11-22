import { useState, useEffect, useRef, useCallback } from 'react';

// Custom hook for interview timer
export const useInterviewTimer = (activeSession, onSubmitAnswer, transcript) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [timerDeadline, setTimerDeadline] = useState(null);
  const timerRef = useRef(null);
  
  // Timer effect
  useEffect(() => {
    if (isTimerRunning && !isTimerPaused && activeSession) {
      const question = activeSession.questions[activeSession.currentQuestionIndex];
      if (question && question.timeLimit) {
        // Initialize timer if not already set
        if (!timerDeadline) {
          const deadline = Date.now() + (question.timeLimit * 1000);
          setTimerDeadline(deadline);
          setTimeLeft(question.timeLimit);
        }
        
        // Start timer countdown
        timerRef.current = setInterval(() => {
          setTimerDeadline(prev => {
            if (prev) {
              const remaining = Math.max(0, Math.floor((prev - Date.now()) / 1000));
              setTimeLeft(remaining);
              
              // Auto-submit when time runs out
              if (remaining <= 0) {
                clearInterval(timerRef.current);
                onSubmitAnswer(transcript || '[Time Expired]');
                return null;
              }
              
              return prev;
            }
            return prev;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, isTimerPaused, activeSession, transcript, timerDeadline, onSubmitAnswer]);
  
  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (!activeSession) return;
    // Calculate remaining time and store it
    if (timerDeadline) {
      const remaining = Math.max(0, Math.floor((timerDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
    setIsTimerPaused(true);
    setIsTimerRunning(false);
  }, [activeSession, timerDeadline]);
  
  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (!activeSession) return;
    // Set new deadline based on remaining time
    const newDeadline = Date.now() + (timeLeft * 1000);
    setTimerDeadline(newDeadline);
    setIsTimerPaused(false);
    setIsTimerRunning(true);
  }, [activeSession, timeLeft]);
  
  // Reset the timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimerDeadline(null);
    setTimeLeft(0);
    setIsTimerRunning(true);
    setIsTimerPaused(false);
  }, []);
  
  return {
    timeLeft,
    isTimerRunning,
    isTimerPaused,
    timerDeadline,
    pauseTimer,
    resumeTimer,
    resetTimer
  };
};