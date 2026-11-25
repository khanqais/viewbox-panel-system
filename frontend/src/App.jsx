import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/Login";
import ProfileOnboarding from "./pages/ProfileOnboarding";
import Dashboard from "./pages/Dashboard";
import Referrals from "./pages/Referrals";
import AdminRespondents from "./pages/AdminRespondents";
import AdminSources from "./pages/AdminSources";

// Auth shell: Mobile-first card on phones, clean centered card on desktop with panel branding
function AuthShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 text-slate-900">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {children}
      </div>
      <footer className="mt-6 text-center text-xs text-slate-400">
        Concave Insights • ViewBox Panel System v1.0
      </footer>
    </div>
  );
}

// Responsive Member Shell: Mobile-optimized with bottom/top tabs; full desktop console with navbar
function MemberShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const navItems = [
    { label: "Active Studies", path: "/dashboard", icon: "📋" },
    { label: "Referrals & Rewards", path: "/referrals", icon: "🎁" },
    { label: "My Profile", path: "/profile", icon: "👤" },
  ];

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Desktop Nav Links */}
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs group-hover:bg-blue-700 transition-colors">
                  VB
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm tracking-tight block">
                    ViewBox Panel
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block -mt-0.5">
                    Research Community
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: User Pill, Admin Shortcut & Sign Out */}
            <div className="flex items-center gap-2.5">
              {user.role === "admin" && (
                <Link
                  to="/admin/respondents"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Operations Console</span>
                  <span className="text-[10px] text-slate-400">→</span>
                </Link>
              )}

              {user.phone && (
                <div className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-medium text-slate-700 tabular-nums">
                  +91 {user.phone}
                </div>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-slate-100 bg-white px-2 py-1.5 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors flex flex-col items-center gap-0.5 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] truncate">{item.label}</span>
              </Link>
            );
          })}
          {user.role === "admin" && (
            <Link
              to="/admin/respondents"
              className="flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors flex flex-col items-center gap-0.5 text-slate-900 hover:bg-slate-50"
            >
              <span className="text-sm">⚙️</span>
              <span className="text-[11px] truncate">Admin</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Responsive Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {children}
      </main>

      {/* Responsive Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">ViewBox Panel System</span>
            <span>•</span>
            <span>Concave Insights Research Network</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Fair Research Policy</span>
            <span>DPDP Compliant</span>
            <span>3-Month Cool-off Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Protected Route wrapper checking for stored JWT token
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
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthShell>
              <Login />
            </AuthShell>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MemberShell>
                <ProfileOnboarding />
              </MemberShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MemberShell>
                <Dashboard />
              </MemberShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <ProtectedRoute>
              <MemberShell>
                <Referrals />
              </MemberShell>
            </ProtectedRoute>
          }
        />

        {/* Admin Console routes with wide full-screen layouts */}
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

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
