import React from 'react';
import { 
  Dumbbell, 
  Users
} from 'lucide-react';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import { ProgramCard } from '../../../Workouts/components/ProgramCard';

/**
 * Overview Tab - Simplified version showing only current program and friends
 */
const OverviewTab = ({ userData, friends, fullProgramData, handleProgramSelect }) => {
  // Format text utility
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Current Program */}
      <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800/40">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-blue-400" />
          Current Program
        </h3>
        
        {(fullProgramData || userData?.current_program) ? (
          <div 
            onClick={() => handleProgramSelect(fullProgramData || userData.current_program)}
            className="cursor-pointer hover:opacity-90 transition-opacity"
          >
            <ProgramCard
              program={fullProgramData || userData.current_program}
              singleColumn={true}
              currentUser={userData?.username}
              onProgramSelect={handleProgramSelect}
            />
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800/20 rounded-xl">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-400">No active program</p>
          </div>
        )}
      </div>
      
      {/* Friends Preview */}
      <div className="bg-gray-900/60 rounded-xl p-5 border border-gray-800/40">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Friends
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {friends.slice(0, 6).map((friendData) => {
            // Extract the friend data
            const friend = friendData.friend || friendData;
            
            return (
              <div 
                key={friend.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200"
              >
                <img
                  src={getAvatarUrl(friend.avatar)}
                  alt={friend.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <div className="font-medium text-white truncate">{friend.username}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {formatText(friend.training_level || 'beginner')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {friends.length === 0 && (
          <div className="text-center py-6 bg-gray-800/20 rounded-xl">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-700" />
            <p className="text-gray-400">No friends yet</p>
          </div>
        )}
        
        {friends.length > 6 && (
          <div className="text-center mt-4">
            <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              See all {friends.length} friends
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;