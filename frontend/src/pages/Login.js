import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { loginByName } from "../Service/Auth";
import "../Styles/Login.css";

export default function Login() {
  const { role } = useParams(); // admin / subadmin / resident / vendor
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // ✅ Valid email check (any domain, not just Gmail)
  const isValidEmail = (e) => /^[\w.+-]+@[\w-]+\.[\w.]+$/.test(e);

  // ✅ Login submit
  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!isValidEmail(email)) return setErr("Please enter a valid email address");
    if (!pw) return setErr("Password required");

    try {
      setLoading(true);
      const res = await loginByName(role?.toLowerCase(), email, pw);

      if (res.success) {
        alert("✅ Login successful!");
        nav("/dashboard");
      } else {
        setErr(res.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErr(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot password
  const handleForgotPassword = () => setShowForgotPopup(true);

  const handleResetSubmit = () => {
    if (!resetEmail) {
      alert("Please enter your registered email!");
      return;
    }
    alert(`📧 Password reset link sent to ${resetEmail}`);
    setShowForgotPopup(false);
    setResetEmail("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">{role} Login</h2>

        {/* Login Form */}
        <form onSubmit={submit} className="form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Enter password"
            required
          />

          {err && <div className="error">{err}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Links */}
        <div className="form-links">
          <span onClick={handleForgotPassword} className="forgot-link">
            Forgot Password?
          </span>
          <Link to={`/register/${role}`} className="register-link">
            Create Account
          </Link>
        </div>
      </div>

      {/* Forgot Password Popup */}
      {showForgotPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Reset Password</h3>
            <p>Enter your registered email address below:</p>
            <input
              type="email"
              placeholder="Enter email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
            <div className="popup-actions">
              <button onClick={handleResetSubmit} className="btn-primary">
                Send Reset Link
              </button>
              <button
                onClick={() => setShowForgotPopup(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
