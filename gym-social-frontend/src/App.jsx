// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Feed from './components/Posts/Feed';
import WorkoutList from './components/Workouts/WorkoutList';
import Profile from './components/Profile/Profile';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Layout Component with Navigation
const Layout = ({ children }) => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex space-x-7">
              <a href="/" className="flex items-center py-4">
                <span className="font-semibold text-gray-800 text-lg">
                  ai.bros
                </span>
              </a>
              
              <div className="hidden md:flex items-center space-x-1">
                <a href="/" className="py-4 px-2 text-gray-800 hover:text-blue-600">
                  Feed
                </a>
                <a href="/workouts" className="py-4 px-2 text-gray-800 hover:text-blue-600">
                  Workouts
                </a>
                <a href="/profile" className="py-4 px-2 text-gray-800 hover:text-blue-600">
                  Profile
                </a>
              </div>
            </div>
            
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-800 hover:text-blue-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and is valid
    const token = localStorage.getItem('token');
    if (token) {
      // You could validate the token here if needed
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Feed />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts"
            element={
              <ProtectedRoute>
                <Layout>
                  <WorkoutList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl font-semibold">
                  404 - Page Not Found
                </div>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;