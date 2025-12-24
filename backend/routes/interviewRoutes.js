// This file defines the API routes for interview-related actions.
// It uses Express Router to create a modular set of routes.

import express from "express";
import {
  createInterview,
  getAllInterviews,
  generateQuestion,
  getInterviewById,
  handleNextQuestion,
  deleteInterview,
} from "../controllers/interviewController.js";

// Create a new router object.
const router = express.Router();

// Define a POST route at '/create' to handle the creation of a new interview.
router.post("/create", createInterview);
// Define a GET route at '/' to fetch all existing interviews.
router.get("/", getAllInterviews);
// Define a POST route at '/generate' to handle AI question generation.
router.post("/generate", generateQuestion);
// Define a POST route to handle the progression of an interview, getting the next question.
router.post("/next", handleNextQuestion);
// Define a DELETE route to delete an interview by its ID
router.delete("/:id", deleteInterview);
// Define a GET route to fetch a single interview by its ID
router.get("/:id", getInterviewById);

export default router;
