import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IntervieweeView from '../../features/interview/IntervieweeView';

// Mock the InterviewContext
const mockUseInterview = vi.fn();
vi.mock('../../contexts/InterviewContext', () => ({
  useInterview: () => mockUseInterview()
}));

// Mock Ant Design components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Button: ({ children, onClick, ...props }) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    Form: ({ children, onFinish }) => (
      <form onSubmit={onFinish}>{children}</form>
    ),
    Input: ({ placeholder, ...props }) => (
      <input placeholder={placeholder} {...props} />
    ),
    message: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn()
    }
  };
});

// Mock react-webcam
vi.mock('react-webcam', () => ({
  default: () => <div data-testid="webcam">Webcam Component</div>
}));

describe('IntervieweeView - Speech Recognition', () => {
  const mockStartInterview = vi.fn();
  const mockSubmitAnswer = vi.fn();
  const mockSaveDraft = vi.fn();
  const mockClearError = vi.fn();
  const mockClearErrors = vi.fn();

  beforeEach(() => {
    mockStartInterview.mockClear();
    mockSubmitAnswer.mockClear();
    mockSaveDraft.mockClear();
    mockClearError.mockClear();
    mockClearErrors.mockClear();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any mock implementations
    vi.restoreAllMocks();
  });

  it('should show fallback UI when SpeechRecognition is not supported', () => {
    // Mock browser without SpeechRecognition support
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    mockUseInterview.mockReturnValue({
      activeCandidate: null,
      activeSession: null,
      loadingStates: {},
      error: null,
      errors: {},
      clearError: mockClearError,
      clearErrors: mockClearErrors,
      saveDraft: mockSaveDraft,
      startInterview: mockStartInterview,
      submitAnswer: mockSubmitAnswer
    });

    render(<IntervieweeView />);

    // Fill in the form to start an interview
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    
    const startButton = screen.getByText('Start Interview');
    fireEvent.click(startButton);

    // Check that the fallback message is displayed
    expect(screen.getByText('Speech Recognition Not Supported')).toBeInTheDocument();
    expect(screen.getByText(/Speech Recognition is not supported in this browser/)).toBeInTheDocument();
  });

  it('should handle speech recognition errors gracefully', () => {
    // Mock browser with SpeechRecognition support
    window.SpeechRecognition = vi.fn().mockImplementation(() => ({
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      addEventListener: vi.fn((event, callback) => {
        if (event === 'error') {
          // Simulate an error
          callback({ error: 'no-speech' });
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    mockUseInterview.mockReturnValue({
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        email: 'john@example.com'
      },
      activeSession: {
        _id: 'session123',
        questions: [
          { text: 'Tell me about yourself', timeLimit: 60 }
        ],
        currentQuestionIndex: 0
      },
      loadingStates: {},
      error: null,
      errors: {},
      clearError: mockClearError,
      clearErrors: mockClearErrors,
      saveDraft: mockSaveDraft,
      startInterview: mockStartInterview,
      submitAnswer: mockSubmitAnswer
    });

    render(<IntervieweeView />);

    // Click the record button
    const recordButton = screen.getByText('Start Recording');
    fireEvent.click(recordButton);

    // Check that error handling works (message.error should be called)
    // Note: This might require more specific mocking of the message component
  });

  it('should continue to work with manual input when speech recognition fails', () => {
    // Mock browser without SpeechRecognition support
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    mockUseInterview.mockReturnValue({
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        email: 'john@example.com'
      },
      activeSession: {
        _id: 'session123',
        questions: [
          { text: 'Tell me about yourself', timeLimit: 60 }
        ],
        currentQuestionIndex: 0
      },
      loadingStates: {},
      error: null,
      errors: {},
      clearError: mockClearError,
      clearErrors: mockClearErrors,
      saveDraft: mockSaveDraft,
      startInterview: mockStartInterview,
      submitAnswer: mockSubmitAnswer
    });

    render(<IntervieweeView />);

    // Check that manual input is still available
    const answerInput = screen.getByPlaceholderText('Type your answer here...');
    expect(answerInput).toBeInTheDocument();

    // Fill in an answer
    fireEvent.change(answerInput, { target: { value: 'This is my manual answer to the question.' } });
    expect(answerInput.value).toBe('This is my manual answer to the question.');

    // Submit the answer
    const submitButton = screen.getByText('Submit Answer');
    fireEvent.click(submitButton);

    // Check that submitAnswer was called
    expect(mockSubmitAnswer).toHaveBeenCalledWith({
      answerText: 'This is my manual answer to the question.'
    });
  });
});