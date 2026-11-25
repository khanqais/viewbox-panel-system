import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const TODAY_ISO = new Date().toISOString().split("T")[0];

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
  const [pendingRef] = useState(() => localStorage.getItem("pending_ref_token") || "");
  const [pendingSource] = useState(() => localStorage.getItem("pending_source_slug") || "");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const initData = async () => {
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

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Please enter your full name (at least 2 characters)");
      return;
    }
    if (!dateOfBirth) {
      setErrorMsg("Please select your date of birth");
      return;
    }

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
      setErrorMsg("Please select at least 1 interest category to match surveys");
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column / Guide Card */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Progress Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Onboarding Step
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Step 2 of 2
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">Mobile Verified</span>
                  <span className="text-slate-400 text-2xs">Secure OTP completed</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Demographic Matching</span>
                  <span className="text-blue-600 text-2xs font-medium">In Progress</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attribution Notice */}
          {pendingRef && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs shadow-2xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <span>🎁</span> Referral Bonus Linked
              </div>
              <p className="text-2xs text-emerald-800 leading-relaxed">
                Invited with code <strong className="font-mono">{pendingRef}</strong>. Both you and your inviter receive cash rewards on study completion.
              </p>
            </div>
          )}

          {pendingSource && !pendingRef && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs shadow-2xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <span>📍</span> Campaign Attribution
              </div>
              <p className="text-2xs text-blue-800 leading-relaxed">
                Source channel tagged: <strong>{pendingSource}</strong>
              </p>
            </div>
          )}

          {/* Research Matching Criteria */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-600 shadow-2xs space-y-2.5">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯</span> Why Accuracy Matters
            </h3>
            <p className="text-2xs text-slate-500 leading-relaxed">
              Consumer brands and research institutions screen respondents against strict demographic criteria (City, SEC income, Age).
            </p>
            <p className="text-2xs text-slate-500 leading-relaxed">
              Accurate details ensure you match directly to eligible surveys without getting screened out mid-way.
            </p>
          </div>
        </aside>

        {/* Right Column / Main Form Card */}
        <section className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Complete Your Research Profile
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Required for automated study matching and demographic cohort screening
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block tracking-label text-slate-700 mb-1.5"
              >
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-900 bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            {/* DOB & Gender 2-Col */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dob"
                  className="block tracking-label text-slate-700 mb-1.5"
                >
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  max={TODAY_ISO}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-900 bg-white transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block tracking-label text-slate-700 mb-1.5"
                >
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-900 bg-white transition-all"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* City & Income 2-Col */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="city"
                  className="block tracking-label text-slate-700 mb-1.5"
                >
                  City of Residence <span className="text-rose-500">*</span>
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-900 bg-white transition-all"
                >
                  <option value="">Select your city</option>
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="income"
                  className="block tracking-label text-slate-700 mb-1.5"
                >
                  Annual Household Income <span className="text-rose-500">*</span>
                </label>
                <select
                  id="income"
                  value={incomeRange}
                  onChange={(e) => setIncomeRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-900 bg-white transition-all"
                >
                  <option value="">Select income bracket</option>
                  {INCOME_OPTIONS.map((inc) => (
                    <option key={inc} value={inc}>
                      {inc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interests & Categories */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="tracking-label text-slate-700">
                  Topic & Category Interests <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {interests.length} selected
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Studies matching your selected interests will receive priority recommendation tags.
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = interests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`text-xs px-3.5 py-2 rounded-xl border font-medium transition-all cursor-pointer select-none flex items-center gap-2 ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <span className={active ? "text-white" : "text-slate-400"}>
                        {active ? "✓" : "+"}
                      </span>
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fallback Attribution Dropdown */}
            {!pendingRef && !pendingSource && sourcesList.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <label
                  htmlFor="fallback-source"
                  className="block tracking-label text-slate-600 mb-1.5"
                >
                  How did you discover ViewBox?
                </label>
                <select
                  id="fallback-source"
                  value={fallbackSourceId}
                  onChange={(e) => setFallbackSourceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm text-slate-800 bg-white"
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
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 hidden sm:inline">
                You can update these preferences anytime from your profile settings.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ml-auto"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <span>Save Profile & Explore Surveys →</span>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}


