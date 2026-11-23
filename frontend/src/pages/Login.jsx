import { useState } from "react";
import api from "../api/client";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone");
  const [message, setMessage] = useState("");

  const sendOtp = async () => {
    try {
      const res = await api.post("/api/auth/send-otp", { phone });
      setStep("otp");
      setMessage(`Mock OTP: ${res.data.mock_otp}`);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Something went wrong");
    }
  };

  const verifyOtp = async () => {
    try {
      const res = await api.post("/api/auth/verify-otp", { phone, otp });
      localStorage.setItem("token", res.data.access_token);
      setMessage("Login successful");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Invalid OTP");
    }
  };

  return (
    <div className="login-page">
      <h1>ViewBox Panel</h1>

      {step === "phone" ? (
        <>
          <input
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={sendOtp}>Send OTP</button>
        </>
      ) : (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}

      <p>{message}</p>
    </div>
  );
}