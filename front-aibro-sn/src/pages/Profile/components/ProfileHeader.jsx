import React from 'react';
import { Edit, Dumbbell, Target, Crown, Heart, Calendar } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ProfileHeader = ({ user, workoutCount, friendCount, onEditClick }) => {
  console.log("useeeeeeeeeer",user)
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
    <div className="bg-gray-800 rounded-xl p-6 mb-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column - Avatar and primary info */}
        <div className="flex flex-col items-center md:items-start">
          <div className="relative">
            <img
              src={getAvatarUrl(user?.avatar)}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
            />
            <button 
              onClick={onEditClick}
              className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              title="Edit Profile"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-4 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-1">{user?.username}</h1>
            <p className="text-lg text-gray-400 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              {getGymDisplay(user)}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{workoutCount}</div>
              <div className="text-sm text-gray-400">Workouts</div>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div className="text-center">
              <div className="text-2xl font-bold">{friendCount}</div>
              <div className="text-sm text-gray-400">Friends</div>
            </div>
          </div>
        </div>

        {/* Right column - Detailed info */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 md:mt-0">
          {/* Training Level */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Crown className="w-5 h-5" />
              <h3 className="font-semibold">Training Level</h3>
            </div>
            <p className="text-lg">{formatText(user?.training_level) || 'Not set'}</p>
          </div>

          {/* Personality Type */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Heart className="w-5 h-5" />
              <h3 className="font-semibold">Personality Type</h3>
            </div>
            <p className="text-lg">{formatText(user?.personality_type) || 'Not set'}</p>
          </div>

          {/* Current Program */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Calendar className="w-5 h-5" />
              <h3 className="font-semibold">Current Program</h3>
            </div>
            {user?.current_program ? (
              <div>
                <p className="text-lg font-medium">{user.current_program.name}</p>
                <p className="text-sm text-gray-400">
                  {user.current_program.sessions_per_week} sessions/week • {' '}
                  {formatText(user.current_program.focus)} • {' '}
                  {formatText(user.current_program.difficulty_level)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {user.current_program.workouts?.length || 0} workouts planned
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-400">No active program</p>
                <p className="text-xs text-gray-500 mt-1">
                  Set a program as active in your programs page
                </p>
              </div>
            )}
          </div>

          {/* Fitness Goals */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Target className="w-5 h-5" />
              <h3 className="font-semibold">Fitness Goals</h3>
            </div>
            <p className="text-gray-200">{user?.fitness_goals || 'No goals set yet'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;