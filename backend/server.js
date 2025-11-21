const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import routes
const interviewRoutes = require('./routes/interviewRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/interview', interviewRoutes);
app.use('/api/candidates', require('./routes/candidateRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'AI Interview Assistant Backend is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  // Remove deprecated options
})
.then(() => {
  console.log('Connected to MongoDB');
  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check endpoint: http://localhost:${PORT}/health`);
  });
})
.catch((error) => {
  console.error('Database connection error:', error.message);
  console.log('Please ensure MongoDB is running or update the MONGO_URI in your .env file');
  console.log('To use MongoDB Atlas, replace the MONGO_URI with your Atlas connection string');
  console.log('To use local MongoDB, make sure MongoDB is installed and running on your machine');
  
  // Start server even without database connection for demonstration purposes
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (without database connection)`);
    console.log(`Health check endpoint: http://localhost:${PORT}/health`);
  });
});