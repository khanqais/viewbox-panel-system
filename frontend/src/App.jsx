import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProfileOnboarding from "./pages/ProfileOnboarding";

// Simple Protected Route wrapper checking for stored JWT token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Placeholder for upcoming Member Dashboard (Feature 3 & 4)
function DashboardPlaceholder() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h2>Respondent Dashboard</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Welcome back, {user.name || user.phone}!
      </p>
      <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
        <a href="/profile" className="btn btn-secondary">
          Edit Profile
        </a>
        <button
          className="btn btn-secondary"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-viewport">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
              </ProtectedRoute>
            }
          />
          {/* Default redirect to login or dashboard */}
          <Route
            path="*"
            element={
              localStorage.getItem("token") ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

