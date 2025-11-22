import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock window.SpeechRecognition for tests
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock window.speechSynthesis for tests
window.speechSynthesis = window.speechSynthesis || {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn().mockReturnValue([]),
  speaking: false,
  pending: false,
  paused: false,
};

// Mock navigator.mediaDevices for webcam tests
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([]),
    }),
  },
});

// Clean up after each test
afterEach(() => {
  cleanup();
});