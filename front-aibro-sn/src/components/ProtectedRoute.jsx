// src/components/ProtectedRoute.jsx
import React, { useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sidebar } from 'lucide-react';

// Layout component (move this to a separate file if needed)
export const Layout = ({ children }) => {
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

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-900 border-t-transparent"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, refreshAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Force check authentication on route access
    const checkAuth = async () => {
      if (!isAuthenticated && !isLoading) {
        console.log("Protected route: Not authenticated, redirecting to login");
        navigate('/login', { replace: true });
      }
    };
    
    checkAuth();
  }, [isAuthenticated, isLoading, navigate, refreshAuth]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log("Protected route: Loading auth state");
    return <LoadingSpinner />;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Protected route: Redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Render the route content if authenticated
  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;