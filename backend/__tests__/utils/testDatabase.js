// Test database setup and teardown utilities
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

class TestDatabase {
  constructor() {
    this.mongoServer = null;
  }

  async setup() {
    // Create in-memory MongoDB server
    this.mongoServer = await MongoMemoryServer.create();
    const uri = this.mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Test database connected');
  }

  async teardown() {
    // Disconnect and stop the in-memory server
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
    
    console.log('Test database disconnected');
  }

  async clearCollections() {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

module.exports = TestDatabase;