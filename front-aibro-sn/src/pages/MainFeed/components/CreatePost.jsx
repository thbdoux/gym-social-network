import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit,
  Activity,
  Users,
  Dumbbell,
  ImageIcon,
  Send,
  X,
  ChevronDown,
  Clock,
  Calendar
} from 'lucide-react';
import api from '../../../api';
import ProgramSelector from './ProgramSelector';
import WorkoutLogSelector from './WorkoutLogSelector';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const typeButtonRef = useRef(null);
  const [postType, setPostType] = useState('regular');
  const [showWorkoutLogSelector, setShowWorkoutLogSelector] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedWorkoutLog, setSelectedWorkoutLog] = useState(null);
  const [gymName, setGymName] = useState(null);
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
      action: () => setShowWorkoutLogSelector(true)
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
    
    // Validation: Either content or an attachment (program/workout) is required
    if (!content.trim() && !selectedProgram && !selectedWorkoutLog) return;

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
      
      // If sharing a workout log, add the workout log ID
      if (postType === 'workout_log' && selectedWorkoutLog) {
        formData.append('workout_log_id', selectedWorkoutLog.id);
        console.log('Sharing workout log with ID:', selectedWorkoutLog.id);
      }

      console.log('Sending post data:', {
        content,
        post_type: postType,
        program_id: selectedProgram?.id || null,
        workout_log_id: selectedWorkoutLog?.id || null
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
    setSelectedWorkoutLog(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleProgramSelect = (program) => {
    console.log('Selected program:', program);
    setSelectedProgram(program);
    setShowProgramSelector(false);
    // Auto-populate content with program name
    setContent(`Check out my workout program: ${program.name}`);
  };
  
  const handleWorkoutLogSelect = async (workoutLog) => {
    console.log('Selected workout log:', workoutLog);
    
    // Fetch gym name if workoutLog has a gym ID
    if (workoutLog.gym) {
      try {
        const response = await api.get(`/gyms/${workoutLog.gym}/`);
        setGymName(response.data.name);
      } catch (error) {
        console.error('Error fetching gym details:', error);
        setGymName('Unknown Gym');
      }
    } else {
      setGymName(null);
    }
    
    setSelectedWorkoutLog(workoutLog);
    setShowWorkoutLogSelector(false);
    // Auto-populate content with workout name
    setContent(`Just completed: ${workoutLog.workout_name || workoutLog.name || "a workout"}`);
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
                  placeholder={
                    postType === 'program' && selectedProgram 
                      ? "Add a note about this program..." 
                      : postType === 'workout_log' && selectedWorkoutLog
                      ? "Add a note about this workout..."
                      : "What's on your mind?"
                  }
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
                  disabled={
                    (postType === 'program' && !selectedProgram && !content.trim()) || 
                    (postType === 'workout_log' && !selectedWorkoutLog && !content.trim()) || 
                    (postType !== 'program' && postType !== 'workout_log' && !content.trim())
                  }
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
              <div className="mt-3 bg-gray-800 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{selectedProgram.name}</h4>
                      <span className="text-xs bg-gray-700 text-purple-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {selectedProgram.focus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedProgram(null)}
                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                <p className="text-gray-400 text-sm bg-gray-900/50 p-3 rounded-lg mb-3">{selectedProgram.description}</p>
                
                <div className="grid grid-cols-2 gap-3 bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex flex-col items-center p-2 border-r border-gray-700">
                    <span className="text-xs text-gray-400">Frequency</span>
                    <span className="text-sm font-medium text-white mt-1">
                      {selectedProgram.sessions_per_week}x weekly
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2">
                    <span className="text-xs text-gray-400">Workouts</span>
                    <span className="text-sm font-medium text-white mt-1">
                      {selectedProgram.workouts?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Workout Log Preview if selected */}
            {postType === 'workout_log' && selectedWorkoutLog && (
              <div className="mt-3 bg-gray-800 rounded-lg p-4 border border-green-500/20 hover:border-green-500/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {selectedWorkoutLog.workout_name || selectedWorkoutLog.name || "Workout"}
                      </h4>
                      {selectedWorkoutLog.program_name && (
                        <span className="text-xs bg-gray-700 text-green-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {selectedWorkoutLog.program_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {selectedWorkoutLog.date || "No date"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {selectedWorkoutLog.location || gymName || "No location"}
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedWorkoutLog(null)}
                      className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 bg-gray-900/50 p-3 rounded-lg">
                  <div className="flex flex-col items-center p-2 border-r border-gray-700">
                    <span className="text-xs text-gray-400">Duration</span>
                    <span className="text-sm font-medium text-white mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-400" />
                      {selectedWorkoutLog.duration_mins || 0} mins
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 border-r border-gray-700">
                    <span className="text-xs text-gray-400">Volume</span>
                    <span className="text-sm font-medium text-white mt-1">
                      {selectedWorkoutLog.total_volume || 0} kg
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2">
                    <span className="text-xs text-gray-400">Exercises</span>
                    <span className="text-sm font-medium text-white mt-1">
                      {selectedWorkoutLog.exercise_count || selectedWorkoutLog.exercises?.length || 0}
                    </span>
                  </div>
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

      {/* Workout Log Selector Modal */}
      {showWorkoutLogSelector && (
        <WorkoutLogSelector
          onSelect={handleWorkoutLogSelect}
          onCancel={() => {
            setShowWorkoutLogSelector(false);
            if (!selectedWorkoutLog) {
              setPostType('regular');
            }
          }}
        />
      )}

      {/* Program Selector Modal */}
      {showProgramSelector && (
        <ProgramSelector
          onSelect={handleProgramSelect}
          onCancel={() => {
            setShowProgramSelector(false);
            if (!selectedProgram) {
              setPostType('regular');
            }
          }}
        />
      )}
    </>
  );
};

export default CreatePost;