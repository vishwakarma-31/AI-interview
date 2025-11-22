const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const InterviewSession = require('../models/InterviewSession');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-interview', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for data retention script');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Delete data older than 90 days
const deleteOldData = async () => {
  try {
    // Calculate the date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    console.log(`Deleting data older than: ${ninetyDaysAgo.toISOString()}`);
    
    // Delete old candidates
    const deletedCandidates = await Candidate.deleteMany({
      createdAt: { $lt: ninetyDaysAgo }
    });
    
    console.log(`Deleted ${deletedCandidates.deletedCount} old candidates`);
    
    // Delete old interview sessions (orphans)
    const deletedSessions = await InterviewSession.deleteMany({
      createdAt: { $lt: ninetyDaysAgo }
    });
    
    console.log(`Deleted ${deletedSessions.deletedCount} old interview sessions`);
    
    console.log('Data retention cleanup completed');
  } catch (error) {
    console.error('Error during data retention cleanup:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await deleteOldData();
  await mongoose.connection.close();
  console.log('Database connection closed');
};

// Only run if this script is executed directly
if (require.main === module) {
  run();
}

module.exports = { deleteOldData };