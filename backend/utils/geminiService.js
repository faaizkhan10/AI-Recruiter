// This file contains utility functions for interacting with the Google Gemini AI service.

// Import the Google Generative AI SDK and dotenv for environment variables.
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables from the .env file.
dotenv.config();

// Initialize the Gemini AI client with the API key from environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
 * @param {string} difficulty - The difficulty of the question.
 * @returns {Promise<string>} The generated question text.
 */
export const generateAIQuestion = async (role, difficulty) => {
  try {
    const prompt = `Generate one interview question for a ${role} position with ${difficulty} difficulty. Only return the question text, without any introductory phrases like "Here is a question:".`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Gemini API question generation error:", error.message);
    throw new Error("Failed to generate question from Gemini API");
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
