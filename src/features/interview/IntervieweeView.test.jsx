import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IntervieweeView from './IntervieweeView';

// Mock the InterviewContext
const mockUseInterview = vi.fn();
vi.mock('../../contexts/InterviewContext.jsx', () => ({
  useInterview: () => mockUseInterview(),
}));

// Mock child components
vi.mock('../../components/IntervieweeErrorBoundary.jsx', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>,
}));

describe('IntervieweeView - Speech Recognition', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();

    // Mock window.SpeechRecognition
    window.SpeechRecognition = vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      onresult: null,
      onerror: null,
      onend: null,
    }));
  });

  afterEach(() => {
    // Clean up mocks
    vi.clearAllMocks();
  });

  it('should show fallback UI when speech recognition is not supported', () => {
    // Mock browser without speech recognition support
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    mockUseInterview.mockReturnValue({
      activeCandidate: null,
      activeSession: null,
      loadingStates: {},
      error: null,
      errors: {},
      clearError: vi.fn(),
      clearErrors: vi.fn(),
      saveDraft: vi.fn(),
      startInterview: vi.fn(),
      submitAnswer: vi.fn(),
    });

    render(<IntervieweeView />);

    // Should show fallback message
    expect(screen.getByText('Speech Recognition Not Supported')).toBeInTheDocument();
    expect(
      screen.getByText(/Speech Recognition is not supported in this browser/)
    ).toBeInTheDocument();
  });

  it('should show fallback UI when speech recognition is supported but fails', () => {
    // Mock browser with speech recognition support
    window.SpeechRecognition = vi.fn().mockImplementation(() => {
      throw new Error('Speech recognition not available');
    });

    mockUseInterview.mockReturnValue({
      activeCandidate: null,
      activeSession: null,
      loadingStates: {},
      error: null,
      errors: {},
      clearError: vi.fn(),
      clearErrors: vi.fn(),
      saveDraft: vi.fn(),
      startInterview: vi.fn(),
      submitAnswer: vi.fn(),
    });

    render(<IntervieweeView />);

    // Should show fallback message
    expect(screen.getByText('Speech Recognition Not Supported')).toBeInTheDocument();
  });
});
