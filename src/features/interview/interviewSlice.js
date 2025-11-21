import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks for API calls
export const startInterview = createAsyncThunk(
  'interview/startInterview',
  async ({ name, email, phone, role, resume }, { rejectWithValue }) => {
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
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'interview/submitAnswer',
  async ({ sessionId, answerText }, { rejectWithValue }) => {
    try {
      const response = await api.submitAnswer(sessionId, answerText);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const finalizeInterview = createAsyncThunk(
  'interview/finalizeInterview',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await api.finalizeInterview(sessionId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCandidates = createAsyncThunk(
  'interview/fetchCandidates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getCandidates();
      return response.candidates;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  candidates: [],
  activeCandidate: null,
  activeSession: null,
  timers: {},
  loading: false,
  error: null
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setActiveCandidate: (state, action) => {
      state.activeCandidate = action.payload.candidate;
      state.activeSession = action.payload.session;
    },
    saveDraft: (state, action) => {
      const { questionIndex, draft } = action.payload;
      if (state.activeSession && state.activeSession.questions[questionIndex]) {
        state.activeSession.questions[questionIndex].draft = draft;
      }
    },
    updateTimer: (state, action) => {
      const { sessionId, questionIndex, deadlineMs } = action.payload;
      state.timers[sessionId] = {
        questionIndex,
        deadlineMs,
        paused: false
      };
    },
    pauseTimer: (state, action) => {
      const { sessionId } = action.payload;
      if (state.timers[sessionId]) {
        state.timers[sessionId].paused = true;
        state.timers[sessionId].remainingMs = 
          Math.max(0, state.timers[sessionId].deadlineMs - Date.now());
      }
    },
    resumeTimer: (state, action) => {
      const { sessionId } = action.payload;
      if (state.timers[sessionId] && state.timers[sessionId].paused) {
        const remainingMs = state.timers[sessionId].remainingMs || 
          Math.max(0, state.timers[sessionId].deadlineMs - Date.now());
        state.timers[sessionId].paused = false;
        state.timers[sessionId].deadlineMs = Date.now() + remainingMs;
        delete state.timers[sessionId].remainingMs;
      }
    },
    // Add back the missing reducers
    abandonActiveInterview: (state) => {
      state.activeCandidate = null;
      state.activeSession = null;
    },
    resumeTimerIfNeeded: (state, action) => {
      // This is now handled by the timer logic above
    },
    updateNotes: (state, action) => {
      // This would update notes in the backend in a real implementation
    },
    updateTags: (state, action) => {
      // This would update tags in the backend in a real implementation
    }
  },
  extraReducers: (builder) => {
    builder
      // Start interview
      .addCase(startInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.activeCandidate = action.payload.candidate;
        state.activeSession = action.payload.session;
        // Initialize timer for first question
        const firstQuestion = action.payload.session.questions[0];
        if (firstQuestion) {
          state.timers[action.payload.session.id] = {
            questionIndex: 0,
            deadlineMs: Date.now() + (firstQuestion.time * 1000),
            paused: false
          };
        }
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.nextQuestion) {
          // Move to next question
          state.activeSession.currentQuestionIndex = action.payload.nextQuestion.index;
          // Update timer for next question
          const nextQuestion = action.payload.nextQuestion.question;
          state.timers[state.activeSession.id] = {
            questionIndex: action.payload.nextQuestion.index,
            deadlineMs: Date.now() + (nextQuestion.time * 1000),
            paused: false
          };
        } else if (action.payload.finalScore !== undefined) {
          // Interview completed
          state.activeSession.score = action.payload.finalScore;
          state.activeSession.summary = action.payload.summary;
          state.activeSession.questions = action.payload.questions;
          delete state.timers[state.activeSession.id];
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch candidates
      .addCase(fetchCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  setActiveCandidate, 
  saveDraft, 
  updateTimer, 
  pauseTimer, 
  resumeTimer,
  abandonActiveInterview,
  resumeTimerIfNeeded,
  updateNotes,
  updateTags
} = interviewSlice.actions;

export default interviewSlice.reducer;