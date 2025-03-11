import React from 'react';
import { 
  Edit, MapPin, Calendar, Dumbbell, Heart, 
  Users, Activity
} from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ProfileHeader = ({ 
  user, 
  workoutCount, 
  postCount, 
  friendCount, 
  onEditClick,
  onFriendsClick,
  setActiveSection,
  activeSection
}) => {
  // Format text utilities
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getGymDisplay = (user) => {
    if (!user?.preferred_gym_details || !user?.preferred_gym_details?.name) {
      return 'No gym set';
    }
    const gym = user.preferred_gym_details;
    return `${gym.name} - ${gym.location}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="px-8 py-6 relative">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          {/* Avatar */}
          <div className="mx-auto md:mx-0">
            <div className="p-1.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-xl group">
              <img
                src={getAvatarUrl(user?.avatar)}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-800 transition-all duration-300 group-hover:border-blue-600/40"
              />
            </div>
          </div>
          
          {/* User Info */}
          <div className="text-center md:text-left md:flex-1">
            <h1 className="text-3xl font-bold">{user?.username}</h1>
            
            <div className="flex flex-col md:flex-row md:items-center mt-2 gap-2">
              <div className="flex items-center justify-center md:justify-start gap-1 text-gray-400 transition-all duration-200 hover:text-gray-300">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{getGymDisplay(user)}</span>
              </div>
              
              <div className="hidden md:block text-gray-500">•</div>
              
              <div className="flex items-center justify-center md:justify-start gap-1 text-gray-400 transition-all duration-200 hover:text-gray-300">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user?.date_joined).toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 transition-all duration-200 hover:bg-blue-500/30 hover:scale-105">
                {formatText(user?.training_level) || 'Beginner'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/20 text-pink-400 transition-all duration-200 hover:bg-pink-500/30 hover:scale-105">
                <Heart className="w-3 h-3 mr-1" />
                {formatText(user?.personality_type) || 'Casual'}
              </span>
            </div>
          </div>
          
          {/* Edit button */}
          <div className="absolute top-4 right-4 md:static md:self-start">
            <button 
              onClick={onEditClick}
              className="p-2 bg-gray-800/70 hover:bg-gray-700 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-12"
              title="Edit Profile"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>
          
          {/* Stats Summary */}
          <div className="flex gap-4 justify-center md:justify-end">
            <button 
              onClick={() => setActiveSection('workouts')}
              className={`flex flex-col items-center transition-all duration-300 px-3 py-2 rounded-lg ${activeSection === 'workouts' ? 'bg-blue-900/30' : 'hover:bg-gray-800'}`}
            >
              <div className="flex items-center">
                <Dumbbell className="w-4 h-4 text-blue-400 mr-1" />
                <span className="text-2xl font-bold">{workoutCount}</span>
              </div>
              <span className="text-xs text-gray-400">Workouts</span>
            </button>
            
            <button 
              onClick={() => setActiveSection('posts')}
              className={`flex flex-col items-center transition-all duration-300 px-3 py-2 rounded-lg ${activeSection === 'posts' ? 'bg-purple-900/30' : 'hover:bg-gray-800'}`}
            >
              <div className="flex items-center">
                <Activity className="w-4 h-4 text-purple-400 mr-1" />
                <span className="text-2xl font-bold">{postCount}</span>
              </div>
              <span className="text-xs text-gray-400">Posts</span>
            </button>
            
            <button 
              onClick={onFriendsClick}
              className={`flex flex-col items-center transition-all duration-300 px-3 py-2 rounded-lg ${activeSection === 'friends' ? 'bg-green-900/30' : 'hover:bg-gray-800'}`}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-2xl font-bold">{friendCount}</span>
              </div>
              <span className="text-xs text-gray-400">Friends</span>
            </button>
          </div>
        </div>
        
        {user?.bio && (
          <div className="mt-6 text-gray-300 text-sm max-w-2xl mx-auto md:mx-0 text-center md:text-left">
            {user.bio}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;