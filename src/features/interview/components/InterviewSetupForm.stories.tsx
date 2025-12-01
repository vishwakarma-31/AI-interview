import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Form } from 'antd';
import InterviewSetupForm from './InterviewSetupForm';

const meta: Meta<typeof InterviewSetupForm> = {
  title: 'Interview/InterviewSetupForm',
  component: InterviewSetupForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    loadingStates: {
      control: 'object',
    },
    prefill: {
      control: 'object',
    },
    showPreview: {
      control: 'boolean',
    },
  },
};

export default meta;

type Story = StoryObj<typeof InterviewSetupForm>;

// Mock functions for the story
const mockOnStart = async (_values: any) => {
  // console.log('Starting interview with values:', values);
};

const mockSetPrefill = (_prefill: any) => {
  // console.log('Setting prefill:', prefill);
};

const mockSetShowPreview = (_showPreview: React.SetStateAction<boolean>) => {
  // console.log('Setting showPreview:', showPreview);
};

export const Default: Story = {
  args: {
    onStart: mockOnStart,
    loadingStates: {
      startInterview: false,
      submitAnswer: false,
    },
    prefill: {
      name: '',
      email: '',
    },
    setPrefill: mockSetPrefill,
    form: Form.useForm()[0],
    showPreview: false,
    setShowPreview: mockSetShowPreview,
  },
};

export const WithPrefill: Story = {
  args: {
    ...Default.args,
    prefill: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
  },
};

export const InPreviewMode: Story = {
  args: {
    ...Default.args,
    showPreview: true,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loadingStates: {
      startInterview: true,
      submitAnswer: false,
    },
  },
};
