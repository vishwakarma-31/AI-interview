# AI Interview Assistant

AI Interview Assistant is a full-stack web application that streamlines the technical interview process by leveraging artificial intelligence to generate custom questions, grade responses, and provide detailed candidate assessments.

## Features

- **AI-Powered Interview Questions**: Generates custom technical questions based on candidate resumes and job roles
- **Real-time Answer Grading**: Provides instant feedback and scoring for candidate responses
- **Resume Parsing**: Automatically extracts information from PDF and DOCX resumes
- **Interactive Interview Interface**: Clean, responsive UI for conducting interviews
- **Candidate Management Dashboard**: View and manage all interview sessions
- **Persistent Storage**: All data stored in MongoDB for future reference

## Tech Stack

### Frontend
- React 18
- Redux Toolkit for state management
- Ant Design for UI components
- Vite for build tooling

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- OpenAI API for AI capabilities
- PDF and DOCX parsing libraries

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-interview
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. Create environment files:
   
   Create a `.env` file in the `backend` directory with the following content:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ai-interview
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Create a `.env` file in the root directory with the following content:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```

## Running the Application

### Development Mode

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
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

## API Endpoints

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
  "candidate": { /* candidate object */ },
  "session": { /* session object */ }
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
    "question": { /* question object */ }
  }
}
```

OR (when interview is completed):

```json
{
  "message": "Interview completed",
  "finalScore": 85,
  "summary": "Candidate performed well...",
  "questions": [ /* array of questions with scores */ ]
}
```

#### POST `/api/interview/submit`
Finalize the interview

**Request:**
- Body (JSON):
  - `sessionId` (string, required): Interview session ID

**Response:**
```json
{
  "message": "Interview finalized",
  "session": { /* session object */ }
}
```

### Candidate Routes

#### GET `/api/candidates`
Get all candidates with their interview sessions

**Response:**
```json
{
  "candidates": [ /* array of candidates with sessions */ ]
}
```

## Services

### AI Service
The AI service integrates with OpenAI to provide:
- Resume parsing (PDF/DOCX)
- Custom question generation based on resume and role
- Answer grading with feedback
- Final interview summary generation

### Database Models
- **Candidate**: Stores candidate information
- **InterviewSession**: Stores interview session data including questions, answers, and scores

## Project Structure

```
ai-interview/
├── backend/           # Backend API server
│   ├── controllers/   # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic and AI integration
│   └── server.js      # Main server entry point
├── src/               # Frontend React application
│   ├── app/           # Redux store configuration
│   ├── components/    # Reusable UI components
│   ├── features/      # Feature-specific modules
│   ├── services/      # API service clients
│   ├── App.jsx        # Main application component
│   └── main.jsx       # Application entry point
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Multi-container Docker setup
└── vercel.json        # Vercel deployment configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.