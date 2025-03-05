import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit,
  Activity,
  Users,
  Dumbbell,
  ImageIcon,
  Send,
  X,
  ChevronDown 
} from 'lucide-react';
import api from '../../../api';
import ShareWorkoutLog from './ShareWorkoutLog';
import ProgramSelector from './ProgramSelector';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const typeButtonRef = useRef(null);
  const [postType, setPostType] = useState('regular');
  const [showShareWorkout, setShowShareWorkout] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
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
      color: 'green',
      action: () => setShowShareWorkout(true)
    },
    program: {
      label: 'Share Program',
      icon: Dumbbell,
      color: 'purple',
      action: () => setShowProgramSelector(true)
    },
    workout_invite: {
      label: 'Group Workout',
      icon: Users,
      color: 'orange'
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
    if (!content.trim() && !selectedProgram) return;

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('post_type', postType);
      
      if (image) {
        formData.append('image', image);
      }
      
      // If sharing a program, add the program ID
      if (postType === 'program' && selectedProgram) {
        formData.append('program_id', selectedProgram.id);
        console.log('Sharing program with ID:', selectedProgram.id);
      }

      console.log('Sending post data:', {
        content,
        post_type: postType,
        program_id: selectedProgram?.id || null
      });

      const response = await api.post('/posts/', formData);
      console.log('Post created response:', response.data);
      onPostCreated(response.data);
      resetForm();
    } catch (err) {
      console.error('Failed to create post:', err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to create post: ${err.response?.data?.detail || err.message}`);
    }
  };

  const resetForm = () => {
    setContent('');
    setImage(null);
    setPostType('regular');
    setSelectedProgram(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleShareWorkout = async (postData) => {
    try {
      console.log('About to send post data:', postData);
      
      // Ensure we're using the right parameter name for the API
      // If postData contains workout_log instead of workout_log_id, fix it
      if (postData.workout_log && !postData.workout_log_id) {
        postData.workout_log_id = postData.workout_log;
        delete postData.workout_log;
      }
      
      const response = await api.post('/posts/', postData);
      
      console.log('Response from API:', response.data);
      console.log('Response headers:', response.headers);
      
      onPostCreated(response.data);
      setShowShareWorkout(false);
      setPostType('regular');
    } catch (err) {
      console.error('Failed to share workout:', err);
      console.error('Error response:', err.response?.data);
      if (err.response?.data) {
        alert('Error sharing workout: ' + JSON.stringify(err.response.data));
      }
    }
  };

  const handleProgramSelect = (program) => {
    console.log('Selected program:', program);
    setSelectedProgram(program);
    setShowProgramSelector(false);
    // Auto-populate content with program name
    setContent(`Check out my workout program: ${program.name}`);
  };

  const currentType = postTypes[postType];
  const TypeIcon = currentType.icon;

  const handleTypeSelect = (key, type) => {
    console.log(`Selecting post type: ${key}`);
    setPostType(key);
    setShowTypeMenu(false);
    
    // Important: Call the action function if it exists
    if (type.action) {
      console.log(`Executing action for post type: ${key}`);
      type.action();
    }
  };
  
  // Close the type menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeButtonRef.current && !typeButtonRef.current.contains(event.target)) {
        setShowTypeMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3">
              {/* Post Type Selector on the left */}
              <div className="relative" ref={typeButtonRef}>
                <button
                  type="button"
                  onClick={() => setShowTypeMenu(!showTypeMenu)}
                  className={`flex items-center gap-2 px-3 py-2 h-10 rounded-lg text-sm font-medium transition-colors
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
                  <div className="fixed mt-1 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-700/50 overflow-hidden z-50">
                    {Object.entries(postTypes).map(([key, type]) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleTypeSelect(key, type)}
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

              {/* Textarea */}
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={postType === 'program' && selectedProgram 
                    ? "Add a note about this program..." 
                    : "What's on your mind?"}
                  className="w-full bg-gray-800 text-gray-100 rounded-lg p-3 h-10 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-gray-500 transition-all"
                  style={{ minHeight: '40px', paddingTop: '8px', paddingBottom: '8px' }}
                />
              </div>

              {/* Upload and Post buttons on the right */}
              <div className="flex items-center gap-2">
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-900/50"
                >
                  <ImageIcon className="w-5 h-5" />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </button>

                {/* Post Button */}
                <button
                  type="submit"
                  disabled={(postType === 'program' && !selectedProgram) || 
                            (postType !== 'program' && !content.trim())}
                  className={`h-10 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50
                  ${postType === 'workout_log' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' :
                    postType === 'workout_invite' ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' :
                    postType === 'program' ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' :
                    'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'}`}
                >
                  <Send className="w-4 h-4" />
                  <span>Post</span>
                </button>
              </div>
            </div>

            {/* Program Preview if selected */}
            {postType === 'program' && selectedProgram && (
              <div className="mt-3 bg-gray-800 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-purple-400" />
                    <h4 className="font-medium text-white">{selectedProgram.name}</h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedProgram(null)}
                    className="p-1 hover:bg-gray-700 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">{selectedProgram.description}</p>
                <div className="mt-2 text-xs text-gray-500">
                  {selectedProgram.sessions_per_week}x per week • 
                  {selectedProgram.focus.replace(/_/g, ' ')} • 
                  {selectedProgram.workouts?.length || 0} workouts
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-3">
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      URL.revokeObjectURL(imagePreview);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-full hover:bg-gray-800 transition-colors"
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
          </form>
        </div>
      </div>

      {/* Share Workout Modal */}
      {showShareWorkout && (
        <ShareWorkoutLog
          onClose={() => {
            setShowShareWorkout(false);
            setPostType('regular');
          }}
          onShare={handleShareWorkout}
        />
      )}

      {/* Program Selector Modal */}
      {showProgramSelector && (
        <ProgramSelector
          onSelect={handleProgramSelect}
          onCancel={() => {
            setShowProgramSelector(false);
            setPostType('regular');
          }}
        />
      )}
    </>
  );
};

export default CreatePost;