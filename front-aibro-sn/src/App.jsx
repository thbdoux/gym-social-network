import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PostsProvider } from './pages/MainFeed/contexts/PostsContext';
import { useContext } from 'react';
import { postService } from './api/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Pages
import LoginPage from './pages/Login';
import WorkoutsSpace from './pages/Workouts';
import CoachPage from './pages/Coach';
import ProfilePage from './pages/Profile';
import MainFeed from './pages/MainFeed';

// Updated Components
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';

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
  const { isAuthenticated, logout } = useContext(AuthContext);
  
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

// Feed page implementation
const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const fetchedPosts = await postService.getFeed();
      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Import the Feed component dynamically to avoid circular dependencies
  const Feed = React.lazy(() => import('./components/Feed'));

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Feed 
        posts={posts} 
        loading={loading} 
        error={error} 
        onUpdatePost={setPosts}
      />
    </React.Suspense>
  );
};

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PostsProvider>
          <Router>
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
                path="/feed/posts"
                element={
                  <ProtectedRoute>
                    <FeedPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </PostsProvider>
      </AuthProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} position="bottom-right" /> */}
    </QueryClientProvider>
  );
}

export default App;