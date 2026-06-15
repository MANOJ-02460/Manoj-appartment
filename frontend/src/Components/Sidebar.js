// Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../Service/Auth';
import '../Styles/Sidebar.css';
import {
  FaTachometerAlt,
  FaBuilding,
  FaHome,
  FaUsers,
  FaTools,
  FaClipboardList,
  FaClock,
  FaComments,
  FaDollarSign,
  FaBell,
  FaFileAlt,
  FaSignOutAlt,
  FaBars,
  FaCreditCard
} from 'react-icons/fa';

export default function Sidebar() {
  const nav = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // toggle for tablet/mobile sidebar

  const goLogout = () => {
    logout();
    nav('/');
  };

  const menuItems = [
    { label: 'Dashboard', icon: FaTachometerAlt, path: '/dashboard' },
    { label: 'Community', icon: FaBuilding, path: '/dashboard/community' },
    { label: 'Flats', icon: FaHome, path: '/dashboard/flats' },
    { label: 'Residents', icon: FaUsers, path: '/dashboard/residents' },
    { label: 'Vendors', icon: FaTools, path: '/dashboard/vendors' },
    { label: 'Notifications', icon: FaBell, path: '/dashboard/notifications' },
    { label: 'Service Requests', icon: FaClipboardList, path: '/dashboard/service-requests' },
    { label: 'Expenses', icon: FaDollarSign, path: '/dashboard/expenses' },
    { label: 'Payments', icon: FaCreditCard, path: '/dashboard/payments' },
    { label: 'Feedback', icon: FaComments, path: '/dashboard/feedback' },
    { label: 'Timeline', icon: FaClock, path: '/dashboard/timeline' },
    { label: 'Audit Logs', icon: FaFileAlt, path: '/dashboard/audit-logs' },
    
    
  ];

  return (
    <>
      {/* Toggle button visible on tablet and mobile */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Toggle Sidebar"
      >
        <FaBars size={24} />
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="logo">
          <img src="/vblp.png" alt="logo" />
        </div>

        <ul className="menu">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={index}
                className={activeIndex === index ? 'active' : ''}
                onClick={() => {
                  setActiveIndex(index);
                  nav(item.path);
                  setIsOpen(false); // Close sidebar on menu click for small screens
                }}
              >
                <Icon className="menu-icon" />
                <span className="menu-label">{item.label}</span>
              </li>
            );
          })}
        </ul>

        <div
          className="logout"
          onClick={() => {
            goLogout();
            setIsOpen(false);
          }}
        >
          <FaSignOutAlt className="menu-icon" />
          <span className="menu-label">Logout</span>
        </div>
      </div>
    </>
  );
}
