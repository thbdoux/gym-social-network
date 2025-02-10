import React, { useState, useEffect } from 'react';
import WelcomeHeader from './components/WelcomeHeader';
import CreatePost from './components/CreatePost';
import Post from './components/FeedContainer';
import ProgressCard from './components/ProgressCard';
import NextWorkout from './components/NextWorkout';
import RecentWorkouts from './components/RecentWorkouts';
import FeedContainer from './components/FeedContainer';
import api from '../../api';

const MainFeed = () => {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({});
  const [user, setUser] = useState(null);
  const [nextWorkout, setNextWorkout] = useState(null);
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel for better performance
        const [
          userResponse, 
          postsResponse, 
          statsResponse, 
          workoutLogsResponse
        ] = await Promise.all([
          api.get('/users/me/'),
          api.get('/posts/feed/'),
          api.get('/workouts/logs/stats/'),
          api.get('/workouts/logs/', {
            params: {
              limit: 5, // Get only last 5 workouts
              sort: '-date' // Sort by date descending
            }
          })
        ]);

        setUser(userResponse.data);
        setPosts(postsResponse.data);
        setStats(statsResponse.data);
        setRecentWorkouts(workoutLogsResponse.data);

        // If user has a current program, fetch next workout
        if (userResponse.data.current_program) {
          const programResponse = await api.get(
            `/workouts/programs/${userResponse.data.current_program}/`
          );
          if (programResponse.data.workouts?.length > 0) {
            setNextWorkout(programResponse.data.workouts[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like/`);
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, is_liked: !post.is_liked, likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1 }
          : post
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handlePostComment = async (postId, content) => {
    try {
      const response = await api.post(`/posts/${postId}/comment/`, { content });
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), response.data] }
          : post
      ));
    } catch (err) {
      console.error('Error commenting on post:', err);
    }
  };

  return (
    // <div className="min-h-screen bg-[#0B0E14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <WelcomeHeader username={user?.username} />
            <div className="space-y-6">
              <CreatePost onPostCreated={handlePostCreated} />
              <FeedContainer
                posts={posts}
                onLike={handlePostLike}
                onComment={handlePostComment}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4">
            <div className="space-y-6 lg:sticky lg:top-8">
              <ProgressCard stats={stats} />
              <NextWorkout workout={nextWorkout} />
              <RecentWorkouts workouts={recentWorkouts} />
            </div>
          </div>
        </div>
      </div>
    // </div>
  );
};


export default MainFeed;