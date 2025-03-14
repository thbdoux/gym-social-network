import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Trophy, 
  Target, 
  Activity, 
  Users,
  ChevronUp,
  ChevronDown,
  GitFork
} from 'lucide-react';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import { ProgramCard } from '../../../Workouts/components/ProgramCard';
import { userService } from '../../../../api/services';

const OverviewTab = ({ userData, friends, fullProgramData, handleProgramSelect }) => {
  const [expandedStatsSection, setExpandedStatsSection] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current logged-in user for fork permissions
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUserData = await userService.getCurrentUser();
        setCurrentUser(currentUserData);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Format text utility
  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Check if current logged-in user can fork the viewed profile's program
  const canForkProgram = () => {
    if (!currentUser || !userData || !fullProgramData) return false;
    
    // Don't show fork button if viewing your own profile
    if (currentUser.username === userData.username) return false;
    
    // Check if the program is public or if current user is admin
    return fullProgramData.is_public || currentUser.is_staff;
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Current Program */}
      <div className="bg-gray-800/40 rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-purple-400" />
            Current Program
          </h3>
          {canForkProgram() && (
            <button 
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm flex items-center gap-1 transition-colors"
              onClick={() => handleProgramSelect(fullProgramData)}
            >
              <GitFork className="w-3.5 h-3.5" />
              Fork
            </button>
          )}
        </div>
        
        {(fullProgramData || userData?.current_program) ? (
          <div 
            onClick={() => handleProgramSelect(fullProgramData || userData.current_program)}
            className="cursor-pointer"
          >
            <ProgramCard
              program={fullProgramData || userData.current_program}
              singleColumn={true}
              currentUser={currentUser?.username}
              onProgramSelect={handleProgramSelect}
            />
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800/30 rounded-xl">
            <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-70" />
            <p className="text-gray-400">No active program</p>
          </div>
        )}
      </div>
      
      {/* Stats Summary */}
      <div className="bg-gray-800/40 rounded-xl p-5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Stats
          </h3>
          <button 
            onClick={() => setExpandedStatsSection(!expandedStatsSection)}
            className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800/70 rounded-full"
          >
            {expandedStatsSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {expandedStatsSection && (
          <div className="mt-4 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
              <div className="text-gray-400">Current Streak</div>
              <div className="flex items-center gap-1 text-blue-400">
                <Dumbbell className="w-4 h-4" />
                <span className="font-bold">{userData?.current_streak || 0} days</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
              <div className="text-gray-400">Longest Streak</div>
              <div className="flex items-center gap-1 text-green-400">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{userData?.longest_streak || 0} days</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
              <div className="text-gray-400">Avg. Workouts/Week</div>
              <div className="flex items-center gap-1 text-purple-400">
                <Activity className="w-4 h-4" />
                <span className="font-bold">{userData?.avg_workouts_per_week || 0}</span>
              </div>
            </div>
            
            {userData?.fitness_goals && (
              <div className="mt-5 pt-4 border-t border-gray-700/30">
                <h3 className="font-medium text-white mb-2 flex items-center gap-1">
                  <Target className="w-4 h-4 text-yellow-400" />
                  Fitness Goals
                </h3>
                <p className="text-gray-300 text-sm">{userData.fitness_goals}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Friends Preview */}
      <div className="bg-gray-800/40 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          Friends
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {friends.slice(0, 3).map((friendData) => {
            // Extract the friend data
            const friend = friendData.friend || friendData;
            
            return (
              <div 
                key={friend.id} 
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/40 hover:bg-gray-800/70 transition-all duration-300"
              >
                <img
                  src={getAvatarUrl(friend.avatar)}
                  alt={friend.username}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-700"
                />
                <div className="min-w-0">
                  <div className="font-medium truncate">{friend.username}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {formatText(friend.training_level || 'beginner')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {friends.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-400">No friends yet</p>
          </div>
        )}
        
        {friends.length > 3 && (
          <div className="text-center mt-4">
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              See all {friends.length} friends
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;