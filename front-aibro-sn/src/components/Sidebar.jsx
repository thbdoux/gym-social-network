import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Users, Calendar, User, LogOut } from 'lucide-react';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home, path: '/feed' },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/workouts' },
    { id: 'friends', label: 'Friends', icon: Users, path: '/friends' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/schedule' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="w-72 bg-gray-950 h-screen fixed left-0 top-0">
      <div className="p-6">
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
              className={`w-full flex items-center space-x-4 px-6 py-4 text-lg transition-colors
                ${isActive 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              <Icon className="w-6 h-6" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-4 px-6 py-4 text-lg text-red-400 hover:bg-gray-800 hover:text-red-300 mt-6 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

// // src/components/Sidebar.jsx
// import React from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Home, Dumbbell, Users, Calendar, User, LogOut } from 'lucide-react';

// const Sidebar = ({ onLogout }) => {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   const navItems = [
//     { id: 'feed', label: 'Feed', icon: Home, path: '/feed' },
//     { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/workouts' },
//     { id: 'friends', label: 'Friends', icon: Users, path: '/friends' },
//     { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/schedule' },
//     { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
//   ];

//   return (
//     <div className="w-72 bg-slate-900 h-screen fixed left-0 top-0">
//       <div className="p-6">
//         <h1 className="text-3xl font-bold text-white">GymBro</h1>
//       </div>
//       <nav className="mt-6">
//         {navItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = location.pathname === item.path;
          
//           return (
//             <button
//               key={item.id}
//               onClick={() => navigate(item.path)}
//               className={`w-full flex items-center space-x-4 px-6 py-4 text-lg transition-colors
//                 ${isActive 
//                   ? 'bg-slate-700 text-white' 
//                   : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
//             >
//               <Icon className="w-6 h-6" />
//               <span>{item.label}</span>
//             </button>
//           );
//         })}
//         <button
//           onClick={onLogout}
//           className="w-full flex items-center space-x-4 px-6 py-4 text-lg text-red-400 hover:bg-slate-800 hover:text-red-300 mt-6 transition-colors"
//         >
//           <LogOut className="w-6 h-6" />
//           <span>Logout</span>
//         </button>
//       </nav>
//     </div>
//   );
// };

export default Sidebar;