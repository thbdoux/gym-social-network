import React from 'react';
import { Edit, Dumbbell, Target, Crown, Heart, Calendar, MapPin, Share, ChevronRight } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ProfileHeader = ({ user, workoutCount, friendCount, onEditClick }) => {
  const getGymDisplay = (user) => {
    if (!user?.preferred_gym_details) return 'No gym set';
    const gym = user.preferred_gym_details;
    return `${gym.name} - ${gym.location}`;
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 rounded-xl overflow-hidden mb-8 shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Cover Image with dynamic gradient */}
      <div className="h-48 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-indigo-900/20 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-purple-500/5 rounded-full translate-y-1/2"></div>
      </div>
      
      <div className="relative px-8 pb-8">
        {/* Avatar - positioned to overlap the cover image */}
        <div className="absolute -top-20 left-8 p-1.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-xl group">
          <div className="relative">
            <img
              src={getAvatarUrl(user?.avatar)}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-800 transition-transform duration-300 group-hover:scale-105"
            />
            <button 
              onClick={onEditClick}
              className="absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 shadow-lg transform hover:scale-110"
              title="Edit Profile"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Header actions - positioned to the top right */}
        <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm">
            <Share className="w-4 h-4" />
            Share Profile
          </button>
        </div>
        
        {/* Main content grid - with left margin to account for the avatar */}
        <div className="mt-12 ml-40">
          <div className="flex flex-wrap justify-between gap-6">
            {/* Left column - Basic info */}
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {user?.username}
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 transition-all duration-200 hover:bg-blue-500/30">
                  {formatText(user?.training_level) || 'Beginner'}
                </span>
              </h1>
              
              <p className="text-gray-400 flex items-center gap-2 mt-2 transition-all duration-200 hover:text-gray-300">
                <MapPin className="w-4 h-4" />
                {getGymDisplay(user)}
              </p>
              
              <p className="text-gray-300 mt-4 max-w-xl leading-relaxed">
                {user?.bio || user?.fitness_goals || 'No bio or fitness goals set yet. Edit your profile to add some information about yourself and your fitness journey.'}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex items-center gap-4 bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gray-800/80">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{workoutCount}</div>
                    <div className="text-sm text-gray-400">Workouts</div>
                  </div>
                  <div className="h-10 w-px bg-gray-700" />
                  <div className="text-center">
                    <div className="text-2xl font-bold">{friendCount}</div>
                    <div className="text-sm text-gray-400">Friends</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 transition-all duration-200 hover:from-gray-700 hover:to-gray-800">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-sm text-gray-300">{formatText(user?.personality_type) || 'Casual'}</span>
                </div>
              </div>
            </div>
            
            {/* Right column - Current Program */}
            <div className="w-full sm:w-auto">
              <div className="bg-gray-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm max-w-xs transition-all duration-300 hover:shadow-xl hover:bg-gray-800/90 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Calendar className="w-5 h-5" />
                    <h3 className="font-semibold">Current Program</h3>
                  </div>
                  {user?.current_program && (
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {user?.current_program ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium">{user.current_program.name}</p>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-400 transition-all duration-200 hover:bg-yellow-500/20">
                        {formatText(user.current_program.difficulty_level)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900/80 transition-all duration-200">
                        <Dumbbell className="w-4 h-4 text-blue-400" />
                        <span>{user.current_program.sessions_per_week} sessions/week</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900/80 transition-all duration-200">
                        <Target className="w-4 h-4 text-purple-400" />
                        <span>{formatText(user.current_program.focus)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700/50">
                      <p className="text-xs text-gray-400">
                        {user.current_program.workouts?.length || 0} workouts planned
                      </p>
                      <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-gray-400">No active program</p>
                    <button className="mt-3 w-full px-3 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-sm transition-all duration-200 transform hover:scale-105">
                      Choose a Program
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;