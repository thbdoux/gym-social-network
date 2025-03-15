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
import ProgramSelector from './ProgramSelector';
import WorkoutLogSelector from './WorkoutLogSelector';
import { useCreatePost, useGym } from '../../../hooks/query';

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
  const fileInputRef = useRef(null);

  // Use React Query hooks
  const createPostMutation = useCreatePost();
  
  // Fetch gym data if there's a selected workout log with a gym
  const { data: gymData } = useGym(
    selectedWorkoutLog?.gym, 
    { enabled: !!selectedWorkoutLog?.gym }
  );
  
  // Get gym name for UI display
  const gymName = gymData?.name || null;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation: Either content or an attachment (program/workout) is required
    if (!content.trim() && !selectedProgram && !selectedWorkoutLog) return;

    // Create FormData object
    const formData = new FormData();
    formData.append('content', content);
    formData.append('post_type', postType);
    
    if (image) {
      formData.append('image', image);
    }
    
    // If sharing a program, add the program ID
    if (postType === 'program' && selectedProgram) {
      formData.append('program_id', selectedProgram.id);
    }
    
    // If sharing a workout log, add the workout log ID
    if (postType === 'workout_log' && selectedWorkoutLog) {
      formData.append('workout_log_id', selectedWorkoutLog.id);
    }

    // Use React Query mutation
    createPostMutation.mutate(formData, {
      onSuccess: (createdPost) => {
        // Reset the form
        resetForm();
      },
      onError: (error) => {
        console.error('Failed to create post:', error);
        alert(`Failed to create post: ${error.message || 'Unknown error'}`);
      }
    });
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
    setSelectedProgram(program);
    setShowProgramSelector(false);
    // Auto-populate content with program name
    setContent(`Check out my workout program: ${program.name}`);
  };
  
  const handleWorkoutLogSelect = (workoutLog) => {
    setSelectedWorkoutLog(workoutLog);
    setShowWorkoutLogSelector(false);
    // Auto-populate content
    setContent(`Just completed: ${workoutLog.workout_name || workoutLog.name || "a workout"}`);
  };

  // Handle removing program or workout log
  const handleRemoveProgram = () => {
    setSelectedProgram(null);
    setPostType('regular');
    setContent('');
  };

  const handleRemoveWorkoutLog = () => {
    setSelectedWorkoutLog(null);
    setPostType('regular');
    setContent('');
  };

  const currentType = postTypes[postType];
  const TypeIcon = currentType.icon;

  const handleTypeSelect = (key, type) => {
    setPostType(key);
    setShowTypeMenu(false);
    
    // Call the action function if it exists
    if (type.action) {
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
                    (postType !== 'program' && postType !== 'workout_log' && !content.trim()) ||
                    createPostMutation.isPending
                  }
                  className={`h-10 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50
                  ${postType === 'workout_log' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' :
                    postType === 'workout_invite' ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400' :
                    postType === 'program' ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' :
                    'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'}`}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Program Preview if selected */}
            {postType === 'program' && selectedProgram && (
              <div className="mt-3 p-4 rounded-xl border overflow-hidden relative transition-all duration-300 border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-violet-800/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center mb-2">
                    <div className="p-2.5 rounded-lg mr-3 bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg">
                      <Dumbbell className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white flex items-center text-base">
                        <span className="truncate">{selectedProgram.name}</span>
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-700/50 text-purple-400 px-2 py-0.5 rounded-full">
                          {selectedProgram.focus.replace(/_/g, ' ')}
                        </span>
                        {selectedProgram.is_active && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleRemoveProgram}
                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                {/* Description (limited to 2 lines) */}
                <div className="mt-2 text-sm text-gray-400 line-clamp-2 bg-gray-800/50 p-2 rounded-lg">
                  {selectedProgram.description || "No description available"}
                </div>
                
                {/* Program stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 bg-gray-800/70 p-2 rounded-lg">
                  <div className="flex items-center gap-2 p-1">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs text-gray-500">Frequency</span>
                      <p className="text-sm font-medium text-white">
                        {selectedProgram.sessions_per_week}x weekly
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-1">
                    <Users className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs text-gray-500">Workouts</span>
                      <p className="text-sm font-medium text-white">
                        {selectedProgram.workouts?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Bottom gradient bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500"></div>
              </div>
            )}
            
            {/* Workout Log Preview if selected */}
            {postType === 'workout_log' && selectedWorkoutLog && (
              <div className="mt-3 p-4 rounded-xl border overflow-hidden relative transition-all duration-300 border-green-500/50 bg-gradient-to-br from-green-900/20 to-emerald-800/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center mb-2">
                    <div className="p-2.5 rounded-lg mr-3 bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white flex items-center text-base">
                        <span className="truncate">{selectedWorkoutLog.workout_name || selectedWorkoutLog.name || "Unnamed Workout"}</span>
                      </h4>
                      {selectedWorkoutLog.program_name && (
                        <span className="text-xs bg-gray-700/50 text-green-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {selectedWorkoutLog.program_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={handleRemoveWorkoutLog}
                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-green-400" />
                  <span>{selectedWorkoutLog.date || "No date"}</span>
                </div>
                
                <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-green-400" />
                  <span>{selectedWorkoutLog.duration_mins || 0} mins</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-800/70 p-2 rounded-lg text-center">
                  <div>
                    <span className="text-xs text-gray-500">Exercises</span>
                    <p className="text-sm font-medium text-white">
                      {selectedWorkoutLog.exercise_count || selectedWorkoutLog.exercises?.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Volume</span>
                    <p className="text-sm font-medium text-white">
                      {selectedWorkoutLog.total_volume || 0} kg
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Location</span>
                    <p className="text-sm font-medium text-white truncate">
                      {selectedWorkoutLog.location || gymName || "—"}
                    </p>
                  </div>
                </div>
                
                {/* Bottom gradient bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
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