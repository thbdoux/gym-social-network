import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Dumbbell, 
  Sparkles, 
  User, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import douLogo from '../assets/dou.svg';
import douPlusLogo from '../assets/dou-plus.svg';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  
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
      <div className="flex-1 flex flex-col justify-between">
        {/* Logo at top */}
        <div className="mt-6 mb-12 flex justify-center">
          <img src={douLogo} alt="dou logo" className="h-10" />
        </div>
        
        <nav className="space-y-6 px-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <div key={item.id} className="relative group" onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-center rounded-xl p-3 transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white' 
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
                    }`}
                  aria-label={item.label}
                >
                  <div className={`p-2 rounded-lg transform transition-all duration-200 group-hover:scale-110 ${
                    isActive ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400' : 'bg-gray-800/80'
                  }`}>
                    <Icon className="w-5 h-5 transform transition-all duration-300 group-hover:translate-y-[-2px]" />
                  </div>
                </button>
                
                {/* Tooltip that appears on hover */}
                {hoveredItem === item.id && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700/30 shadow-lg z-50 w-36 text-left">
                    <div className="font-medium text-white text-sm">{item.label}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{item.description}</div>
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 transform rotate-45 w-2 h-2 bg-gray-800"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        <div className="mb-6 space-y-4 px-2">
          {/* Upgrade button */}
          <div className="relative">
            <button
              onClick={() => setShowUpgradePopup(!showUpgradePopup)}
              className="w-full flex items-center justify-center rounded-xl p-3 text-purple-300 hover:bg-purple-600/10 transition-all duration-200 group"
              aria-label="Upgrade to dou+"
            >
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30 transform transition-all duration-200 group-hover:scale-110">
                <img src={douPlusLogo} alt="dou+" className="w-5 h-5" />
              </div>
            </button>
            
            {showUpgradePopup && (
              <div className="absolute left-full ml-2 bottom-0 bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700/30 shadow-lg z-50 w-64">
                <div className="flex items-center mb-2">
                  <img src={douPlusLogo} alt="dou+ logo" className="h-5 mr-2" />
                  <span className="font-medium text-sm text-white">Upgrade to dou+</span>
                </div>
                <p className="text-gray-300 text-xs mb-3">Get unlimited workouts, advanced analytics, and premium features.</p>
                <button className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center">
                  <span>Upgrade now</span>
                  <ChevronRight size={14} className="ml-1" />
                </button>
                <div className="absolute left-0 top-4 -translate-x-1/2 transform rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            )}
          </div>
          
          {/* Logout button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center rounded-xl p-3 text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-all duration-200 group"
            aria-label="Logout"
          >
            <div className="p-2 rounded-lg bg-gray-800/80 transform transition-all duration-200 group-hover:scale-110">
              <LogOut className="w-5 h-5 transform transition-all duration-200 group-hover:translate-y-[-2px]" />
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
        <img src={douLogo} alt="dou logo" className="h-8" />
        <div className="text-sm text-gray-400">
          {getPageTitle()}
        </div>
      </div>
      <div className="flex items-center">
        <button 
          className="mr-4 flex items-center px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-purple-500/30"
        >
          <img src={douPlusLogo} alt="dou+ logo" className="h-4 mr-1" />
          <span className="text-xs text-purple-300">Upgrade</span>
        </button>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg bg-gray-800/80 text-gray-200 hover:bg-gray-700/80 transition-colors"
        >
          <span className="sr-only">Open menu</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
    </div>
  );
  
  // Helper function to get page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/feed')) return 'Feed';
    if (path.startsWith('/workouts')) return 'Workouts';
    if (path.startsWith('/coach')) return 'Coach';
    if (path.startsWith('/profile')) return 'Profile';
    return '';
  };
  
  // Render the mobile menu overlay with enhanced animations
  const renderMobileMenu = () => (
    <div className={`fixed inset-0 bg-gray-900/98 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300 ${
      mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div className="flex flex-col h-full pt-16 pb-6 px-4">
        <div className="flex-1 flex flex-col gap-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 p-3 rounded-xl text-lg transition-all duration-300 
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-500' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                  }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  opacity: mobileMenuOpen ? 1 : 0,
                  transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 300ms, transform 300ms'
                }}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/80'}`}>
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
        
        {/* Upgrade button */}
        <div 
          className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-purple-500/20"
          style={{
            opacity: mobileMenuOpen ? 1 : 0,
            transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 500ms, transform 500ms'
          }}
        >
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30">
            <img src={douPlusLogo} alt="dou+ logo" className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-purple-300">Upgrade to dou+</span>
            <span className="text-xs text-gray-400">Unlock premium features</span>
          </div>
        </div>
        
        {/* Logout button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 p-3 mt-2 rounded-xl text-lg transition-all duration-200 text-gray-400 hover:bg-red-600/10 hover:text-red-400"
          style={{
            opacity: mobileMenuOpen ? 1 : 0,
            transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 600ms, transform 600ms'
          }}
        >
          <div className="p-2 rounded-lg bg-gray-800/80">
            <LogOut className="w-5 h-5" />
          </div>
          <span>Logout</span>
        </button>
      </div>
      
      {/* Close button */}
      <button 
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 hover:text-white transition-colors"
        onClick={toggleMobileMenu}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
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