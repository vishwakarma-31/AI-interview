import { Document, Types } from 'mongoose';

/**
 * Candidate Status Enum
 */
export type CandidateStatus = 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'abandoned';

/**
 * Candidate Role Enum
 */
export type CandidateRole = 'Frontend' | 'Backend';

/**
 * Candidate Interface
 */
export interface ICandidate {
  name: string;
  email: string;
  phone: string;
  resumeText?: string;
  status: CandidateStatus;
  role: CandidateRole;
  gdprConsent: boolean;
  scheduledAt?: Date;
  scheduledDuration?: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Candidate Document Interface (extends Mongoose Document)
 */
export interface ICandidateDocument extends ICandidate, Document {
  // _id is provided by Document interface
}
