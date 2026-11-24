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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
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
        // Reload surveys to update status
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

  const getEligibilityBadge = (status) => {
    if (status === "approved")
      return (
        <span
          className="badge"
          style={{
            backgroundColor: "var(--success-light)",
            color: "var(--success)",
            border: "1px solid var(--success)",
          }}
        >
          ✓ Eligible
        </span>
      );
    if (status === "waitlisted")
      return (
        <span
          className="badge"
          style={{
            backgroundColor: "var(--warning-light)",
            color: "var(--warning)",
            border: "1px solid var(--warning)",
          }}
        >
          ⏳ Waitlisted
        </span>
      );
    return (
      <span
        className="badge"
        style={{
          backgroundColor: "#f1f5f9",
          color: "var(--text-muted)",
          border: "1px solid var(--border-color)",
        }}
      >
        Not Eligible
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading dashboard...</p>
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
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div style={{ padding: "20px", flexGrow: 1 }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Welcome, {user?.name || "Member"}!
          </h2>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            {user?.referral_code && (
              <>
                Your referral code: <strong>{user.referral_code}</strong>
              </>
            )}
          </p>
        </div>

        {/* Referral Link Card */}
        {user?.referral_link && (
          <div
            style={{
              backgroundColor: "var(--primary-light)",
              border: "1px solid #bfdbfe",
              borderRadius: 10,
              padding: 14,
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "var(--primary)",
                marginBottom: 6,
              }}
            >
              🎁 Invite Friends & Earn
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 8 }}>
              Share your personal invite link. When they complete a survey, you both earn bonuses!
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#ffffff",
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: "0.82rem",
                fontFamily: "monospace",
                border: "1px solid #e0e7ff",
              }}
            >
              <span style={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                {window.location.origin + user.referral_link}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: "4px 10px", fontSize: "0.75rem", whiteSpace: "nowrap" }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + user.referral_link);
                  alert("Link copied to clipboard!");
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {errorMsg && <div className="banner-error">{errorMsg}</div>}

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: "0.85rem", padding: "10px" }}
            onClick={() => navigate("/profile")}
          >
            📝 Edit Profile
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: "0.85rem", padding: "10px" }}
            onClick={() => navigate("/referrals")}
          >
            👥 My Referrals
          </button>
        </div>

        {/* Live Surveys Section */}
        <div style={{ marginBottom: 16 }}>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            📋 Live Surveys ({surveys.length})
          </h3>
        </div>

        {surveys.length === 0 ? (
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              padding: 32,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📭</div>
            <p style={{ margin: "0 0 6px", fontSize: "0.95rem", fontWeight: 600 }}>
              No Live Surveys Right Now
            </p>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              New paid surveys are posted regularly. Check back soon!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {surveys.map((survey) => {
              const isApproved = survey.eligibility === "approved";
              const isWaitlisted = survey.eligibility === "waitlisted";
              const alreadyJoined = survey.already_joined;
              const matchesInterests = survey.matches_interests;

              return (
                <div
                  key={survey.id}
                  style={{
                    backgroundColor: matchesInterests ? "#fffdf5" : "#ffffff",
                    border: matchesInterests
                      ? "1.5px solid #f59e0b"
                      : isApproved && !alreadyJoined
                      ? "1.5px solid var(--primary)"
                      : "1px solid var(--border-color)",
                    borderRadius: 10,
                    padding: 16,
                    textAlign: "left",
                    position: "relative",
                  }}
                >
                  {/* Matching Interests Highlight Ribbon */}
                  {matchesInterests && (
                    <div style={{ marginBottom: 8 }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          border: "1px solid #fde68a",
                        }}
                      >
                        ⭐ Matches Your Interests
                      </span>
                    </div>
                  )}

                  {/* Survey Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {survey.title}
                    </h4>
                    {getEligibilityBadge(survey.eligibility)}
                  </div>

                  {/* Description */}
                  {survey.description && (
                    <p
                      style={{
                        margin: "6px 0 10px",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {survey.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 10,
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>💰 ₹{survey.reward_amount}</span>
                    <span>
                      📊 {survey.filled}/{survey.quota} filled
                    </span>
                    <span>📅 Deadline: {new Date(survey.deadline).toLocaleDateString()}</span>
                    {survey.category && <span>🏷️ {survey.category}</span>}
                  </div>

                  {/* Eligibility Reason */}
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color:
                        survey.eligibility === "approved"
                          ? "var(--success)"
                          : survey.eligibility === "waitlisted"
                          ? "#b45309"
                          : "var(--text-muted)",
                      marginBottom: 10,
                      fontWeight: 500,
                    }}
                  >
                    {survey.eligibility_reason}
                  </div>

                  {/* Actions */}
                  {alreadyJoined ? (
                    <div
                      className="banner-info"
                      style={{ padding: 8, fontSize: "0.78rem", marginTop: 8 }}
                    >
                      Already joined • Status: <strong>{survey.participation_result}</strong>
                    </div>
                  ) : isApproved ? (
                    <button
                      className="btn btn-primary btn-block"
                      style={{ fontSize: "0.85rem", padding: "10px" }}
                      disabled={joining === survey.id}
                      onClick={() => handleJoinSurvey(survey.id)}
                    >
                      {joining === survey.id ? "Joining..." : "Join Survey →"}
                    </button>
                  ) : isWaitlisted ? (
                    <div>
                      <button
                        className="btn btn-secondary btn-block"
                        style={{
                          fontSize: "0.85rem",
                          padding: "10px",
                          border: "1px solid #f59e0b",
                          color: "#b45309",
                          backgroundColor: "#fffbeb",
                        }}
                        disabled={joining === survey.id}
                        onClick={() => handleJoinSurvey(survey.id)}
                      >
                        {joining === survey.id ? "Joining Waitlist..." : "Join Waitlist →"}
                      </button>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                          marginTop: 4,
                          textAlign: "center",
                        }}
                      >
                        Flexible criteria applied • Ops may approve as slots open
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
