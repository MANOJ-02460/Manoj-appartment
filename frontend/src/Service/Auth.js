// src/Service/Auth.js
import axios from "axios";

import {BASE_URL} from "../Components/Baseurl";
const API_URL = BASE_URL;
const AUTH_KEY = "MY_ADMIN_AUTH";

// ✅ Save login info in localStorage
function saveAuth(user, token) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ ...user, token }));
}

// ✅ Get current user
export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

// ✅ Check if user is authenticated
export function isAuthenticated() {
  return !!localStorage.getItem(AUTH_KEY);
}

// ✅ Logout
export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

// ✅ Register new user
export async function register(user) {
  try {
    const res = await axios.post(`${API_URL}/registers`, user, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.data.success) {
      return { success: true, message: "Registered successfully" };
    } else {
      return { success: false, message: res.data.message || "Registration failed" };
    }
  } catch (err) {
    console.error("Register error:", err);
    return {
      success: false,
      message: err.response?.data?.message || "Server error",
    };
  }
}

// ✅ Login by email + password
export async function loginByName(role, email, password) {
  try {
    const res = await axios.post(
      `${API_URL}/logins`,
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.data.success) {
      const { user, token } = res.data;

      // ✅ Role check
      if (role && user.role !== role) {
        return { success: false, message: `Access denied for role: ${role}` };
      }

      saveAuth(user, token);
      return { success: true, message: "Login successful" };
    }

    return { success: false, message: res.data.message || "Invalid credentials" };
  } catch (err) {
    console.error("Login error:", err);
    return {
      success: false,
      message: err.response?.data?.message || "Server error",
    };
  }
}

// ✅ Send OTP to phone for login (Residents/Vendors)
export async function loginByPhone(role, phone) {
  try {
    const res = await axios.post(
      `${API_URL}/send-otp`,
      { phone, role },
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.data.success) {
      return { success: true, message: "OTP sent successfully" };
    }

    return { success: false, message: res.data.message || "Failed to send OTP" };
  } catch (err) {
    console.error("OTP send error:", err);
    return {
      success: false,
      message: err.response?.data?.message || "Server error",
    };
  }
}

// ✅ Verify OTP and complete login
export async function verifyOtpAndLogin(role, phone, otp) {
  try {
    const res = await axios.post(
      `${API_URL}/verify-otp`,
      { phone, otp, role },
      { headers: { "Content-Type": "application/json" } }
    );

    if (res.data.success) {
      const { user, token } = res.data;
      saveAuth(user, token);
      return { success: true, message: "Login successful" };
    }

    return { success: false, message: res.data.message || "Invalid OTP" };
  } catch (err) {
    console.error("OTP verify error:", err);
    return {
      success: false,
      message: err.response?.data?.message || "Server error",
    };
  }
}
