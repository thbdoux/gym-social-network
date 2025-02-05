import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Award, Calendar, Image, Send } from 'lucide-react';
import Feed from '../../components/Feed';
import { usePosts } from './contexts/PostsContext';
import api from '../../api';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onPostCreated(response.data);
      setContent('');
      setImage(null);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your workout progress..."
          className="w-full bg-gray-800 text-gray-100 rounded-lg p-4 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors">
              <Image className="w-5 h-5" />
              <span>Add Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {image && (
              <span className="text-sm text-gray-400">
                Image selected: {image.name}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Post</span>
          </button>
        </div>
      </form>
    </div>
  );
};

const RecentActivityCard = ({ activity }) => (
  <div className="flex items-center space-x-4 p-4 hover:bg-gray-800/50 rounded-lg transition-colors">
    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{activity.user_username}</p>
      <p className="text-xs text-gray-400 truncate">{activity.description}</p>
    </div>
    <div className="text-xs text-gray-400">
      {new Date(activity.created_at).toLocaleDateString()}
    </div>
  </div>
);

const ProgressCard = ({ stat }) => (
  <div className="bg-gray-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-400">{stat.label}</h3>
      <div className={`p-2 rounded-full ${stat.trend > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        <TrendingUp className="w-4 h-4" />
      </div>
    </div>
    <p className="mt-2 text-2xl font-bold">{stat.value}</p>
    <p className="text-xs text-gray-400 mt-1">vs last month</p>
  </div>
);

const SideCard = ({ title, icon: Icon, children }) => (
  <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
    <div className="p-4 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const MainFeed = () => {
  const { posts, loading, error, fetchPosts, addPost: handlePostCreated, updatePosts: handleUpdatePost } = usePosts();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    console.log('MainFeed mounted');
    let mounted = true;  // Add mounted flag

    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        if (mounted) {  // Only proceed if component is mounted
          await fetchPosts();
          
          const today = new Date();
          const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
          const logsResponse = await api.get('/workouts/logs/', {
            params: {
              start_date: lastMonth.toISOString().split('T')[0],
              end_date: new Date().toISOString().split('T')[0]
            }
          });

          if (mounted) {  // Check mounted before setting state
            setStats([
              {
                label: 'Workouts This Month',
                value: logsResponse.data.total_workouts,
                trend: 5
              },
              {
                label: 'Completion Rate',
                value: `${logsResponse.data.completion_rate}%`,
                trend: 2
              }
            ]);

            setActivities([
              {
                user_username: "JohnDoe",
                description: "Completed leg day workout",
                created_at: new Date()
              },
              {
                user_username: "JaneSmith",
                description: "Hit a new PR on deadlifts",
                created_at: new Date()
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []); // Remove fetchPosts from dependencies

  useEffect(() => {
    console.log('Posts updated:', posts);
  }, [posts]);

  console.log('MainFeed rendering with posts:', posts);

  return (
    <div className="flex gap-8">
      {/* Main Feed Column */}
      <div className="flex-1">
        <CreatePost onPostCreated={handlePostCreated} />
        <Feed
          posts={posts || []}
          loading={loading}
          error={error}
          onUpdatePost={handleUpdatePost}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-80 space-y-6">
        {/* Quick Stats */}
        <SideCard title="Your Progress" icon={Activity}>
          <div className="grid grid-cols-1 gap-4">
            {stats.map((stat, index) => (
              <ProgressCard key={index} stat={stat} />
            ))}
          </div>
        </SideCard>

        {/* Recent Activity */}
        <SideCard title="Recent Activity" icon={Calendar}>
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <RecentActivityCard key={index} activity={activity} />
            ))}
          </div>
        </SideCard>

        {/* Next Workout Preview */}
        <SideCard title="Next Workout" icon={Award}>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium">Upper Body Strength</h3>
            <p className="text-sm text-gray-400 mt-1">Today at 6:00 PM</p>
            <div className="mt-3 space-y-2">
              <div className="text-sm">
                <span className="text-gray-400">Location: </span>
                FITNESS PARK, Boulogne
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Duration: </span>
                ~60 minutes
              </div>
            </div>
          </div>
        </SideCard>
      </div>
    </div>
  );
};

export default MainFeed;