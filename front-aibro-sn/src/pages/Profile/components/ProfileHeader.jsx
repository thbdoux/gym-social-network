import React from 'react';
import { Edit } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';

const ProfileHeader = ({ user, workoutCount, friendCount, onEditClick }) => (
  <div className="flex items-start justify-between mb-8">
    <div className="flex items-start gap-6">
      <div className="relative">
        <img
          src={getAvatarUrl(user?.avatar)}
          alt="Profile"
          className="w-28 h-28 rounded-full object-cover border-4 border-gray-700"
        />
      </div>
      
      <div>
        <h1 className="text-3xl font-bold mb-1">{user?.username}</h1>
        <p className="text-lg text-gray-400">{user?.preferred_gym || 'No gym set'}</p>
        <div className="flex items-center gap-2 mt-2 text-gray-400">
          <span>{workoutCount} workouts</span>
          <span>•</span>
          <span>{friendCount} friends</span>
        </div>
      </div>
    </div>

    <button 
      onClick={onEditClick}
      className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
    >
      <Edit className="w-4 h-4" />
      Edit Profile
    </button>
  </div>
);

export default ProfileHeader;