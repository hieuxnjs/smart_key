import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// ====================================================
// Strict Authentication & Global Axios 401 Interceptor
// ====================================================

// 1. Setup Axios response interceptor for automatic 401 session expiry handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[Auth] Received 401 Unauthorized. Clearing session and redirecting to /login...');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 2. Strict Token Validator (sessionStorage-based: defaults to requiring login whenever the web is opened)
export const isTokenValid = () => {
  const token = sessionStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return false;
    }
    return true;
  } catch {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return false;
  }
};

// 3. Strict Private Route Guard
function PrivateRoute({ children }) {
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ====================================================
// Root Application Router
// ====================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Strictly Protected Dashboard Route */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* Default fallback route always redirects to /login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
