import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';

// Mock the InterviewContext
const mockUseInterview = vi.fn();
vi.mock('../../contexts/InterviewContext', () => ({
  useInterview: () => mockUseInterview()
}));

// Mock react-router-dom
const mockUseNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({
      pathname: '/'
    })
  };
});

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
    Select: ({ children, onChange, ...props }) => (
      <select onChange={onChange} {...props}>{children}</select>
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

describe('User Flows Integration Tests', () => {
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
    mockUseNavigate.mockClear();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should complete the full interview flow', async () => {
    // Mock the initial state (no active session)
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

    render(<App />);

    // Step 1: Fill in the interview setup form
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    
    // Select a role
    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'Frontend' } });
    
    // Check GDPR consent
    const consentCheckbox = screen.getByRole('checkbox');
    fireEvent.click(consentCheckbox);
    
    // Submit the form
    const startButton = screen.getByText('Start Interview');
    fireEvent.click(startButton);

    // Step 2: Verify interview started successfully
    // Mock the state after starting interview
    mockUseInterview.mockReturnValueOnce({
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        email: 'john@example.com'
      },
      activeSession: {
        _id: 'session123',
        questions: [
          { text: 'Tell me about yourself', timeLimit: 60 },
          { text: 'What is your experience with React?', timeLimit: 90 }
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

    // Wait for the interview view to render
    await waitFor(() => {
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('Tell me about yourself')).toBeInTheDocument();
    });

    // Step 3: Submit an answer
    const answerInput = screen.getByPlaceholderText('Type your answer here...');
    fireEvent.change(answerInput, { target: { value: 'This is my answer to the first question.' } });
    
    const submitButton = screen.getByText('Submit Answer');
    fireEvent.click(submitButton);

    // Verify submitAnswer was called
    expect(mockSubmitAnswer).toHaveBeenCalledWith({
      answerText: 'This is my answer to the first question.'
    });

    // Step 4: Verify navigation to next question
    // Mock the state after submitting first answer
    mockUseInterview.mockReturnValueOnce({
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        email: 'john@example.com'
      },
      activeSession: {
        _id: 'session123',
        questions: [
          { text: 'Tell me about yourself', timeLimit: 60 },
          { text: 'What is your experience with React?', timeLimit: 90 }
        ],
        currentQuestionIndex: 1
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

    // Wait for the second question to render
    await waitFor(() => {
      expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
      expect(screen.getByText('What is your experience with React?')).toBeInTheDocument();
    });

    // Step 5: Submit answer to final question
    fireEvent.change(answerInput, { target: { value: 'I have 5 years of experience with React.' } });
    fireEvent.click(submitButton);

    // Verify submitAnswer was called for the second answer
    expect(mockSubmitAnswer).toHaveBeenCalledWith({
      answerText: 'I have 5 years of experience with React.'
    });
  });

  it('should handle form validation errors', async () => {
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

    render(<App />);

    // Try to submit without filling the form
    const startButton = screen.getByText('Start Interview');
    fireEvent.click(startButton);

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Please enter your full name')).toBeInTheDocument();
      expect(screen.getByText('Please enter your email')).toBeInTheDocument();
      expect(screen.getByText('Please enter your phone number')).toBeInTheDocument();
    });
  });

  it('should handle interview errors gracefully', async () => {
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

    render(<App />);

    // Fill in the form
    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    
    // Mock startInterview to throw an error
    mockStartInterview.mockRejectedValueOnce(new Error('Failed to start interview'));
    
    const startButton = screen.getByText('Start Interview');
    fireEvent.click(startButton);

    // Check that error is handled
    await waitFor(() => {
      expect(mockStartInterview).toHaveBeenCalled();
    });
  });
});