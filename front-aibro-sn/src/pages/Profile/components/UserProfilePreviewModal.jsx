import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Dumbbell, 
  Target, 
  Heart, 
  MapPin, 
  Trophy, 
  Award, 
  Activity, 
  Calendar,
  Users,
  GitFork,
  MessageSquare
} from 'lucide-react';
import { userService, postService, gymService } from '../../../api/services';
import { getAvatarUrl } from '../../../utils/imageUtils';
import ExpandableProgramModal from '../../Workouts/components/ExpandableProgramModal';

const UserProfilePreviewModal = ({ isOpen, onClose, userId, username }) => {
  const [userData, setUserData] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && (userId || username)) {
      fetchUserProfile();
    }
  }, [isOpen, userId, username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine how to fetch the user
      let userData;
      try {
        if (userId) {
          userData = await userService.getUserById(userId);
        } else if (username) {
          // Since there's no direct method for fetching by username in the service,
          // we'll need to get all users and filter by username
          const allUsers = await userService.getAllUsers();
          userData = allUsers.find(user => user.username === username);
          
          if (!userData) {
            throw new Error('User not found');
          }
        } else {
          throw new Error('No user identifier provided');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
      
      // Fetch posts
      let postsData;
      try {
        postsData = await postService.getPosts();
      } catch (error) {
        console.error('Error fetching posts:', error);
        postsData = [];
      }

      // Filter posts by the viewed user's username
      const userPosts = Array.isArray(postsData) ? postsData.filter(
        post => post.user_username === userData.username
      ) : [];
      
      // Fetch gym details if necessary
      if (userData.preferred_gym && !userData.preferred_gym_details) {
        try {
          const gymData = await gymService.getGymById(userData.preferred_gym);
          userData = {
            ...userData,
            preferred_gym_details: gymData
          };
        } catch (error) {
          console.error('Error fetching gym details:', error);
        }
      }

      // Add posts to user data
      userData = {
        ...userData,
        posts: userPosts
      };
      
      setUserData(userData);
      setPosts(userPosts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
      setLoading(false);
    }
  };

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
  };

  const handleCloseModal = () => {
    setSelectedProgram(null);
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto backdrop-blur-sm p-4">
      <div 
        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl border border-gray-700 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-800/70 border-b border-gray-700 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            {loading ? 'Loading Profile...' : `${userData?.username}'s Profile`}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-28 w-28 bg-gray-700 rounded-full"></div>
              <div className="h-6 w-48 bg-gray-700 rounded-lg"></div>
              <div className="h-4 w-64 bg-gray-700 rounded-lg"></div>
              <div className="h-32 w-full max-w-md bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-red-400">
              <div className="text-lg font-medium mb-2">{error}</div>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors mt-4"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* User Profile Content */}
        {!loading && !error && userData && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* User Header */}
              <div className="relative overflow-hidden">
                {/* Background gradient with subtle pattern */}
                <div className="h-40 bg-gradient-to-r from-blue-900/30 to-purple-900/30 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_0,_transparent_100%)] bg-[length:20px_20px]"></div>
                </div>
                
                {/* User Avatar & Basic Info */}
                <div className="px-8 pb-4 relative z-10">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 gap-4">
                    <div className="p-1.5 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-xl">
                      <img
                        src={getAvatarUrl(userData.avatar)}
                        alt={`${userData.username}'s avatar`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-800"
                      />
                    </div>
                    
                    <div className="text-center sm:text-left flex-1 pb-1">
                      <h1 className="text-2xl font-bold">{userData.username}</h1>
                      <div className="text-gray-400 flex items-center justify-center sm:justify-start gap-2 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{getGymDisplay(userData)}</span>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                          {formatText(userData.training_level) || 'Beginner'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-pink-500/20 text-pink-400">
                          <Heart className="w-3 h-3 mr-1" />
                          {formatText(userData.personality_type) || 'Casual'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all text-sm flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <div className="border-b border-gray-700/50 px-6">
                <div className="flex">
                  <TabButton 
                    label="Overview" 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')} 
                  />
                  <TabButton 
                    label="Stats" 
                    active={activeTab === 'stats'} 
                    onClick={() => setActiveTab('stats')} 
                  />
                  <TabButton 
                    label="Recent Activity" 
                    active={activeTab === 'activity'} 
                    onClick={() => setActiveTab('activity')} 
                  />
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="animate-fadeIn">
                    {/* Bio */}
                    <div className="bg-gray-800/40 rounded-xl p-5 mb-6">
                      <h3 className="text-lg font-semibold mb-3">About</h3>
                      <p className="text-gray-300 leading-relaxed">
                        {userData.bio || userData.fitness_goals || 'No bio provided.'}
                      </p>
                      
                      {userData.fitness_goals && userData.bio && (
                        <>
                          <h4 className="font-medium mt-4 mb-2">Fitness Goals</h4>
                          <p className="text-gray-300 leading-relaxed">{userData.fitness_goals}</p>
                        </>
                      )}
                    </div>
                    
                    {/* Current Program */}
                    <div className="bg-gray-800/40 rounded-xl p-5">
                      <h3 className="text-lg font-semibold mb-4">Current Program</h3>
                      
                      {userData.current_program ? (
                        <div 
                          onClick={() => handleProgramSelect(userData.current_program)}
                          className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg transform transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-lg cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg">{userData.current_program.name}</h4>
                            <div className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                              {formatText(userData.current_program.difficulty_level)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span>{userData.current_program.sessions_per_week} sessions/week</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Target className="w-4 h-4 text-yellow-400" />
                              <span>{formatText(userData.current_program.focus)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-700/30 flex justify-between items-center">
                            <div className="text-sm text-gray-400">
                              {userData.current_program.duration} weeks
                            </div>
                            <div className="text-sm text-purple-400 flex items-center gap-1 group">
                              <span>View Details</span>
                              <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 flex flex-col items-center">
                          <div className="text-gray-400 mb-2">No active program</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Stats Tab */}
                {activeTab === 'stats' && (
                  <div className="animate-fadeIn">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <StatCard 
                        label="Workouts" 
                        value={userData?.workout_count || 0} 
                        icon={<Dumbbell className="w-5 h-5 text-blue-400" />} 
                        className="bg-blue-900/20"
                      />
                      <StatCard 
                        label="Posts" 
                        value={userData?.posts?.length || 0} 
                        icon={<Activity className="w-5 h-5 text-purple-400" />} 
                        className="bg-purple-900/20"
                      />
                      <StatCard 
                        label="Friends" 
                        value={userData?.friend_count || 0} 
                        icon={<Users className="w-5 h-5 text-green-400" />} 
                        className="bg-green-900/20"
                      />
                      <StatCard 
                        label="Likes" 
                        value={userData?.total_likes || 0} 
                        icon={<Heart className="w-5 h-5 text-pink-400" />} 
                        className="bg-pink-900/20"
                      />
                    </div>
                    
                    {/* Additional stats boxes can go here */}
                    <div className="bg-gray-800/40 rounded-xl p-5 mb-6">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Training History
                      </h3>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700/30">
                          <div className="text-gray-300">Current Streak</div>
                          <div className="flex items-center gap-1 text-blue-400">
                            <Calendar className="w-4 h-4" />
                            <span className="font-bold">{userData?.current_streak || 0} days</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700/30">
                          <div className="text-gray-300">Longest Streak</div>
                          <div className="flex items-center gap-1 text-green-400">
                            <Award className="w-4 h-4" />
                            <span className="font-bold">{userData?.longest_streak || 0} days</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700/30">
                          <div className="text-gray-300">Avg. Workouts/Week</div>
                          <div className="flex items-center gap-1 text-purple-400">
                            <Activity className="w-4 h-4" />
                            <span className="font-bold">{userData?.avg_workouts_per_week || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/40 rounded-xl p-5">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-400" />
                        Achievements
                      </h3>
                      
                      {/* Mock achievements */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-gradient-to-br from-amber-900/20 to-amber-800/10 rounded-lg border border-amber-700/30">
                          <Trophy className="w-8 h-8 text-amber-400 mb-2" />
                          <h4 className="font-medium text-amber-300">Consistent Athlete</h4>
                          <p className="text-sm text-gray-400 mt-1">Worked out 3+ times per week for a month</p>
                        </div>
                        
                        <div className="p-3 bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-lg border border-blue-700/30">
                          <Award className="w-8 h-8 text-blue-400 mb-2" />
                          <h4 className="font-medium text-blue-300">Progress Master</h4>
                          <p className="text-sm text-gray-400 mt-1">Increased weights on all major lifts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="animate-fadeIn">
                    <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
                    
                    {posts.length > 0 ? (
                      <div className="space-y-4">
                        {posts.slice(0, 3).map((post) => (
                          <div key={post.id} className="bg-gray-800/40 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                              <img
                                src={getAvatarUrl(userData.avatar, 40)}
                                alt={`${userData.username}'s avatar`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">{
                                      new Date(post.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', 
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    }</span>
                                    {post.post_type !== 'regular' && (
                                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                        {post.post_type === 'workout_log' ? 'Workout' : post.post_type}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-2 text-gray-200">{post.content}</p>
                                
                                {post.image && (
                                  <img
                                    src={getAvatarUrl(post.image)}
                                    alt=""
                                    className="mt-3 rounded-lg w-full object-cover max-h-60"
                                  />
                                )}
                                
                                <div className="flex items-center gap-4 mt-3 text-gray-400">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Heart className="w-4 h-4" />
                                    {post.likes_count || 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {posts.length > 3 && (
                          <div className="text-center mt-2">
                            <button className="text-blue-400 hover:text-blue-300 text-sm">
                              View all {posts.length} posts
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-800/30 rounded-xl">
                        <p className="text-gray-400">No posts yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="bg-gray-800/70 border-t border-gray-700 p-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Member since {
                  userData.date_joined 
                    ? new Date(userData.date_joined).toLocaleDateString('en-US', {
                        year: 'numeric', 
                        month: 'long',
                      })
                    : 'N/A'
                }
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Program Modal */}
      {selectedProgram && (
        <ExpandableProgramModal 
          programId={selectedProgram.id}
          initialProgramData={selectedProgram}
          isOpen={!!selectedProgram}
          onClose={handleCloseModal}
          currentUser={userData}
          onProgramSelect={(program) => {
            window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
          }}
        />
      )}
    </div>
  );
};

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-3 relative ${
      active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    {label}
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
    )}
  </button>
);

const StatCard = ({ label, value, icon, className = "" }) => (
  <div className={`rounded-lg p-4 text-center ${className}`}>
    <div className="flex flex-col items-center">
      {icon && <div className="mb-2">{icon}</div>}
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  </div>
);

export default UserProfilePreviewModal;