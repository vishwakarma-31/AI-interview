const Candidate = require('../models/Candidate');
const InterviewSession = require('../models/InterviewSession');

// Reference to in-memory storage from interviewController
let inMemoryCandidates = [];
let inMemorySessions = [];

// This is a workaround to access the in-memory storage
// In a real application, you would use a proper dependency injection pattern
function setInMemoryStorage(candidates, sessions) {
  inMemoryCandidates = candidates;
  inMemorySessions = sessions;
}

/**
 * Get all candidates with their interview sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllCandidates(req, res) {
  try {
    // Check if we're using MongoDB or in-memory storage
    if (Candidate && InterviewSession) {
      // Use MongoDB
      const candidates = await Candidate.find({}).sort({ createdAt: -1 });
      
      // Get interview sessions for each candidate
      const candidatesWithSessions = await Promise.all(candidates.map(async (candidate) => {
        const session = await InterviewSession.findOne({ candidateId: candidate._id });
        return {
          ...candidate.toObject(),
          session: session ? session.toObject() : null
        };
      }));
      
      res.json({
        candidates: candidatesWithSessions
      });
    } else {
      // Use in-memory storage
      const candidatesWithSessions = inMemoryCandidates.map(candidate => {
        const session = inMemorySessions.find(s => s.candidateId === candidate._id) || null;
        return {
          ...candidate,
          session
        };
      });
      
      res.json({
        candidates: candidatesWithSessions
      });
    }
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch candidates',
      details: error.message 
    });
  }
}

module.exports = {
  getAllCandidates,
  setInMemoryStorage
};