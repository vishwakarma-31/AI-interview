import { FC } from 'react';

interface Question {
  text: string;
  difficulty: string;
  timeLimit: number;
  answer?: string;
  draft?: string;
  score?: number;
}

interface InterviewSession {
  questions: Question[];
  currentQuestionIndex: number;
  id: string;
  candidateId: string;
  score?: number;
  summary?: string;
  notes?: string;
  tags?: string[];
  pauseHistory?: any[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

interface LoadingStates {
  submitAnswer?: boolean;
}

interface InterviewQuestionViewProps {
  activeSession: InterviewSession;
  timeLeft: number;
  isRecording: boolean;
  isSpeaking: boolean;
  transcript: string;
  isSpeechRecognitionSupported: boolean;
  loadingStates: LoadingStates;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  toggleRecording: () => void;
  handleTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmitAnswer: (text: string) => void;
  handleSkip: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleEndCall: () => void;
}

declare const InterviewQuestionView: FC<InterviewQuestionViewProps>;
export default InterviewQuestionView;
