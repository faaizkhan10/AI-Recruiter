// This file defines the Mongoose schema and model for an "Interview".
// A schema maps to a MongoDB collection and defines the shape of the documents within that collection.

import mongoose from "mongoose";

// Create a new Mongoose schema for interviews.
const interviewSchema = new mongoose.Schema(
  {
    // Define the fields for the interview document.
    jobRole: { type: String, required: true },
    jobDescription: { type: String },
    duration: { type: Number },
    // 'interviewType' must be one of the values in the 'enum' array.
    interviewType: { type: String, enum: ["HR", "Technical"], required: true },
    link: { type: String },
    questions: { type: [String] },
    answers: { type: [String] },
    score: { type: Number },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

// Create and export the Mongoose model.
// The model is a constructor compiled from the schema definition. An instance of a model is called a document.
// mongoose.model("Interview", ...) will create/use a collection named "interviews" in the database.
export default mongoose.model("Interview", interviewSchema);
