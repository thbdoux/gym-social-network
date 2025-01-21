import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              GymSocial
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Feed
            </Link>
            <Link to="/workouts" className="text-gray-600 hover:text-gray-900">
              Workouts
            </Link>
            <Link to="/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}