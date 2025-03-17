import React, { useState, useRef } from 'react';
import { 
  Dumbbell, Plus, Trash2, ChevronDown, ChevronUp,
  Settings, Award, Search, Info, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

const ExercisesStep = ({ formData, updateFormData, errors, colors }) => {
  const { t } = useLanguage();
  const [showTip, setShowTip] = useState(false);
  
  // Equipment options for dropdown with translations
  const EQUIPMENT_OPTIONS = [
    t("barbell"), t("dumbbell"), t("kettlebell"), t("machine"), t("cable"),
    t("smith_machine"), t("bodyweight"), t("resistance_band"), t("other")
  ];

  // Common exercise suggestions - organized by category with translations
  const getExerciseSuggestions = () => ({
    [t("upper_body")]: [
      t("bench_press"), t("push_ups"), t("shoulder_press"), t("lat_pulldown"), 
      t("bicep_curls"), t("tricep_dips"), t("pull_ups"), t("chest_fly")
    ],
    [t("lower_body")]: [
      t("squats"), t("deadlifts"), t("lunges"), t("leg_press"), 
      t("calf_raises"), t("leg_extensions"), t("hamstring_curls"), t("hip_thrusts")
    ]
  });

  const EXERCISE_SUGGESTIONS = getExerciseSuggestions();
  
  // Default rest time between sets
  const DEFAULT_REST_TIME = 90;

  // Exercise card component with minimalist rep tracker
  const ExerciseCard = ({ exercise, onChange, onDelete, index, colors }) => {
    const [isExpanded, setIsExpanded] = useState(index === 0);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    
    const maxReps = 20; // Maximum number of reps
    const maxWeight = getMaxWeight(exercise.equipment); // Maximum weight based on equipment
    
    // Get max weight based on equipment for slider
    function getMaxWeight(equipment) {
      switch(equipment) {
        case t("barbell"): return 250;
        case t("dumbbell"): return 70;
        case t("kettlebell"): return 100;
        case t("machine"): return 200;
        case t("cable"): return 100;
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
            <h3 className="font-semibold text-white text-sm">{t("set")} {set.order + 1}</h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (exercise.sets.length > 1) {
                  removeSet(set.id);
                }
              }}
              className={`text-red-400 hover:text-red-500 transition-colors ${exercise.sets.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
              title={t("remove_set")}
              aria-label={t("remove_set")}
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
                      title={`${repValue} ${t("reps")}`}
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
                      title={`${Math.round(weightValue / 5) * 5}kg`}
                    ></div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between w-full text-xs font-medium">
            <div className="flex flex-col items-center">
              <span className="text-indigo-400">{set.reps}</span>
              <span className="text-gray-400">{t("reps")}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-amber-400">{set.weight}</span>
              <span className="text-gray-400">
                {exercise.equipment === t("bodyweight") ? t("assist") : t("kg")}
              </span>
            </div>
          </div>
          
          {/* Show rest time if advanced options are enabled */}
          {showAdvancedOptions && (
            <div className="mt-3 w-full">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">{t("rest_time")}</label>
                <span className="text-xs text-white">{set.rest_time}{t("seconds")}</span>
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
              placeholder={`${t("exercise")} ${index + 1}`}
              className="bg-transparent border-b border-gray-700 px-0 py-1 text-white font-medium focus:border-blue-500 focus:ring-0 w-40"
              onClick={(e) => e.stopPropagation()}
              aria-label={t("exercise_name")}
            />
          </div>
          
          {/* Equipment dropdown */}
          <div className="px-2">
            <select
              value={exercise.equipment || ''}
              onChange={(e) => onChange({ ...exercise, equipment: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm appearance-none"
              aria-label={t("select_equipment")}
            >
              <option value="">{t("equipment")}</option>
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
              title={t("advanced_options")}
              aria-label={t("advanced_options")}
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
            
            {/* Add Set button - icon only */}
            <button
              type="button"
              onClick={addSet}
              className={`p-1.5 rounded-lg ${colors.bg} text-white flex items-center shadow-md hover:opacity-90 transition-all`}
              title={t("add_set")}
              aria-label={t("add_set")}
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
              title={t("delete_exercise")}
              aria-label={t("delete_exercise")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            {/* Expand/Collapse Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title={isExpanded ? t("collapse") : t("expand")}
              aria-label={isExpanded ? t("collapse") : t("expand")}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Expanded content with rep tracker */}
        {isExpanded && (
          <div className="px-4 pt-3 pb-5 bg-gray-800/30">
            {/* Sets without title */}
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {exercise.sets.map((set) => (
                <SetGauge key={set.id} set={set} setId={set.id} />
              ))}
            </div>
            
            {/* Notes field (if advanced options enabled) */}
            {showAdvancedOptions && (
              <div className="mt-4">
                <label className="block text-gray-300 mb-2 text-sm font-medium">
                  {t("exercise_notes")}
                </label>
                <textarea
                  value={exercise.notes || ''}
                  onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
                  placeholder={t("exercise_notes_placeholder")}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={2}
                  aria-label={t("exercise_notes")}
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
    // Determine the default category based on workout type
    const getDefaultCategory = () => {
      const upperBodyKey = t("upper_body");
      const lowerBodyKey = t("lower_body");
      
      // First check if the workout type is one of our translated keys
      if (workoutType === upperBodyKey || workoutType === lowerBodyKey) {
        return workoutType;
      }
      
      // Check if it contains upper/lower in any language variation
      if (
        workoutType === "Upper Body" || 
        workoutType.toLowerCase().includes("upper") ||
        workoutType.toLowerCase().includes(t("upper").toLowerCase())
      ) {
        return upperBodyKey;
      }
      
      if (
        workoutType === "Lower Body" || 
        workoutType.toLowerCase().includes("lower") ||
        workoutType.toLowerCase().includes(t("lower").toLowerCase())
      ) {
        return lowerBodyKey;
      }
      
      // Default to upper body
      return upperBodyKey;
    };
    
    const [selectedCategory, setSelectedCategory] = useState(getDefaultCategory());
    const [search, setSearch] = useState('');
    
    // Filter exercises based on search
    const getFilteredExercises = (category) => {
      if (!EXERCISE_SUGGESTIONS[category]) return [];
      
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
              <h3 className="text-sm font-medium text-white">{t("exercise_library")}</h3>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_exercises")}
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              aria-label={t("search_exercises")}
            />
          </div>
        </div>
        
        {/* Category tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setSelectedCategory(t("upper_body"))}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              selectedCategory === t("upper_body") 
                ? `${colors.text} border-${colors.text}` 
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
            }`}
            aria-label={t("upper_body")}
          >
            {t("upper_body")}
          </button>
          <button
            onClick={() => setSelectedCategory(t("lower_body"))}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              selectedCategory === t("lower_body") 
                ? `${colors.text} border-${colors.text}` 
                : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600'
            }`}
            aria-label={t("lower_body")}
          >
            {t("lower_body")}
          </button>
        </div>
        
        {/* Exercise list - scrollable */}
        <div className="overflow-y-auto flex-1 p-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {getFilteredExercises(selectedCategory).length > 0 ? (
            <div className="space-y-2">
              {getFilteredExercises(selectedCategory).map(exercise => (
                <button
                  key={exercise}
                  onClick={() => onAddExercise(exercise)}
                  className="w-full text-left px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm flex items-center transition-all"
                >
                  <Dumbbell className="w-4 h-4 mr-2 text-gray-400" />
                  {exercise}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              {t("no_matching_exercises")}
            </div>
          )}
        </div>
        
        {/* Custom exercise button - sticky at bottom */}
        <div className="p-3 border-t border-gray-800 bg-gray-800/50">
          <button
            onClick={onAddCustom}
            className={`w-full px-3 py-2.5 ${colors.bg} rounded-lg shadow-md hover:opacity-90 transition-all flex items-center justify-center`}
            aria-label={t("custom_exercise")}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>{t("custom_exercise")}</span>
          </button>
        </div>
      </div>
    );
  };

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
    <>
      {/* Info tip about exercises */}
      <div className="mb-4 relative">
        <div 
          className={`
            flex items-start p-4 rounded-lg border border-gray-700 transition-all duration-300
            ${showTip ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-800/30'}
          `}
        >
          <button
            onClick={() => setShowTip(!showTip)}
            className={`
              p-2 rounded-full transition-all duration-300 flex-shrink-0 mr-3
              ${showTip ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-gray-300'}
            `}
            aria-label={showTip ? t("hide_tip") : t("show_tip")}
          >
            {showTip ? <Info className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </button>
          
          <div className={`transition-all duration-300 ${showTip ? 'opacity-100' : 'opacity-70'}`}>
            <h3 className="font-medium text-white mb-1">
              {showTip ? t("exercise_tip_title_expanded") : t("exercise_tip_title")}
            </h3>
            
            {showTip && (
              <p className="text-sm text-gray-300 animate-fadeIn">
                {t("exercise_tip_description")}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: '500px' }}>
        {/* Left column - Exercise Library */}
        <div className="md:col-span-1">
          <VerticalExerciseLibrary
            onAddExercise={(exerciseName) => addExercise(exerciseName)}
            onAddCustom={() => addExercise()}
            workoutType={formData.name}
            colors={colors}
          />
        </div>
        
        {/* Right column - Exercise List */}
        <div className="md:col-span-2">
          {/* Error message if no exercises */}
          {errors.exercises && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
              <div className="text-red-400 text-sm">{errors.exercises}</div>
            </div>
          )}
          
          {/* Exercise List */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">{t("your_exercises")}</h3>
              
              <div className="text-xs text-gray-400">
                {formData.exercises.length > 0 ? (
                  <>
                    {formData.exercises.length} {t("exercises")}, 
                    {formData.exercises.reduce((total, ex) => total + ex.sets.length, 0)} {t("sets")}
                  </>
                ) : null}
              </div>
            </div>
            
            {formData.exercises.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center py-6">
                  <div className="mx-auto w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <Dumbbell className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <p className="text-gray-400 text-sm mx-auto">
                    {t("choose_exercises_from_library")}
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
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ExercisesStep;