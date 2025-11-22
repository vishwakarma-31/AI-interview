module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // Create indexes for Candidate collection
    await db.collection('candidates').createIndex({ email: 1 });
    await db.collection('candidates').createIndex({ createdAt: 1 });
    await db.collection('candidates').createIndex({ status: 1 });
    
    // Create indexes for InterviewSession collection
    await db.collection('interviewsessions').createIndex({ candidateId: 1 });
    await db.collection('interviewsessions').createIndex({ createdAt: 1 });
    
    // Create indexes for User collection
    await db.collection('users').createIndex({ email: 1 });
    await db.collection('users').createIndex({ createdAt: 1 });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ email: 1, role: 1 });
    
    // Create indexes for ApiKey collection
    await db.collection('apikeys').createIndex({ key: 1, isActive: 1 });
    await db.collection('apikeys').createIndex({ hashedKey: 1, isActive: 1 });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Drop indexes for Candidate collection
    await db.collection('candidates').dropIndex({ email: 1 });
    await db.collection('candidates').dropIndex({ createdAt: 1 });
    await db.collection('candidates').dropIndex({ status: 1 });
    
    // Drop indexes for InterviewSession collection
    await db.collection('interviewsessions').dropIndex({ candidateId: 1 });
    await db.collection('interviewsessions').dropIndex({ createdAt: 1 });
    
    // Drop indexes for User collection
    await db.collection('users').dropIndex({ email: 1 });
    await db.collection('users').dropIndex({ createdAt: 1 });
    await db.collection('users').dropIndex({ role: 1 });
    await db.collection('users').dropIndex({ isActive: 1 });
    await db.collection('users').dropIndex({ email: 1, role: 1 });
    
    // Drop indexes for ApiKey collection
    await db.collection('apikeys').dropIndex({ key: 1, isActive: 1 });
    await db.collection('apikeys').dropIndex({ hashedKey: 1, isActive: 1 });
  }
};