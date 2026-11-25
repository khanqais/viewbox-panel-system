import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProfileOnboarding from "./pages/ProfileOnboarding";
import Dashboard from "./pages/Dashboard";
import Referrals from "./pages/Referrals";
import AdminRespondents from "./pages/AdminRespondents";
import AdminSources from "./pages/AdminSources";

// Simple Protected Route wrapper checking for stored JWT token
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Admin Route wrapper checking for admin role
function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
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
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <Referrals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/respondents"
            element={
              <AdminRoute>
                <AdminRespondents />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sources"
            element={
              <AdminRoute>
                <AdminSources />
              </AdminRoute>
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

