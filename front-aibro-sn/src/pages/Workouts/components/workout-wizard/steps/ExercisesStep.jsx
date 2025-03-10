import React, { useState, useRef } from 'react';
import { 
  Dumbbell, Plus, Trash2, ChevronDown, ChevronUp,
  Settings, Award, Search
} from 'lucide-react';

// Equipment options for dropdown
const EQUIPMENT_OPTIONS = [
  "Barbell", "Dumbbell", "Kettlebell", "Machine", "Cable",
  "Smith Machine", "Bodyweight", "Resistance Band", "Other"
];

// Common exercise suggestions - organized by category
const EXERCISE_SUGGESTIONS = {
  "Upper Body": [
    "Bench Press", "Push-ups", "Shoulder Press", "Lat Pulldown", 
    "Bicep Curls", "Tricep Dips", "Pull-ups", "Chest Fly"
  ],
  "Lower Body": [
    "Squats", "Deadlifts", "Lunges", "Leg Press", 
    "Calf Raises", "Leg Extensions", "Hamstring Curls", "Hip Thrusts"
  ]
};

// Default rest time between sets
const DEFAULT_REST_TIME = 90;

// Exercise card component with minimalist rep tracker
// Enhanced version of the ExerciseCard component with a more compact header

const ExerciseCard = ({ exercise, onChange, onDelete, index, colors }) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const maxReps = 20; // Maximum number of reps
  const maxWeight = getMaxWeight(exercise.equipment); // Maximum weight based on equipment
  
  // Get max weight based on equipment for slider
  function getMaxWeight(equipment) {
    switch(equipment) {
      case "Barbell": return 500;
      case "Dumbbell": return 150;
      case "Kettlebell": return 100;
      case "Machine": return 300;
      case "Cable": return 200;
      default: return 100;
    }
  }
  
  // Handle set change
  const updateReps = (setId, newReps) => {
    const newSets = exercise.sets.map(set => 
      set.id === setId ? { ...set, reps: newReps } : set
    );
    onChange({ ...exercise, sets: newSets });
  };
  
  // Function to update weight for a specific set
  const updateWeight = (setId, newWeight) => {
    const newSets = exercise.sets.map(set => 
      set.id === setId ? { ...set, weight: newWeight } : set
    );
    onChange({ ...exercise, sets: newSets });
  };
  
  // Function to add a new set
  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = {
      id: Date.now(),
      reps: lastSet ? lastSet.reps : 8,
      weight: lastSet ? lastSet.weight : 50,
      rest_time: lastSet ? lastSet.rest_time : DEFAULT_REST_TIME,
      order: exercise.sets.length
    };
    onChange({ ...exercise, sets: [...exercise.sets, newSet] });
  };
  
  // Function to remove a set
  const removeSet = (setId) => {
    onChange({
      ...exercise,
      sets: exercise.sets.filter(set => set.id !== setId)
    });
  };
  
  // Minimalist set gauge component
  const SetGauge = ({ set, setId }) => {
    return (
      <div className="flex flex-col items-center rounded-lg shadow-md p-3 w-36">
        <div className="flex items-center justify-between w-full mb-1">
          <h3 className="font-semibold text-white text-sm">Set {set.order + 1}</h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (exercise.sets.length > 1) {
                removeSet(set.id);
              }
            }}
            className={`text-red-400 hover:text-red-500 transition-colors ${exercise.sets.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
        
        <div className="flex gap-4 h-40 mb-2 justify-center">
          {/* Reps gauge */}
          <div className="h-full w-8 bg-gray-800 rounded-full overflow-hidden flex items-end justify-center relative">
            <div 
              className="w-full rounded-t-full bg-gradient-to-t from-indigo-600 to-blue-400 transition-all duration-300"
              style={{ height: `${(set.reps / maxReps) * 100}%` }}
            ></div>
            
            {/* Clickable areas for reps */}
            <div className="absolute inset-0">
              {[...Array(maxReps)].map((_, index) => {
                const repValue = maxReps - index;
                return (
                  <div
                    key={`rep-${repValue}`}
                    onClick={() => updateReps(setId, repValue)}
                    className="absolute w-full cursor-pointer"
                    style={{ 
                      height: `${100 / maxReps}%`, 
                      top: `${(index * 100) / maxReps}%`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
          
          {/* Weight gauge */}
          <div className="h-full w-8 bg-gray-800 rounded-full overflow-hidden flex items-end justify-center relative">
            <div 
              className="w-full rounded-t-full bg-gradient-to-t from-amber-500 to-red-400 transition-all duration-300"
              style={{ height: `${(set.weight / maxWeight) * 100}%` }}
            ></div>
            
            {/* Clickable areas for weight */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, index) => {
                // Divide the maxWeight into 20 clickable sections
                const increment = maxWeight / 20;
                const weightValue = maxWeight - index * increment;
                return (
                  <div
                    key={`weight-${index}`}
                    onClick={() => updateWeight(setId, Math.round(weightValue / 5) * 5)}
                    className="absolute w-full cursor-pointer"
                    style={{ 
                      height: `5%`, 
                      top: `${index * 5}%`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between w-full text-xs font-medium">
          <div className="flex flex-col items-center">
            <span className="text-indigo-400">{set.reps}</span>
            <span className="text-gray-400">reps</span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-amber-400">{set.weight}</span>
            <span className="text-gray-400">
              {exercise.equipment === "Bodyweight" ? "assist" : "kg"}
            </span>
          </div>
        </div>
        
        {/* Show rest time if advanced options are enabled */}
        {showAdvancedOptions && (
          <div className="mt-3 w-full">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400">Rest Time</label>
              <span className="text-xs text-white">{set.rest_time}s</span>
            </div>
            <input
              type="range"
              min="15"
              max="300"
              step="15"
              value={set.rest_time}
              onChange={(e) => {
                const newSets = exercise.sets.map(s => 
                  s.id === set.id ? { ...s, rest_time: parseInt(e.target.value) } : s
                );
                onChange({ ...exercise, sets: newSets });
              }}
              className="w-full mt-1"
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg transition-all mb-4">
      {/* Exercise header - everything on one line */}
      <div className="bg-gray-800/50 flex items-center justify-between py-3 px-4">
        {/* Icon & Name */}
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${colors.bg} mr-3 shadow-md`}>
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          
          <input
            type="text"
            value={exercise.name}
            onChange={(e) => onChange({ ...exercise, name: e.target.value })}
            placeholder={`Exercise ${index + 1}`}
            className="bg-transparent border-b border-gray-700 px-0 py-1 text-white font-medium focus:border-blue-500 focus:ring-0 w-40"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        {/* Equipment dropdown */}
        <div className="px-2">
          <select
            value={exercise.equipment || ''}
            onChange={(e) => onChange({ ...exercise, equipment: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm appearance-none"
          >
            <option value="">Equipment</option>
            {EQUIPMENT_OPTIONS.map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
        
        {/* Action buttons group */}
        <div className="flex items-center space-x-2">
          {/* Advanced options toggle - icon only */}
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`p-1.5 rounded-lg ${showAdvancedOptions ? colors.bg : 'bg-gray-800'} transition-colors`}
          >
            <Settings className="w-4 h-4 text-white" />
          </button>
          
          {/* Add Set button - icon only */}
          <button
            type="button"
            onClick={addSet}
            className={`p-1.5 rounded-lg ${colors.bg} text-white flex items-center shadow-md hover:opacity-90 transition-all`}
          >
            <Plus className="w-4 h-4" />
          </button>
          
          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          {/* Expand/Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Expanded content with rep tracker */}
      {isExpanded && (
        <div className="px-4 pt-3 pb-5 bg-gray-800/30">
          {/* Sets without title */}
          <div className="flex overflow-x-auto gap-4 pb-2">
            {exercise.sets.map((set) => (
              <SetGauge key={set.id} set={set} setId={set.id} />
            ))}
          </div>
          
          {/* Notes field (if advanced options enabled) */}
          {showAdvancedOptions && (
            <div className="mt-4">
              <label className="block text-gray-300 mb-2 text-sm font-medium">
                Exercise Notes
              </label>
              <textarea
                value={exercise.notes || ''}
                onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
                placeholder="Add technique notes, targets, or reminders..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={2}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Vertical Exercise Library component
const VerticalExerciseLibrary = ({ onAddExercise, workoutType, onAddCustom, colors }) => {
  const [selectedCategory, setSelectedCategory] = useState(workoutType === "Upper Body" || workoutType === "Lower Body" ? workoutType : "Upper Body");
  const [search, setSearch] = useState('');
  
  // Filter exercises based on search
  const getFilteredExercises = (category) => {
    return EXERCISE_SUGGESTIONS[category].filter(ex => 
      ex.toLowerCase().includes(search.toLowerCase())
    );
  };
  
  return (
    <div className="bg-gray-900 rounded-xl h-full border border-gray-800 overflow-hidden flex flex-col">
      {/* Header with search */}
      <div className="p-4 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Award className="w-4 h-4 mr-2 text-blue-400" />
            <h3 className="text-sm font-medium text-white">Exercise Library</h3>
          </div>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          />
        </div>
      </div>
      
      {/* Category tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setSelectedCategory("Upper Body")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
            selectedCategory === "Upper Body" 
              ? `${colors.text} border-${colors.text}` 
              : 'text-gray-400 border-transparent'
          }`}
        >
          Upper Body
        </button>
        <button
          onClick={() => setSelectedCategory("Lower Body")}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
            selectedCategory === "Lower Body" 
              ? `${colors.text} border-${colors.text}` 
              : 'text-gray-400 border-transparent'
          }`}
        >
          Lower Body
        </button>
      </div>
      
      {/* Exercise list - scrollable */}
      <div className="overflow-y-auto flex-1 p-3">
        {selectedCategory === "Upper Body" && (
          <div className="space-y-2">
            {getFilteredExercises("Upper Body").length > 0 ? (
              getFilteredExercises("Upper Body").map(exercise => (
                <button
                  key={exercise}
                  onClick={() => onAddExercise(exercise)}
                  className="w-full text-left px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm flex items-center transition-all"
                >
                  <Dumbbell className="w-4 h-4 mr-2 text-gray-400" />
                  {exercise}
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No matching exercises found
              </div>
            )}
          </div>
        )}
        
        {selectedCategory === "Lower Body" && (
          <div className="space-y-2">
            {getFilteredExercises("Lower Body").length > 0 ? (
              getFilteredExercises("Lower Body").map(exercise => (
                <button
                  key={exercise}
                  onClick={() => onAddExercise(exercise)}
                  className="w-full text-left px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm flex items-center transition-all"
                >
                  <Dumbbell className="w-4 h-4 mr-2 text-gray-400" />
                  {exercise}
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No matching exercises found
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Custom exercise button - sticky at bottom */}
      <div className="p-3 border-t border-gray-800 bg-gray-800/50">
        <button
          onClick={onAddCustom}
          className={`w-full px-3 py-2.5 ${colors.bg} rounded-lg shadow-md hover:opacity-90 transition-all flex items-center justify-center`}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Custom Exercise</span>
        </button>
      </div>
    </div>
  );
};

// Main component with two-column layout
const ExercisesStep = ({ formData, updateFormData, errors, colors }) => {
  // Add a new exercise
  const addExercise = (name = '') => {
    const newExercise = {
      id: Date.now(),
      name,
      equipment: '',
      notes: '',
      order: formData.exercises.length,
      sets: [{
        id: Date.now() + 1,
        reps: 8,
        weight: 50,
        rest_time: DEFAULT_REST_TIME,
        order: 0
      }]
    };
    
    updateFormData({
      exercises: [...formData.exercises, newExercise]
    });
  };
  
  // Handle exercise change
  const handleExerciseChange = (index, updatedExercise) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = updatedExercise;
    updateFormData({ exercises: newExercises });
  };
  
  // Delete an exercise
  const deleteExercise = (index) => {
    updateFormData({
      exercises: formData.exercises.filter((_, i) => i !== index)
    });
  };
  
  return (
    <div className="grid grid-cols-3 gap-4" style={{ minHeight: '500px' }}>
      {/* Left column - Exercise Library */}
      <div className="col-span-1">
        <VerticalExerciseLibrary
          onAddExercise={(exerciseName) => addExercise(exerciseName)}
          onAddCustom={() => addExercise()}
          workoutType={formData.name}
          colors={colors}
        />
      </div>
      
      {/* Right column - Exercise List */}
      <div className="col-span-2">
        {/* Error message if no exercises */}
        {errors.exercises && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
            <div className="text-red-400 text-sm">{errors.exercises}</div>
          </div>
        )}
        
        {/* Exercise List */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 h-full overflow-y-auto">
          <h3 className="text-sm font-medium text-white mb-4">Your Exercises</h3>
          
          {formData.exercises.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-6">
                <div className="mx-auto w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Dumbbell className={`w-6 h-6 ${colors.text}`} />
                </div>
                <p className="text-gray-400 text-sm mx-auto">
                  Choose exercises from the library <br /> or add a custom exercise
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  onChange={(updatedExercise) => handleExerciseChange(index, updatedExercise)}
                  onDelete={() => deleteExercise(index)}
                  colors={colors}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExercisesStep;