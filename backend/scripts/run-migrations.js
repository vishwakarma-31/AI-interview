#!/usr/bin/env node

// Script to run database migrations
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { config, database } = require('./migrate-mongo-config');

async function runMigrations() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(config.mongodb.url, config.mongodb.options);
    await client.connect();
    
    console.log('Connected to MongoDB');
    
    // Run migrations
    const db = client.db();
    const migrated = await database.connect();
    const pendingMigrations = await migrated.migrations.find({}).toArray();
    
    console.log(`Found ${pendingMigrations.length} pending migrations`);
    
    // Run all pending migrations
    const result = await migrated.migrate();
    
    console.log('Migrations completed successfully');
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();