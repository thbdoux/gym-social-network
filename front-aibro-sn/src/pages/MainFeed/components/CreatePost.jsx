import React, { useState } from 'react';
import { 
  Edit,
  Activity,
  Users,
  Dumbbell,
  Image, 
  Send 
} from 'lucide-react';
import api from '../../../api'

const CreatePost = ({ onPostCreated }) => {
  const [postType, setPostType] = useState(null);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('post_type', postType || 'regular');
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/posts/', formData);
      onPostCreated(response.data);
      setContent('');
      setImage(null);
      setPostType(null);
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const renderPostTypeButton = (type, icon, label, gradient) => (
    <button
      onClick={() => setPostType(type)}
      className={`flex-1 bg-gray-900/50 rounded-lg p-4 transition-all duration-300 hover:-translate-y-1
        ${gradient === 'blue' ? 'hover:shadow-blue-500/20' : 
         gradient === 'green' ? 'hover:shadow-green-500/20' : 
         gradient === 'orange' ? 'hover:shadow-orange-500/20' :
         'hover:shadow-purple-500/20'}`}
    >
      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center
        ${gradient === 'blue' ? 'bg-blue-500/20 text-blue-400' : 
         gradient === 'green' ? 'bg-green-500/20 text-green-400' : 
         gradient === 'orange' ? 'bg-orange-500/20 text-orange-400' :
         'bg-purple-500/20 text-purple-400'}`}
      >
        {icon}
      </div>
      <p className="text-white text-center font-medium">{label}</p>
    </button>
  );

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
      {/* Progress Bar Background */}
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-75" />
      
      <div className="p-6">
        {!postType ? (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Create Post
                </h3>
                <p className="text-gray-400 mt-1">Share your fitness journey</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {renderPostTypeButton(
                'regular',
                <Edit className="w-6 h-6" />,
                'Regular Post',
                'blue'
              )}
              {renderPostTypeButton(
                'workout_log',
                <Activity className="w-6 h-6" />,
                'Share Workout',
                'green'
              )}
              {renderPostTypeButton(
                'workout_invite',
                <Users className="w-6 h-6" />,
                'Group Workout',
                'orange'
              )}
              {renderPostTypeButton(
                'program',
                <Dumbbell className="w-6 h-6" />,
                'Share Program',
                'purple'
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {postType === 'workout_log' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                    Workout Post
                  </span>
                )}
                {postType === 'workout_invite' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400">
                    Group Workout
                  </span>
                )}
                {postType === 'program' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400">
                    Program Share
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPostType(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === 'workout_log' ? "Share your workout achievement..." :
                postType === 'workout_invite' ? "Invite friends to workout together..." :
                postType === 'program' ? "Share your training program..." :
                "What's on your mind?"
              }
              className="w-full bg-gray-900/50 text-gray-100 rounded-lg p-4 min-h-[120px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-gray-500"
            />

            <div className="flex items-center justify-between mt-4">
              <label className="cursor-pointer flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-900/50">
                <Image className="w-5 h-5" />
                <span className="text-sm">Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={!content.trim()}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50
                  ${postType === 'workout_log' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' :
                    postType === 'workout_invite' ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' :
                    postType === 'program' ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' :
                    'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'}`}
              >
                <Send className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePost;