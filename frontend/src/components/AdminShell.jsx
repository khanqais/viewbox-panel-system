import { Link, useLocation, useNavigate } from "react-router-dom";
import AnimatedThemeSwitch from "./AnimatedThemeSwitch";
import UserDropdown from "./UserDropdown";

export default function AdminShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const adminNavItems = [
    { label: "Respondents", path: "/admin/respondents" },
    { label: "Source Funnels", path: "/admin/sources" },
  ];

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col text-slate-900 dark:text-slate-100">
      {/* Top Console Navigation Bar */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Desktop Nav Links */}
            <div className="flex items-center gap-6 sm:gap-8">
              <Link to="/admin/respondents" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs group-hover:bg-blue-700 transition-colors">
                  VB
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight block">
                      ViewBox Console
                    </span>
                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                      Admin
                    </span>
                  </div>
                  <span className="tracking-label text-slate-400 dark:text-slate-400 block -mt-0.5">
                    Panel Operations
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1.5" aria-label="Admin Navigation">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mr-1 select-none">
                  Admin
                </span>
                {adminNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Theme Switch & User Dropdown */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <AnimatedThemeSwitch />
              <UserDropdown user={user} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>

        {/* Mobile Admin Navigation Bar */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2 py-2 flex items-center justify-around">
          {adminNavItems.map((item) => {
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
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        {children}
      </main>
    </div>
  );
}
