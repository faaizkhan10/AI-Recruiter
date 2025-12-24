import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// API base URL - uses environment variable for deployment flexibility
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Results page to view interview details and candidate performance
function ResultsPage() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/interviews/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch interview details");
        }
        const data = await res.json();
        setInterview(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview results...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error || "Interview not found"}</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block text-blue-500 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="text-blue-500 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            Interview Results
          </h1>
        </div>

        {/* Interview Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {interview.jobRole}
              </h2>
              <p className="text-gray-600 mt-2">{interview.jobDescription}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                interview.status
              )}`}
            >
              {interview.status || "Pending"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-semibold">{interview.interviewType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-semibold">{interview.duration} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Score</p>
              <p className="font-semibold text-lg">
                {interview.score !== undefined ? (
                  <span className="text-blue-600">{interview.score}/100</span>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-semibold text-sm">
                {new Date(interview.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        {interview.questions && interview.questions.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Questions & Answers
            </h3>
            <div className="space-y-6">
              {interview.questions.map((question, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="mb-2">
                    <p className="text-sm text-gray-500 mb-1">
                      Question {index + 1}
                    </p>
                    <p className="font-semibold text-gray-800">{question}</p>
                  </div>
                  {interview.answers && interview.answers[index] ? (
                    <div className="mt-2 bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-500 mb-1">Answer</p>
                      <p className="text-gray-700">
                        {interview.answers[index]}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic mt-2">
                      No answer provided
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-gray-500 text-center">
              Interview questions will appear here once the interview is
              started.
            </p>
          </div>
        )}

        {/* Score Visualization */}
        {interview.score !== undefined && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Performance Score
            </h3>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-8">
                <div
                  className={`h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                    interview.score >= 70
                      ? "bg-green-500"
                      : interview.score >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${interview.score}%` }}
                >
                  {interview.score}%
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {interview.score >= 70
                    ? "Excellent Performance"
                    : interview.score >= 50
                    ? "Good Performance"
                    : "Needs Improvement"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsPage;
