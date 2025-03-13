import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PostsProvider } from './pages/MainFeed/contexts/PostsContext';
import { useContext } from 'react';
import { postService } from './api/services';

// Pages
import LoginPage from './pages/Login';
import WorkoutsSpace from './pages/Workouts';
import CoachPage from './pages/Coach';
import ProfilePage from './pages/Profile';
import MainFeed from './pages/MainFeed';
import UserPostsPage from './pages/Profile/components/UserPostsPage';

// Updated Components
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';

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
              <Route
                path="/users/:username/posts"
                element={
                  <ProtectedRoute>
                    <UserPostsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
      </PostsProvider>
    </AuthProvider>
  );
}

export default App;