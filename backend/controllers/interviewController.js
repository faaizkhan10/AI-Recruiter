import Interview from "../models/interviewModel.js";
import {
  generateContent,
  generateAIQuestion,
  conductInterview,
} from "../utils/geminiService.js";

export const createInterview = async (req, res) => {
  try {
    const { jobRole, jobDescription, duration, interviewType } = req.body;

    // Create a new interview instance. Mongoose assigns a unique _id by default.
    const interview = new Interview({
      jobRole,
      jobDescription,
      duration,
      interviewType,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    // Set the link using the unique _id before saving.
    interview.link = `${frontendUrl}/interview/${interview._id}`;
    // Now save the interview to the database
    await interview.save();

    res.json(interview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create interview" });
  }
};

export const getAllInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ createdAt: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    // Destructure role and difficulty from the request body
    const { role, difficulty, count = 1 } = req.body;

    const questions = [];
    // Generate 'count' number of questions
    for (let i = 0; i < count; i++) {
      // Call the Gemini service to generate a question
      const question = await generateAIQuestion(role, difficulty);
      questions.push(question);
    }

    // Send the generated questions back as a JSON response
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate question" });
  }
};

// Controller to get a single interview by its ID
export const getInterviewById = async (req, res) => {
  const mongoose = (await import("mongoose")).default;
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Interview not found" });
    }
    const interview = await Interview.findById(id);
    if (interview) {
      res.json(interview);
    } else {
      res.status(404).json({ message: "Interview not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch interview" });
  }
};

// Controller to handle getting the next question in a chat-based interview
export const handleNextQuestion = async (req, res) => {
  try {
    const { interviewId, jobRole, history, question, answer } = req.body;

    // Scenario 1: Get the first question
    if (!history || history.length === 0) {
      if (!jobRole) {
        return res
          .status(400)
          .json({ message: "jobRole is required for the first question." });
      }
      const firstQuestion = await generateAIQuestion(
        jobRole,
        "medium",
        "start the interview"
      );
      return res.json({ nextQuestion: firstQuestion });
    }

    // Combine the latest Q&A into the history format Gemini expects
    const fullHistory = [
      ...history.map((qa) => ({
        role: "user",
        parts: [{ text: `My answer is: ${qa.answer}` }],
      })),
      ...history.map((qa) => ({
        role: "model",
        parts: [{ text: qa.question }],
      })),
    ];

    // Scenario 2: Get subsequent questions
    const newMessage = `My answer is: ${answer}. What is your next question? If this is the last question, please respond with only the text "INTERVIEW_COMPLETE".`;
    const nextQuestion = await conductInterview(fullHistory, newMessage);

    if (nextQuestion.includes("INTERVIEW_COMPLETE")) {
      // Interview is over, now evaluate
      const evaluationPrompt = `You are an expert interviewer. Evaluate the following questions and answers for a job interview. Provide a final score out of 100. The score should be an integer. Do not provide any other text or explanation, only the integer score. Here are the questions and answers: ${history
        .map((pair) => `Question: ${pair.question}\nAnswer: ${pair.answer}`)
        .join("\n\n")}`;

      const scoreText = await generateContent(evaluationPrompt);
      const finalScore = parseInt(scoreText.trim(), 10);

      await Interview.findByIdAndUpdate(interviewId, {
        status: "Completed",
        score: finalScore,
      });

      return res.json({ interviewComplete: true, finalScore });
    }

    res.json({ nextQuestion });
  } catch (err) {
    console.error("Error in handleNextQuestion:", err);
    res.status(500).json({ message: "Failed to get next question" });
  }
};
