import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { loginByPhone, verifyOtpAndLogin } from '../Service/Auth';
import '../Styles/Otplogin.css';

export default function OTPLogin() {
  const { role } = useParams();
  const nav = useNavigate();

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ✅ Send OTP
  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^\d{10,}$/.test(phone)) {
      setError('Enter a valid phone number (digits only)');
      return;
    }

    try {
      const res = await loginByPhone(role, phone);
      if (res.success) {
        setOtpSent(true);
        setMessage('✅ OTP sent successfully');
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error(err);
      setError('Server error while sending OTP');
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otp) {
      setError('Enter the OTP');
      return;
    }

    try {
      const res = await verifyOtpAndLogin(role, phone, otp);
      if (res.success) {
        setMessage('✅ Login successful! Redirecting...');
        setTimeout(() => nav('/dashboard'), 1000);
      } else {
        setError(res.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error(err);
      setError('Server error while verifying OTP');
    }
  };

  return (
    <div className="otp-login-container">
      <div className="otp-login-card">
        <h2>{role} OTP Login</h2>

        {/* Phone Input */}
        {!otpSent && (
          <form className="form" onSubmit={sendOtp}>
            <label>Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
            />
            <button className="btn-primary" type="submit">Send OTP</button>
          </form>
        )}

        {/* OTP Verification */}
        {otpSent && (
          <form className="form" onSubmit={verifyOtp}>
            <label>Enter OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              required
            />
            <button className="btn-primary" type="submit">Verify OTP</button>
          </form>
        )}

        {/* Messages */}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Register Link */}
        <div className="extra-links">
          <Link to={`/register/${role}`}>Create Account</Link>
        </div>
      </div>
    </div>
  );
}
