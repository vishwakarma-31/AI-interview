import { createSlice, nanoid } from '@reduxjs/toolkit';

const EASY_QUESTIONS = [
  { text: 'What is JSX?', difficulty: 'Easy', time: 20 },
  { text: 'What are React hooks?', difficulty: 'Easy', time: 20 },
];

const MEDIUM_QUESTIONS = [
  { text: 'Explain the virtual DOM.', difficulty: 'Medium', time: 60 },
  { text: 'Describe the difference between state and props.', difficulty: 'Medium', time: 60 },
];

const HARD_QUESTIONS = [
  { text: 'How would you optimize the performance of a large React application?', difficulty: 'Hard', time: 120 },
  { text: "Explain React's reconciliation process.", difficulty: 'Hard', time: 120 },
];

function generateQuestions() {
  const withDefaults = (q) => ({ ...q, answer: '', score: 0 });
  return [
    ...EASY_QUESTIONS.map(withDefaults),
    ...MEDIUM_QUESTIONS.map(withDefaults),
    ...HARD_QUESTIONS.map(withDefaults),
  ];
}

const initialState = {
  candidates: [],
  activeCandidateId: null,
  // tracking per-candidate timers using absolute deadlines for persistence
  timers: {}, // { [candidateId]: { questionIndex: number, deadlineMs: number } }
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startNewCandidate: {
      reducer(state, action) {
        const candidate = action.payload;
        state.candidates.push(candidate);
        state.activeCandidateId = candidate.id;
        // initialize timer for first question
        const first = candidate.questions[0];
        state.timers[candidate.id] = {
          questionIndex: 0,
          deadlineMs: Date.now() + (first?.time ?? 20) * 1000,
        };
      },
      prepare({ name, email, phone }) {
        const id = nanoid();
        return {
          payload: {
            id,
            status: 'in-progress',
            name,
            email,
            phone,
            currentQuestionIndex: 0,
            score: 0,
            summary: '',
            questions: generateQuestions(),
          }
        };
      }
    },
    recordAnswerAndNext(state, action) {
      const { candidateId, answerText, timeUp = false } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (!candidate) return;
      const idx = candidate.currentQuestionIndex;
      if (candidate.questions[idx]) {
        candidate.questions[idx].answer = answerText || (timeUp ? '[No answer - time expired]' : '');
        // Assign a mock per-question score (0-10)
        candidate.questions[idx].score = Math.floor(Math.random() * 6) + 5; // 5..10
      }
      if (idx < candidate.questions.length - 1) {
        candidate.currentQuestionIndex += 1;
        const next = candidate.questions[candidate.currentQuestionIndex];
        state.timers[candidate.id] = {
          questionIndex: candidate.currentQuestionIndex,
          deadlineMs: Date.now() + (next?.time ?? 20) * 1000,
        };
      } else {
        candidate.status = 'completed';
        // finalize score and summary
        candidate.score = Math.floor(Math.random() * 41) + 60; // 60..100
        candidate.summary = 'The candidate showed strong fundamentals in React.';
        delete state.timers[candidate.id];
      }
    },
    setActiveCandidate(state, action) {
      state.activeCandidateId = action.payload;
    },
    abandonActiveInterview(state) {
      const id = state.activeCandidateId;
      if (!id) return;
      const candidate = state.candidates.find(c => c.id === id);
      if (candidate && candidate.status === 'in-progress') {
        candidate.status = 'abandoned';
      }
      state.activeCandidateId = null;
      delete state.timers[id];
    },
    resumeTimerIfNeeded(state, action) {
      const { candidateId } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (!candidate) return;
      const timer = state.timers[candidateId];
      const current = candidate.questions[candidate.currentQuestionIndex];
      if (!timer) {
        state.timers[candidateId] = {
          questionIndex: candidate.currentQuestionIndex,
          deadlineMs: Date.now() + (current?.time ?? 20) * 1000,
        };
      } else if (timer.questionIndex !== candidate.currentQuestionIndex) {
        state.timers[candidateId] = {
          questionIndex: candidate.currentQuestionIndex,
          deadlineMs: Date.now() + (current?.time ?? 20) * 1000,
        };
      }
    }
  }
});

export const { startNewCandidate, recordAnswerAndNext, setActiveCandidate, abandonActiveInterview, resumeTimerIfNeeded } = interviewSlice.actions;

export default interviewSlice.reducer;


