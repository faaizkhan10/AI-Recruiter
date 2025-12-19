import React, { useState, useRef } from "react";
import VoiceInput from "./VoiceInput";

const VoiceInputWrapper = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const voiceInputRef = useRef(null);

  const handleStart = () => {
    setIsRecording(true);
    if (voiceInputRef.current) {
      voiceInputRef.current.start();
    }
  };

  const handleStop = () => {
    setIsRecording(false);
    if (voiceInputRef.current) {
      voiceInputRef.current.stop();
    }
  };

  const handleTranscript = (transcript) => {
    setTranscript(transcript);
  };

  const handleEnd = () => {
    setIsRecording(false);
  };

  return (
    <div>
      <button onClick={isRecording ? handleStop : handleStart}>
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <VoiceInput
        ref={voiceInputRef}
        onTranscript={handleTranscript}
        onEnd={handleEnd}
      />
      <p>Transcript: {transcript}</p>
    </div>
  );
};

export default VoiceInputWrapper;
