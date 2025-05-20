import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight, Sparkles } from 'lucide-react';
import { useCurrentUser } from '../hooks/query/useUserQuery';
import { getAvatarUrl } from '../utils/imageUtils'; // Import the utility
import douLogo from '../assets/dou.svg';
import douPlusLogo from '../assets/dou-plus.svg';
import { useLanguage } from '../context/LanguageContext';

const Layout = ({ children }) => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);
  
  // Use React Query hook for current user
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  
  // Get the current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/feed')) return t('feed');
    if (path.startsWith('/workouts')) return t('workouts');
    if (path.startsWith('/coach')) return t('coach');
    if (path.startsWith('/profile')) return t('profile');
    return '';
  };
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Mock notifications data
  const notifications = [
    { id: 1, text: t('notification_comment'), time: '2m ago', read: false },
    { id: 2, text: t('notification_feature'), time: '1h ago', read: false },
    { id: 3, text: t('notification_like'), time: '3h ago', read: true },
  ];
  
  // Breadcrumbs based on current path
  const renderBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(segment => segment);
    
    if (segments.length <= 1) return null;
    
    return (
      <div className="flex items-center text-sm text-gray-400 mb-2">
        <span className="hover:text-gray-300 cursor-pointer">{t('home')}</span>
        {segments.map((segment, index) => (
          <span key={index} className="flex items-center">
            <ChevronRight className="mx-1 w-3 h-3" />
            <span className={`capitalize ${index === segments.length - 1 ? 'text-blue-400' : 'hover:text-gray-300 cursor-pointer'}`}>
              {t(segment)}
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
            <img src={douLogo} alt={t('app_name')} className="h-8" />
            <span className="text-xl text-gray-400 font-light">{getPageTitle()}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'w-64' : 'w-48'}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search')}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:ring-blue-500 focus:border-blue-500 transition-all"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
            
            {/* Upgrade button */}
            <div className="relative" onMouseEnter={() => setShowUpgradeTooltip(true)} onMouseLeave={() => setShowUpgradeTooltip(false)}>
              <button className="flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-purple-500/30 transition-all group">
                <img src={douPlusLogo} alt={`${t('app_name')}+`} className="h-5 mr-1.5" />
                <span className="text-xs font-medium bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300">{t('upgrade')}</span>
              </button>
              
              {showUpgradeTooltip && (
                <div className="absolute right-0 mt-2 w-64 p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-2xl z-50 text-xs text-gray-300">
                  {t('upgrade_description')}
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-gray-800/80 hover:bg-gray-700/80 transition-colors"
                aria-label={t('notifications')}
              >
                <Bell className="h-5 w-5 text-gray-300" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-700/50 flex justify-between items-center">
                    <h3 className="font-semibold text-white">{t('notifications')}</h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300">
                      {t('mark_all_read')}
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-3 hover:bg-gray-700/30 border-l-2 ${
                          notification.read ? 'border-transparent' : 'border-blue-500'
                        }`}
                      >
                        <p className="text-sm text-gray-300">{notification.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-700/50 text-center">
                    <button className="text-sm text-blue-400 hover:text-blue-300">
                      {t('view_all_notifications')}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile Button - Updated to use avatar */}
            <button 
              onClick={() => navigate('/profile')} 
              className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200 transform hover:scale-105"
              aria-label={t('profile')}
            >
              {userLoading ? (
                <span className="text-sm font-bold text-white">...</span>
              ) : currentUser && currentUser.avatar ? (
                <img 
                  src={getAvatarUrl(currentUser.avatar)} 
                  alt={currentUser.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {currentUser ? currentUser.username.substring(0, 2).toUpperCase() : '??'}
                </span>
              )}
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
              © 2025 {t('app_name')}. {t('all_rights_reserved')}
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">{t('terms')}</a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">{t('privacy')}</a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors">{t('help')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;