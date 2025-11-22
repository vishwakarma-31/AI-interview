import { useState, useRef, useCallback, useEffect } from 'react';
import { message } from 'antd';

// Function to check browser support for speech recognition
const checkSpeechRecognitionSupport = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  // Basic support check
  if (!SpeechRecognition) {
    return {
      supported: false,
      reason: 'Speech Recognition API is not available in this browser. Please use Google Chrome or Microsoft Edge for the full AI experience.'
    };
  }
  
  // Additional checks for secure context (HTTPS)
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    return {
      supported: false,
      reason: 'Speech Recognition requires a secure context (HTTPS). Please use HTTPS or localhost for speech recognition features.'
    };
  }
  
  // Check for microphone permissions
  // Note: We can't check actual permission status without requesting it,
  // but we can at least verify the API exists
  try {
    // Try to create a recognition instance to verify basic functionality
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // If we get here, basic support looks good
    return {
      supported: true,
      reason: null
    };
  } catch (error) {
    return {
      supported: false,
      reason: 'Speech Recognition is not properly configured in this browser. Please check your browser settings.'
    };
  }
};

// Custom hook for speech recognition
export const useSpeechRecognition = (onTranscriptChange, onSubmitAnswer, activeSession, saveDraft) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(true);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  
  // Check for Speech Recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSpeechRecognitionSupported(!!SpeechRecognition);
  }, []);
  
  // Update transcript ref when transcript changes
  useEffect(() => {
    transcriptRef.current = typeof onTranscriptChange === 'string' ? onTranscriptChange : '';
  }, [onTranscriptChange]);
  
  // Start speech recognition
  const startSpeechRecognition = useCallback(() => {
    // Check browser support before each use
    const supportCheck = checkSpeechRecognitionSupport();
    if (!supportCheck.supported) {
      message.error(supportCheck.reason);
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      message.error('Speech Recognition is not supported in your browser.');
      return;
    }
    
    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = transcriptRef.current;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          // Save draft when we have final results
          if (activeSession) {
            saveDraft(activeSession.currentQuestionIndex, finalTranscript);
          }
          
          // Reset silence timer when we get final results
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          
          // Start silence timer after final result
          silenceTimerRef.current = setTimeout(() => {
            if (isRecording) {
              // Auto-submit after 3 seconds of silence
              onSubmitAnswer(finalTranscript);
              setIsRecording(false);
              message.info('Auto-submitted due to silence');
            }
          }, 3000); // 3 seconds of silence
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (typeof onTranscriptChange === 'function') {
        onTranscriptChange(finalTranscript + interimTranscript);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      
      // Handle specific error types
      switch (event.error) {
        case 'no-speech':
          // This is normal, just restart
          if (isRecording) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
              setIsRecording(false);
            }
          }
          break;
        case 'audio-capture':
          message.error('No microphone detected. Please check your audio input device.');
          setIsRecording(false);
          break;
        case 'not-allowed':
        case 'permission-denied':
          message.error('Microphone access denied. Please allow microphone access in your browser settings.');
          setIsRecording(false);
          break;
        case 'network':
          message.error('Network error occurred. Please check your connection.');
          setIsRecording(false);
          break;
        case 'aborted':
          // This might be intentional, don't show error
          setIsRecording(false);
          break;
        default:
          message.error(`Speech recognition error: ${event.error}`);
          setIsRecording(false);
          break;
      }
    };
    
    recognition.onend = () => {
      // Only restart if we're still supposed to be recording
      if (isRecording) {
        // Add a small delay before restarting to prevent rapid restart loops
        setTimeout(() => {
          if (isRecording) {
            try {
              recognition.start();
            } catch (error) {
              console.error('Error restarting speech recognition:', error);
              message.error('Failed to restart speech recognition. Please try again.');
              setIsRecording(false);
            }
          }
        }, 500);
      }
    };
    
    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      message.error('Failed to start speech recognition. Please check your microphone and try again.');
      setIsRecording(false);
    }
  }, [activeSession, saveDraft, onSubmitAnswer, onTranscriptChange, isRecording]);
  
  // Toggle recording state
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setIsRecording(true);
      startSpeechRecognition();
    }
  }, [isRecording, startSpeechRecognition]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop speech recognition if it's active
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Clear any active timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);
  
  return {
    isRecording,
    isSpeechRecognitionSupported,
    toggleRecording,
    startSpeechRecognition
  };
};