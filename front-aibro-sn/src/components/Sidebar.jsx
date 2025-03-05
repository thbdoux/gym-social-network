import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Dumbbell, 
  Sparkles, 
  User, 
  LogOut
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const navItems = [
    { 
      id: 'feed', 
      label: 'Feed', 
      icon: Home, 
      path: '/feed',
      description: 'See what your friends are up to'
    },
    { 
      id: 'workouts', 
      label: 'Workouts', 
      icon: Dumbbell, 
      path: '/workouts',
      description: 'Manage your workout plans'
    },
    { 
      id: 'coach', 
      label: 'Coach', 
      icon: Sparkles, 
      path: '/coach',
      description: 'Get AI-powered guidance'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: '/profile',
      description: 'View and edit your profile'
    },
  ];

  // Check for active path including child routes
  const isActivePath = (path) => {
    return location.pathname.startsWith(path);
  };
  
  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  // Navigation handler that also closes mobile menu
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };
  
  // Render the desktop sidebar (thin version)
  const renderDesktopSidebar = () => (
    <div className="hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r border-white/[0.08] shadow-xl shadow-black/20 bg-gray-900 z-30 w-16">
      <div className="flex-1 mt-14 flex flex-col justify-between">
        <nav className="space-y-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-center rounded-xl p-3 transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white' 
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                title={item.label}
              >
                <div className={`p-2 rounded-lg transform transition-all duration-200 group-hover:scale-110 ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800'}`}>
                  <Icon className="w-5 h-5 transform transition-all duration-200 group-hover:translate-y-[-2px]" />
                </div>
              </button>
            );
          })}
        </nav>
        
        <div className="px-2 mb-6">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center rounded-xl p-3 text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-all duration-200"
            title="Logout"
          >
            <div className="p-2 rounded-lg bg-gray-800 transform transition-all duration-200 hover:scale-110">
              <LogOut className="w-5 h-5 transform transition-all duration-200 hover:translate-y-[-2px]" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
  
  // Mobile header and menu
  const renderMobileHeader = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex justify-between items-center lg:hidden">
      <div className="flex items-center space-x-2">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          GymBro
        </div>
        <div className="text-sm text-gray-400">
          {getPageTitle()}
        </div>
      </div>
      <button 
        onClick={toggleMobileMenu}
        className="p-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
      >
        <span className="sr-only">Open menu</span>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
    </div>
  );
  
  // Helper function to get page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/feed')) return 'Feed';
    if (path.startsWith('/workouts')) return 'Workout Space';
    if (path.startsWith('/coach')) return 'Coach';
    if (path.startsWith('/profile')) return 'Profile';
    return '';
  };
  
  // Render the mobile menu overlay
  const renderMobileMenu = () => (
    <div className={`fixed inset-0 bg-gray-900/95 z-40 lg:hidden transition-opacity duration-300 ${
      mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className="flex flex-col h-full pt-16 pb-6 px-4">
        <div className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 p-3 rounded-xl text-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-4 border-blue-500' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start">
                  <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>{item.label}</span>
                  <span className="text-xs text-gray-500">{item.description}</span>
                </div>
              </button>
            );
          })}
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center gap-3 p-3 rounded-xl text-lg transition-all duration-200 text-gray-400 hover:bg-red-600/10 hover:text-red-400"
        >
          <div className="p-2 rounded-lg bg-gray-800">
            <LogOut className="w-5 h-5" />
          </div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
  
  return (
    <>
      {renderDesktopSidebar()}
      {isMobile && renderMobileHeader()}
      {isMobile && renderMobileMenu()}
    </>
  );
};

export default Sidebar;