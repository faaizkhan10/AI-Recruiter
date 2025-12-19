// Import necessary packages
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import local modules
import connectDB from "./config/db.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import candidatesRoutes from "./routes/candidatesRoutes.js";

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app = express();

// Middleware
// Enable Express to parse JSON request bodies
app.use(express.json());
// Enable Cross-Origin Resource Sharing (CORS) to allow frontend to communicate with the backend
app.use(cors());

// Connect DB
// Establish a connection to the MongoDB database
connectDB();

// Routes
// Mount the interview-related routes under the '/api/interviews' path
app.use("/api/interviews", interviewRoutes);
// Mount the candidate-related routes under the '/api/candidates' path
app.use("/api/candidates", candidatesRoutes);

// Define a root endpoint for health checks
app.get("/", (req, res) => {
  res.send("AI Recruiter Backend Running ✅");
});

// Define the port for the server to listen on
const PORT = process.env.PORT || 5000;

// Start the server and listen for incoming requests
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
