import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Pages
import LoginPage from './pages/Login';
import WorkoutsSpace from './pages/Workouts';
import CoachPage from './pages/Coach';
import ProfilePage from './pages/Profile';
import MainFeed from './pages/MainFeed';
import PersonalityPathWizard from './components/PersonalityPathWizard';

// Updated Components
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import { useAuth } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';
import { useCurrentUser } from './hooks/query/useUserQuery';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ProtectedRoute component that includes both Sidebar and Layout
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Sidebar onLogout={logout} />
      <Layout>{children}</Layout>
    </>
  );
};

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Registration flow - personality path is now part of registration */}
            <Route path="/register" element={<PersonalityPathWizard isRegistrationFlow={true} />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/feed" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <MainFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <WorkoutsSpace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coach"
              element={
                <ProtectedRoute>
                  <CoachPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </LanguageProvider>
      {/* Uncomment for development */}
      {/* <ReactQueryDevtools initialIsOpen={false} position="bottom-right" /> */}
    </QueryClientProvider>
  );
}

export default App;