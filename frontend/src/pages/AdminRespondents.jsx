import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function AdminRespondents() {
  const [respondents, setRespondents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sources, setSources] = useState([]);
  const [cities, setCities] = useState([]);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [showImportDetails, setShowImportDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    let isMounted = true;
    api
      .get("/api/sources")
      .then((res) => {
        if (isMounted) setSources(res.data || []);
      })
      .catch((err) => console.error("Failed to fetch sources:", err));

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadRespondents = async () => {
      try {
        const params = new URLSearchParams({
          limit: "100",
          offset: "0",
        });

        if (search) params.append("search", search);
        if (sourceFilter) params.append("source_id", sourceFilter);
        if (cityFilter && cityFilter !== "all") params.append("city", cityFilter);
        if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

        const res = await api.get(`/api/admin/respondents?${params}`);
        if (isMounted) {
          setRespondents(res.data.respondents || []);
          setTotal(res.data.total || 0);

          // Extract unique cities
          const uniqueCities = [
            ...new Set(res.data.respondents.map((r) => r.city)),
          ].filter((c) => c && c !== "N/A");
          setCities(uniqueCities);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRespondents();

    return () => {
      isMounted = false;
    };
  }, [search, sourceFilter, cityFilter, statusFilter, refreshKey]);

  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (sourceFilter) params.append("source_id", sourceFilter);
      if (cityFilter && cityFilter !== "all") params.append("city", cityFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const res = await api.get(`/api/admin/export-csv?${params}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `viewbox_respondents_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to export CSV. Please try again.");
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await api.post("/api/admin/import-csv", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImportResult(res.data);
      setShowImportDetails(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      alert(`Import failed: ${detail || err.message}`);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  const resetFilters = () => {
    setSearch("");
    setSourceFilter("");
    setCityFilter("");
    setStatusFilter("");
  };

  const activeFiltersCount = [
    Boolean(search),
    Boolean(sourceFilter),
    Boolean(cityFilter && cityFilter !== "all"),
    Boolean(statusFilter && statusFilter !== "all"),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Respondent Database
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Screened panel members, demographic profiles, and cool-off status
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📥</span> Export CSV
          </button>

          <label className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
            <span>📤</span> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

        {/* CSV Import Report Banner */}
      {importResult && (
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-left transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>✓ CSV Import Processed</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200">
                  {importResult.imported} Added / {importResult.total_rows} Total
                </span>
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                Imported: <strong>{importResult.imported}</strong> | Skipped (Duplicates/Invalid):{" "}
                <strong>{importResult.skipped}</strong> | Auto-Fixed Fields:{" "}
                <strong>{importResult.fixed_count}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(importResult.fixed?.length > 0 || importResult.errors?.length > 0) && (
                <button
                  onClick={() => setShowImportDetails(!showImportDetails)}
                  className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold underline cursor-pointer"
                >
                  {showImportDetails ? "Hide Log" : "View Fixes & Errors"}
                </button>
              )}
              <button
                onClick={() => setImportResult(null)}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 cursor-pointer font-bold ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {showImportDetails && (
            <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 space-y-2 text-xs">
              {importResult.fixed?.length > 0 && (
                <div>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-200 block mb-1">
                    Sanitized Data ({importResult.fixed.length}):
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-2xs bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                    {importResult.fixed.map((fix, idx) => (
                      <div key={idx} className="text-emerald-950 dark:text-emerald-200">
                        Row {fix.row}: {fix.field} "{fix.original}" → <strong>"{fix.fixed}"</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors?.length > 0 && (
                <div>
                  <span className="font-semibold text-rose-800 dark:text-rose-300 block mb-1">
                    Skipped Rows ({importResult.errors.length}):
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-2xs bg-rose-50/80 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/60">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="text-rose-900 dark:text-rose-200">
                        Row {err.row} ({err.phone}): {err.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search name, phone, city, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-900/80 transition-colors"
            />
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/80 transition-colors"
            >
              <option value="">All Sources</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/80 transition-colors"
            >
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/80 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="cool-off">In Cool-Off</option>
              <option value="completed">Completed Study</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="profile pending">Profile Pending</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <strong className="text-slate-900 dark:text-white font-semibold">{respondents.length}</strong> of{" "}
            <strong className="text-slate-900 dark:text-white font-semibold">{total}</strong> total registered
          </span>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
            >
              Reset Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-2xs">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Respondent</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Income & Interests</th>
                <th className="py-3 px-4">Acquisition Source</th>
                <th className="py-3 px-4">Eligibility Status</th>
                <th className="py-3 px-4">Joined At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    Loading records...
                  </td>
                </tr>
              ) : respondents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No respondents match current search or filters.
                  </td>
                </tr>
              ) : (
                respondents.map((r) => {
                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        r.in_cool_off ? "bg-amber-50/30 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-500 dark:text-slate-400 text-2xs">
                        #{r.id}
                      </td>

                      {/* Respondent Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {r.name || "Anonymous"}
                        </div>
                        <div className="font-mono text-2xs text-slate-500 dark:text-slate-400 tabular-nums">
                          +91 {r.phone}
                        </div>
                        {r.referral_code && (
                          <span className="text-2xs text-blue-600 dark:text-blue-400 font-mono font-medium">
                            Ref: {r.referral_code}
                          </span>
                        )}
                      </td>

                      {/* Demographics */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-200">{r.city}</div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400">
                          {r.gender || "—"} • {r.dob ? `Born ${r.dob}` : "DOB N/A"}
                        </div>
                      </td>

                      {/* Income & Interests */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {r.income_range || "—"}
                        </div>
                        {r.interests && (
                          <div className="text-2xs text-slate-500 dark:text-slate-400 truncate" title={r.interests}>
                            {r.interests}
                          </div>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <span className="inline-block text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {r.source || "Direct / Unknown"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {r.in_cool_off ? (
                          <div>
                            <span className="inline-block text-2xs font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              ⏳ In Cool-Off
                            </span>
                            <div className="text-2xs text-amber-700 dark:text-amber-400 mt-0.5 font-medium tabular-nums">
                              Free on {r.cool_off_until}
                            </div>
                          </div>
                        ) : r.status === "Active" ? (
                          <span className="inline-block text-2xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="inline-block text-2xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {r.status}
                          </span>
                        )}
                      </td>

                      {/* Joined At */}
                      <td className="py-3 px-4 text-2xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                        {r.created_at}
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


