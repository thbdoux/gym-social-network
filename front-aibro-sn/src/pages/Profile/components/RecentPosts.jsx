import { React, useEffect, useState } from 'react';
import { 
  ChevronRight,
  Heart,
  MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAvatarUrl } from '../../../utils/imageUtils';
import api from './../../../api';

const RecentPosts = ({ posts, username }) => {
  const [userData, setUserData] = useState(null);
  const userPosts = Array.isArray(posts) 
    ? posts.filter(post => post.user_username === username).slice(0, 3)
    : [];
  // console.log("RecentPosts - post data:", userPosts[0]);
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


  return (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Posts</h2>
        <Link 
          to={`/users/${username}/posts`} 
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
        >
          Show More <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {userPosts.length > 0 ? (
        <div className="space-y-4">
          {userPosts.map((post) => (
            <div key={post.id} className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
              <div className="flex items-start gap-3">
              <img
                src={getAvatarUrl(userData?.avatar, 40)} // Changed from post.user_profile_picture
                alt={`${post.user_username}'s avatar`}
                className="w-10 h-10 rounded-full object-cover"
              />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{post.created_at}</span>
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
                      className="mt-3 rounded-lg w-full object-cover max-h-80"
                    />
                  )}
                  {post.workout_log && (
                    <div className="mt-3 bg-gray-800/50 rounded-lg p-3">
                      <div className="text-sm font-medium">{post.workout_log.workout_name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {post.workout_log.exercises?.length || 0} exercises • {post.workout_log.date}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-gray-400">
                    <button className="flex items-center gap-1 hover:text-white text-sm">
                      <Heart className="w-4 h-4" />
                      {post.likes_count}
                    </button>
                    <button className="flex items-center gap-1 hover:text-white text-sm">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments?.length || 0}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No posts yet
        </div>
      )}
    </div>
  );
};

export default RecentPosts;