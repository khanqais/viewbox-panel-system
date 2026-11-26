import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function AdminSources() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", type: "whatsapp", slug: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchDashboard();
  }, [navigate]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/sources/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load source dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSource(e) {
    e.preventDefault();

    if (!newSource.name.trim() || !newSource.type || !newSource.slug.trim()) {
      alert("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/admin/sources", {
        name: newSource.name.trim(),
        type: newSource.type,
        slug: newSource.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      });

      setNewSource({ name: "", type: "whatsapp", slug: "" });
      setShowCreateForm(false);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      alert(detail || "Failed to create source");
    } finally {
      setSubmitting(false);
    }
  }

  const getTypeBadge = (type) => {
    const types = {
      whatsapp: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      instagram: "bg-pink-50 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800",
      meta: "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      website: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
      member: "bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      other: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    };
    const style = types[type] || types.other;
    return (
      <span className={`inline-block text-2xs font-semibold uppercase px-2 py-0.5 rounded-md border ${style}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Acquisition Funnel & Attribution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Conversion rates across marketing channels, referral links, and campaigns
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer self-stretch sm:self-auto"
        >
          <span>{showCreateForm ? "✕ Close Form" : "+ Add Campaign Source"}</span>
        </button>
      </div>

      {/* Create Source Modal / Inline Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateSource}
          className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-slate-900 shadow-xs space-y-4 transition-colors"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Register New Acquisition Channel
            </h3>
            <span className="text-xs text-slate-400">Generates unique trackable token</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block tracking-label text-slate-700 dark:text-slate-300 mb-1.5">
                Channel / Group Name *
              </label>
              <input
                type="text"
                placeholder="e.g. WhatsApp - Pune Techies"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/80 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block tracking-label text-slate-700 dark:text-slate-300 mb-1.5">
                Channel Type *
              </label>
              <select
                value={newSource.type}
                onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/80 transition-colors"
              >
                <option value="whatsapp">WhatsApp Group</option>
                <option value="instagram">Instagram Ads/Bio</option>
                <option value="meta">Meta Lead Ads</option>
                <option value="website">Website Direct</option>
                <option value="member">Member Referral</option>
                <option value="other">Other / Offline</option>
              </select>
            </div>

            <div>
              <label className="block tracking-label text-slate-700 dark:text-slate-300 mb-1.5">
                URL Slug Token *
              </label>
              <input
                type="text"
                placeholder="e.g. whatsapp-pune-tech"
                value={newSource.slug}
                onChange={(e) =>
                  setNewSource({
                    ...newSource,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-slate-900 dark:text-slate-100 font-mono bg-white dark:bg-slate-900/80 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Create Source Channel"}
            </button>
          </div>
        </form>
      )}

      {/* Summary Metrics Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
              Active Sources
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {dashboard.summary?.total_sources || 0}
            </div>
            <span className="text-2xs text-slate-500 dark:text-slate-400">Channels monitored</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
              Total Sign-ups
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {dashboard.summary?.total_signups || 0}
            </div>
            <span className="text-2xs text-slate-500 dark:text-slate-400">Top-of-funnel reach</span>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 shadow-2xs transition-colors">
            <span className="text-2xs font-semibold uppercase tracking-wider text-blue-900 dark:text-blue-300 block mb-1">
              Fit Members
            </span>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums">
              {dashboard.summary?.total_fit || 0}
            </div>
            <span className="text-2xs text-blue-800 dark:text-blue-300">Completed profile & eligible</span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-2xs transition-colors">
            <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 block mb-1">
              Completed Studies
            </span>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {dashboard.summary?.total_completed || 0}
            </div>
            <span className="text-2xs text-emerald-800 dark:text-emerald-300">High-intent responses</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 text-white shadow-2xs col-span-2 sm:col-span-1 transition-colors">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Overall Conversion
            </span>
            <div className="text-2xl font-bold text-white tabular-nums">
              {dashboard.summary?.overall_conversion || "0%"}
            </div>
            <span className="text-2xs text-slate-300">Sign-ups to Completed</span>
          </div>
        </div>
      )}

      {/* Funnel Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Channel Breakdown (Signups → Fit → Completed)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Attribution models: Referral &gt; Campaign Link &gt; Fallback
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-2xs">
              <tr>
                <th className="py-3 px-4">Channel Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Tracking Slug</th>
                <th className="py-3 px-4 text-right">Sign-ups</th>
                <th className="py-3 px-4 text-right">Fit Members</th>
                <th className="py-3 px-4 text-right">Completed</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading funnel metrics...
                  </td>
                </tr>
              ) : !dashboard?.sources || dashboard.sources.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No acquisition sources configured.
                  </td>
                </tr>
              ) : (
                dashboard.sources.map((src) => {
                  const convRate = parseFloat(src.conversion_rate) || 0;
                  return (
                    <tr key={src.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {src.name}
                      </td>

                      <td className="py-3.5 px-4">
                        {getTypeBadge(src.type)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-2xs text-slate-500 dark:text-slate-400">
                        ?source={src.slug}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                        {src.signups}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                        {src.fit}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {src.completed}
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, convRate)}%` }}
                            />
                          </div>
                          <strong className="font-bold text-slate-900 dark:text-white">{src.conversion_rate}</strong>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {src.is_active ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950" title="Active" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" title="Inactive" />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


