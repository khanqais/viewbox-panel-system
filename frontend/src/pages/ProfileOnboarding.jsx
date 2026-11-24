import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const INTEREST_OPTIONS = [
  "Technology & Gadgets",
  "Finance & Investing",
  "Fashion & Apparel",
  "Health & Wellness",
  "Food & Dining",
  "Travel & Tourism",
  "Gaming & Esports",
  "Automobiles & EV",
  "Entertainment & OTT",
  "Online Shopping",
];

const CITY_OPTIONS = [
  "Mumbai",
  "Delhi NCR",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Lucknow",
  "Other",
];

const INCOME_OPTIONS = [
  "Under ₹3 Lakhs",
  "₹3 - ₹5 Lakhs",
  "₹5 - ₹10 Lakhs",
  "₹10 - ₹20 Lakhs",
  "₹20 Lakhs+",
];

export default function ProfileOnboarding() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [interests, setInterests] = useState([]);
  const [fallbackSourceId, setFallbackSourceId] = useState("");

  const [sourcesList, setSourcesList] = useState([]);
  const [pendingRef, setPendingRef] = useState("");
  const [pendingSource, setPendingSource] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetchingSources, setFetchingSources] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Retrieve pending source or referral token
    const refToken = localStorage.getItem("pending_ref_token");
    const srcSlug = localStorage.getItem("pending_source_slug");
    if (refToken) setPendingRef(refToken);
    if (srcSlug) setPendingSource(srcSlug);

    // Fetch existing profile if editing, or fetch source list for fallback
    const initData = async () => {
      setFetchingSources(true);
      try {
        const [meRes, sourcesRes] = await Promise.allSettled([
          api.get("/api/members/me"),
          api.get("/api/sources"),
        ]);

        if (meRes.status === "fulfilled" && meRes.value.data.has_profile) {
          const p = meRes.value.data.profile;
          setName(meRes.value.data.name || "");
          setDateOfBirth(p.date_of_birth || "");
          setGender(p.gender || "");
          setCity(p.city || "");
          setIncomeRange(p.income_range || "");
          setInterests(p.interests || []);
        }

        if (sourcesRes.status === "fulfilled") {
          setSourcesList(sourcesRes.value.data || []);
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setFetchingSources(false);
      }
    };

    initData();
  }, [navigate]);

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Form validations
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Please enter your full name (at least 2 characters)");
      return;
    }
    if (!dateOfBirth) {
      setErrorMsg("Please select your date of birth");
      return;
    }

    // Age validation
    const birthYear = new Date(dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age < 15 || age > 95) {
      setErrorMsg("Please enter a valid date of birth (must be at least 15 years old)");
      return;
    }

    if (!gender) {
      setErrorMsg("Please select your gender");
      return;
    }
    if (!city) {
      setErrorMsg("Please select your city");
      return;
    }
    if (!incomeRange) {
      setErrorMsg("Please select your annual household income range");
      return;
    }
    if (interests.length === 0) {
      setErrorMsg("Please select at least 1 interest to match surveys");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        date_of_birth: dateOfBirth,
        gender,
        city,
        income_range: incomeRange,
        interests,
        source_slug: pendingSource || null,
        referral_token: pendingRef || null,
        fallback_source_id: fallbackSourceId ? parseInt(fallbackSourceId, 10) : null,
      };

      const res = await api.post("/api/members/profile", payload);

      // Clean up pending tokens after successful attribution
      localStorage.removeItem("pending_ref_token");
      localStorage.removeItem("pending_source_slug");

      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      navigate("/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg
          : "Failed to save profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px 20px 48px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: "left" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Member Profile
        </h1>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          Required once to verify eligibility for paid consumer surveys.
        </p>
      </div>

      {/* Attribution tags if arriving via link */}
      {pendingRef && (
        <div className="banner-info">
          🎁 You're joining via referral link (<strong>Code: {pendingRef}</strong>).
        </div>
      )}
      {pendingSource && !pendingRef && (
        <div className="banner-info">
          📍 Joining via invite campaign (<strong>{pendingSource}</strong>).
        </div>
      )}

      {errorMsg && <div className="banner-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="input-group">
          <label className="input-label" htmlFor="name">
            Full Name *
          </label>
          <input
            id="name"
            className="input-field"
            type="text"
            placeholder="e.g. Priya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Date of Birth & Gender Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="input-group">
            <label className="input-label" htmlFor="dob">
              Date of Birth *
            </label>
            <input
              id="dob"
              className="input-field"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="gender">
              Gender *
            </label>
            <select
              id="gender"
              className="input-field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-Binary">Non-Binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* City & Household Income */}
        <div className="input-group">
          <label className="input-label" htmlFor="city">
            City of Residence *
          </label>
          <select
            id="city"
            className="input-field"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Select your city</option>
            {CITY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="income">
            Annual Household Income *
          </label>
          <select
            id="income"
            className="input-field"
            value={incomeRange}
            onChange={(e) => setIncomeRange(e.target.value)}
          >
            <option value="">Select income range</option>
            {INCOME_OPTIONS.map((inc) => (
              <option key={inc} value={inc}>
                {inc}
              </option>
            ))}
          </select>
        </div>

        {/* Interests (Multiple Selection) */}
        <div className="input-group">
          <label className="input-label">
            Interests & Categories *{" "}
            <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
              ({interests.length} selected)
            </span>
          </label>
          <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Surveys matching your interests will be highlighted.
          </p>
          <div className="chip-container">
            {INTEREST_OPTIONS.map((interest) => {
              const active = interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  className={`chip ${active ? "active" : ""}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {active ? "✓ " : "+ "}
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fallback Question: "How did you hear about us?" */}
        {!pendingRef && !pendingSource && sourcesList.length > 0 && (
          <div className="input-group" style={{ marginTop: 12 }}>
            <label className="input-label" htmlFor="fallback-source">
              How did you hear about us?
            </label>
            <select
              id="fallback-source"
              className="input-field"
              value={fallbackSourceId}
              onChange={(e) => setFallbackSourceId(e.target.value)}
            >
              <option value="">Select an option (optional)</option>
              {sourcesList.map((src) => (
                <option key={src.id} value={src.id}>
                  {src.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ marginTop: 28 }}>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Saving Profile..." : "Save Profile & Continue →"}
          </button>
        </div>
      </form>
    </div>
  );
}
