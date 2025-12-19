import { useState } from "react";
import VoiceInput from "../components/VoiceInput";

function VoiceTestPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");

  const handleFinalTranscript = (transcript) => {
    console.log("Final transcript received:", transcript);
    setFinalTranscript(
      (prev) => prev + (prev ? " | " : "") + `"${transcript}"`
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-10 font-sans">
      <h1 className="text-3xl font-bold mb-8">Voice-to-Text Test</h1>

      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Live Transcript:
          </h2>
          <p className="text-lg text-gray-600 italic min-h-[30px]">
            {liveTranscript || "..."}
          </p>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700">
            Final Transcript(s):
          </h2>
          <p className="text-lg text-green-600 font-medium min-h-[30px]">
            {finalTranscript || "..."}
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsRecording((prev) => !prev)}
            className={`border-none rounded-full w-20 h-20 text-white text-4xl cursor-pointer shadow-lg transition-all duration-300 flex justify-center items-center mx-auto ${
              isRecording ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {isRecording ? "🛑" : "🎤"}
          </button>
          <p className="mt-2.5 text-gray-600 text-sm">
            {isRecording ? "Click to Stop" : "Click to Record"}
          </p>
        </div>
      </div>

      {isRecording && (
        <VoiceInput
          onTranscript={handleFinalTranscript}
          onLiveTranscript={setLiveTranscript}
        />
      )}
    </div>
  );
}

export default VoiceTestPage;
