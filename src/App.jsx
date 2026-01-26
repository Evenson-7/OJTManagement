// src/App.jsx
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import LoadingScreen from './components/LoadingScreen'; // <-- 1. Import your new component

// We no longer need the separate ProtectedRoute component
// It's cleaner to handle it all here.

function App() {
  const { isAuthenticated, loading } = useAuth();

  // 2. If the auth state is still loading (e.g., on a refresh), 
  //    show the beautiful loading screen.
  if (loading) {
    return <LoadingScreen />;
  }

  // 3. Once loading is false, then we render the routes
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        
        {/* Auth Route (Login/Register) */}
        <Route 
          path="/" 
          element={
            // If logged in, don't show Auth, redirect to Dashboard
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />
          } 
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            // If not logged in, don't show Dashboard, redirect to Auth
            isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;