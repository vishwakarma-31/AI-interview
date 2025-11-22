import { Context } from 'react';

interface LoadingStates {
  startInterview: boolean;
  submitAnswer: boolean;
  fetchCandidates: boolean;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: Date;
}

interface Question {
  id?: string;
  text: string;
  answer?: string;
  draft?: string;
  index?: number;
}

interface Session {
  id: string;
  candidateId: string;
  questions: Question[];
  currentQuestionIndex: number;
  createdAt: Date;
  score?: number;
  summary?: string;
}

interface InterviewContextType {
  candidates: Candidate[];
  activeCandidate: Candidate | null;
  activeSession: Session | null;
  loading: boolean;
  loadingStates: LoadingStates;
  error: string | null;
  errors: Record<string, string>;
  
  // Methods
  clearError: () => void;
  clearErrors: () => void;
  setActiveCandidate: (candidate: Candidate, session: Session) => void;
  saveDraft: (questionIndex: number, draft: string) => void;
  abandonActiveInterview: () => void;
  startInterview: (params: { name: string; email: string; phone: string; role: string; resume?: File }, retryCount?: number) => Promise<any>;
  submitAnswer: (params: { sessionId: string; answerText: string }, optimistic?: boolean, retryCount?: number) => Promise<any>;
  fetchCandidates: (retryCount?: number) => Promise<Candidate[]>;
}

export const InterviewContext: Context<InterviewContextType>;
export const InterviewProvider: React.ComponentType<{ children: React.ReactNode }>;
export const useInterview: () => InterviewContextType;