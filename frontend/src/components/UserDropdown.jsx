import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function UserDropdown({ user, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasRealName = Boolean(
    user?.name &&
      typeof user.name === "string" &&
      user.name.trim() !== "" &&
      user.name.trim().toLowerCase() !== "member"
  );

  const displayName = hasRealName ? user.name.trim() : "Account";

  const initials = hasRealName
    ? user.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : null;

  const displayPhone = user?.phone ? `+91 ${user.phone}` : "";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User account menu"
        className="flex items-center gap-2 py-1 px-2 sm:px-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer shadow-2xs group select-none text-slate-700 dark:text-slate-200"
      >
        {/* Avatar circle */}
        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-2xs shrink-0">
          {initials ? (
            <span>{initials}</span>
          ) : (
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* User Name Label (hidden on very small screens, visible on sm+) */}
        <span className="hidden sm:block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate text-left">
          {displayName}
        </span>

        {/* Chevron Icon */}
        <svg
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/50 py-1.5 z-50 transition-all animate-in fade-in zoom-in-95"
        >
          {/* Header Info Area: User Name + Phone + Role */}
          <div className="px-3.5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 rounded-t-xl mb-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                {displayName}
              </span>
              <span
                className={`text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                  user?.role === "admin"
                    ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                }`}
              >
                {user?.role === "admin" ? "Admin" : "Member"}
              </span>
            </div>

            {/* Phone Number Display */}
            {displayPhone && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span className="text-2xs">📱</span>
                <span>{displayPhone}</span>
              </div>
            )}

            {user?.referral_code && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400">
                <span>Referral Code:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {user.referral_code}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-1 space-y-0.5">
            {/* My Profile */}
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                location.pathname === "/profile"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
              }`}
            >

              <div className="flex-1 text-left">
                <span className="block font-semibold">My Profile</span>
                <span className="text-2xs text-slate-400 dark:text-slate-500 font-normal block">
                  Demographics &amp; details
                </span>
              </div>
            </Link>

            {/* Admin Operations Console shortcut if admin and currently on member side */}
            {user?.role === "admin" && !location.pathname.startsWith("/admin") && (
              <Link
                to="/admin/respondents"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-purple-100/70 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 text-xs">
                  ⚙️
                </div>
                <div className="flex-1 text-left">
                  <span className="block font-semibold">Operations Console</span>
                  <span className="text-2xs text-slate-400 dark:text-slate-500 font-normal block">
                    Respondent &amp; source management
                  </span>
                </div>
              </Link>
            )}

            {/* Member View shortcut if admin and currently in admin console */}
            {location.pathname.startsWith("/admin") && (
              <Link
                to="/dashboard"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs">
                  📋
                </div>
                <div className="flex-1 text-left">
                  <span className="block font-semibold">Member Dashboard</span>
                  <span className="text-2xs text-slate-400 dark:text-slate-500 font-normal block">
                    Active surveys &amp; rewards
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

          {/* Sign Out */}
          <div className="p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer text-left"
            >

              <span className="font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
