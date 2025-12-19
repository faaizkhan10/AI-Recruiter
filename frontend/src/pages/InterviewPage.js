import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import VoiceInput from "../components/VoiceInput";

// This component manages the entire AI interview experience for the candidate.
function InterviewPage() {
  const { id: interviewId } = useParams(); // Get interview ID from URL

  // State for interview data and flow control
  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [qaPairs, setQaPairs] = useState([]);
  const [interviewStatus, setInterviewStatus] = useState("loading"); // loading, in-progress, completed
  const [finalScore, setFinalScore] = useState(null);

  // State for UI interaction and voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(true); // Start with AI speaking
  const [liveTranscript, setLiveTranscript] = useState("");
  const voiceInputRef = useRef(null);

  // Effect 1: Fetch interview details and questions on initial load.
  useEffect(() => {
    const setupInterview = async () => {
      try {
        // 1. Fetch interview details
        const res = await fetch(
          `http://localhost:5000/api/interviews/${interviewId}`
        );
        const interviewData = await res.json();
        setInterview(interviewData);

        // 2. Generate questions for the interview
        const questionsRes = await fetch(
          "http://localhost:5000/api/interviews/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: interviewData.jobRole,
              difficulty: "medium",
              count: 5,
            }),
          }
        );
        const questionsData = await questionsRes.json();

        if (questionsData.questions && questionsData.questions.length > 0) {
          setQuestions(questionsData.questions);
          setInterviewStatus("in-progress");
        } else {
          // Handle case where no questions are returned
          setInterviewStatus("completed");
        }
      } catch (error) {
        console.error("Failed to set up interview:", error);
        setInterviewStatus("completed"); // Or an error state
      }
    };

    setupInterview();
  }, [interviewId]);

  // Effect 2: Handle the AI speaking animation when the question changes.
  useEffect(() => {
    // Only run if the interview is in progress.
    if (interviewStatus === "in-progress") {
      setAiSpeaking(true);
      setLiveTranscript(""); // Clear any previous live transcript

      // Simulate AI speaking for 2 seconds, then allow user to record.
      const timer = setTimeout(() => setAiSpeaking(false), 2000);

      // Cleanup timer if the component unmounts or the question changes again.
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, interviewStatus]);

  // Callback for when a final voice transcript is ready.
  const handleAnswer = async (transcript) => {
    if (!transcript) return; // Ignore empty transcripts.

    const newQaPair = {
      question: questions[currentQuestionIndex],
      answer: transcript,
    };

    const updatedQaPairs = [...qaPairs, newQaPair];
    setQaPairs(updatedQaPairs);

    // Move to the next question or end the interview
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question answered, end the interview and evaluate
      setInterviewStatus("completed");
      evaluateInterview(updatedQaPairs);
    }
  };

  // Function to send the completed interview for evaluation.
  const evaluateInterview = async (finalQaPairs) => {
    try {
      const res = await fetch("http://localhost:5000/api/evaluation/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, qaPairs: finalQaPairs }),
      });
      const data = await res.json();
      setFinalScore(data.score);
    } catch (error) {
      console.error("Failed to evaluate interview:", error);
    }
  };

  // --- Button Click Handlers ---

 const handleStartRecording = () => {
   setLiveTranscript(""); // Clear previous transcript
   setIsRecording(true);
   // Start recording immediately on button click
   setTimeout(() => {
     voiceInputRef.current?.start();
   }, 100); // Small delay to ensure component is rendered
 };

  const handleStopRecording = () => {
    voiceInputRef.current?.stop(); // Gracefully stop the recording
  };

  // ------------------- UI ---------------------

  // 1. Loading State
  if (interviewStatus === "loading") {
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-10 font-sans">
        <h2 className="text-2xl font-semibold text-gray-700">
          Loading Interview...
        </h2>
      </div>
    );
  }

  // 2. Completed State
  if (interviewStatus === "completed") {
    return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-10 font-sans">
        <div className="flex-1 min-w-[350px] bg-white rounded-2xl p-8 shadow-lg text-center flex flex-col justify-center min-h-[200px]">
          <h2 className="text-gray-800 mb-8 text-3xl font-bold">Thank You!</h2>
          <p className="text-lg text-gray-600 leading-relaxed flex-grow">
            Your interview is complete.
          </p>

          {finalScore !== null ? (
            <p className="text-lg text-gray-600 leading-relaxed flex-grow">
              Your final score is:{" "}
              <strong className="font-bold">{finalScore} / 100</strong>
            </p>
          ) : (
            <p className="text-lg text-gray-600 leading-relaxed flex-grow">
              Calculating your score...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-between p-10 font-sans box-border">
      {/* Header */}
      <h2 className="text-gray-800 mb-8 text-3xl font-bold">
        {interview?.jobRole} Interview ({currentQuestionIndex + 1} /{" "}
        {questions.length})
      </h2>

      {/* Main Content: AI and Candidate cards */}
      <div className="flex justify-center gap-10 w-[90%] max-w-7xl flex-wrap">
        {/* AI Interviewer Card */}
        <div className="flex-1 min-w-[350px] bg-white rounded-2xl p-8 shadow-lg text-center flex flex-col justify-between min-h-[200px] border-t-4 border-indigo-600">
          <h3 className="m-0 mb-4 text-gray-700 text-2xl font-semibold">
            🤖 AI Interviewer
          </h3>

          <p className="text-lg text-gray-600 leading-relaxed flex-grow">
            {questions.length > 0 ? questions[currentQuestionIndex] : "..."}
          </p>

          {aiSpeaking && (
            <div className="mt-5 flex justify-center items-end gap-1 h-[30px]">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className="w-1.5 h-2.5 rounded-sm bg-indigo-600 animate-wave"
                  style={{ animationDelay: `${bar * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Candidate Card */}
        <div className="flex-1 min-w-[350px] bg-white rounded-2xl p-8 shadow-lg text-center flex flex-col justify-between min-h-[200px] border-t-4 border-green-500">
          <h3 className="m-0 mb-4 text-gray-700 text-2xl font-semibold">
            👨‍💻 Your Answer
          </h3>

          {isRecording ? (
            <p className="text-lg text-gray-600 leading-relaxed flex-grow italic">
              {liveTranscript || "Listening..."}
            </p>
          ) : (
            <p className="text-lg text-gray-600 leading-relaxed flex-grow">
              {qaPairs[currentQuestionIndex]
                ? `"${qaPairs[currentQuestionIndex].answer}"`
                : "Click the mic to record your answer."}
            </p>
          )}

          {isRecording && (
            <div className="mt-5 flex justify-center items-end gap-1 h-[30px]">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div
                  key={bar}
                  className="w-1.5 h-2.5 rounded-sm bg-green-500 animate-wave"
                  style={{ animationDelay: `${bar * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Microphone Button and Controls */}
      <div className="mt-auto pt-10 text-center">
        {isRecording ? (
          <button
            onClick={handleStopRecording}
            className="bg-red-500 border-none rounded-full w-20 h-20 text-white text-4xl cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all ease-in-out duration-300 flex justify-center items-center scale-110"
          >
            🛑
          </button>
        ) : (
          <button
            onClick={handleStartRecording}
            className="bg-green-500 border-none rounded-full w-20 h-20 text-white text-4xl cursor-pointer shadow-[0_4px_15px_rgba(34,197,94,0.4)] transition-all ease-in-out duration-300 flex justify-center items-center"
            disabled={aiSpeaking} // Disable button while AI is speaking
          >
            🎤
          </button>
        )}

        {/* Conditionally render VoiceInput to control the recording lifecycle */}
        {isRecording && (
          <VoiceInput
            ref={voiceInputRef}
            onTranscript={handleAnswer}
            onLiveTranscript={setLiveTranscript}
            onEnd={() => setIsRecording(false)}
          />
        )}

        <p className="mt-2.5 text-gray-600 text-sm">
          {isRecording
            ? "Recording... Click to Stop"
            : aiSpeaking
            ? "Listen to the question..."
            : "Click to Record Answer"}
        </p>
      </div>
    </div>
  );
}

export default InterviewPage;
