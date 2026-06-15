import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthCards from './Components/Authcards';
import Login from './pages/Login';
import OTPLogin from './pages/Otplogin';
import Register from './pages/Register';
import DashboardLayout from './pages/Dashboardlayout';
import DashboardHome from './pages/Dashboard';
import Community from './pages/Community';
import Flat from './pages/Flat';
import Resident from './pages/Resident';
import Vendor from './pages/Vendor';
import Servicerequest from './pages/Servicerequest';
import Timeline from './pages/Timeline';
import Feedback from './pages/Feedback';
import Expense from './pages/Expenses/ExpensesContainer';
import Notification from './pages/Notification';
import AuditLog from './pages/Auditlog';
import Payments from './pages/Payments';
import { isAuthenticated } from './Service/Auth';
import './App.css'

function Protected({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AuthCards />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/otp-login/:role" element={<OTPLogin />} />
      <Route path="/register/:role" element={<Register />} />

      {/* Protected layout for dashboard */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="community" element={<Community />} />
        <Route path="flats" element={<Flat />} />
        <Route path="residents" element={<Resident />} />
        <Route path="vendors" element={<Vendor />} />
        <Route path="notifications" element={<Notification />} />
        <Route path="service-requests" element={<Servicerequest />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="expenses" element={<Expense />} />
        <Route path="payments" element={<Payments />} />
        
        <Route path="audit-logs" element={<AuditLog />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
