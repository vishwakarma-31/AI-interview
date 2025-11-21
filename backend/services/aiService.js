const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Parse resume text from PDF file
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text from PDF
 */
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Failed to parse PDF file: ' + error.message);
  }
}

/**
 * Parse resume text from DOCX file
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>} - Extracted text from DOCX
 */
async function parseDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error('Failed to parse DOCX file: ' + error.message);
  }
}

/**
 * Generate interview questions based on resume text and job role
 * @param {string} resumeText - Parsed resume text
 * @param {string} role - Job role (Frontend, Backend, etc.)
 * @returns {Promise<Array>} - Array of generated questions
 */
async function generateQuestions(resumeText, role) {
  try {
    const prompt = `Based on the following resume and job role, generate 3 custom technical interview questions (1 Easy, 1 Medium, 1 Hard) for a ${role} position.
    
Resume:
${resumeText}

Job Role: ${role}

Format your response as JSON with the following structure:
{
  "questions": [
    {
      "text": "Question text here",
      "difficulty": "Easy",
      "time": 30
    },
    {
      "text": "Question text here",
      "difficulty": "Medium",
      "time": 60
    },
    {
      "text": "Question text here",
      "difficulty": "Hard",
      "time": 120
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed.questions;
  } catch (error) {
    throw new Error('Failed to generate questions: ' + error.message);
  }
}

/**
 * Grade candidate's answer and provide feedback
 * @param {string} question - Interview question
 * @param {string} answer - Candidate's answer
 * @returns {Promise<Object>} - Score and feedback
 */
async function gradeAnswer(question, answer) {
  try {
    const prompt = `You are an expert interviewer. Grade the following answer to the interview question on a scale of 0-100 and provide constructive feedback.
    
Question: ${question}
Answer: ${answer}

Format your response as JSON with the following structure:
{
  "score": 85,
  "feedback": "Detailed feedback here"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    throw new Error('Failed to grade answer: ' + error.message);
  }
}

/**
 * Generate final interview summary
 * @param {Array} questions - Array of questions with answers and scores
 * @returns {Promise<string>} - Summary text
 */
async function generateSummary(questions) {
  try {
    const questionsText = questions.map(q => 
      `Q: ${q.text}\nA: ${q.answer}\nScore: ${q.score}/100\n`
    ).join('\n');

    const prompt = `Based on the following interview questions, answers, and scores, provide a concise summary of the candidate's performance.
    
Interview Data:
${questionsText}

Provide a professional summary that highlights the candidate's strengths and areas for improvement.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error('Failed to generate summary: ' + error.message);
  }
}

module.exports = {
  parsePDF,
  parseDOCX,
  generateQuestions,
  gradeAnswer,
  generateSummary
};