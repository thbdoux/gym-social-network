import React from 'react';
import { 
  MapPin, 
  Calendar, 
  Heart, 
  Dumbbell, 
  Activity, 
  Users, 
  MessageCircle 
} from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ProfilePreviewHeader = ({ userData }) => {
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
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-6 py-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-5">
        {/* Avatar */}
        <div className="mx-auto sm:mx-0">
          <div className="p-1.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-xl">
            <img
              src={getAvatarUrl(userData?.avatar)}
              alt="Profile"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-gray-800"
            />
          </div>
        </div>
        
        {/* User Info */}
        <div className="text-center sm:text-left sm:flex-1">
          <h1 className="text-2xl font-bold">{userData?.username}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center mt-2 gap-2">
            <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-400 hover:text-gray-300">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{getGymDisplay(userData)}</span>
            </div>
            
            <div className="hidden sm:block text-gray-500">•</div>
            
            <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-400 hover:text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(userData?.date_joined).toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:scale-105">
              {formatText(userData?.training_level) || 'Beginner'}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 hover:scale-105">
              <Heart className="w-3 h-3 mr-1" />
              {formatText(userData?.personality_type) || 'Casual'}
            </span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center sm:justify-end gap-2 mt-3 sm:mt-0">
          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            Message
          </button>
        </div>
      </div>
      
      {/* Stats Summary Pills */}
      <div className="flex justify-center sm:justify-start gap-6 mt-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <Dumbbell className="w-4 h-4 text-blue-400 mr-1" />
            <span className="text-2xl font-bold">{userData?.workout_count || 0}</span>
          </div>
          <span className="text-xs text-gray-400">Workouts</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <Activity className="w-4 h-4 text-purple-400 mr-1" />
            <span className="text-2xl font-bold">{userData?.posts?.length || 0}</span>
          </div>
          <span className="text-xs text-gray-400">Posts</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <Users className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-2xl font-bold">{userData?.friend_count || 0}</span>
          </div>
          <span className="text-xs text-gray-400">Friends</span>
        </div>
      </div>
      
      {/* Bio (if available) */}
      {userData?.bio && (
        <div className="mt-5 text-gray-300 text-sm max-w-3xl">
          {userData.bio}
        </div>
      )}
    </div>
  );
};

export default ProfilePreviewHeader;