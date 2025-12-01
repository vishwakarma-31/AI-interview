import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WelcomeBackModal from './WelcomeBackModal';

// Mock the InterviewContext
const mockUseInterview = vi.fn();
vi.mock('../contexts/InterviewContext.jsx', () => ({
  useInterview: () => mockUseInterview(),
}));

describe('WelcomeBackModal', () => {
  it('should not render when there is no active session', () => {
    mockUseInterview.mockReturnValue({
      activeCandidate: null,
      activeSession: null,
      abandonActiveInterview: vi.fn(),
    });

    render(<WelcomeBackModal />);

    // Modal should not be visible
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument();
  });

  it('should render when there is an active session', () => {
    mockUseInterview.mockReturnValue({
      activeCandidate: { status: 'in-progress' },
      activeSession: { id: 'test-session' },
      abandonActiveInterview: vi.fn(),
    });

    render(<WelcomeBackModal />);

    // Modal should be visible
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(
      screen.getByText('You have an unfinished interview. Would you like to resume?')
    ).toBeInTheDocument();
  });

  it('should call abandonActiveInterview when Start New button is clicked', () => {
    const mockAbandon = vi.fn();
    mockUseInterview.mockReturnValue({
      activeCandidate: { status: 'in-progress' },
      activeSession: { id: 'test-session' },
      abandonActiveInterview: mockAbandon,
    });

    render(<WelcomeBackModal />);

    // Click the Start New button
    fireEvent.click(screen.getByText('Start New'));

    // Should call abandonActiveInterview
    expect(mockAbandon).toHaveBeenCalled();
  });
});
