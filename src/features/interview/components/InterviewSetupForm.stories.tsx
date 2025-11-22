import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import InterviewSetupForm from './InterviewSetupForm';
import { Form } from 'antd';

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
const mockOnStart = async (values: any) => {
  console.log('Starting interview with values:', values);
};

const mockSetPrefill = (prefill: any) => {
  console.log('Setting prefill:', prefill);
};

const mockSetShowPreview = (showPreview: React.SetStateAction<boolean>) => {
  console.log('Setting showPreview:', showPreview);
};

// Create a form instance for the story
const [form] = Form.useForm();

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
    form: form,
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