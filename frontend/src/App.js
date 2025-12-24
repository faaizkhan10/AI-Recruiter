// This is the main App component that sets up the routing for the application.

// Import components for different pages

import Dashboard from "./pages/Dashboard";
import InterviewPage from "./pages/InterviewPage";
import VoiceTestPage from "./pages/VoiceTestPage";
import ResultsPage from "./pages/ResultsPage";

// Import routing utilities from react-router-dom
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    // Router component to enable client-side routing
    <Router>
      {/* Routes component to define the different routes */}
      <Routes>
        {/* Route for the recruiter dashboard, which is the home page */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Temporarily add a route for testing voice input */}
        <Route path="/voice-test" element={<VoiceTestPage />} />
        {/* Route for the AI interview page, which uses a dynamic ID in the URL */}
        <Route path="/interview/:id" element={<InterviewPage />} />
        {/* Route for viewing interview results */}
        <Route path="/results/:id" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
