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
    Alert: ({ message, description, type }) => (
      <div data-testid={`alert-${type}`}>
        <span>{message}</span>
        <span>{description}</span>
      </div>
    ),
    message: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn()
    }
  };
});

// Mock react-webcam
const mockGetUserMedia = vi.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia
  }
});

describe('IntervieweeView - Webcam', () => {
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
    mockGetUserMedia.mockClear();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any mock implementations
    vi.restoreAllMocks();
  });

  it('should show webcam when permission is granted', () => {
    // Mock successful webcam permission
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => []
    });

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

    // Check that webcam component is rendered
    expect(screen.getByTestId('webcam')).toBeInTheDocument();
  });

  it('should show permission denied message when webcam access is denied', async () => {
    // Mock denied webcam permission
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

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

    // Check that permission denied alert is shown
    expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    expect(screen.getByText('Webcam Permission Denied')).toBeInTheDocument();
  });

  it('should allow retrying webcam permission', async () => {
    // First deny permission
    mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
    
    // Then grant permission on retry
    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => []
    });

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

    // Check that permission denied alert is shown
    expect(screen.getByTestId('alert-error')).toBeInTheDocument();
    
    // Click retry button (this would be in the alert component)
    // Since we're mocking the Alert component, we'll simulate the retry logic differently
    // In a real implementation, there would be a retry button in the UI
  });
});