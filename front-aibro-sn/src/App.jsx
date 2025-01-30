// // src/App.jsx
// import React, { useState, useEffect, useContext } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { Sidebar, Layout } from './components';
// import { LoginPage, WorkoutsPage, FriendsPage, SchedulePage, ProfilePage } from './pages';
// import { Feed } from './components';
// import { AuthProvider, AuthContext } from './context/AuthContext';
// import api from './api';

// // Main content component
// const MainContent = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const { logout } = useContext(AuthContext);

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async () => {
//     setLoading(true);
//     try {
//       const response = await api.get('/posts/feed/');
//       setPosts(response.data);
//     } catch (err) {
//       setError('Failed to fetch posts');
//       console.error('Error fetching posts:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex">
//       <Sidebar onLogout={logout} />
//       <Layout>
//         <Routes>
//           <Route 
//             path="/" 
//             element={<Navigate to="/feed" replace />} 
//           />
//           <Route 
//             path="/feed" 
//             element={<Feed posts={posts} loading={loading} error={error} onUpdatePost={setPosts} />} 
//           />
//           <Route path="/workouts" element={<WorkoutsPage />} />
//           <Route path="/friends" element={<FriendsPage />} />
//           <Route path="/schedule" element={<SchedulePage />} />
//           <Route path="/profile" element={<ProfilePage />} />
//         </Routes>
//       </Layout>
//     </div>
//   );
// };

// // Protected Route component
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated } = useContext(AuthContext);
  
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// };

// // App component
// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           <Route path="/login" element={<LoginPage />} />
//           <Route
//             path="/*"
//             element={
//               <ProtectedRoute>
//                 <MainContent />
//               </ProtectedRoute>
//             }
//           />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import api from './api';

// Pages
import LoginPage from './pages/Login';
import WorkoutsPage from './pages/Workouts';
import FriendsPage from './pages/Friends';
import SchedulePage from './pages/Schedule';
import ProfilePage from './pages/Profile';

// Components
import { Sidebar, Feed } from './components';

// Layout component for consistent page structure
const Layout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar onLogout={logout} />
      <main className="flex-1 ml-72 p-8">
        {children}
      </main>
    </div>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Main Feed component with posts state
const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts/feed/');
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Feed 
      posts={posts} 
      loading={loading} 
      error={error} 
      onUpdatePost={setPosts}
    />
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
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
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts"
            element={
              <ProtectedRoute>
                <WorkoutsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <FriendsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <SchedulePage />
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
    </AuthProvider>
  );
}

export default App;