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

  // Store referral or source token from query params if present
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
      setOtp(receivedOtp); // Pre-fill mock OTP for smooth testing experience
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
      setErrorMsg("Please enter the OTP");
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

      // Check if user has an existing profile
      try {
        const profileRes = await api.get("/api/members/me");
        if (profileRes.data.has_profile) {
          navigate("/dashboard");
        } else {
          navigate("/profile");
        }
      } catch {
        // If checking profile fails, default to profile onboarding
        navigate("/profile");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg
          : "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📊</div>
        <h1 style={{ margin: "0 0 6px", fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
          ViewBox Club
        </h1>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Consumer Research & Insights Panel
        </p>
      </div>

      {/* Main Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 16px" }}>
          {step === "phone" ? "Enter Mobile Number" : "Verify OTP"}
        </h2>

        {errorMsg && <div className="banner-error">{errorMsg}</div>}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp}>
            <div className="input-group">
              <label className="input-label" htmlFor="phone-input">
                Phone Number
              </label>
              <input
                id="phone-input"
                className="input-field"
                type="tel"
                placeholder="e.g. 9876543210"
                maxLength={13}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                We'll send a 6-digit verification code.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || phone.trim().length < 10}
            >
              {loading ? "Sending..." : "Get OTP →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            {mockOtp && (
              <div className="banner-info" style={{ justifyContent: "space-between" }}>
                <span>
                  Demo OTP: <strong>{mockOtp}</strong> (any OTP accepted)
                </span>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                  onClick={() => setOtp(mockOtp)}
                >
                  Use OTP
                </button>
              </div>
            )}

            <div className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="input-label" htmlFor="otp-input">
                  6-Digit OTP
                </label>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => {
                    setStep("phone");
                    setErrorMsg("");
                  }}
                >
                  Change ({phone})
                </button>
              </div>
              <input
                id="otp-input"
                className="input-field"
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
                style={{ textAlign: "center", fontSize: "1.25rem", letterSpacing: "4px", fontWeight: 700 }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !otp.trim()}
            >
              {loading ? "Verifying..." : "Verify & Continue →"}
            </button>
          </form>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: "auto", paddingTop: 24, textAlign: "center" }}>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Strict 15-day study cycles • Referral rewards upon survey completion
        </p>
      </div>
    </div>
  );
}
