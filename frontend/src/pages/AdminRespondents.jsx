import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const [importResult, setImportResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchSources();
    fetchRespondents();
  }, [search, sourceFilter, cityFilter, statusFilter]);

  async function fetchSources() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/sources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSources(data || []);
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    }
  }

  async function fetchRespondents() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        limit: "100",
        offset: "0",
      });
      
      if (search) params.append("search", search);
      if (sourceFilter) params.append("source_id", sourceFilter);
      if (cityFilter && cityFilter !== "all") params.append("city", cityFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(
        `http://localhost:8000/api/admin/respondents?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setRespondents(data.respondents || []);
      setTotal(data.total || 0);

      // Extract unique cities for filter dropdown
      const uniqueCities = [...new Set(data.respondents.map((r) => r.city))].filter(
        (c) => c !== "N/A"
      );
      setCities(uniqueCities);
    } catch (err) {
      console.error(err);
      alert("Failed to load respondents");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      
      if (search) params.append("search", search);
      if (sourceFilter) params.append("source_id", sourceFilter);
      if (cityFilter && cityFilter !== "all") params.append("city", cityFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(
        `http://localhost:8000/api/admin/export-csv?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
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
      alert("Export failed");
    }
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/import-csv", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      setImportResult(result);

      if (result.success) {
        alert(`Import successful! ${result.imported} imported, ${result.skipped} skipped.`);
        fetchRespondents();
      } else {
        alert(`Import failed: ${result.errors[0]?.reason || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Import failed");
    }

    e.target.value = "";
  }

  function getStatusBadge(status) {
    const colors = {
      Active: "var(--success)",
      "Cool-off": "var(--warning)",
      Completed: "var(--primary)",
      Waitlisted: "#f59e0b",
      "Profile Pending": "var(--text-muted)",
    };

    return (
      <span
        className="badge"
        style={{
          backgroundColor: colors[status] || "var(--text-muted)",
          color: "#fff",
          fontSize: "0.72rem",
        }}
      >
        {status}
      </span>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-secondary)", padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--text-primary)" }}>
              👥 Respondent Management
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {total} total respondents
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/admin/sources")}
            style={{ fontSize: "0.85rem", padding: "8px 16px" }}
          >
            📊 Source Dashboard →
          </button>
        </div>

        {/* Search & Filters */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: 16,
            borderRadius: 10,
            marginBottom: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="🔍 Search by name, phone, ID or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "10px 12px", fontSize: "0.85rem" }}
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{ padding: "10px 12px", fontSize: "0.85rem" }}
            >
              <option value="">All Sources</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              style={{ padding: "10px 12px", fontSize: "0.85rem" }}
            >
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "10px 12px", fontSize: "0.85rem" }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="cool-off">Cool-off</option>
              <option value="completed">Completed</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="profile pending">Profile Pending</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
            >
              📥 Export CSV
            </button>
            <label
              className="btn btn-secondary"
              style={{ fontSize: "0.85rem", padding: "8px 16px", cursor: "pointer" }}
            >
              📤 Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        {/* Import Result Banner */}
        {importResult && (
          <div
            className={importResult.success ? "banner-success" : "banner-error"}
            style={{ marginBottom: 16, padding: 12, fontSize: "0.85rem" }}
          >
            <strong>Import Report:</strong> {importResult.imported} imported, {importResult.skipped} skipped
            {importResult.fixed_count > 0 && ` (${importResult.fixed_count} rows auto-fixed)`}
            {importResult.total_errors > 0 && (
              <div style={{ marginTop: 8, fontSize: "0.78rem" }}>
                Errors: {importResult.errors.slice(0, 3).map((e, i) => (
                  <div key={i}>Row {e.row}: {e.reason}</div>
                ))}
                {importResult.total_errors > 3 && <div>...and {importResult.total_errors - 3} more</div>}
              </div>
            )}
          </div>
        )}

        {/* Respondents Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
        ) : respondents.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
            No respondents found
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "2px solid var(--border-color)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Phone</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>City</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Gender</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Income</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Source</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {respondents.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        backgroundColor: r.in_cool_off ? "#fff7ed" : "#fff",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>{r.id}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{r.name}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{r.phone}</td>
                      <td style={{ padding: "12px 16px" }}>{r.city}</td>
                      <td style={{ padding: "12px 16px" }}>{r.gender}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.78rem" }}>{r.income_range}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.78rem" }}>{r.source}</td>
                      <td style={{ padding: "12px 16px" }}>{getStatusBadge(r.status)}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {r.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
