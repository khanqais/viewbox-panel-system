import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Referrals() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadReferrals = async () => {
      setLoading(true);
      try {
        const [referralsRes, statsRes, meRes] = await Promise.all([
          api.get("/api/referrals/my-referrals"),
          api.get("/api/referrals/stats"),
          api.get("/api/members/me"),
        ]);

        setReferrals(referralsRes.data.referrals || []);
        setSummary(referralsRes.data.summary || {});
        setStats(statsRes.data || {});
        setUser(meRes.data || {});
      } catch (err) {
        const detail = err.response?.data?.detail;
        setErrorMsg(
          typeof detail === "string"
            ? detail
            : "Failed to load referrals. Please refresh."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReferrals();
  }, [navigate]);

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
      `Earn cash for consumer research with ViewBox Panel! Sign up via my link: ${fullLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case "completed":
        return (
          <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300">
            🎉 Completed (Bonus Earned)
          </span>
        );
      case "fit":
        return (
          <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            ✓ Fit Verified
          </span>
        );
      case "failed":
        return (
          <span className="text-2xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
            ✗ Ineligible
          </span>
        );
      case "lead":
      default:
        return (
          <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            ⏳ Registered (Lead)
          </span>
        );
    }
  };

  // Filter referrals by stage
  const filteredReferrals = referrals.filter((r) => {
    if (filter === "all") return true;
    return r.stage === filter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-3.5" />
        <p className="text-sm font-semibold text-slate-700">Loading referral records...</p>
        <p className="text-xs text-slate-400 mt-1">Retrieving pipeline stats and earnings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Referrals & Bonus Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Earn ₹100 per friend who registers and completes their first verified research study
          </p>
        </div>

        <button
          type="button"
          onClick={copyReferralLink}
          className="self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <span>{copied ? "✓ Link Copied!" : "📋 Copy Invite Link"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Top KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Contacts */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs text-left">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Referrals
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {stats?.total_referrals || 0}
          </div>
          <span className="text-2xs text-slate-500 mt-1 block">
            Contacts joined via link
          </span>
        </div>

        {/* Fit Stage */}
        <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-2xs text-left">
          <span className="text-2xs font-semibold uppercase tracking-wider text-blue-900 block mb-1">
            Fit Members
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
            {summary?.fit || 0}
          </div>
          <span className="text-2xs text-blue-800 mt-1 block">
            Profile completed & verified
          </span>
        </div>

        {/* Completed Stage */}
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-2xs text-left">
          <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-900 block mb-1">
            Completed Studies
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
            {summary?.completed || 0}
          </div>
          <span className="text-2xs text-emerald-800 mt-1 block">
            Bonus eligible finishes
          </span>
        </div>

        {/* Potential / Total Bonus */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-900 bg-slate-900 text-white shadow-xs text-left">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Potential Bonus
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
            ₹{stats?.potential_earnings || 0}
          </div>
          <span className="text-2xs text-slate-300 mt-1 block">
            ₹100 per verified finish
          </span>
        </div>
      </div>

      {/* Main Grid: Left Hub, Right Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column / Share Hub */}
        <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
          {/* Invite Hub Card */}
          <div className="p-5 rounded-2xl border border-blue-200 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>🔗</span> Your Personal Invite Hub
              </h3>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                Code: {user?.referral_code || "VB0000"}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anyone registering with your link will automatically be credited to your account.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate select-all">
                  {user?.referral_link ? window.location.origin + user.referral_link : "Loading..."}
                </div>
                <button
                  type="button"
                  onClick={copyReferralLink}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-xs shrink-0"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>

              <button
                type="button"
                onClick={shareOnWhatsApp}
                className="w-full py-2.5 px-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>💬</span> Share with Contacts on WhatsApp
              </button>
            </div>
          </div>

          {/* Lifecycle Explainer Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>📊</span> Referral Qualification Stages
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                <span className="text-base">1️⃣</span>
                <div>
                  <strong className="text-slate-900 block font-semibold">Lead</strong>
                  <span className="text-slate-500 text-2xs">User registered phone number via your link.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-2.5">
                <span className="text-base">2️⃣</span>
                <div>
                  <strong className="text-blue-900 block font-semibold">Fit (Verified Profile)</strong>
                  <span className="text-blue-800 text-2xs">Completed demographics & screening criteria.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5">
                <span className="text-base">3️⃣</span>
                <div>
                  <strong className="text-emerald-900 block font-semibold">Completed (₹100 Paid)</strong>
                  <span className="text-emerald-800 text-2xs">Completed first verified study. Bonus unlocked!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Box */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-2xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700 block mb-1">🔒 Privacy Compliant (DPDP Act):</strong>
            All contact telephone numbers are masked as <code className="font-mono text-slate-700">98******10</code> to protect individual privacy while enabling reward tracking.
          </div>
        </aside>

        {/* Right Column / Referred Members Ledger */}
        <section className="lg:col-span-7 space-y-4">
          {/* Header & Stage Filters */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Referred Members Ledger ({referrals.length})
              </h2>
              <span className="text-xs text-slate-500">Live conversion and stage audit</span>
            </div>

            {/* Stage Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
              {["all", "completed", "fit", "lead", "failed"].map((stg) => (
                <button
                  type="button"
                  key={stg}
                  onClick={() => setFilter(stg)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    filter === stg
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {stg}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table / Cards */}
          {filteredReferrals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <span className="text-3xl block mb-2">👥</span>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                No Referrals in "{filter}"
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Share your personal link on WhatsApp or social media. Earn ₹100 on every friend's completed study.
              </p>
              <button
                type="button"
                onClick={copyReferralLink}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {copied ? "✓ Link Copied!" : "Copy Invite Link"}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
                    <tr>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Masked Phone</th>
                      <th className="py-3 px-4">Lifecycle Stage</th>
                      <th className="py-3 px-4 text-right">Bonus Reward</th>
                      <th className="py-3 px-4 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredReferrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {ref.name || "Anonymous Member"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-2xs text-slate-600 tabular-nums">
                          {ref.phone}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStageBadge(ref.stage)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold tabular-nums">
                          {ref.stage === "completed" ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              + ₹100 Paid
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">Pending</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-500 text-2xs tabular-nums whitespace-nowrap">
                          {ref.created_at
                            ? new Date(ref.created_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Recent"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

