import React, { useEffect, useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { PostsProvider } from './pages/MainFeed/contexts/PostsContext';
import { WorkoutProvider } from './pages/Workouts/contexts/WorkoutContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AUTH_ERROR_EVENT } from './api';

// Components
import { Sidebar } from './components';

// Lazy load pages for better initial load performance
const LoginPage = lazy(() => import('./pages/Login'));
const MainFeed = lazy(() => import('./pages/MainFeed'));
const WorkoutsSpace = lazy(() => import('./pages/Workouts'));
const CoachPage = lazy(() => import('./pages/Coach'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const UserPostsPage = lazy(() => import('./pages/Profile/components/UserPostsPage'));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent"></div>
  </div>
);

// Layout component
const Layout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar onLogout={logout} />
      <main className="flex-1 ml-72 p-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useContext(AuthContext);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Main App component
function App() {
  // Listen for auth errors globally
  useEffect(() => {
    const handleAuthError = () => {
      // Redirect to login
      window.location.href = '/login';
    };
    
    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    
    return () => {
      window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <PostsProvider>
            <WorkoutProvider>
              <Router>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Public route */}
                    <Route path="/login" element={<LoginPage />} />

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
                    <Route
                      path="/users/:username/posts"
                      element={
                        <ProtectedRoute>
                          <UserPostsPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Catch-all route */}
                    <Route
                      path="*"
                      element={
                        <ProtectedRoute>
                          <div className="text-center py-12">
                            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
                            <p>The page you're looking for doesn't exist or has been moved.</p>
                          </div>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </Router>
            </WorkoutProvider>
          </PostsProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;