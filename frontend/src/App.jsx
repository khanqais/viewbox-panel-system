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
import AdminShell from "./components/AdminShell";
import AnimatedThemeSwitch from "./components/AnimatedThemeSwitch";
import UserDropdown from "./components/UserDropdown";

// Auth shell: Full top navigation with theme toggle, mobile-first responsive card container
function AuthShell({ children }) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-transparent flex flex-col text-slate-900 dark:text-slate-100">
      {/* Top Navbar with Brand and Theme Switch */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Brand & Portal Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs">
                VB
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight block">
                  ViewBox Panel
                </span>
                <span className="hidden sm:inline-block text-2xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tracking-wide">
                  Research Portal
                </span>
              </div>
            </div>

            {/* Right: Theme Switch in Top Nav */}
            <div className="flex items-center">
              <AnimatedThemeSwitch />
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-2xs text-slate-500 dark:text-slate-400">
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
    { label: "Active Studies", path: "/dashboard"},
    { label: "Referrals & Rewards", path: "/referrals"},
  ];

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Desktop Nav Links */}
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs group-hover:bg-blue-700 transition-colors">
                  VB
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight block">
                    ViewBox Panel
                  </span>
                  <span className="tracking-label text-slate-400 dark:text-slate-400 block -mt-0.5">
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
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs font-bold"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                {user.role === "admin" && (
                  <Link
                    to="/admin/respondents"
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      location.pathname.startsWith("/admin")
                        ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span>Admin</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Right: Theme Switch & User Dropdown */}
            <div className="flex items-center gap-2.5">
              <AnimatedThemeSwitch />
              <UserDropdown user={user} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-xs truncate">{item.label}</span>
              </Link>
            );
          })}
          {user.role === "admin" && (
            <Link
              to="/admin/respondents"
              className={`flex-1 py-1.5 px-2 text-center text-xs font-semibold rounded-lg transition-colors ${
                location.pathname.startsWith("/admin")
                  ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="text-xs truncate">Admin</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Responsive Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {children}
      </main>

      {/* Responsive Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">ViewBox Panel System</span>
            <span>•</span>
            <span>Concave Insights Research Network</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-400">
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
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role === "admin") {
    return <Navigate to="/admin/respondents" replace />;
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
              <AdminShell>
                <AdminRespondents />
              </AdminShell>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sources"
          element={
            <AdminRoute>
              <AdminShell>
                <AdminSources />
              </AdminShell>
            </AdminRoute>
          }
        />

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
