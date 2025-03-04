import React, { useState } from 'react';
import { Edit, Dumbbell, Target, Crown, Heart, Calendar, MapPin, Trophy, ChevronDown, Activity, Users, TrendingUp } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import ExpandableProgramModal from '../../MainFeed/components/ExpandableProgramModal';
import FriendsModal from './FriendsModal';
import { POST_TYPE_COLORS } from '../../../utils/postTypeUtils';

const ProfileHeader = ({ user, workoutCount, friendCount, onEditClick, friends }) => {
  const [showMoreStats, setShowMoreStats] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  
  const getGymDisplay = (user) => {
    if (!user?.preferred_gym_details || !user?.preferred_gym_details?.name) {
      return 'No gym set';
    }
    const gym = user.preferred_gym_details;
    return `${gym.name} - ${gym.location}`;
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  const handleCloseModal = () => {
    setSelectedProgram(null);
  };

  // Get the number of posts from the user object if available
  const postCount = user?.posts?.length || 0;

  // Get the appropriate color styles for the program
  const getProgramColors = () => {
    if (user?.current_program) {
      // Use the program colors from postTypeUtils
      return POST_TYPE_COLORS.program;
    }
    return {};
  };

  const programColors = getProgramColors();

  return (
    <div className="bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 rounded-xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        {/* Section 1: User Info (Upper Left) */}
        <div 
          className={`p-4 bg-gray-800/50 rounded-xl shadow-md transition-all duration-300 transform ${activeSection === 'profile' ? 'scale-[1.02] bg-gray-800/70 shadow-lg' : 'hover:bg-gray-800/60 hover:shadow-lg hover:scale-[1.01]'}`}
          onMouseEnter={() => setActiveSection('profile')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative group mx-auto sm:mx-0">
              <div className="p-1.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-xl group">
                <img
                  src={getAvatarUrl(user?.avatar)}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-800 transition-all duration-300 group-hover:border-blue-800/50 group-hover:scale-105"
                />
                <button 
                  onClick={onEditClick}
                  className="absolute bottom-1 right-1 p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-all duration-200 shadow-lg transform hover:scale-110 hover:rotate-12"
                  title="Edit Profile"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold flex flex-col sm:flex-row items-center gap-2">
                {user?.username}
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 transition-all duration-200 hover:bg-blue-500/30 hover:scale-105 mt-2 sm:mt-0">
                  {formatText(user?.training_level) || 'Beginner'}
                </span>
              </h1>
              
              <p className="text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-2 transition-all duration-200 hover:text-gray-300 group">
                <MapPin className="w-4 h-4 group-hover:text-blue-400" />
                <span className="truncate max-w-[200px]">{getGymDisplay(user)}</span>
              </p>

              <div className="mt-4 flex items-center justify-center sm:justify-start">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 transition-all duration-300 hover:from-pink-900/30 hover:to-pink-800/20 hover:shadow-md">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-sm text-gray-300">{formatText(user?.personality_type) || 'Casual'}</span>
                </div>
              </div>
              
              <p className="text-gray-300 mt-4 max-w-xl leading-relaxed text-sm line-clamp-2 hover:line-clamp-none transition-all duration-300">
                {user?.bio || user?.fitness_goals || 'No bio or fitness goals set yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Friends (Upper Right) */}
        <div 
          className={`p-4 bg-gray-800/50 rounded-xl shadow-md transition-all duration-300 transform ${activeSection === 'friends' ? 'scale-[1.02] bg-gray-800/70 shadow-lg' : 'hover:bg-gray-800/60 hover:shadow-lg hover:scale-[1.01]'}`}
          onMouseEnter={() => setActiveSection('friends')}
          onMouseLeave={() => setActiveSection(null)}
          onClick={() => setIsFriendsModalOpen(true)}
        >
          <div className="h-full cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 group">
                <Users className="w-4 h-4 text-green-400 transition-all duration-300 group-hover:scale-110" />
                <span className="group-hover:text-green-300 transition-colors duration-300">Friends ({friendCount})</span>
              </h2>
              <button className="text-blue-400 hover:text-blue-300 text-xs transition-all duration-200 hover:scale-110">
                View All
              </button>
            </div>
            
            {friends && Array.isArray(friends) && friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friendData) => (
                  <div 
                    key={friendData.id} 
                    className="flex items-center gap-2 p-2 bg-gray-900/50 hover:bg-gray-900/70 rounded-lg transition-all duration-200 transform hover:translate-x-1 hover:shadow-md"
                  >
                    <img
                      src={getAvatarUrl(friendData.friend ? friendData.friend.avatar : friendData.avatar)}
                      alt={friendData.friend ? friendData.friend.username : friendData.username}
                      className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-green-500/30 transition-all duration-300"
                    />
                    <div>
                      <div className="font-medium text-sm">{friendData.friend ? friendData.friend.username : friendData.username}</div>
                      <div className="text-xs text-gray-400">{formatText(friendData.friend ? friendData.friend.training_level : friendData.training_level)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 flex flex-col items-center">
                <div className="text-gray-400 text-sm mb-2">No friends yet</div>
                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs transition-all duration-300 hover:shadow-md hover:scale-105">
                  Find Friends
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Stats (Lower Left) */}
        <div 
          className={`p-4 bg-gray-800/50 rounded-xl shadow-md transition-all duration-300 transform ${activeSection === 'stats' ? 'scale-[1.02] bg-gray-800/70 shadow-lg' : 'hover:bg-gray-800/60 hover:shadow-lg hover:scale-[1.01]'}`}
          onMouseEnter={() => setActiveSection('stats')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 group">
              <Trophy className="w-5 h-5 text-yellow-400 transition-all duration-300 group-hover:rotate-12" />
              <span className="group-hover:text-yellow-300 transition-colors duration-300">Stats</span>
            </h2>
            <button 
              onClick={() => setShowMoreStats(!showMoreStats)}
              className="text-gray-400 hover:text-white transition-all duration-300 hover:bg-gray-700/50 p-1 rounded-full"
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${showMoreStats ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <StatItem count={workoutCount} label="Workouts" className="bg-blue-900/20 hover:bg-blue-900/30" icon={<Dumbbell className="w-4 h-4 text-blue-400" />} />
            <StatItem count={friendCount} label="Friends" className="bg-green-900/20 hover:bg-green-900/30" icon={<Users className="w-4 h-4 text-green-400" />} />
            <StatItem count={postCount} label="Posts" className="bg-purple-900/20 hover:bg-purple-900/30" icon={<Activity className="w-4 h-4 text-purple-400" />} />
            <StatItem count={user?.total_likes || 0} label="Total Likes" className="bg-pink-900/20 hover:bg-pink-900/30" icon={<Heart className="w-4 h-4 text-pink-400" />} />
          </div>
          
          {showMoreStats && (
            <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
                <div className="text-gray-400">Current Streak</div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Dumbbell className="w-4 h-4" />
                  <span className="font-bold">5 days</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
                <div className="text-gray-400">Longest Streak</div>
                <div className="flex items-center gap-1 text-green-400">
                  <Trophy className="w-4 h-4" />
                  <span className="font-bold">14 days</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
                <div className="text-gray-400">Avg. Workouts/Week</div>
                <div className="flex items-center gap-1 text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-bold">3.5</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Current Program (Lower Right) */}
        <div 
          className={`p-4 bg-gray-800/50 rounded-xl shadow-md transition-all duration-300 transform ${activeSection === 'program' ? 'scale-[1.02] bg-gray-800/70 shadow-lg' : 'hover:bg-gray-800/60 hover:shadow-lg hover:scale-[1.01]'}`}
          onMouseEnter={() => setActiveSection('program')}
          onMouseLeave={() => setActiveSection(null)}
        >
          <div 
            onClick={() => user?.current_program && handleProgramSelect(user.current_program)}
            className={`h-full ${user?.current_program ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 group">
                <Dumbbell className="w-5 h-5 text-purple-400 transition-transform duration-300 group-hover:rotate-12" />
                <span className="group-hover:text-purple-300 transition-colors duration-300">Current Program</span>
              </h2>
            </div>
            
            {user?.current_program ? (
              <div className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className={`p-4 rounded-lg border ${programColors.bg || 'bg-gray-900/50'} ${programColors.border || 'border-purple-500/20'} ${programColors.hoverBg || 'hover:bg-gray-900/70'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{user.current_program.name}</h3>
                    <div className={`px-2 py-1 ${programColors.darkBg || 'bg-purple-500/20'} ${programColors.text || 'text-purple-400'} text-xs rounded-full transition-all duration-300 hover:scale-105`}>
                      {formatText(user.current_program.difficulty_level)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-300 p-1 rounded hover:bg-gray-800/30 transition-colors duration-200">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span>{user.current_program.sessions_per_week} sessions/week</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300 p-1 rounded hover:bg-gray-800/30 transition-colors duration-200">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <span>{formatText(user.current_program.focus)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-700/30 flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      {user.current_program.duration} weeks
                    </div>
                    <div className={`text-sm ${programColors.text || 'text-purple-400'} flex items-center gap-1 group transition-all duration-300 hover:translate-x-1`}>
                      <span>View Details</span>
                      <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 flex flex-col items-center">
                <div className="text-gray-400 mb-3">No active program</div>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                  Choose a Program
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Program Modal */}
      {selectedProgram && (
        <ExpandableProgramModal 
          programId={selectedProgram.id}
          // initialProgramData={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={handleCloseModal}
          currentUser={user}
          onProgramSelect={(program) => {
            window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
          }}
        />
      )}

      {/* Friends Modal */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
};

const StatItem = ({ count, label, className = "", icon }) => (
  <div className={`rounded-lg p-4 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-md ${className}`}>
    <div className="flex flex-col items-center">
      {icon && <div className="mb-1 transition-all duration-300 hover:scale-110">{icon}</div>}
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  </div>
);

export default ProfileHeader;