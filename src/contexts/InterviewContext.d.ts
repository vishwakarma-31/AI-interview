/**
 * @typedef {Object} LoadingStates
 * @property {boolean} startInterview
 * @property {boolean} submitAnswer
 * @property {boolean} fetchCandidates
 */

/**
 * @typedef {Object} Candidate
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} role
 * @property {string} status
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Question
 * @property {string} [id]
 * @property {string} text
 * @property {string} [answer]
 * @property {string} [draft]
 * @property {number} [index]
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} candidateId
 * @property {Question[]} questions
 * @property {number} currentQuestionIndex
 * @property {Date} createdAt
 * @property {number} [score]
 * @property {string} [summary]
 */

/**
 * @typedef {Object} InterviewContextType
 * @property {Candidate[]} candidates
 * @property {Candidate | null} activeCandidate
 * @property {Session | null} activeSession
 * @property {boolean} loading
 * @property {LoadingStates} loadingStates
 * @property {string | null} error
 * @property {Record<string, string>} errors
 * @property {function(): void} clearError
 * @property {function(): void} clearErrors
 * @property {function(Candidate, Session): void} setActiveCandidate
 * @property {function(number, string): void} saveDraft
 * @property {function(): void} abandonActiveInterview
 * @property {function({
 *   name: string,
 *   email: string,
 *   phone: string,
 *   role: string,
 *   resume?: File
 * }, number?): Promise<any>} startInterview
 * @property {function({
 *   sessionId: string,
 *   answerText: string
 * }, boolean?, number?): Promise<any>} submitAnswer
 * @property {function(number?): Promise<Candidate[]>} fetchCandidates
 */

/** @type {import('react').Context<InterviewContextType>} */
const InterviewContext = /** @type {any} */ {};

/** @type {React.FC<{ children: React.ReactNode }>} */
const InterviewProvider = /** @type {any} */ {};

/** @returns {InterviewContextType} */
const useInterview = () => /** @type {any} */ {};

export { InterviewContext, InterviewProvider, useInterview };
