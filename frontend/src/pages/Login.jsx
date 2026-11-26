import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [mockOtp, setMockOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (token) {
      if (storedUser.role === "admin") {
        navigate("/admin/respondents", { replace: true });
        return;
      } else {
        navigate("/dashboard", { replace: true });
        return;
      }
    }

    const refToken = searchParams.get("ref");
    const sourceSlug = searchParams.get("source");

    if (refToken) {
      localStorage.setItem("pending_ref_token", refToken);
    }
    if (sourceSlug) {
      localStorage.setItem("pending_source_slug", sourceSlug);
    }
  }, [searchParams, navigate]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim();

    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("/api/auth/send-otp", { phone: cleanPhone });
      setStep("otp");
      const receivedOtp = res.data.mock_otp || "123456";
      setMockOtp(receivedOtp);
      setOtp(receivedOtp);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg
          : "Failed to send OTP. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setErrorMsg("Please enter the verification code");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post("/api/auth/verify-otp", {
        phone: cleanPhone,
        otp: cleanOtp,
      });

      const { access_token, user } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user?.role === "admin") {
        navigate("/admin/respondents", { replace: true });
        return;
      }

      try {
        const profileRes = await api.get("/api/members/me");
        if (profileRes.data.has_profile) {
          navigate("/dashboard");
        } else {
          navigate("/profile");
        }
      } catch {
        navigate("/profile");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg
          : "Invalid verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-5 sm:p-7 justify-between">
      <div>
        {/* Step context & status badge */}
        <div className="mb-6">
          {step === "phone" ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-2xs font-semibold mb-3 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                Verified Respondent Portal
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Sign in with mobile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Access paid consumer studies, live research opportunities, and track your referral rewards.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setErrorMsg("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-3 cursor-pointer group"
              >
                <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                <span>Change mobile number</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Verify Passcode
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Enter the 6-digit verification code sent to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  +91 {phone}
                </span>
              </p>
            </>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-start gap-2.5">
            <span className="font-bold shrink-0">Error:</span>
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Phone Entry */}
        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="phone-input"
                className="block tracking-label text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Mobile Number
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus-within:border-blue-600 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950/50 transition-all overflow-hidden">
                <span className="pl-3.5 pr-2.5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 select-none">
                  +91
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-3.5 pr-3.5 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent outline-none tabular-nums font-mono"
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-2xs sm:text-xs text-slate-400 dark:text-slate-500">
                Any valid 10-digit number accepted for this demo.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.trim().length < 10}
              className="w-full h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Requesting code...</span>
                </>
              ) : (
                <span>Continue to Verification →</span>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Entry */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {mockOtp && (
              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Demo Code:</span>{" "}
                  <span className="font-mono font-bold tracking-widest text-blue-900 dark:text-blue-100 text-sm">
                    {mockOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(mockOtp)}
                  className="text-2xs font-semibold px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="otp-input"
                  className="block tracking-label text-slate-700 dark:text-slate-300"
                >
                  6-Digit Passcode
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setOtp("");
                    handleSendOtp();
                  }}
                  disabled={loading}
                  className="text-2xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  Resend code
                </button>
              </div>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full h-14 px-3.5 py-3 text-center text-2xl font-mono tracking-[0.4em] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/50 outline-none transition-all tabular-nums"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length === 0}
              className="w-full h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Continue →</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Demo Quick Access - touch friendly buttons */}
      <div className="pt-5 mt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between text-2xs uppercase tracking-wider">
            <span>💡 Demo Quick Access</span>
            <span className="font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-2xs">
              Passcode: 123456
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setPhone("8454803210");
                setErrorMsg("");
                if (step === "otp") setStep("phone");
              }}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-left transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="text-2xs text-slate-500 dark:text-slate-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Admin Portal
              </div>
              <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">
                8454803210
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setPhone("9876500001");
                setErrorMsg("");
                if (step === "otp") setStep("phone");
              }}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-left transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="text-2xs text-slate-500 dark:text-slate-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Respondent
              </div>
              <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">
                9876500001
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
