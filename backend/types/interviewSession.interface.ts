import { Document, Types } from 'mongoose';

/**
 * Question Difficulty Enum
 */
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

/**
 * Pause History Type Enum
 */
export type PauseHistoryType = 'start' | 'pause' | 'resume' | 'complete';

/**
 * Question Interface
 */
export interface IQuestion {
  text: string;
  difficulty: QuestionDifficulty;
  time: number;
  answer?: string;
  draft?: string;
  score?: number;
}

/**
 * Pause History Interface
 */
export interface IPauseHistory {
  type: PauseHistoryType;
  ts: Date;
  remainingMs?: number;
}

/**
 * Interview Session Interface
 */
export interface IInterviewSession {
  candidateId: Types.ObjectId;
  questions: IQuestion[];
  currentQuestionIndex: number;
  score?: number;
  summary?: string;
  notes?: string;
  tags?: string[];
  pauseHistory?: IPauseHistory[];
  resumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * Interview Session Document Interface (extends Mongoose Document)
 */
export interface IInterviewSessionDocument extends IInterviewSession, Document {
  // _id is provided by Document interface
}
