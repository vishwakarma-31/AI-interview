const mongoose = require('mongoose');
const dotenv = require('dotenv');
const InterviewSession = require('../models/InterviewSession');
const Candidate = require('../models/Candidate');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
});

// Cleanup expired sessions
async function cleanupExpiredSessions() {
  let session;
  try {
    console.log('Starting session cleanup...');
    
    // Find sessions that are older than 24 hours and still in progress
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    // Use MongoDB transaction for atomic operations
    session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Find expired sessions
      const expiredSessions = await InterviewSession.find({
        createdAt: { $lt: cutoffTime },
        status: { $in: ['pending', 'in-progress'] }
      }).session(session);
      
      if (expiredSessions.length === 0) {
        console.log('No expired sessions found.');
        await session.commitTransaction();
        session.endSession();
        return;
      }
      
      console.log(`Found ${expiredSessions.length} expired sessions to clean up.`);
      
      // Update expired sessions and related candidates atomically
      for (const interviewSession of expiredSessions) {
        interviewSession.status = 'expired';
        await interviewSession.save({ session });
        
        // Also update the candidate status
        const candidate = await Candidate.findById(interviewSession.candidateId).session(session);
        if (candidate && candidate.status === 'in-progress') {
          candidate.status = 'abandoned';
          await candidate.save({ session });
        }
      }
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      console.log(`Successfully cleaned up ${expiredSessions.length} sessions.`);
    } catch (transactionError) {
      // Abort transaction if any error occurs
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }
  } catch (error) {
    console.error('Error during session cleanup:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the cleanup function
cleanupExpiredSessions().catch(console.error);