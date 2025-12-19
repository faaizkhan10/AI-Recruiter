// This file defines the API routes related to candidates.
// It uses Express Router to create a modular set of routes.

import express from "express";
import { evaluateAnswers } from "../controllers/evaluationController.js";

// Create a new router object.
const router = express.Router();

// Define a POST route at '/evaluate'. This will be mounted under '/api/candidates' in server.js.
router.post("/evaluate", evaluateAnswers);

export default router;
