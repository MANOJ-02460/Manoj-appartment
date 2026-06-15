import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { register } from "../Service/Auth";
import "../Styles/Register.css";
import { BASE_URL } from "../Components/Baseurl";

export default function Register() {
  const { role } = useParams(); // role: admin / subadmin / resident / vendor
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Validation functions
  const onlyLetters = (n) => /^[A-Za-z ]+$/.test(n); // Letters + spaces allowed
  const isGmail = (e) => /^[\w.+-]+@gmail\.com$/.test(e); // Must be Gmail
  const onlyDigits = (p) => /^\d+$/.test(p); // Only digits

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    // 🔍 Validation
    if (!onlyLetters(name)) return setErr("Name must contain letters only");
    if (!isGmail(email)) return setErr("Email must be a gmail.com address");
    if (!onlyDigits(phone)) return setErr("Phone must contain digits only");
    if (pw.length < 4) return setErr("Password must be at least 4 characters long");
    if (pw !== pw2) return setErr("Passwords do not match");

    try {
      setLoading(true);

      // ✅ Normalize role (remove hyphens, lowercase)
      const normalizedRole = role?.toLowerCase().replace("-", "");

      const data = await register({
        name,
        email,
        phone,
        password: pw,
        role: normalizedRole,
      });

      if (data.success) {
        alert("🎉 Registration successful!");

        // ✅ Redirect based on role
        if (normalizedRole === "resident") {
          nav("/otp-login/resident");
        } else {
          nav(`/login/${normalizedRole}`);
        }
      } else {
        setErr(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error:", error);
      setErr(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Create Account</h2>
        <p className="role-text">for {role}</p>

        <form onSubmit={submit}>
          <label>Name:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (letters only)"
            required
          />

          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@gmail.com"
            required
          />

          <label>Phone:</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Digits only"
            required
          />

          <label>Password:</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Enter password"
            required
          />

          <label>Confirm Password:</label>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Confirm password"
            required
          />

          {err && <div className="error">{err}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="login-link">
          <p>Already have an account?</p>
          <Link
            to={`/login/${role?.toLowerCase().replace("-", "")}`}
            className="login-btn"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
