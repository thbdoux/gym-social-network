import React, { useState, useRef } from 'react';
import { 
  Edit,
  Activity,
  Users,
  Dumbbell,
  Image as ImageIcon,
  Send,
  X,
  ChevronDown 
} from 'lucide-react';
import api from '../../../api';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [postType, setPostType] = useState('regular');
  const fileInputRef = useRef(null);

  const postTypes = {
    regular: {
      label: 'Regular Post',
      icon: Edit,
      color: 'blue'
    },
    workout_log: {
      label: 'Share Workout',
      icon: Activity,
      color: 'green'
    },
    workout_invite: {
      label: 'Group Workout',
      icon: Users,
      color: 'orange'
    },
    program: {
      label: 'Program Share',
      icon: Dumbbell,
      color: 'purple'
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setImageError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setImageError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('post_type', postType);
      
      if (image) {
        const imageFile = new File([image], image.name, { type: image.type });
        formData.append('image', imageFile);
      }

      const response = await api.post('/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      onPostCreated(response.data);
      setContent('');
      setImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    } catch (err) {
      console.error('Failed to create post:', err.response?.data || err);
    }
  };

  const currentType = postTypes[postType];
  const TypeIcon = currentType.icon;

  return (
    <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-75" />
      
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          {/* Post Type Selector */}
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${currentType.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  currentType.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  currentType.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-purple-500/20 text-purple-400'}`}
            >
              <TypeIcon className="w-4 h-4" />
              {currentType.label}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {showTypeMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700/50 overflow-hidden z-10">
                {Object.entries(postTypes).map(([key, type]) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setPostType(key);
                        setShowTypeMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-800 flex items-center gap-2
                        ${key === postType ? 'bg-gray-800' : ''}`}
                    >
                      <Icon className={`w-4 h-4 
                        ${type.color === 'blue' ? 'text-blue-400' :
                          type.color === 'green' ? 'text-green-400' :
                          type.color === 'orange' ? 'text-orange-400' :
                          'text-purple-400'}`}
                      />
                      <span className="text-gray-200">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Text Input */}
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

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-4">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    URL.revokeObjectURL(imagePreview);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full hover:bg-gray-900 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          )}

          {imageError && (
            <p className="mt-2 text-sm text-red-400">
              {imageError}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-900/50"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm">Add Image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </button>

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
      </div>
    </div>
  );
};

export default CreatePost;