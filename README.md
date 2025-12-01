# AI Interview Assistant

AI Interview Assistant is a full-stack web application that streamlines the technical interview process by leveraging artificial intelligence to generate custom questions, grade responses, and provide detailed candidate assessments.

## Features

- **AI-Powered Interview Questions**: Generates custom technical questions based on candidate resumes and job roles
- **Real-time Answer Grading**: Provides instant feedback and scoring for candidate responses
- **Resume Parsing**: Automatically extracts information from PDF and DOCX resumes
- **Interactive Interview Interface**: Clean, responsive UI for conducting interviews
- **Candidate Management Dashboard**: View and manage all interview sessions
- **Persistent Storage**: All data stored in MongoDB for future reference
- **Multi-language Support**: Internationalization support for global teams
- **Security Features**: CSRF protection, rate limiting, input sanitization
- **Session Management**: Redis-backed session storage with concurrent session control
- **API Key Authentication**: Secure API access with key management
- **File Upload Security**: Secure resume upload with validation and sanitization

## Tech Stack

### Frontend

- React 18 with TypeScript
- Ant Design for UI components
- Vite for build tooling
- React Router for navigation
- Redux Toolkit for state management
- Storybook for component development

### Backend

- Node.js with Express.js
- MongoDB with Mongoose ODM
- Redis for session storage
- OpenAI API for AI capabilities
- PDF and DOCX parsing libraries
- BullMQ for job queueing
- JWT for authentication
- Helmet for security headers
- Winston for logging

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.18.2 (use `.nvmrc` file to set the correct version)
- **npm**: v9.x or higher
- **MongoDB**: v5.0 or higher (local instance or MongoDB Atlas)
- **Redis**: v6.x or higher
- **OpenAI API key**: Required for AI features

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB
- **Disk Space**: Minimum 2GB free space
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+, CentOS 8+)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ai-interview
   ```

2. Set Node.js version using nvm (recommended):

   ```bash
   nvm use
   ```

3. Install frontend dependencies:

   ```bash
   npm install
   ```

4. Install backend dependencies:

   ```bash
   cd backend
   npm install
   cd ..
   ```

5. Create environment files:

   Create a `.env` file in the `backend` directory with the following content:

   ```env
   # Server Configuration
   PORT=5000
   SSL_PORT=5443

   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/ai-interview

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Session Configuration
   SESSION_SECRET=your-session-secret-here

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # JWT Configuration
   JWT_SECRET=your-jwt-secret-here
   JWT_REFRESH_SECRET=your-jwt-refresh-secret-here

   # Encryption Configuration
   ENCRYPTION_KEY=your-encryption-key-here

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173

   # AWS Configuration (optional)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   ```

   Create a `.env` file in the root directory with the following content:

   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

## Running the Application

### Development Mode

1. Start MongoDB and Redis services:

   ```bash
   # For MongoDB (if running locally)
   mongod

   # For Redis (if running locally)
   redis-server
   ```

2. Start the backend server:

   ```bash
   cd backend
   npm run dev
   ```

3. In a separate terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Production Mode

1. Build the frontend:

   ```bash
   npm run build
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

### Using Docker (Recommended)

```bash
docker-compose up
```

This will start all required services (backend, MongoDB, Redis) in separate containers.

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`

Register a new user

**Request:**

- Body (JSON):
  - `email` (string, required): User email
  - `password` (string, required): User password
  - `name` (string, required): User name

#### POST `/api/auth/login`

Login user

**Request:**

- Body (JSON):
  - `email` (string, required): User email
  - `password` (string, required): User password

#### POST `/api/auth/refresh`

Refresh access token

#### POST `/api/auth/logout`

Logout user

### Interview Routes

#### POST `/api/interview/start`

Start a new interview session

**Request:**

- Form Data:
  - `name` (string, required): Candidate's name
  - `email` (string, required): Candidate's email
  - `phone` (string, required): Candidate's phone number
  - `role` (string, required): Job role (Frontend, Backend)
  - `resume` (file, optional): Resume file (PDF or DOCX)

**Response:**

```json
{
  "message": "Interview started successfully",
  "candidate": {
    /* candidate object */
  },
  "session": {
    /* session object */
  }
}
```

#### POST `/api/interview/answer`

Submit an answer and get the next question

**Request:**

- Body (JSON):
  - `sessionId` (string, required): Interview session ID
  - `answerText` (string, required): Candidate's answer

**Response:**

```json
{
  "message": "Answer submitted successfully",
  "nextQuestion": {
    "index": 1,
    "question": {
      /* question object */
    }
  }
}
```

OR (when interview is completed):

```json
{
  "message": "Interview completed",
  "finalScore": 85,
  "summary": "Candidate performed well...",
  "questions": [
    /* array of questions with scores */
  ]
}
```

#### PATCH `/api/interview/:id`

Finalize the interview

**Request:**

- URL Parameter:
  - `id` (string, required): Interview session ID

**Response:**

```json
{
  "message": "Interview finalized",
  "session": {
    /* session object */
  }
}
```

### Candidate Routes

#### GET `/api/candidates`

Get all candidates with their interview sessions

**Response:**

```json
{
  "candidates": [
    /* array of candidates with sessions */
  ]
}
```

#### GET `/api/candidates/:id`

Get specific candidate with interview sessions

#### DELETE `/api/candidates/:id/data`

Delete candidate's personal data (GDPR compliance)

### API Key Routes

#### POST `/api/api-keys`

Generate a new API key

#### GET `/api/api-keys`

Get all API keys

#### DELETE `/api/api-keys/:id`

Revoke an API key

### Organization Routes

#### GET `/api/organization`

Get organization settings

#### PUT `/api/organization`

Update organization settings

### Scheduling Routes

#### POST `/api/schedule/interview`

Schedule an interview

#### GET `/api/schedule/availability`

Get interviewer availability

#### GET `/api/schedule/timezones`

Get supported timezones

## Services

### AI Service

The AI service integrates with OpenAI to provide:

- Resume parsing (PDF/DOCX)
- Custom question generation based on resume and role
- Answer grading with feedback
- Final interview summary generation
- Question difficulty adjustment based on candidate performance

### Database Models

- **Candidate**: Stores candidate information
- **InterviewSession**: Stores interview session data including questions, answers, and scores
- **User**: Stores application users
- **Organization**: Stores organization settings
- **ApiKey**: Stores API keys for authentication

## Project Structure

```
ai-interview/
├── backend/              # Backend API server
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic and AI integration
│   ├── utils/            # Utility functions
│   ├── validation/       # Input validation
│   └── server.js         # Main server entry point
├── src/                  # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── features/         # Feature-specific modules
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service clients
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── .storybook/           # Storybook configuration
├── e2e/                  # End-to-end tests
├── scripts/              # Utility scripts
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Multi-container Docker setup
└── vercel.json           # Vercel deployment configuration
```

## Common Setup Errors & Troubleshooting

### 1. MongoDB Connection Error

**Error**: `MongoNetworkError: failed to connect to server`
**Solution**:

- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env file
- Verify MongoDB version compatibility

### 2. Redis Connection Error

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`
**Solution**:

- Ensure Redis is running: `redis-server`
- Check Redis configuration in .env file

### 3. OpenAI API Key Error

**Error**: `401 Unauthorized: Invalid API key`
**Solution**:

- Verify OPENAI_API_KEY in .env file
- Ensure API key has proper permissions

### 4. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use`
**Solution**:

- Change PORT in .env file
- Kill processes using the port: `lsof -i :5000` then `kill -9 <PID>`

### 5. Node.js Version Mismatch

**Error**: Various syntax or module errors
**Solution**:

- Use nvm to set correct Node.js version: `nvm use`
- Check .nvmrc file for required version

## Testing

### Unit Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
npm test
```

### End-to-End Tests

```bash
npx playwright test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
< ! - -   D e p l o y m e n t   t r i g g e r   c o m m e n t   - - > 
 
 
