import React, { useState, useEffect } from "react";
import { currentUser } from "../Service/Auth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaBell,
  FaEnvelope,
  FaWrench,
} from "react-icons/fa";
import "../Styles/Navbar.css";
const BASE_URL = "http://localhost:4000";

export default function Navbar() {
  const user = currentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadServices, setUnreadServices] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchCounts = async () => {
    try {
      const notifRes = await fetch(`${BASE_URL}/allnotifications`);
      const notifData = await notifRes.json();
      const notifList = Array.isArray(notifData)
        ? notifData
        : notifData.notifications || notifData.data || [];

      const serviceRes = await fetch(`${BASE_URL}/allservices`);
      const serviceData = await serviceRes.json();

      let serviceList = [];
      if (Array.isArray(serviceData)) {
        serviceList = serviceData;
      } else if (Array.isArray(serviceData.data)) {
        serviceList = serviceData.data;
      } else if (Array.isArray(serviceData.services)) {
        serviceList = serviceData.services;
      } else if (Array.isArray(serviceData.requests)) {
        serviceList = serviceData.requests;
      }

      const unreadServiceCount = serviceList.filter(s => s.read === false).length;
      const unreadNotifCount = notifList.filter(n => !n.is_read && !n.read).length;

      setUnreadNotifications(unreadNotifCount);
      setUnreadServices(unreadServiceCount);
    } catch (err) {
      console.error("Error fetching counts:", err);
      setUnreadNotifications(0);
      setUnreadServices(0);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    const handleNotificationUpdate = () => fetchCounts();
    window.addEventListener("notificationUpdated", handleNotificationUpdate);
    return () => window.removeEventListener("notificationUpdated", handleNotificationUpdate);
  }, []);

  useEffect(() => {
    const handleServiceUpdate = () => fetchCounts();
    window.addEventListener("serviceUpdated", handleServiceUpdate);
    return () => window.removeEventListener("serviceUpdated", handleServiceUpdate);
  }, []);

  const handleNavigate = (path) => {
    setShowDropdown(false);
    navigate(`/dashboard/${path}`);
  };

  const handleNotificationClick = () => {
    setShowDropdown(false);
    navigate("/dashboard/notifications", { state: { activeTab: "received" } });
  };

  return (
    <div className="navbar-container">
      <div className="navbar-title"></div>

      <div className="navbar-right">
        <div className="notification-wrapper">
          <FaBell
            className="notification-icon"
            onClick={() => setShowDropdown(prev => !prev)}
            aria-label="Toggle Notifications Dropdown"
            tabIndex={0}
            role="button"
            onKeyPress={e => e.key === "Enter" && setShowDropdown(prev => !prev)}
          />
          {(unreadNotifications + unreadServices) > 0 && (
            <span className="notification-badges">
              {unreadNotifications > 0 && <span className="badge red" />}
              {unreadServices > 0 && <span className="badge green" />}
            </span>
          )}

          {showDropdown && (
            <div className="dropdown-menu">
              <div
                onClick={handleNotificationClick}
                className="dropdown-item"
                role="button"
                tabIndex={0}
                onKeyPress={e => e.key === "Enter" && handleNotificationClick()}
              >
                <FaEnvelope className="dropdown-icon red" />
                Notifications
                <span className={`count ${unreadNotifications > 0 ? "red" : "gray"}`}>
                  {unreadNotifications}
                </span>
              </div>

              <div
                onClick={() => handleNavigate("service-requests")}
                className="dropdown-item"
                role="button"
                tabIndex={0}
                onKeyPress={e => e.key === "Enter" && handleNavigate("service-requests")}
              >
                <FaWrench className="dropdown-icon green" />
                Service Requests
                <span className={`count ${unreadServices > 0 ? "green" : "gray"}`}>
                  {unreadServices}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="user-name">{user?.name || "User"}</div>
      </div>
    </div>
  );
}
