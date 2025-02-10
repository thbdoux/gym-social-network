import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Users, Calendar, Sparkles, User, LogOut } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home, path: '/feed' },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/workouts' },
    { id: 'friends', label: 'Friends', icon: Users, path: '/friends' },
    { id: 'coach', label: 'Coach', icon: Sparkles, path: '/coach' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="w-72 h-screen fixed left-0 top-0 border-r border-white/[0.08] shadow-xl shadow-black/20">
      <div className="p-6 border-b border-white/[0.08]">
        <h1 className="text-3xl font-bold text-white">GymBro</h1>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-4 px-6 py-4 text-lg transition-all duration-200
                ${isActive 
                  ? 'bg-white/[0.06] text-white border-r-2 border-blue-500' 
                  : 'text-gray-400 bg-gray-900 hover:bg-white/[0.03] hover:text-white'}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-blue-500' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="w-full flex items-center bg-gray-900 space-x-4 px-6 py-4 text-lg text-red-400 hover:bg-white/[0.03] hover:text-red-300 mt-6 transition-all duration-200"
        >
          <LogOut className="w-6 h-6" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;