import { createSlice, nanoid } from '@reduxjs/toolkit';

// Question bank with role presets
const QUESTION_BANK = {
  Frontend: {
    Easy: [
      { text: 'What is JSX?', difficulty: 'Easy', time: 20 },
      { text: 'What are React hooks?', difficulty: 'Easy', time: 20 },
      { text: 'What does useState do?', difficulty: 'Easy', time: 20 },
    ],
    Medium: [
      { text: 'Explain the virtual DOM.', difficulty: 'Medium', time: 60 },
      { text: 'Describe the difference between state and props.', difficulty: 'Medium', time: 60 },
      { text: 'How does context help avoid prop drilling?', difficulty: 'Medium', time: 60 },
    ],
    Hard: [
      { text: 'How would you optimize performance of a large React app?', difficulty: 'Hard', time: 120 },
      { text: "Explain React's reconciliation process.", difficulty: 'Hard', time: 120 },
      { text: 'How would you architect SSR/SSG with hydration?', difficulty: 'Hard', time: 120 },
    ]
  },
  Backend: {
    Easy: [
      { text: 'What is REST?', difficulty: 'Easy', time: 20 },
      { text: 'What is an HTTP status code?', difficulty: 'Easy', time: 20 },
    ],
    Medium: [
      { text: 'Explain statelessness in REST APIs.', difficulty: 'Medium', time: 60 },
      { text: 'What is database indexing and why?', difficulty: 'Medium', time: 60 },
    ],
    Hard: [
      { text: 'Design a rate limiter for an API.', difficulty: 'Hard', time: 120 },
      { text: 'How would you shard a database?', difficulty: 'Hard', time: 120 },
    ]
  }
};

function pickRandom(arr, n) {
  const copy = [...arr];
  const result = [];
  while (copy.length && result.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(i, 1)[0]);
  }
  return result;
}

function generateQuestions(role = 'Frontend') {
  const bank = QUESTION_BANK[role] || QUESTION_BANK.Frontend;
  const withDefaults = (q) => ({ ...q, answer: '', draft: '', score: 0 });
  return [
    ...pickRandom(bank.Easy, 2).map(withDefaults),
    ...pickRandom(bank.Medium, 2).map(withDefaults),
    ...pickRandom(bank.Hard, 2).map(withDefaults),
  ];
}

const initialState = {
  candidates: [],
  activeCandidateId: null,
  // tracking per-candidate timers using absolute deadlines for persistence
  timers: {}, // { [candidateId]: { questionIndex: number, deadlineMs: number, paused: boolean, remainingMs?: number } }
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
          paused: false,
        };
      },
      prepare({ name, email, phone, role = 'Frontend' }) {
        const id = nanoid();
        return {
          payload: {
            id,
            status: 'in-progress',
            name,
            email,
            phone,
            role,
            currentQuestionIndex: 0,
            score: 0,
            summary: '',
            questions: generateQuestions(role),
            notes: '',
            tags: [],
            pauseHistory: [{ type: 'start', ts: Date.now() }],
            resumedAt: null,
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
        // Clear draft after submission
        candidate.questions[idx].draft = '';
      }
      if (idx < candidate.questions.length - 1) {
        candidate.currentQuestionIndex += 1;
        const next = candidate.questions[candidate.currentQuestionIndex];
        state.timers[candidate.id] = {
          questionIndex: candidate.currentQuestionIndex,
          deadlineMs: Date.now() + (next?.time ?? 20) * 1000,
          paused: false,
        };
      } else {
        candidate.status = 'completed';
        // finalize score and summary
        candidate.score = Math.floor(Math.random() * 41) + 60; // 60..100
        candidate.summary = 'The candidate showed strong fundamentals in React.';
        candidate.pauseHistory.push({ type: 'complete', ts: Date.now() });
        delete state.timers[candidate.id];
      }
    },
    saveDraft(state, action) {
      const { candidateId, questionIndex, draft } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (!candidate) return;
      if (candidate.questions[questionIndex]) {
        candidate.questions[questionIndex].draft = draft;
      }
    },
    pauseInterview(state, action) {
      const { candidateId } = action.payload;
      const t = state.timers[candidateId];
      if (!t || t.paused) return;
      const remainingMs = Math.max(0, t.deadlineMs - Date.now());
      t.paused = true;
      t.remainingMs = remainingMs;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (cand) cand.pauseHistory.push({ type: 'pause', ts: Date.now(), remainingMs });
    },
    resumeInterview(state, action) {
      const { candidateId } = action.payload;
      const t = state.timers[candidateId];
      if (!t || !t.paused) return;
      const ms = typeof t.remainingMs === 'number' ? t.remainingMs : Math.max(0, t.deadlineMs - Date.now());
      t.paused = false;
      t.deadlineMs = Date.now() + ms;
      delete t.remainingMs;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (cand) {
        cand.pauseHistory.push({ type: 'resume', ts: Date.now(), remainingMs: ms });
        cand.resumedAt = Date.now();
      }
    },
    skipWithPenalty(state, action) {
      const { candidateId } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (!candidate) return;
      const idx = candidate.currentQuestionIndex;
      if (candidate.questions[idx]) {
        candidate.questions[idx].answer = '[Skipped]';
        candidate.questions[idx].score = 0;
      }
      if (idx < candidate.questions.length - 1) {
        candidate.currentQuestionIndex += 1;
        const next = candidate.questions[candidate.currentQuestionIndex];
        state.timers[candidate.id] = {
          questionIndex: candidate.currentQuestionIndex,
          deadlineMs: Date.now() + (next?.time ?? 20) * 1000,
          paused: false,
        };
      } else {
        candidate.status = 'completed';
        candidate.score = Math.floor(Math.random() * 41) + 60;
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
          paused: false,
        };
      } else if (timer.questionIndex !== candidate.currentQuestionIndex) {
        state.timers[candidateId] = {
          questionIndex: candidate.currentQuestionIndex,
          deadlineMs: Date.now() + (current?.time ?? 20) * 1000,
          paused: false,
        };
      }
    },
    clearResumedAt(state, action) {
      const { candidateId } = action.payload;
      const cand = state.candidates.find(c => c.id === candidateId);
      if (cand) cand.resumedAt = null;
    },
    updateNotes(state, action) {
      const { candidateId, notes } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate) candidate.notes = notes;
    },
    updateTags(state, action) {
      const { candidateId, tags } = action.payload;
      const candidate = state.candidates.find(c => c.id === candidateId);
      if (candidate) candidate.tags = tags;
    }
  }
});

export const { startNewCandidate, recordAnswerAndNext, saveDraft, pauseInterview, resumeInterview, skipWithPenalty, setActiveCandidate, abandonActiveInterview, resumeTimerIfNeeded, updateNotes, updateTags } = interviewSlice.actions;

export default interviewSlice.reducer;


