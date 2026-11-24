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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadReferrals = async () => {
      setLoading(true);
      try {
        const [referralsRes, statsRes] = await Promise.all([
          api.get("/api/referrals/my-referrals"),
          api.get("/api/referrals/stats"),
        ]);

        setReferrals(referralsRes.data.referrals || []);
        setSummary(referralsRes.data.summary || {});
        setStats(statsRes.data || {});
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

  const getStageBadge = (stage) => {
    const badges = {
      lead: {
        label: "🆕 Lead",
        bg: "var(--primary-light)",
        color: "var(--primary)",
        border: "#bfdbfe",
      },
      fit: {
        label: "✓ Fit Verified",
        bg: "#ecfdf5",
        color: "var(--success)",
        border: "#a7f3d0",
      },
      completed: {
        label: "🎉 Completed",
        bg: "var(--success-light)",
        color: "var(--success)",
        border: "var(--success)",
      },
      failed: {
        label: "✗ Failed",
        bg: "#f1f5f9",
        color: "var(--text-muted)",
        border: "var(--border-color)",
      },
    };

    const badge = badges[stage] || badges.lead;

    return (
      <span
        className="badge"
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          border: `1px solid ${badge.border}`,
        }}
      >
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading referrals...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="app-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="brand-badge">📊 ViewBox</div>
        <button
          className="btn btn-secondary"
          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: "20px", flexGrow: 1 }}>
        {/* Page Title */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            👥 My Referrals
          </h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            Track your referrals and earn bonuses when they complete surveys.
          </p>
        </div>

        {errorMsg && <div className="banner-error">{errorMsg}</div>}

        {/* Stats Cards */}
        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  marginBottom: 4,
                }}
              >
                {stats.total_referrals}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Total Referrals
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: 10,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "var(--success)",
                  marginBottom: 4,
                }}
              >
                ₹{stats.potential_earnings}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                Potential Earnings
              </div>
            </div>
          </div>
        )}

        {/* Stage Summary */}
        {summary && (
          <div
            style={{
              backgroundColor: "var(--primary-light)",
              border: "1px solid #bfdbfe",
              borderRadius: 10,
              padding: 14,
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-around",
              fontSize: "0.78rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary)" }}>
                {summary.lead || 0}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>Lead</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--success)" }}>
                {summary.fit || 0}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>Fit</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--success)" }}>
                {summary.completed || 0}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>Completed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-muted)" }}>
                {summary.failed || 0}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>Failed</div>
            </div>
          </div>
        )}

        {/* Referrals List */}
        <div style={{ marginBottom: 16 }}>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Referral History ({referrals.length})
          </h3>
        </div>

        {referrals.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: 32,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔗</div>
            <p style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 600 }}>
              No Referrals Yet
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Share your referral link from the dashboard to start earning bonuses!
            </p>
            <button
              className="btn btn-primary"
              style={{ fontSize: "0.85rem" }}
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {referrals.map((ref) => (
              <div
                key={ref.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--border-color)",
                  borderRadius: 10,
                  padding: 14,
                  textAlign: "left",
                }}
              >
                {/* Referral Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {ref.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {ref.phone}
                    </div>
                  </div>
                  {getStageBadge(ref.stage)}
                </div>

                {/* Survey Completion Status */}
                {ref.has_completed_survey && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--success)",
                      marginBottom: 6,
                      fontWeight: 500,
                    }}
                  >
                    ✓ Completed a survey • Bonus earned!
                  </div>
                )}

                {/* Fail Reason */}
                {ref.fail_reason && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    Reason: {ref.fail_reason}
                  </div>
                )}

                {/* Timestamps */}
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    gap: 12,
                  }}
                >
                  <span>Joined: {new Date(ref.created_at).toLocaleDateString()}</span>
                  {ref.updated_at !== ref.created_at && (
                    <span>Updated: {new Date(ref.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: "#f8fafc",
            borderRadius: 8,
            fontSize: "0.78rem",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          <strong>Referral Stages:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            <li>
              <strong>Lead:</strong> Friend joined via your link
            </li>
            <li>
              <strong>Fit Verified:</strong> Profile matches survey criteria
            </li>
            <li>
              <strong>Completed:</strong> Friend completed a survey • Bonus earned!
            </li>
            <li>
              <strong>Failed:</strong> Did not meet criteria or inactive
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
