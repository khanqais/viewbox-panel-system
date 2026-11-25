import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSources() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", type: "", slug: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/sources/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load source dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSource(e) {
    e.preventDefault();

    if (!newSource.name || !newSource.type || !newSource.slug) {
      alert("All fields are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSource),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create source");
      }

      alert("Source created successfully!");
      setNewSource({ name: "", type: "", slug: "" });
      setShowCreateForm(false);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-secondary)", padding: "20px 16px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--text-primary)" }}>
              📊 Source Dashboard
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Track conversion funnel by marketing channel
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/admin/respondents")}
            style={{ fontSize: "0.85rem", padding: "8px 16px" }}
          >
            👥 Respondents Grid →
          </button>
        </div>

        {/* Summary Cards */}
        {dashboard && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                Total Sources
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {dashboard.summary.total_sources}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                Total Sign-ups
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {dashboard.summary.total_signups}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                Fit Members
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "var(--success)" }}>
                {dashboard.summary.total_fit}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                Completed Surveys
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "var(--primary)" }}>
                {dashboard.summary.total_completed}
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 6 }}>
                Overall Conversion
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 600, color: "var(--primary)" }}>
                {dashboard.summary.overall_conversion}
              </div>
            </div>
          </div>
        )}

        {/* Create Source Button */}
        <div style={{ marginBottom: 16 }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ fontSize: "0.85rem", padding: "10px 20px" }}
          >
            {showCreateForm ? "✖ Cancel" : "+ Create New Source"}
          </button>
        </div>

        {/* Create Source Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateSource}
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 10,
              marginBottom: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem" }}>Create New Source</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Source Name (e.g., Instagram - Tech Reels)"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                required
                style={{ padding: "10px 12px", fontSize: "0.85rem" }}
              />
              <input
                type="text"
                placeholder="Type (e.g., instagram, whatsapp, website)"
                value={newSource.type}
                onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                required
                style={{ padding: "10px 12px", fontSize: "0.85rem" }}
              />
              <input
                type="text"
                placeholder="Slug (e.g., instagram-tech-reels)"
                value={newSource.slug}
                onChange={(e) => setNewSource({ ...newSource, slug: e.target.value })}
                required
                style={{ padding: "10px 12px", fontSize: "0.85rem" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "10px 20px" }}>
              Create Source
            </button>
          </form>
        )}

        {/* Sources Table */}
        {dashboard && dashboard.sources && (
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
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Source Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>Slug</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>Sign-ups</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>Fit</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>Completed</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>Conversion</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.sources.map((source) => (
                    <tr
                      key={source.id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        backgroundColor: source.is_active ? "#fff" : "#f9fafb",
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{source.name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            fontSize: "0.72rem",
                          }}
                        >
                          {source.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {source.slug}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{source.signups}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--success)" }}>
                        {source.fit}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--primary)" }}>
                        {source.completed}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontWeight: 600,
                          color: parseFloat(source.conversion_rate) > 10 ? "var(--success)" : "var(--warning)",
                        }}
                      >
                        {source.conversion_rate}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {source.is_active ? (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: "var(--success)",
                              color: "#fff",
                              fontSize: "0.72rem",
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            className="badge"
                            style={{
                              backgroundColor: "var(--text-muted)",
                              color: "#fff",
                              fontSize: "0.72rem",
                            }}
                          >
                            Inactive
                          </span>
                        )}
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
