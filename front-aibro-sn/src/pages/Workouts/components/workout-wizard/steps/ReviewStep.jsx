import React from 'react';
import { 
  Dumbbell, Calendar, MapPin, Clock, Flame, 
  CheckCircle, XCircle, ChevronRight
} from 'lucide-react';

const ReviewStep = ({ formData, colors }) => {
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get mood label
  const getMoodLabel = (value) => {
    if (value >= 8) return { emoji: "😀", label: "Great" };
    if (value >= 6) return { emoji: "🙂", label: "Good" };
    if (value >= 4) return { emoji: "😐", label: "Okay" };
    if (value >= 2) return { emoji: "☹️", label: "Poor" };
    return { emoji: "😫", label: "Terrible" };
  };
  
  // Get difficulty label
  const getDifficultyLabel = (value) => {
    if (value >= 8) return { label: "Hard", color: "text-red-400" };
    if (value >= 6) return { label: "Challenging", color: "text-orange-400" };
    if (value >= 4) return { label: "Moderate", color: "text-yellow-400" };
    return { label: "Easy", color: "text-green-400" };
  };
  
  const mood = getMoodLabel(formData.mood_rating);
  const difficulty = getDifficultyLabel(formData.perceived_difficulty);
  
  // Count total sets
  const totalSets = formData.exercises.reduce(
    (total, exercise) => total + exercise.sets.length, 0
  );
  
  return (
    <div className="space-y-4">
      {/* Workout summary card */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h3 className="font-semibold text-white text-base mb-3 flex items-center">
          <Dumbbell className={`w-4 h-4 mr-2 ${colors.text}`} />
          {formData.name || "Unnamed Workout"}
        </h3>
        
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          {/* Date */}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-300">{formatDate(formData.date)}</span>
          </div>
          
          {/* Location */}
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-300">
              {formData.gym ? "Gym" : "Home Workout"}
            </span>
          </div>
          
          {/* Duration */}
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-300">{formData.duration} minutes</span>
          </div>
          
          {/* Status */}
          <div className="flex items-center">
            {formData.completed ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-gray-300">Completed</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-yellow-500 mr-2" />
                <span className="text-gray-300">Partially Done</span>
              </>
            )}
          </div>
          
          {/* Difficulty */}
          <div className="flex items-center">
            <Flame className={`w-4 h-4 mr-2 ${difficulty.color}`} />
            <span className="text-gray-300">
              {difficulty.label} ({formData.perceived_difficulty}/10)
            </span>
          </div>
          
          {/* Mood */}
          <div className="flex items-center">
            <span className="text-xl mr-2">{mood.emoji}</span>
            <span className="text-gray-300">
              {mood.label} ({formData.mood_rating}/10)
            </span>
          </div>
        </div>
      </div>
      
      {/* Exercise summary */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-white text-sm">
            Exercises ({formData.exercises.length})
          </h3>
          <span className="text-xs text-gray-400">
            {totalSets} total sets
          </span>
        </div>
        
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {formData.exercises.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-sm">
              No exercises added yet
            </div>
          ) : (
            formData.exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className={`p-2 flex items-center justify-between ${
                  index < formData.exercises.length - 1 ? 'border-b border-gray-700' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`${colors.bg} p-1 rounded mr-2`}>
                    <Dumbbell className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-white text-sm">{exercise.name}</div>
                    <div className="text-xs text-gray-400">
                      {exercise.sets.length} sets • {exercise.equipment || 'No equipment'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Notes summary (if any) */}
      {formData.performance_notes && (
        <div>
          <h3 className="font-semibold text-white text-sm mb-1">Notes</h3>
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
            <p className="text-gray-300 text-xs whitespace-pre-line">
              {formData.performance_notes}
            </p>
          </div>
        </div>
      )}
      
      {/* Media gallery preview (if any) */}
      {formData.media.length > 0 && (
        <div>
          <h3 className="font-semibold text-white text-sm mb-1">
            Photos ({formData.media.length})
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {formData.media.slice(0, 4).map((file, index) => (
              <div key={index} className="bg-gray-800 rounded-lg overflow-hidden aspect-square">
                <img 
                  src={file instanceof File ? URL.createObjectURL(file) : (file.url || file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewStep;