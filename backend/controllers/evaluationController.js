import Interview from "../models/interviewModel.js";
import { generateContent } from "../utils/geminiService.js";

export const evaluateAnswers = async (req, res) => {
  try {
    const { interviewId, qaPairs } = req.body;

    const prompt = `
      You are an expert interviewer. Evaluate the following questions and answers for a job interview.
      Provide a final score out of 100. The score should be an integer.
      Do not provide any other text or explanation, only the integer score.
      
      Here are the questions and answers:
      ${qaPairs
        .map((pair) => `Question: ${pair.question}\nAnswer: ${pair.answer}`)
        .join("\n\n")}
    `;

    const scoreText = await generateContent(prompt);

    const score = parseInt(scoreText.trim(), 10);

    // Update the interview document with the score, questions, and answers
    await Interview.findByIdAndUpdate(interviewId, {
      questions: qaPairs.map((p) => p.question),
      answers: qaPairs.map((p) => p.answer),
      score: score,
      status: "Completed",
    });

    res.json({ score });
  } catch (err) {
    console.error("Evaluation error:", err);
    res.status(500).json({ message: "Failed to evaluate answers" });
  }
};
