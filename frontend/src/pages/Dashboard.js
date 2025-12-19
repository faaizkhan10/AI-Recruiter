// Import React hooks and utilities
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// The Dashboard component serves as the main interface for recruiters.
// It allows them to create new interviews and view a list of all previously created interviews.
function Dashboard() {
  // Initial state for the form, used for resetting
  const initialFormState = {
    role: "", // Job role for the interview
    description: "", // Job description
    duration: "15", // Duration in minutes, default to 15
    type: "Technical", // Type of interview, default to 'Technical'
  };

  // State to store form data (values entered by the recruiter)
  const [form, setForm] = useState(initialFormState);

  // State to store list of created interviews fetched from backend
  const [interviews, setInterviews] = useState([]);

  // State to manage loading and success messages for better UX
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // `useEffect` hook to fetch existing interviews from the backend when the component first loads.
  // The empty dependency array `[]` ensures this effect runs only once.
  useEffect(() => {
    fetchInterviews();
  }, []);

  // Asynchronous function to load all interviews from the backend API.
  const fetchInterviews = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/interviews");
      const data = await res.json();
      setInterviews(data); // Update state with backend response
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    }
  };

  // Event handler that runs when the recruiter submits the "Create Interview" form.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior (page refresh).
    setIsLoading(true);
    setSuccessMessage("");

    try {
      // Send a POST request to the backend to create a new interview.
      const response = await fetch(
        "http://localhost:5000/api/interviews/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // The body of the request contains the form data, mapped to the keys expected by the backend.
          body: JSON.stringify({
            jobRole: form.role,
            jobDescription: form.description,
            duration: form.duration,
            interviewType: form.type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create interview");
      }

      setSuccessMessage("Interview Created Successfully!");
      setForm(initialFormState); // Reset form to initial state
      fetchInterviews(); // Refresh the list of interviews to include the new one.
    } catch (error) {
      console.error("Error creating interview:", error);
      setSuccessMessage("Failed to create interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // JSX to render the component's UI.
  return (
    <div className="bg-gray-100 font-sans text-gray-800 p-10">
      {/* Heading */}
      <h1 className="text-center text-gray-800 mb-2 text-3xl font-bold">
        Recruiter Dashboard
      </h1>
      <p className="text-center text-gray-600 mt-0">
        Create and manage AI-powered interviews.
      </p>

      <div className="max-w-lg my-8 mx-auto p-5 bg-white rounded-lg shadow-md">
        <h2 className="text-center mb-5 text-2xl font-semibold">
          Create New Interview
        </h2>
        {/* Interview Creation Form */}
        {/* The `onSubmit` event is handled by the `handleSubmit` function. */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Each input field is a "controlled component", its value is tied to the `form` state. */}
          {/* The `onChange` handler updates the state whenever the user types. */}
          <input
            className="p-2.5 rounded border border-gray-300 text-base"
            type="text"
            placeholder="Job Role"
            value={form.role}
            // Update only the 'role' field in the form state, keeping other fields unchanged.
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          />

          <textarea
            className="p-2.5 rounded border border-gray-300 text-base min-h-[80px] resize-y"
            placeholder="Job Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <select
            className="p-2.5 rounded border border-gray-300 text-base bg-white"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            required
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
          </select>

          <select
            className="p-2.5 rounded border border-gray-300 text-base bg-white"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            required
          >
            <option value="Technical">Technical</option>
            <option value="HR">HR</option>
          </select>

          {/* The submit button for the form. */}
          <button
            type="submit"
            className="p-3 rounded border-none bg-blue-500 text-white text-base cursor-pointer transition-colors hover:bg-blue-600 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Interview"}
          </button>
        </form>

        {/* Display success or error message after form submission */}
        {successMessage && (
          <p
            className={`text-center text-gray-600 mt-4 ${
              successMessage.includes("Failed")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {successMessage}
          </p>
        )}
      </div>

      {/* Divider */}
      <hr className="my-10" />

      {/* Section to display list of created interviews */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center mb-5 text-2xl font-semibold">
          Created Interviews
        </h2>

        {/* Loop through the 'interviews' state array and render a list item for each interview. */}
        <ul className="list-none p-0">
          {interviews.map((i) => (
            <li key={i._id} className="bg-white p-4 mb-2.5 rounded shadow-sm">
              <strong>{i.jobRole}</strong> - {i.interviewType} ({i.duration}{" "}
              mins)
              <br />
              <small className="text-gray-500">
                Interview Link:{" "}
                <Link
                  to={i.link.replace("http://localhost:3000", "")}
                  className="text-blue-500 no-underline"
                >
                  {i.link}
                </Link>
              </small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Export the Dashboard component to be used in other parts of the application (like App.js).
export default Dashboard;
