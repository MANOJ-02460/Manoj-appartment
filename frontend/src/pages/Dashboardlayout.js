// src/pages/DashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';
import { currentUser } from '../Service/Auth';


export default function DashboardLayout() {
  const user = currentUser();

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <Navbar />
        <div className="content">
          {/* <h2>Welcome, {user?.name || user?.id}</h2> */}
          {/* Page content will load here */}
          <Outlet />
        </div>
      </div>
    </div>
  ); 
}
