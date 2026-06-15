import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Authcards.css';

// Reusable Card Component
const Card = ({ title, subtitle, image, onClick }) => (
  <div className="auth-card" onClick={onClick}>
    <div className="card-image">
      <img src={image} alt={title} />
    </div>
    <div className="card-content">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  </div>
);

// Main Component
export default function AuthCards() {
  const nav = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-header">
        <h1>Select Login Type</h1>
        <p>Choose your role to continue</p>
      </div>

      <div className="cards-grid">
        <Card
          title="Admin"
          subtitle="Admin Login"
          image="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          onClick={() => nav('/login/admin')}
        />
        <Card
          title="Sub-Admin"
          subtitle="Sub Admin Login"
          image="https://cdn-icons-png.flaticon.com/512/219/219983.png"
          onClick={() => nav('/login/subadmin')} 
        />
        <Card
          title="Resident"
          subtitle="Login via OTP"
          image="https://cdn-icons-png.flaticon.com/512/1256/1256650.png"
          onClick={() => nav('/otp-login/resident')}
        />
        <Card
          title="Vendor"
          subtitle="Login via OTP"
          image="https://cdn-icons-png.flaticon.com/512/1077/1077012.png"
          onClick={() => nav('/otp-login/vendor')}
        />
      </div>
    </div>
  );
}
