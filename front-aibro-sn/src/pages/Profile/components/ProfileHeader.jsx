import React, { useState } from 'react';
import { Edit, Dumbbell, Target, Crown, Heart, Calendar, MapPin, Trophy, ChevronDown, Activity, Users, TrendingUp } from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import ExpandableProgramModal from '../../MainFeed/components/ExpandableProgramModal';
import FriendsModal from './FriendsModal';
import UserProfilePreviewModal from './UserProfilePreviewModal';
import { POST_TYPE_COLORS } from '../../../utils/postTypeUtils';

const ProfileHeader = ({ user, workoutCount, friendCount, onEditClick, friends }) => {
  const [showMoreStats, setShowMoreStats] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  
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

  const handleViewFriendProfile = (friend) => {
    setSelectedFriend(friend);
  };

  const handleCloseFriendProfile = () => {
    setSelectedFriend(null);
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
        >
          <div className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 group">
                <Users className="w-4 h-4 text-green-400 transition-all duration-300 group-hover:scale-110" />
                <span className="group-hover:text-green-300 transition-colors duration-300">Friends ({friendCount})</span>
              </h2>
              <button 
                onClick={() => setIsFriendsModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 text-xs transition-all duration-200 hover:scale-110"
              >
                View All
              </button>
            </div>
            
            {friends && Array.isArray(friends) && friends.length > 0 ? (
              <div className="space-y-3">
                {friends.map((friendData) => {
                  // Determine friend object structure
                  const friend = friendData.friend ? friendData.friend : friendData;
                  
                  // Generate personality color based on personality type
                  const getPersonalityColor = (type) => {
                    switch(type) {
                      case 'casual': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400';
                      case 'competitor': return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400';
                      case 'lone_wolf': return 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400';
                      case 'extrovert_bro': return 'from-green-500/20 to-teal-500/20 border-green-500/30 text-green-400';
                      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-400';
                    }
                  };

                  // Level color classes
                  const getLevelColor = (level) => {
                    switch(level) {
                      case 'beginner': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
                      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                    }
                  };
                  
                  const personalityColor = getPersonalityColor(friend.personality_type);
                  const levelColor = getLevelColor(friend.training_level);
                  
                  return (
                    <div 
                      key={friendData.id} 
                      className="group relative p-3 bg-gradient-to-br from-gray-900/60 to-gray-800/60 hover:from-gray-800/80 hover:to-gray-700/80 rounded-lg transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg cursor-pointer overflow-hidden"
                      onClick={() => handleViewFriendProfile(friend)}
                    >
                      {/* Subtle background pattern */}
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0,_transparent_70%)] bg-[length:20px_20px]"></div>
                      
                      <div className="flex items-center gap-3 relative z-10">
                        {/* Avatar with colored border based on personality */}
                        <div className="relative">
                          <div className={`absolute inset-0 bg-gradient-to-br ${personalityColor} rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                          <img
                            src={getAvatarUrl(friend.avatar)}
                            alt={friend.username}
                            className="relative w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-white/30 transition-all duration-300 z-10"
                          />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"></div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-white group-hover:text-white transition-colors duration-300">
                            {friend.username}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full border ${levelColor}`}>
                              {formatText(friend.training_level || 'beginner')}
                            </span>
                            
                            {friend.personality_type && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full border ${personalityColor}`}>
                                {formatText(friend.personality_type)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* "View profile" action on hover */}
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-blue-600/20 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                            <span className="text-blue-200 text-xs">+</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Animated highlight line on hover */}
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 w-0 group-hover:w-full transition-all duration-700"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 flex flex-col items-center">
                <div className="text-gray-400 text-sm mb-2">No friends yet</div>
                <button 
                  onClick={() => setIsFriendsModalOpen(true)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-xs transition-all duration-300 hover:shadow-md hover:scale-105"
                >
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
          initialProgramData={selectedProgram}
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
      
      {/* Friend Profile Preview Modal */}
      {selectedFriend && (
        <UserProfilePreviewModal
          isOpen={!!selectedFriend}
          onClose={handleCloseFriendProfile}
          userId={selectedFriend.id}
          username={selectedFriend.username}
        />
      )}
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