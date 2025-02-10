// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, AuthContext } from './context/AuthContext';
// import { PostsProvider } from './pages/MainFeed/contexts/PostsContext';
// import { useContext } from 'react';
// import api from './api';

// // Pages
// import LoginPage from './pages/Login';
// import WorkoutsPage from './pages/Workouts';
// import FriendsPage from './pages/Friends';
// import SchedulePage from './pages/Schedule';
// import ProfilePage from './pages/Profile';
// import MainFeed from './pages/MainFeed';

// // Components
// import { Sidebar, Feed } from './components';

// // Layout component for consistent page structure
// const Layout = ({ children }) => {
//   const { logout } = useContext(AuthContext);
  
//   return (
//     <div className="flex min-h-screen bg-gray-900">
//       <Sidebar onLogout={logout} />
//       <main className="flex-1 ml-72 p-8">
//         {children}
//       </main>
//     </div>
//   );
// };

// // Protected Route wrapper
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated } = useContext(AuthContext);
  
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   return <Layout>{children}</Layout>;
// };

// // Original Feed component wrapper (kept for reference or reuse)
// const FeedPage = () => {
//   const [posts, setPosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetchPosts();
//   }, []);

//   const fetchPosts = async () => {
//     try {
//       const response = await api.get('/posts/feed/');
//       setPosts(Array.isArray(response.data) ? response.data : []);
//     } catch (err) {
//       setError('Failed to load posts');
//       console.error('Error fetching posts:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Feed 
//       posts={posts} 
//       loading={loading} 
//       error={error} 
//       onUpdatePost={setPosts}
//     />
//   );
// };

// // Main App component
// function App() {
//   return (
//     <AuthProvider>
//       <PostsProvider>
//         <Router>
//           <Routes>
//             {/* Public route */}
//             <Route path="/login" element={<LoginPage />} />

//             {/* Protected routes */}
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <Navigate to="/feed" replace />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/feed"
//               element={
//                 <ProtectedRoute>
//                   <MainFeed />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/workouts"
//               element={
//                 <ProtectedRoute>
//                   <WorkoutsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/friends"
//               element={
//                 <ProtectedRoute>
//                   <FriendsPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/schedule"
//               element={
//                 <ProtectedRoute>
//                   <SchedulePage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/profile"
//               element={
//                 <ProtectedRoute>
//                   <ProfilePage />
//                 </ProtectedRoute>
//               }
//             />
//             {/* Add route for original feed if needed */}
//             <Route
//               path="/feed/posts"
//               element={
//                 <ProtectedRoute>
//                   <FeedPage />
//                 </ProtectedRoute>
//               }
//             />
//           </Routes>
//         </Router>
//       </PostsProvider>
//     </AuthProvider>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { PostsProvider } from './pages/MainFeed/contexts/PostsContext';
import { WorkoutProvider } from './pages/Workouts/contexts/WorkoutContext';
import { useContext } from 'react';
import api from './api';

// Pages
import LoginPage from './pages/Login';
import WorkoutsPage from './pages/Workouts';
import FriendsPage from './pages/Friends';
import CoachPage from './pages/Coach';
import ProfilePage from './pages/Profile';
import MainFeed from './pages/MainFeed';

// Components
import { Sidebar, Feed } from './components';

// Layout and other components remain the same...
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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const FeedPage = () => {
  // FeedPage implementation remains the same...
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
      <PostsProvider>
        <WorkoutProvider>
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
        </WorkoutProvider>
      </PostsProvider>
    </AuthProvider>
  );
}

export default App;