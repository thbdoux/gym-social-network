import { React, useEffect, useState } from 'react';
import { 
  ChevronRight,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarUrl } from '../../../utils/imageUtils';
import api from './../../../api';
import ProgramCardPost from '../../MainFeed/components/ProgramCardPost';

const RecentPosts = ({ posts, username }) => {
  const [userData, setUserData] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const userPosts = Array.isArray(posts) 
    ? posts.filter(post => post.user_username === username)
    : [];

  // Handler for program card selection
  const handleProgramSelect = (program) => {
    window.location.href = `/workouts?view=plan-detail&program=${program.id}`;
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/users/me/`);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, [username]);

  // Format the timestamp to a more readable format
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to toggle post expansion
  const togglePostExpansion = (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
    }
  };

  return (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Posts</h2>
        <Link 
          to={`/users/${username}/posts`} 
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {userPosts.length > 0 ? (
        <div className="space-y-6">
          {userPosts.map((post) => (
            <div key={post.id} className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
              <div className="flex items-start gap-3">
                <img
                  src={getAvatarUrl(userData?.avatar, 40)}
                  alt={`${post.user_username}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium">{post.user_username}</span>
                      <span className="text-sm text-gray-400">{formatTimestamp(post.created_at)}</span>
                    </div>
                    {post.post_type !== 'regular' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        {post.post_type === 'workout_log' ? 'Workout' : 
                         post.post_type === 'program_share' ? 'Program' : 
                         post.post_type}
                      </span>
                    )}
                  </div>
                  
                  {/* Post Content */}
                  <div className="mt-3">
                    <p className="text-gray-200">{post.content}</p>
                  </div>
                  
                  {/* Post Image */}
                  {post.image && (
                    <div className="mt-3">
                      <img
                        src={getAvatarUrl(post.image)}
                        alt=""
                        className="rounded-lg w-full object-cover max-h-96"
                      />
                    </div>
                  )}
                  
                  {/* Workout Log */}
                  {post.post_type === 'workout_log' && post.workout_log && (
                    <div className="mt-3 bg-gray-800/50 rounded-lg p-4">
                      <div className="text-lg font-medium">{post.workout_log.workout_name}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        {post.workout_log.date}
                      </div>
                      
                      {post.workout_log.exercises && post.workout_log.exercises.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-medium text-gray-300">Exercises:</div>
                          {post.workout_log.exercises.map((exercise, index) => (
                            <div key={index} className="bg-gray-700/30 p-3 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{exercise.name}</span>
                                <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">
                                  {exercise.sets} sets
                                </span>
                              </div>
                              {exercise.sets_data && exercise.sets_data.length > 0 && (
                                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-400">
                                  <div>Set</div>
                                  <div>Weight</div>
                                  <div>Reps</div>
                                  {exercise.sets_data.map((set, setIndex) => (
                                    <React.Fragment key={setIndex}>
                                      <div>{setIndex + 1}</div>
                                      <div>{set.weight} {set.weight_unit}</div>
                                      <div>{set.reps}</div>
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Program Share */}
                  {console.log("post : ", post)}
                  {post.post_type === 'program' && post.program && (
                    <div className="mt-3">
                      <ProgramCardPost 
                        programId={post.program_details.id} 
                        initialProgramData={post.program_details}
                        onClick={handleProgramSelect}
                      />
                    </div>
                  )}
                  
                  {/* Shared Post */}
                  {post.post_type === 'share' && post.shared_post && (
                    <div className="mt-3 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={getAvatarUrl(post.shared_post.user_avatar, 32)}
                          alt={`${post.shared_post.user_username}'s avatar`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="font-medium">{post.shared_post.user_username}</span>
                              <span className="text-xs text-gray-400">{formatTimestamp(post.shared_post.created_at)}</span>
                            </div>
                          </div>
                          
                          <p className="mt-2 text-gray-300">{post.shared_post.content}</p>
                          
                          {post.shared_post.image && (
                            <img
                              src={getAvatarUrl(post.shared_post.image)}
                              alt=""
                              className="mt-2 rounded-lg w-full object-cover max-h-60"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Post Actions */}
                  <div className="flex items-center gap-4 mt-4 text-gray-400">
                    <button className="flex items-center gap-1 hover:text-white text-sm">
                      <Heart className="w-4 h-4" />
                      {post.likes_count || 0}
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-white text-sm"
                      onClick={() => togglePostExpansion(post.id)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments?.length || 0}
                    </button>
                    <button className="flex items-center gap-1 hover:text-white text-sm">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                  
                  {/* Comments Section - Expandable */}
                  {expandedPost === post.id && post.comments && post.comments.length > 0 && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-gray-700">
                      <div className="text-sm font-medium text-gray-300">Comments</div>
                      {post.comments.map((comment, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <img
                            src={getAvatarUrl(comment.user_avatar, 24)}
                            alt={`${comment.user_username}'s avatar`}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="flex-1 bg-gray-800/40 p-2 rounded-lg">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-sm">{comment.user_username}</span>
                              <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          No posts yet
        </div>
      )}
    </div>
  );
};

export default RecentPosts;