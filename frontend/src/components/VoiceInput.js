import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

const VoiceInput = forwardRef(
  ({ onTranscript, onEnd, onLiveTranscript, isActive }, ref) => {
    const recognitionRef = useRef(null);
    const transcriptHandledRef = useRef(false);
    const isStartedRef = useRef(false);
    const wasStoppedManuallyRef = useRef(false);
    const accumulatedTranscriptRef = useRef(""); // Simple string that accumulates all final transcripts
    const lastSessionFinalRef = useRef(""); // Track what we last saw in current session
    const lastResultIndexRef = useRef(0); // Track which results we've already processed

      // Expose start and stop functions to the parent component
      useImperativeHandle(ref, () => ({
        start: (initialTranscript = "") => {
          console.log("VoiceInput start called", {
            hasRecognition: !!recognitionRef.current,
            isStarted: isStartedRef.current,
            initialTranscript,
          });

          if (!recognitionRef.current) {
            console.error("Recognition not initialized");
            return;
          }

          if (isStartedRef.current) {
            console.log("Recognition already started");
            return;
          }

          // Initialize accumulated transcript with previous answer if provided
          if (initialTranscript) {
            accumulatedTranscriptRef.current = initialTranscript + " "; // Add space for continuation
            console.log("Initialized with previous transcript:", initialTranscript);
          } else {
            // New recording - start fresh
            accumulatedTranscriptRef.current = "";
          }
          lastResultIndexRef.current = 0; // Reset result index for new session
          lastSessionFinalRef.current = ""; // Reset session tracker

          // Request microphone permission before starting
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
              .getUserMedia({ audio: true })
              .then(() => {
                console.log("Microphone permission granted");
                // Start recognition after permission is granted
                try {
                  wasStoppedManuallyRef.current = false;
                  lastResultIndexRef.current = 0; // Reset for new session
                  lastSessionFinalRef.current = ""; // Reset session tracker
                  transcriptHandledRef.current = false;
                  recognitionRef.current.start();
                  console.log("Recognition start() called, accumulated so far:", accumulatedTranscriptRef.current);
                } catch (error) {
                  console.error("Error starting recognition:", error);
                  // Try to reset and start again
                  isStartedRef.current = false;
                  setTimeout(() => {
                    if (recognitionRef.current && !isStartedRef.current) {
                      try {
                        recognitionRef.current.start();
                      } catch (retryError) {
                        console.error("Retry start failed:", retryError);
                      }
                    }
                  }, 500);
                }
              })
              .catch((err) => {
                console.error("Microphone permission denied:", err);
                alert(
                  "Microphone permission is required for voice recording. Please allow microphone access."
                );
              });
          } else {
            // Fallback if getUserMedia is not available
            try {
              wasStoppedManuallyRef.current = false;
              lastResultIndexRef.current = 0; // Reset for new session
              lastSessionFinalRef.current = ""; // Reset session tracker
              transcriptHandledRef.current = false;
              recognitionRef.current.start();
              console.log("Recognition start() called (no getUserMedia), accumulated:", accumulatedTranscriptRef.current);
            } catch (error) {
              console.error("Error starting recognition:", error);
            }
          }
        },
        stop: () => {
          console.log("VoiceInput stop called");

          if (!recognitionRef.current) {
            console.error("Recognition not initialized");
            return;
          }

          try {
            wasStoppedManuallyRef.current = true;
            if (isStartedRef.current) {
              recognitionRef.current.stop();
            }
            isStartedRef.current = false;

            // Process accumulated transcript when manually stopped
            const finalTranscript = accumulatedTranscriptRef.current.trim();
            console.log("Final transcript on stop:", finalTranscript);

            if (
              finalTranscript &&
              !transcriptHandledRef.current &&
              onTranscript
            ) {
              transcriptHandledRef.current = true;
              console.log("Calling onTranscript with:", finalTranscript);
              onTranscript(finalTranscript);
              // Reset accumulated transcript after processing, so next recording starts fresh
              accumulatedTranscriptRef.current = "";
              lastSessionFinalRef.current = "";
              lastResultIndexRef.current = 0;
            }
          } catch (error) {
            console.error("Error stopping recognition:", error);
          }
        },
    }));

    // Initialize speech recognition on mount
    useEffect(() => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported in this browser.");
        alert(
          "Your browser does not support speech recognition. Please use Chrome, Edge, or Safari."
        );
        if (onEnd) onEnd();
        return;
      }

      // Don't request microphone permissions automatically
      // Only request when user clicks record button
      // This prevents auto-starting the microphone

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
        // ULTRA SIMPLE APPROACH: Process only NEW results we haven't seen
        let interimText = "";

        // Process only results we haven't processed yet
        for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            // Final result - add to accumulated
            accumulatedTranscriptRef.current += transcript + " ";
            lastResultIndexRef.current = i + 1; // Mark as processed
            console.log("Added final:", transcript, "Total:", accumulatedTranscriptRef.current);
          } else {
            // Interim - show live
            interimText += transcript;
          }
        }

        // Send live updates: all accumulated + current interim
        if (onLiveTranscript) {
          const fullText = accumulatedTranscriptRef.current.trim() + (interimText ? " " + interimText : "");
          onLiveTranscript(fullText.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        isStartedRef.current = false;
        if (onEnd) onEnd();
      };

      recognition.onend = () => {
        console.log("Speech recognition ended", {
          wasStoppedManually: wasStoppedManuallyRef.current,
          isStarted: isStartedRef.current,
          accumulatedLength: accumulatedTranscriptRef.current.length,
        });

        // Update isStartedRef to false when recognition ends
        isStartedRef.current = false;

        if (!wasStoppedManuallyRef.current) {
          // Restart recognition if it ended unexpectedly (after a brief delay)
          // This handles the automatic stopping that happens after silence
          // Don't reset processedResultIndexRef - we want to continue from where we left off
          setTimeout(() => {
            if (!wasStoppedManuallyRef.current && recognitionRef.current) {
              try {
                // Reset result index when restarting (new session starts)
                lastResultIndexRef.current = 0;
                lastSessionFinalRef.current = "";
                recognitionRef.current.start();
                console.log("Auto-restarting speech recognition, keeping accumulated:", accumulatedTranscriptRef.current);
              } catch (error) {
                // If restart fails (e.g., already started), that's okay
                console.log("Recognition restart skipped:", error.message);
                // If it's a "recognition already started" error, that's fine
                if (!error.message.includes("already started")) {
                  console.error("Unexpected restart error:", error);
                }
              }
            }
          }, 300);
        } else {
          // Was stopped manually, call onEnd callback
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
