import { withRetry, defaultShouldRetry } from '../utils/retryUtils.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    return data;
  } else {
    if (!response.ok) {
      throw new Error('API request failed');
    }
    return response.text();
  }
}

// API service object
export const api = {
  // Start a new interview
  async startInterview(formData) {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/interview/start`, {
        method: 'POST',
        body: formData
      });
      return handleResponse(response);
    }, {
      maxRetries: 3,
      shouldRetry: defaultShouldRetry
    });
  },

  // Submit an answer
  async submitAnswer(sessionId, answerText) {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/interview/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId, answerText })
      });
      return handleResponse(response);
    }, {
      maxRetries: 3,
      shouldRetry: defaultShouldRetry
    });
  },

  // Finalize interview (PATCH /interview/:id)
  async finalizeInterview(sessionId) {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/interview/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleResponse(response);
    }, {
      maxRetries: 2,
      shouldRetry: defaultShouldRetry
    });
  },

  // Get all candidates
  async getCandidates() {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/candidates`);
      return handleResponse(response);
    }, {
      maxRetries: 3,
      shouldRetry: defaultShouldRetry
    });
  },

  // Schedule an interview
  async scheduleInterview(data) {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/scheduling/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }, {
      maxRetries: 3,
      shouldRetry: defaultShouldRetry
    });
  },

  // Get upcoming scheduled interviews
  async getUpcomingInterviews(params = {}) {
    return withRetry(async () => {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/scheduling/upcoming${queryParams ? `?${queryParams}` : ''}`;
      const response = await fetch(url);
      return handleResponse(response);
    }, {
      maxRetries: 3,
      shouldRetry: defaultShouldRetry
    });
  },

  // Cancel a scheduled interview
  async cancelInterview(candidateId) {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/scheduling/${candidateId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return handleResponse(response);
    }, {
      maxRetries: 3,
      shouldRetry: defaultShouldRetry
    });
  },

  // Reschedule an interview
  async rescheduleInterview(candidateId, data) {
    return withRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/scheduling/${candidateId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    }, {
      maxRetries: 3,
      shouldRetry: defaultShouldRetry
    });
  }
};

export default api;