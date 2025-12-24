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
