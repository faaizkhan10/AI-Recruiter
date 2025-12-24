// This file contains utility functions for interacting with the Google Gemini AI service.

// Import the Google Generative AI SDK and dotenv for environment variables.
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables from the .env file.
dotenv.config();

// Initialize the Gemini AI client with the API key from environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Change from "gemini-2.5-flash"

/**
 * Conducts a chat-based interview session with the Gemini API.
 * @param {Array<Object>} history - The chat history. Each object should have 'role' and 'parts'.
 * @param {string} newMessage - The latest message to send to the model.
 * @returns {Promise<string>} The text response from the model.
 */
export const conductInterview = async (history, newMessage) => {
  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(newMessage);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API error:", error.message);
    throw new Error("Failed to get response from Gemini API");
  }
};

/**
 * Generates an interview question using the Gemini API.
 * @param {string} role - The job role for the question.
 * @returns {Promise<string>} The generated question text.
 */
export const generateAIQuestion = async (role, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const prompt = `Generate one interview question for a ${role} position. Only return the question text.`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Generates content from a prompt using the Gemini API.
 * @param {string} prompt - The prompt to send to the model.
 * @returns {Promise<string>} The text response from the model.
 */
export const generateContent = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API content generation error:", error.message);
    throw new Error("Failed to generate content from Gemini API");
  }
};

/**
 * Returns fallback questions when API quota is exceeded.
 * @param {string} jobRole - The job role for the interview.
 * @param {string} interviewType - The type of interview (technical, behavioral, etc.).
 * @param {number} count - Number of questions to generate.
 * @returns {Array<string>} Array of fallback questions.
 */
export const getFallbackQuestions = (jobRole, interviewType, count) => {
  // Predefined fallback questions organized by role and type
  const fallbackLibrary = {
    technical: {
      "Software Engineer": [
        "Can you explain the difference between var, let, and const in JavaScript?",
        "What is the purpose of the 'this' keyword in JavaScript?",
        "How does event bubbling work in the DOM?",
        "What are closures in JavaScript and why are they useful?",
        "Explain the concept of asynchronous programming in JavaScript.",
        "What is the difference between == and === in JavaScript?",
        "How do you handle errors in JavaScript?",
        "What are promises and how do they work?",
        "Explain the concept of hoisting in JavaScript.",
        "What is the difference between function declarations and function expressions?"
      ],
      "Frontend Developer": [
        "What is the difference between HTML, CSS, and JavaScript?",
        "How do you optimize website performance?",
        "What are CSS preprocessors and why would you use them?",
        "Explain the box model in CSS.",
        "How do you handle responsive design?",
        "What is the virtual DOM in React?",
        "How do you manage state in a React application?",
        "What are hooks in React and how do they work?",
        "Explain the difference between class components and functional components.",
        "How do you handle form validation in React?"
      ],
      "Backend Developer": [
        "What is REST and how does it work?",
        "Explain the difference between SQL and NoSQL databases.",
        "How do you handle authentication and authorization?",
        "What are APIs and how do you design them?",
        "Explain the concept of middleware in web development.",
        "How do you handle database connections?",
        "What is the difference between synchronous and asynchronous operations?",
        "How do you implement error handling in APIs?",
        "What are design patterns and why are they important?",
        "How do you optimize database queries?"
      ]
    },
    behavioral: {
      "Software Engineer": [
        "Tell me about a challenging problem you solved.",
        "How do you handle tight deadlines?",
        "Describe a time when you had to learn a new technology quickly.",
        "How do you approach debugging a complex issue?",
        "Tell me about a time you received constructive criticism.",
        "How do you prioritize your tasks when everything seems urgent?",
        "Describe a situation where you had to work with a difficult team member.",
        "How do you stay updated with technology trends?",
        "Tell me about a project you are particularly proud of.",
        "How do you handle failure or setbacks?"
      ]
    }
  };

  // Normalize job role for lookup
  const normalizedRole = jobRole.toLowerCase();
  let roleKey = "Software Engineer"; // default

  if (normalizedRole.includes("frontend") || normalizedRole.includes("front-end")) {
    roleKey = "Frontend Developer";
  } else if (normalizedRole.includes("backend") || normalizedRole.includes("back-end")) {
    roleKey = "Backend Developer";
  }

  // Get questions based on interview type
  const typeKey = interviewType.toLowerCase().includes("behavioral") ? "behavioral" : "technical";
  const questions = fallbackLibrary[typeKey]?.[roleKey] || fallbackLibrary.technical["Software Engineer"];

  // Return requested number of questions, cycling if needed
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(questions[i % questions.length]);
  }

  return result;
};
