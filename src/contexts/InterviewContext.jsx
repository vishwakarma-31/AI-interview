import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { api } from '../services/api';
import { message } from 'antd';
import { getFriendlyErrorMessage } from '../utils/errorMessages.js';

// Initial state
const initialState = {
  candidates: [],
  activeCandidate: null,
  activeSession: null,
  loading: false,
  loadingStates: {
    startInterview: false,
    submitAnswer: false,
    fetchCandidates: false
  },
  error: null,
  errors: {}
};

// Action types
const ACTIONS = {
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_ACTIVE_CANDIDATE: 'SET_ACTIVE_CANDIDATE',
  SAVE_DRAFT: 'SAVE_DRAFT',
  ABANDON_ACTIVE_INTERVIEW: 'ABANDON_ACTIVE_INTERVIEW',
  START_INTERVIEW_OPTIMISTIC: 'START_INTERVIEW_OPTIMISTIC',
  START_INTERVIEW_PENDING: 'START_INTERVIEW_PENDING',
  START_INTERVIEW_FULFILLED: 'START_INTERVIEW_FULFILLED',
  START_INTERVIEW_REJECTED: 'START_INTERVIEW_REJECTED',
  SUBMIT_ANSWER_OPTIMISTIC: 'SUBMIT_ANSWER_OPTIMISTIC',
  SUBMIT_ANSWER_PENDING: 'SUBMIT_ANSWER_PENDING',
  SUBMIT_ANSWER_FULFILLED: 'SUBMIT_ANSWER_FULFILLED',
  SUBMIT_ANSWER_REJECTED: 'SUBMIT_ANSWER_REJECTED',
  FETCH_CANDIDATES_PENDING: 'FETCH_CANDIDATES_PENDING',
  FETCH_CANDIDATES_FULFILLED: 'FETCH_CANDIDATES_FULFILLED',
  FETCH_CANDIDATES_REJECTED: 'FETCH_CANDIDATES_REJECTED'
};

// Reducer function
const interviewReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: {}
      };
      
    case ACTIONS.SET_ACTIVE_CANDIDATE:
      return {
        ...state,
        activeCandidate: action.payload.candidate,
        activeSession: action.payload.session
      };
      
    case ACTIONS.SAVE_DRAFT:
      const { questionIndex, draft } = action.payload;
      if (state.activeSession && state.activeSession.questions[questionIndex]) {
        const updatedQuestions = [...state.activeSession.questions];
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          draft
        };
        
        return {
          ...state,
          activeSession: {
            ...state.activeSession,
            questions: updatedQuestions
          }
        };
      }
      return state;
      
    case ACTIONS.ABANDON_ACTIVE_INTERVIEW:
      return {
        ...state,
        activeCandidate: null,
        activeSession: null
      };
      
    case ACTIONS.START_INTERVIEW_OPTIMISTIC:
      // Optimistically update the state with temporary candidate and session data
      const { name, email, phone, role, resume } = action.payload;
      
      // Create temporary candidate data
      const tempCandidate = {
        _id: 'temp-' + Date.now(),
        name,
        email,
        phone,
        role,
        status: 'in-progress',
        createdAt: new Date()
      };
      
      // Create temporary session data
      const tempSession = {
        id: 'temp-' + Date.now(),
        candidateId: tempCandidate._id,
        questions: [],
        currentQuestionIndex: 0,
        createdAt: new Date()
      };
      
      return {
        ...state,
        activeCandidate: tempCandidate,
        activeSession: tempSession
      };
      
    case ACTIONS.START_INTERVIEW_PENDING:
      return {
        ...state,
        loading: true,
        loadingStates: {
          ...state.loadingStates,
          startInterview: true
        },
        error: null,
        errors: {
          ...state.errors,
          startInterview: null
        }
      };
      
    case ACTIONS.START_INTERVIEW_FULFILLED:
      const { candidate, session } = action.payload;
      return {
        ...state,
        loading: false,
        loadingStates: {
          ...state.loadingStates,
          startInterview: false
        },
        activeCandidate: candidate,
        activeSession: session
      };
      
    case ACTIONS.START_INTERVIEW_REJECTED:
      return {
        ...state,
        loading: false,
        loadingStates: {
          ...state.loadingStates,
          startInterview: false
        },
        error: action.payload,
        errors: {
          ...state.errors,
          startInterview: action.payload
        }
      };
      
    case ACTIONS.SUBMIT_ANSWER_OPTIMISTIC:
      // Optimistically update the state
      const { answerText, sessionId } = action.payload;
      
      // Find the current question and update it with the answer
      if (state.activeSession && state.activeSession.id === sessionId) {
        const questionIndex = state.activeSession.currentQuestionIndex;
        const updatedQuestions = [...state.activeSession.questions];
        
        // Update the current question with the answer
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          answer: answerText
        };
        
        return {
          ...state,
          activeSession: {
            ...state.activeSession,
            questions: updatedQuestions
          }
        };
      }
      return state;
      
    case ACTIONS.SUBMIT_ANSWER_PENDING:
      return {
        ...state,
        loading: true,
        loadingStates: {
          ...state.loadingStates,
          submitAnswer: true
        },
        error: null,
        errors: {
          ...state.errors,
          submitAnswer: null
        }
      };
      
    case ACTIONS.SUBMIT_ANSWER_FULFILLED:
      if (action.payload.nextQuestion) {
        // Move to next question
        const updatedSession = {
          ...state.activeSession,
          currentQuestionIndex: action.payload.nextQuestion.index
        };
        
        return {
          ...state,
          loading: false,
          loadingStates: {
            ...state.loadingStates,
            submitAnswer: false
          },
          activeSession: updatedSession
        };
      } else if (action.payload.finalScore !== undefined) {
        // Interview completed
        const completedSession = {
          ...state.activeSession,
          score: action.payload.finalScore,
          summary: action.payload.summary,
          questions: action.payload.questions
        };
        
        return {
          ...state,
          loading: false,
          loadingStates: {
            ...state.loadingStates,
            submitAnswer: false
          },
          activeSession: completedSession
        };
      }
      return {
        ...state,
        loading: false,
        loadingStates: {
          ...state.loadingStates,
          submitAnswer: false
        }
      };
      
    case ACTIONS.SUBMIT_ANSWER_REJECTED:
      // Rollback the optimistic update on error
      return {
        ...state,
        loading: false,
        loadingStates: {
          ...state.loadingStates,
          submitAnswer: false
        },
        error: action.payload,
        errors: {
          ...state.errors,
          submitAnswer: action.payload
        }
      };
      
    case ACTIONS.FETCH_CANDIDATES_PENDING:
      return {
        ...state,
        loading: true,
        loadingStates: {
          ...state.loadingStates,
          fetchCandidates: true
        },
        error: null,
        errors: {
          ...state.errors,
          fetchCandidates: null
        }
      };
      
    case ACTIONS.FETCH_CANDIDATES_FULFILLED:
      return {
        ...state,
        loading: false,
        loadingStates: {
          ...state.loadingStates,
          fetchCandidates: false
        },
        candidates: action.payload
      };
      
    case ACTIONS.FETCH_CANDIDATES_REJECTED:
      return {
        ...state,
        loading: false,
        loadingStates: {
          ...state.loadingStates,
          fetchCandidates: false
        },
        error: action.payload,
        errors: {
          ...state.errors,
          fetchCandidates: action.payload
        }
      };
      
    default:
      return state;
  }
};

