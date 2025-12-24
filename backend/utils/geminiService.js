// This file contains utility functions for interacting with the Google Gemini AI service.

// Import the Google Generative AI SDK and dotenv for environment variables.
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables from the .env file.
dotenv.config();

// Check if API key is set
if (!process.env.GEMINI_API_KEY) {
  console.error("WARNING: GEMINI_API_KEY is not set in environment variables");
}

// Fallback questions when API quota is exhausted
const FALLBACK_QUESTIONS = {
  technical: [
    "Please introduce yourself and tell us about your background and experience.",
    "Can you walk me through your experience with the technologies mentioned in this role?",
    "Describe a challenging technical problem you've solved and how you approached it.",
    "How do you stay updated with the latest developments in your field?",
    "Explain a time when you had to learn a new technology quickly for a project.",
    "What is your approach to debugging complex issues?",
  ],
  hr: [
    "Please introduce yourself and tell us about your background.",
    "Tell me about yourself and why you're interested in this position.",
    "What are your greatest strengths and how do they apply to this role?",
    "Describe a situation where you had to work under pressure.",
    "How do you handle conflicts in the workplace?",
    "Where do you see yourself in 5 years?",
  ],
};

/**
 * Gets fallback questions when API is unavailable
 * @param {string} role - The job role
 * @param {string} interviewType - Type of interview (Technical or HR)
 * @param {number} count - Number of questions needed
 * @returns {Array<string>} Array of fallback questions
 */
export const getFallbackQuestions = (role, interviewType, count) => {
  const type = interviewType?.toLowerCase() === "hr" ? "hr" : "technical";
  const questions = FALLBACK_QUESTIONS[type] || FALLBACK_QUESTIONS.technical;

  // Return requested number of questions, cycling if needed
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(questions[i % questions.length]);
  }
  return result;
};

// Initialize the Gemini AI client with the API key from environment variables.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Changed to stable model

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

    // Check for daily quota limit
    if (error.status === 429) {
      const errorMessage = error.message || "";
      const isDailyQuota =
        errorMessage.includes("GenerateRequestsPerDay") ||
        errorMessage.includes("limit: 20");

      if (isDailyQuota) {
        throw new Error(
          "Daily API quota exceeded. The free tier allows 20 requests per day. " +
            "Please wait until tomorrow or upgrade to a paid plan."
        );
      }
    }

    throw new Error("Failed to get response from Gemini API");
  }
};

/**
 * Extracts retry delay from Google API error response
 * @param {Error} error - The error object from Google API
 * @returns {number} - Delay in milliseconds, or null if not found
 */
const extractRetryDelay = (error) => {
  try {
    // Try to parse the error message for retry delay
    const message = error.message || "";
    const retryMatch = message.match(/Please retry in ([\d.]+)s/);
    if (retryMatch) {
      const seconds = parseFloat(retryMatch[1]);
      return Math.ceil(seconds * 1000); // Convert to milliseconds and round up
    }
  } catch (e) {
    // If parsing fails, return null
  }
  return null;
};

/**
 * Generates an interview question using the Gemini API.
 * @param {string} role - The job role for the question.
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<string>} The generated question text.
 */
export const generateAIQuestion = async (role, retries = 3) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!role) {
    throw new Error("Role parameter is required");
  }

  for (let i = 0; i < retries; i++) {
    try {
      const prompt = `Generate one interview question for a ${role} position. Only return the question text.`;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error(
        `Error generating question (attempt ${i + 1}/${retries}):`,
        error.message
      );

      // Check if it's a rate limit error
      if (error.status === 429) {
        const errorMessage = error.message || "";

        // Check if it's a daily quota limit (not per-minute)
        const isDailyQuota =
          errorMessage.includes("GenerateRequestsPerDay") ||
          errorMessage.includes("limit: 20");

        if (isDailyQuota) {
          // Daily quota exhausted - don't retry, just throw clear error
          throw new Error(
            "Daily API quota exceeded. The free tier allows 20 requests per day. " +
              "Please wait until tomorrow or upgrade to a paid plan. " +
              "Visit https://ai.google.dev/pricing for more information."
          );
        }

        // Per-minute rate limit - retry with delay
        if (i < retries - 1) {
          // Try to extract retry delay from Google's error message
          const retryDelay = extractRetryDelay(error);
          const delay = retryDelay || Math.pow(2, i) * 1000; // Use Google's delay or exponential backoff

          // Add a small buffer (1 second) to the delay
          const delayWithBuffer = delay + 1000;
          console.log(
            `Rate limit hit. Retrying in ${Math.ceil(
              delayWithBuffer / 1000
            )}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayWithBuffer));
        } else {
          // Max retries reached
          throw new Error(
            `Rate limit exceeded. Free tier allows 5 requests per minute. Please wait and try again. ${errorMessage}`
          );
        }
      } else {
        // Other errors
        const errorMessage = error.message || "Unknown error occurred";
        throw new Error(`Failed to generate question: ${errorMessage}`);
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

    // Check for daily quota limit
    if (error.status === 429) {
      const errorMessage = error.message || "";
      const isDailyQuota =
        errorMessage.includes("GenerateRequestsPerDay") ||
        errorMessage.includes("limit: 20");

      if (isDailyQuota) {
        throw new Error(
          "Daily API quota exceeded. The free tier allows 20 requests per day. " +
            "Please wait until tomorrow or upgrade to a paid plan."
        );
      }
    }

    throw new Error("Failed to generate content from Gemini API");
  }
};
