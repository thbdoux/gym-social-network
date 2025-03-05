import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../src/api';
import { getAvatarUrl } from '../../src/utils/imageUtils';
import { Bell, Search, ChevronRight } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Get the current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/feed')) return 'Feed';
    if (path.startsWith('/workouts')) return 'Workouts';
    if (path.startsWith('/coach')) return 'Coach';
    if (path.startsWith('/profile')) return 'Profile';
    return 'GymBro';
  };
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/users/me/');
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Mock notifications data
  const notifications = [
    { id: 1, text: 'John commented on your workout', time: '2m ago', read: false },
    { id: 2, text: 'New feature: AI workout suggestions', time: '1h ago', read: false },
    { id: 3, text: 'Sarah liked your progress photo', time: '3h ago', read: true },
  ];
  
  // Breadcrumbs based on current path
  const renderBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(segment => segment);
    
    if (segments.length <= 1) return null;
    
    return (
      <div className="flex items-center text-sm text-gray-400 mb-2">
        <span className="hover:text-gray-300 cursor-pointer">Home</span>
        {segments.map((segment, index) => (
          <span key={index} className="flex items-center">
            <ChevronRight className="mx-1 w-3 h-3" />
            <span className={`capitalize ${index === segments.length - 1 ? 'text-blue-400' : 'hover:text-gray-300 cursor-pointer'}`}>
              {segment}
            </span>
          </span>
        ))}
      </div>
    );
  };
  
  useEffect(() => {
    // When sidebar collapses, we need to adjust the main content area
    const handleSidebarChange = () => {
      const sidebarElement = document.querySelector('.sidebar-container');
      if (sidebarElement) {
        const isCollapsed = sidebarElement.classList.contains('sidebar-collapsed');
        document.documentElement.style.setProperty(
          '--sidebar-width', 
          isCollapsed ? '5rem' : '18rem'
        );
      }
    };
    
    // Set up event listeners for sidebar changes
    window.addEventListener('sidebarchange', handleSidebarChange);
    
    return () => {
      window.removeEventListener('sidebarchange', handleSidebarChange);
    };
  }, []);
  
  return (
    <div 
      className={`min-h-screen bg-gray-900 text-gray-100 transition-all duration-300 ${
        isMobile ? 'ml-0 pt-14' : 'lg:ml-16'
      }`}
    >
      {/* Top header for desktop */}
      <div className="hidden lg:block sticky top-0 z-10 backdrop-blur-md bg-gray-900/80 border-b border-gray-800/50">
        <div className="container mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">GymBro</h1>
            <span className="text-xl text-gray-400 font-light">{getPageTitle()}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'w-64' : 'w-48'}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-blue-500 focus:border-blue-500 transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-300" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300">
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-3 hover:bg-gray-700/50 border-l-2 ${
                          notification.read ? 'border-transparent' : 'border-blue-500'
                        }`}
                      >
                        <p className="text-sm text-gray-300">{notification.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-700 text-center">
                    <button className="text-sm text-blue-400 hover:text-blue-300">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => navigate('/profile')} 
              className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-sm font-bold text-white">
                {currentUser ? currentUser.username.substring(0, 2).toUpperCase() : '...'}
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative">
          {/* Visual elements for decoration */}
          <div className="absolute -top-10 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"></div>
          
          {/* Actual content */}
          <div className="relative">
            {children}
          </div>
        </div>
      </div>

      {/* Footer with subtle design */}
      <footer className="mt-12 border-t border-gray-800/50 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © 2025 GymBro. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">Terms</a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">Privacy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;