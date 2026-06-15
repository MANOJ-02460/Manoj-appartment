import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { BASE_URL } from './Components/Baseurl';

// Global fetch interceptor to automatically attach JWT tokens
const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  
  if (typeof resource === 'string' && resource.includes(BASE_URL)) {
    config = config || {};
    config.headers = config.headers || {};
    
    // Automatically retrieve the latest token from localStorage
    try {
      const authData = JSON.parse(localStorage.getItem("MY_ADMIN_AUTH"));
      if (authData && authData.token) {
        config.headers['Authorization'] = `Bearer ${authData.token}`;
      }
    } catch (e) {
      console.error("Failed to parse auth token", e);
    }
  }
  
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
