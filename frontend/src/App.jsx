import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";

// Simple Protected Route wrapper checking for stored JWT token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Placeholder for upcoming Member Profile page (Feature 2)
function ProfilePlaceholder() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h2>Complete Your Profile</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Welcome, {user.phone || "Member"}! Profile onboarding form will load here in Feature 2.
      </p>
      <button
        className="btn btn-secondary"
        style={{ marginTop: 16 }}
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

// Placeholder for upcoming Member Dashboard (Feature 4)
function DashboardPlaceholder() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h2>Respondent Dashboard</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Welcome back, {user.name || user.phone}! Live surveys and referral status will appear here.
      </p>
      <button
        className="btn btn-secondary"
        style={{ marginTop: 16 }}
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
      >
        Sign Out
      </button>
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
                <ProfilePlaceholder />
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
