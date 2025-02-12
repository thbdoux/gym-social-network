import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import api from '../../../api';
import { getAvatarUrl } from '../../../utils/imageUtils';

const UserPostsPage = () => {
  const { username } = useParams();
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsResponse, userResponse] = await Promise.all([
          api.get('/posts/'),
          api.get(`/users/me/`)
        ]);
        
        const userPosts = postsResponse.data.results.filter(
          post => post.user_username === username
        );
        setPosts(userPosts);
        setUserData(userResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);
  
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const response = await api.get('/posts/');
        // Filter posts by username from the full posts list
        const userPosts = response.data.results.filter(
          post => post.user_username === username
        );
        // console.log("UserPostsPage - API response:", response.data.results[0]);
        setPosts(userPosts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user posts:', error);
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/profile" 
          className="p-2 hover:bg-gray-800/40 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">Posts by {username}</h1>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-800/40 rounded-xl p-6">
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
                  <div className="mt-3 bg-gray-900/50 rounded-lg p-3">
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

        {posts.length === 0 && (
          <div className="text-center py-12 bg-gray-800/40 rounded-xl">
            <p className="text-gray-400">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPostsPage;