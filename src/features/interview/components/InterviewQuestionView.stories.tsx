import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import InterviewQuestionView from './InterviewQuestionView';

const meta: Meta<typeof InterviewQuestionView> = {
  title: 'Interview/InterviewQuestionView',
  component: InterviewQuestionView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    timeLeft: {
      control: { type: 'number' },
    },
    isRecording: {
      control: { type: 'boolean' },
    },
    isSpeaking: {
      control: { type: 'boolean' },
    },
    transcript: {
      control: { type: 'text' },
    },
    isSpeechRecognitionSupported: {
      control: { type: 'boolean' },
    },
    isTimerRunning: {
      control: { type: 'boolean' },
    },
    isTimerPaused: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;

type Story = StoryObj<typeof InterviewQuestionView>;

// Mock functions for the story
const mockToggleRecording = () => {
  // console.log('Toggle recording');
};

const mockHandleTextChange = (_e: React.ChangeEvent<HTMLTextAreaElement>) => {
  // console.log('Text changed:', e.target.value);
};

const mockHandleSubmitAnswer = (_text: string) => {
  // console.log('Submit answer:', text);
};

const mockHandleSkip = () => {
  // console.log('Skip question');
};

const mockHandlePause = () => {
  // console.log('Pause interview');
};

const mockHandleResume = () => {
  // console.log('Resume interview');
};

const mockHandleEndCall = () => {
  // console.log('End call');
};

const mockActiveSession = {
  questions: [
    {
      text: 'Explain the concept of React hooks and their advantages.',
      difficulty: 'Medium',
      timeLimit: 120,
      answer: '',
      draft: '',
      score: 0,
    },
    {
      text: 'How would you optimize the performance of a React application?',
      difficulty: 'Hard',
      timeLimit: 180,
      answer: '',
      draft: '',
      score: 0,
    },
  ],
  currentQuestionIndex: 0,
  id: 'test-session-id',
  candidateId: 'test-candidate-id',
  score: 0,
  summary: '',
  notes: '',
  tags: [],
  pauseHistory: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isDeleted: false,
};

export const Default: Story = {
  args: {
    activeSession: mockActiveSession,
    timeLeft: 120,
    isRecording: false,
    isSpeaking: false,
    transcript: '',
    isSpeechRecognitionSupported: true,
    loadingStates: {
      submitAnswer: false,
    },
    isTimerRunning: true,
    isTimerPaused: false,
    toggleRecording: mockToggleRecording,
    handleTextChange: mockHandleTextChange,
    handleSubmitAnswer: mockHandleSubmitAnswer,
    handleSkip: mockHandleSkip,
    handlePause: mockHandlePause,
    handleResume: mockHandleResume,
    handleEndCall: mockHandleEndCall,
  },
};

export const Recording: Story = {
  args: {
    ...Default.args,
    isRecording: true,
    transcript: 'I am currently answering the question about React hooks...',
  },
};

export const WithTranscript: Story = {
  args: {
    ...Default.args,
    transcript:
      'React hooks are functions that allow you to use state and other React features without writing a class component.',
  },
};

export const Paused: Story = {
  args: {
    ...Default.args,
    isTimerRunning: false,
    isTimerPaused: true,
  },
};

export const UnsupportedBrowser: Story = {
  args: {
    ...Default.args,
    isSpeechRecognitionSupported: false,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loadingStates: {
      submitAnswer: true,
    },
  },
};
