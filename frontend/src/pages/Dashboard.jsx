import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "eligible" | "waitlist"

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (storedUser.role === "admin") {
      navigate("/admin/respondents", { replace: true });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [meRes, surveysRes] = await Promise.all([
          api.get("/api/members/me"),
          api.get("/api/surveys/active"),
        ]);

        setUser(meRes.data);
        setSurveys(surveysRes.data || []);
      } catch (err) {
        const detail = err.response?.data?.detail;
        setErrorMsg(
          typeof detail === "string"
            ? detail
            : "Failed to load dashboard data. Please refresh."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleJoinSurvey = async (surveyId) => {
    setJoining(surveyId);
    setErrorMsg("");

    try {
      const res = await api.post(`/api/surveys/${surveyId}/join`);

      if (res.data.success) {
        const surveysRes = await api.get("/api/surveys/active");
        setSurveys(surveysRes.data || []);
      } else {
        setErrorMsg(res.data.message || "Failed to join survey");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : "Failed to join survey. Please try again."
      );
    } finally {
      setJoining(null);
    }
  };

  const copyReferralLink = () => {
    if (!user?.referral_link) return;
    const fullLink = window.location.origin + user.referral_link;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    if (!user?.referral_link) return;
    const fullLink = window.location.origin + user.referral_link;
    const text = encodeURIComponent(
      `Join ViewBox Research Panel and earn cash rewards for answering surveys! Use my invite link: ${fullLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Filtered surveys
  const filteredSurveys = surveys.filter((s) => {
    if (filter === "eligible") return s.eligibility === "approved";
    if (filter === "waitlist") return s.eligibility === "waitlisted";
    return true;
  });

  const eligibleCount = surveys.filter((s) => s.eligibility === "approved").length;
  const waitlistCount = surveys.filter((s) => s.eligibility === "waitlisted").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3.5" />
        <p className="text-sm font-semibold text-slate-700">Checking survey eligibility...</p>
        <p className="text-xs text-slate-400 mt-1">Screening against 3-month cool-off and demographic rules</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between shadow-2xs">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg("")}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column / Desktop Sidebar */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
          {/* Respondent Profile Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xs">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="tracking-label text-slate-400 block mb-1">
                  Panel Respondent
                </span>
                <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
                  {user?.name || "Panel Member"}
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5 tabular-nums">
                  {user?.phone ? `+91 ${user.phone}` : "Verified Member"}
                </p>
              </div>
              <span className="shrink-0 text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ✓ Active
              </span>
            </div>

            {/* Quick Demographics Preview */}
            {user?.profile && (
              <div className="py-2.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-1.5 my-3">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">City:</span>
                  <span className="font-semibold text-white">{user.profile.city || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Income:</span>
                  <span className="font-semibold text-white">{user.profile.income_range || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Interests:</span>
                  <span className="font-semibold text-white">
                    {user.profile.interests?.length || 0} categories
                  </span>
                </div>
              </div>
            )}

            {/* Referral Code Box */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-2xs block">Referral ID:</span>
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {user?.referral_code || "VB0000"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                Edit Profile →
              </button>
            </div>
          </div>

          {/* Invite & Earn Box */}
          {user?.referral_link && (
            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/70 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <span>🎁</span> Earn ₹100 Per Referral
                </span>
                <span className="text-2xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Cash Bonus
                </span>
              </div>
              <p className="text-xs text-blue-800/90 leading-relaxed mb-3">
                Share your invite link with colleagues & friends. Earn ₹100 once they complete their first eligible study.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-mono text-slate-700 truncate select-all">
                    {window.location.origin + user.referral_link}
                  </div>
                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-xs"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>💬</span> Share on WhatsApp
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200/60 text-right">
                <button
                  type="button"
                  onClick={() => navigate("/referrals")}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  View Referral Ledger ({user?.referral_count || 0}) →
                </button>
              </div>
            </div>
          )}

          {/* Research Quality Policy Card */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white text-xs text-slate-600 shadow-2xs space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <span>🛡️</span> Sampling Protocol
            </h4>
            <p className="text-2xs text-slate-500 leading-relaxed">
              <strong>3-Month Cool-off:</strong> Completing a study places your account in a 90-day rest period for that specific industry to maintain unbiased data.
            </p>
            <p className="text-2xs text-slate-500 leading-relaxed">
              <strong>Flexible Screening:</strong> Waitlist slots are reviewed manually by project researchers as capacity opens.
            </p>
          </div>
        </aside>

        {/* Right Column / Surveys Feed */}
        <section className="lg:col-span-8 space-y-5">
          {/* Studies Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Available Research Studies
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Automatically pre-screened based on your demographic profile & cool-off
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === "all"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({surveys.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("eligible")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === "eligible"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Eligible ({eligibleCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("waitlist")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === "waitlist"
                    ? "bg-white text-amber-800 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Waitlist ({waitlistCount})
              </button>
            </div>
          </div>

          {/* Surveys List / Grid */}
          {filteredSurveys.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <span className="text-4xl block mb-2.5">📋</span>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No Studies In This Category
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                {filter === "eligible"
                  ? "You do not have any immediately eligible studies right now. Check the waitlist tab or update your profile interests."
                  : "New consumer research campaigns are added weekly. Check back soon."}
              </p>
              {filter !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  View All Studies
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSurveys.map((survey) => {
                const isApproved = survey.eligibility === "approved";
                const isWaitlisted = survey.eligibility === "waitlisted";
                const alreadyJoined = survey.already_joined;
                const matchesInterests = survey.matches_interests;
                const percentFilled = Math.min(
                  100,
                  Math.round(((survey.filled || 0) / (survey.quota || 1)) * 100)
                );

                return (
                  <div
                    key={survey.id}
                    className={`p-5 rounded-2xl border transition-all text-left bg-white flex flex-col justify-between ${
                      matchesInterests
                        ? "border-amber-300 ring-1 ring-amber-200/80 shadow-xs"
                        : isApproved && !alreadyJoined
                        ? "border-blue-300 ring-1 ring-blue-100 shadow-xs"
                        : "border-slate-200 shadow-2xs"
                    }`}
                  >
                    <div>
                      {/* Matching Interests Tag */}
                      {matchesInterests && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            ⭐ Matches Your Interests
                          </span>
                        </div>
                      )}

                      {/* Header: Title + Status Badge */}
                      <div className="flex items-start justify-between gap-2.5 mb-2">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {survey.title}
                        </h3>
                        {isApproved ? (
                          <span className="shrink-0 text-2xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Eligible
                          </span>
                        ) : isWaitlisted ? (
                          <span className="shrink-0 text-2xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            ⏳ Waitlist
                          </span>
                        ) : (
                          <span className="shrink-0 text-2xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                            Ineligible
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {survey.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3.5">
                          {survey.description}
                        </p>
                      )}

                      {/* Meta Chips */}
                      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mb-3 tabular-nums">
                        <div>
                          <span className="tracking-label text-slate-400 block">Reward</span>
                          <strong className="text-slate-900 font-bold text-xs">₹{survey.reward_amount}</strong>
                        </div>
                        <div>
                          <span className="tracking-label text-slate-400 block">Quota</span>
                          <span className="font-semibold text-slate-800">
                            {survey.filled}/{survey.quota}
                          </span>
                        </div>
                        <div>
                          <span className="tracking-label text-slate-400 block">Deadline</span>
                          <span className="font-semibold text-slate-800">
                            {new Date(survey.deadline).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Quota Progress Bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentFilled >= 100
                              ? "bg-rose-500"
                              : percentFilled > 75
                              ? "bg-amber-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>

                      {/* Eligibility Reason / Cool-off Warning */}
                      <div className="mb-4 text-xs flex items-start gap-1.5 leading-relaxed">
                        {isApproved ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ {survey.eligibility_reason}
                          </span>
                        ) : isWaitlisted ? (
                          <span className="text-amber-800 font-medium">
                            ⚠️ {survey.eligibility_reason}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            ✕ {survey.eligibility_reason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {alreadyJoined ? (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 font-medium">
                          Registered • Status:{" "}
                          <strong className="text-slate-900 uppercase">
                            {survey.participation_result || "Submitted"}
                          </strong>
                        </div>
                      ) : isApproved ? (
                        <button
                          type="button"
                          onClick={() => handleJoinSurvey(survey.id)}
                          disabled={joining === survey.id}
                          className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {joining === survey.id ? (
                            <>
                              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Joining Study...</span>
                            </>
                          ) : (
                            <span>Join Study & Earn ₹{survey.reward_amount} →</span>
                          )}
                        </button>
                      ) : isWaitlisted ? (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleJoinSurvey(survey.id)}
                            disabled={joining === survey.id}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                          >
                            {joining === survey.id ? (
                              <>
                                <span className="inline-block w-3.5 h-3.5 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                                <span>Joining Waitlist...</span>
                              </>
                            ) : (
                              <span>Join Waitlist (Flexible Screen) →</span>
                            )}
                          </button>
                          <p className="text-2xs text-slate-400 text-center mt-1">
                            Researchers manually admit waitlisted respondents as slots open.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


