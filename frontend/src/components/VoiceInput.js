import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const VoiceInput = forwardRef(
  ({ onTranscript, onEnd, onLiveTranscript, isActive }, ref) => {
    const recognitionRef = useRef(null);
    const transcriptHandledRef = useRef(false);
    const isStartedRef = useRef(false);
    const wasStoppedManuallyRef = useRef(false);

    // Expose start and stop functions to the parent component
    useImperativeHandle(ref, () => ({
      start: () => {
        if (recognitionRef.current && !isStartedRef.current) {
          try {
            wasStoppedManuallyRef.current = false;
            recognitionRef.current.start();
            isStartedRef.current = true;
            transcriptHandledRef.current = false;
          } catch (error) {
            console.error("Error starting recognition:", error);
          }
        }
      },
      stop: () => {
        if (recognitionRef.current && isStartedRef.current) {
          try {
            wasStoppedManuallyRef.current = true;
            recognitionRef.current.stop();
            isStartedRef.current = false;
          } catch (error) {
            console.error("Error stopping recognition:", error);
          }
        }
      },
    }));

    // Initialize speech recognition on mount
    useEffect(() => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported in this browser.");
        if (onEnd) onEnd();
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Speech recognition started");
        isStartedRef.current = true;
      };

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;

        // Send live transcript updates
        if (onLiveTranscript) {
          onLiveTranscript(transcript);
        }

        // Handle final transcript
        if (result.isFinal && !transcriptHandledRef.current) {
          transcriptHandledRef.current = true;
          console.log("Final transcript:", transcript.trim());
          if (onTranscript) {
            onTranscript(transcript.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        isStartedRef.current = false;
        if (onEnd) onEnd();
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        if (isStartedRef.current && !wasStoppedManuallyRef.current) {
          // Restart recognition if it ended unexpectedly
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error("Error restarting recognition:", error);
            isStartedRef.current = false;
            if (onEnd) onEnd();
          }
        } else {
          isStartedRef.current = false;
          if (onEnd) onEnd();
        }
      };

      // Cleanup on unmount
      return () => {
        if (recognitionRef.current && isStartedRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.error("Cleanup error:", error);
          }
        }
      };
    }, [onTranscript, onEnd, onLiveTranscript]);

    return null;
  }
);

VoiceInput.displayName = "VoiceInput";

export default VoiceInput;
