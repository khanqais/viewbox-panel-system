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
    const refToken = searchParams.get("ref");
    const sourceSlug = searchParams.get("source");

    if (refToken) {
      localStorage.setItem("pending_ref_token", refToken);
    }
    if (sourceSlug) {
      localStorage.setItem("pending_source_slug", sourceSlug);
    }
  }, [searchParams]);

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
    <div className="flex flex-col flex-1 px-6 py-10 sm:px-8 justify-between">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-sm">
            VB
          </div>
          <span className="font-semibold text-slate-900 text-lg tracking-tight">
            ViewBox Panel
          </span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Research Portal
          </span>
        </div>

        {/* Hero Context */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            {step === "phone" ? "Sign in with phone" : "Verify code"}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {step === "phone"
              ? "Access paid consumer research studies and track your referral bonuses."
              : `Enter 6-digit code sent to +91 ${phone}`}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
            <span className="font-bold">Error:</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Phone Entry */}
        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="phone-input"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Mobile Number
              </label>
              <div className="relative flex items-center rounded-lg border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white transition-all">
                <span className="pl-3.5 pr-2.5 py-3 text-sm font-semibold text-slate-500 border-r border-slate-200 bg-slate-50 select-none rounded-l-lg">
                  +91
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-3 pr-3 py-3 text-base text-slate-900 placeholder:text-slate-400 bg-transparent outline-none tabular-nums"
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Any 10-digit number accepted for this demo.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.trim().length < 10}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Requesting code...</span>
                </>
              ) : (
                <span>Continue →</span>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Entry */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {mockOtp && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <div>
                  <span className="text-blue-700 font-medium">Demo Passcode:</span>{" "}
                  <span className="font-mono font-bold tracking-widest text-blue-900 text-sm">
                    {mockOtp}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtp(mockOtp)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="otp-input"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                >
                  6-Digit Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setErrorMsg("");
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  Change phone
                </button>
              </div>
              <input
                id="otp-input"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full px-3.5 py-3 text-center text-xl font-mono tracking-[0.5em] text-slate-900 placeholder:text-slate-300 rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all tabular-nums bg-white"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.trim().length === 0}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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

      {/* Demo Credentials Helper */}
      <div className="pt-6 mt-6 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700 flex items-center justify-between">
            <span>💡 Demo Quick Access</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">Mock OTP: 123456</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
            <span>Admin: <strong className="font-mono text-slate-800">8454803210</strong></span>
            <span>•</span>
            <span>Member: <strong className="font-mono text-slate-800">9876500001</strong> (or any 10-digit number)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
