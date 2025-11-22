import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WelcomeBackModal from '../../components/WelcomeBackModal';

// Mock the InterviewContext
const mockUseInterview = vi.fn();
vi.mock('../../contexts/InterviewContext', () => ({
  useInterview: () => mockUseInterview()
}));

describe('WelcomeBackModal', () => {
  const mockClearActiveSession = vi.fn();
  const mockSetActiveCandidate = vi.fn();

  beforeEach(() => {
    mockClearActiveSession.mockClear();
    mockSetActiveCandidate.mockClear();
  });

  it('should render when there is an active session and candidate', () => {
    mockUseInterview.mockReturnValue({
      activeSession: {
        _id: 'session123',
        currentQuestionIndex: 0,
        questions: [{ text: 'Question 1' }]
      },
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        status: 'in-progress'
      },
      clearActiveSession: mockClearActiveSession,
      setActiveCandidate: mockSetActiveCandidate
    });

    render(<WelcomeBackModal />);

    expect(screen.getByText('Welcome Back, John Doe!')).toBeInTheDocument();
    expect(screen.getByText('Continue Interview')).toBeInTheDocument();
    expect(screen.getByText('Start New Interview')).toBeInTheDocument();
  });

  it('should not render when there is no active session', () => {
    mockUseInterview.mockReturnValue({
      activeSession: null,
      activeCandidate: null,
      clearActiveSession: mockClearActiveSession,
      setActiveCandidate: mockSetActiveCandidate
    });

    const { container } = render(<WelcomeBackModal />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when candidate status is not in-progress or pending', () => {
    mockUseInterview.mockReturnValue({
      activeSession: {
        _id: 'session123',
        currentQuestionIndex: 0,
        questions: [{ text: 'Question 1' }]
      },
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        status: 'completed'
      },
      clearActiveSession: mockClearActiveSession,
      setActiveCandidate: mockSetActiveCandidate
    });

    const { container } = render(<WelcomeBackModal />);
    expect(container.firstChild).toBeNull();
  });

  it('should continue interview when Continue button is clicked', () => {
    mockUseInterview.mockReturnValue({
      activeSession: {
        _id: 'session123',
        currentQuestionIndex: 0,
        questions: [{ text: 'Question 1' }]
      },
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        status: 'in-progress'
      },
      clearActiveSession: mockClearActiveSession,
      setActiveCandidate: mockSetActiveCandidate
    });

    render(<WelcomeBackModal />);

    const continueButton = screen.getByText('Continue Interview');
    fireEvent.click(continueButton);

    // Should not call any mock functions as it just continues
    expect(mockClearActiveSession).not.toHaveBeenCalled();
    expect(mockSetActiveCandidate).not.toHaveBeenCalled();
  });

  it('should start new interview when Start New Interview button is clicked', () => {
    mockUseInterview.mockReturnValue({
      activeSession: {
        _id: 'session123',
        currentQuestionIndex: 0,
        questions: [{ text: 'Question 1' }]
      },
      activeCandidate: {
        _id: 'candidate123',
        name: 'John Doe',
        status: 'in-progress'
      },
      clearActiveSession: mockClearActiveSession,
      setActiveCandidate: mockSetActiveCandidate
    });

    render(<WelcomeBackModal />);

    const newInterviewButton = screen.getByText('Start New Interview');
    fireEvent.click(newInterviewButton);

    expect(mockClearActiveSession).toHaveBeenCalled();
    expect(mockSetActiveCandidate).toHaveBeenCalled();
  });
});