// Create context
const InterviewContext = createContext();

// Custom hook to use the interview context
export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

// Provider component
export const InterviewProvider = ({ children }) => {
  const [state, dispatch] = useReducer(interviewReducer, initialState);
  
  // Action creators
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);
  
  const clearErrors = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERRORS });
  }, []);
  
  const setActiveCandidate = useCallback((candidate, session) => {
    dispatch({ 
      type: ACTIONS.SET_ACTIVE_CANDIDATE, 
      payload: { candidate, session } 
    });
  }, []);
  
  const saveDraft = useCallback((questionIndex, draft) => {
    dispatch({ 
      type: ACTIONS.SAVE_DRAFT, 
      payload: { questionIndex, draft } 
    });
  }, []);
  
  const abandonActiveInterview = useCallback(() => {
    dispatch({ type: ACTIONS.ABANDON_ACTIVE_INTERVIEW });
  }, []);
  
  // Async action creators with retry functionality
  const startInterview = useCallback(async ({ name, email, phone, role, resume }, retryCount = 0) => {
    // Dispatch optimistic update immediately
    dispatch({ 
      type: ACTIONS.START_INTERVIEW_OPTIMISTIC, 
      payload: { name, email, phone, role, resume } 
    });
    
    dispatch({ type: ACTIONS.START_INTERVIEW_PENDING });
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('role', role);
      if (resume) {
        formData.append('resume', resume);
      }
      
      const response = await api.startInterview(formData);
      dispatch({ 
        type: ACTIONS.START_INTERVIEW_FULFILLED, 
        payload: response 
      });
      
      return response;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.START_INTERVIEW_REJECTED, 
        payload: error.message 
      });
      
      // Show user-friendly error message
      const friendlyMessage = getFriendlyErrorMessage(error);
      message.error(`Failed to start interview: ${friendlyMessage}`);
      
      throw error;
    }
  }, []);
  
  const submitAnswer = useCallback(async ({ sessionId, answerText }, optimistic = true, retryCount = 0) => {
    // Dispatch optimistic update immediately
    if (optimistic) {
      dispatch({ 
        type: ACTIONS.SUBMIT_ANSWER_OPTIMISTIC, 
        payload: { sessionId, answerText } 
      });
    }
    
    dispatch({ type: ACTIONS.SUBMIT_ANSWER_PENDING });
    
    try {
      const response = await api.submitAnswer(sessionId, answerText);
      dispatch({ 
        type: ACTIONS.SUBMIT_ANSWER_FULFILLED, 
        payload: response 
      });
      
      return response;
    } catch (error) {
      // Rollback the optimistic update on error
      dispatch({ 
        type: ACTIONS.SUBMIT_ANSWER_REJECTED, 
        payload: error.message 
      });
      
      // Show user-friendly error message
      const friendlyMessage = getFriendlyErrorMessage(error);
      message.error(`Failed to submit answer: ${friendlyMessage}`);
      
      throw error;
    }
  }, []);
  
  const fetchCandidates = useCallback(async (retryCount = 0) => {
    dispatch({ type: ACTIONS.FETCH_CANDIDATES_PENDING });
    
    try {
      const response = await api.getCandidates();
      dispatch({ 
        type: ACTIONS.FETCH_CANDIDATES_FULFILLED, 
        payload: response.candidates 
      });
      
      return response.candidates;
    } catch (error) {
      dispatch({ 
        type: ACTIONS.FETCH_CANDIDATES_REJECTED, 
        payload: error.message 
      });
      
      // Show user-friendly error message
      const friendlyMessage = getFriendlyErrorMessage(error);
      message.error(`Failed to load candidates: ${friendlyMessage}`);
      
      throw error;
    }
  }, []);
  
  // Context value
  const value = {
    ...state,
    // Synchronous actions
    clearError,
    clearErrors,
    setActiveCandidate,
    saveDraft,
    abandonActiveInterview,
    // Async actions
    startInterview,
    submitAnswer,
    fetchCandidates
  };
  
  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};