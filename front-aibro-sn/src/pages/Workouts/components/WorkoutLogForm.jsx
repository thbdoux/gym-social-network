import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Trash2, Dumbbell, Calendar, Scale, Clock, 
  ChevronDown, ChevronUp, CircleDot, Heart, Flame, 
  Info, Camera, Save, MoreHorizontal, Copy, Target,
  ArrowRight, Settings, Zap, Award, CheckCircle
} from 'lucide-react';
import { useGyms } from '../hooks/useGyms';
import { GymSelect, AddGymModal } from './GymComponents';
import { POST_TYPE_COLORS } from '../../../utils/postTypeUtils';

const EQUIPMENT_OPTIONS = [
  "Barbell", "Dumbbell", "Kettlebell", "Machine", "Cable",
  "Smith Machine", "Bodyweight", "Resistance Band", "Other"
];

// Helper to initialize form data from a log
const initializeFormData = (log) => {
  if (!log) {
    return {
      name: '',
      date: new Date().toISOString().split('T')[0],
      completed: true,
      exercises: [],
      mood_rating: 5,
      perceived_difficulty: 5,
      performance_notes: '',
      program: null,
      based_on_instance: null,
      gym: null,
      notes: '',
      duration: 45,
      media: []
    };
  }
  
  // Process based_on_instance
  let basedOnInstance = null;
  if (log.based_on_instance !== undefined && log.based_on_instance !== null) {
    if (typeof log.based_on_instance === 'object' && log.based_on_instance !== null) {
      basedOnInstance = log.based_on_instance.id;
    } else {
      basedOnInstance = typeof log.based_on_instance === 'string' ? 
        parseInt(log.based_on_instance, 10) : log.based_on_instance;
    }
  }
  
  // Process program
  let program = null;
  if (log.program !== undefined && log.program !== null) {
    if (typeof log.program === 'object' && log.program !== null) {
      program = log.program.id;
    } else {
      program = typeof log.program === 'string' ? 
        parseInt(log.program, 10) : log.program;
    }
  }
  
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Check if date is in DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    
    // If date is already in YYYY-MM-DD format or another format,
    // try to parse it and return in correct format
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const exercises = log.exercises?.map(exercise => ({
    id: exercise.id || Math.floor(Date.now() + Math.random() * 1000),
    name: exercise.name || '',
    equipment: exercise.equipment || '',
    notes: exercise.notes || '',
    order: exercise.order || 0,
    sets: exercise.sets?.map(set => ({
      id: set.id || Math.floor(Date.now() + Math.random() * 1000),
      reps: set.reps || 0,
      weight: set.weight || 0,
      rest_time: set.rest_time || 60,
      order: set.order || 0
    })) || []
  })) || [];

  return {
    name: log.name || '',
    date: formatDate(log.date),
    completed: log.completed ?? true,
    exercises: exercises,
    mood_rating: log.mood_rating || 5,
    perceived_difficulty: log.perceived_difficulty || 5,
    performance_notes: log.performance_notes || '',
    program: program,
    based_on_instance: basedOnInstance,
    gym: log.gym ? (typeof log.gym === 'object' ? log.gym.id : log.gym) : null,
    notes: log.notes || '',
    duration: log.duration || 45,
    media: log.media || []
  };
};

  // Default rest time
const DEFAULT_REST_TIME = 160;

// Compact Sets Table Component
const SetsTable = ({ sets, onChange, exerciseId }) => {
  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      [field]: field === 'reps' || field === 'rest_time' ? parseInt(value) : parseFloat(value)
    };
    onChange(newSets);
  };
  
  const addSet = () => {
    const lastSet = sets[sets.length - 1];
          const newSet = {
      id: Date.now(),
      reps: lastSet ? lastSet.reps : 10,
      weight: lastSet ? lastSet.weight : 0,
      rest_time: lastSet ? lastSet.rest_time : DEFAULT_REST_TIME,
      order: sets.length
    };
    onChange([...sets, newSet]);
  };
  
  const removeSet = (index) => {
    const newSets = [...sets];
    newSets.splice(index, 1);
    onChange(newSets);
  };
  
  return (
    <div className="mt-3">
      <div className="mb-2 flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-300">Sets</h4>
        <button
          type="button"
          onClick={addSet}
          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded transition-colors flex items-center"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Set
        </button>
      </div>
      
      <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/30 bg-gray-800/50">
              <th className="py-2 pl-3 pr-1 text-left text-xs font-medium text-gray-400">#</th>
              <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Weight</th>
              <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Reps</th>
              <th className="py-2 px-1 text-left text-xs font-medium text-gray-400">Rest</th>
              <th className="py-2 px-1 text-center w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, index) => (
              <tr key={set.id} className="border-b border-gray-700/20 last:border-0 hover:bg-gray-800/30">
                <td className="py-2 pl-3 pr-1 font-medium text-gray-400">{index + 1}</td>
                <td className="py-1 px-1">
                  <input
                    type="number"
                    value={set.weight}
                    onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                  />
                </td>
                <td className="py-1 px-1">
                  <input
                    type="number"
                    value={set.reps}
                    onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                  />
                </td>
                <td className="py-1 px-1">
                  <input
                    type="number"
                    value={set.rest_time}
                    onChange={(e) => handleSetChange(index, 'rest_time', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                  />
                </td>
                <td className="py-1 px-1 text-center">
                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSet(index)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Exercise Card Component
const ExerciseCard = ({ exercise, onChange, onDelete, onDuplicate, index, exercisesLength, colors, moveExercise }) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  // Removed templates state
  const [showSettings, setShowSettings] = useState(false);
  const cardRef = useRef(null);
  
  useEffect(() => {
    // Auto-scroll to newly added exercise if it's the last one
    if (index === exercisesLength - 1 && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [exercisesLength, index]);
  
  const applyTemplate = (template) => {
    let updatedExercise = { ...exercise };
    
    if (!exercise.name) {
      updatedExercise.name = template.name;
    }
    
    if (!exercise.equipment) {
      updatedExercise.equipment = template.equipment;
    }
    
    if (exercise.sets.length === 0) {
      updatedExercise.sets = template.defaultSets.map((set, index) => ({
        id: Date.now() + index,
        reps: set.reps,
        weight: set.weight,
        rest_time: set.rest_time,
        order: index
      }));
    }
    
    onChange(updatedExercise);
                      // Templates removed
  };
  
  const applyPresetSets = (preset) => {
    let sets = [];
    
    switch(preset) {
      case '5x5':
        sets = Array(5).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: 5,
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
      case '3x8':
        sets = Array(3).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: 8,
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
      case '4x8':
        sets = Array(4).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: 8,
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
      case '4xPyramid':
        sets = Array(4).fill().map((_, index) => ({
          id: Date.now() + index,
          reps: [12, 10, 8, 6][index],
          weight: exercise.sets[0]?.weight || 0,
          rest_time: DEFAULT_REST_TIME,
          order: index
        }));
        break;
    }
    
    onChange({
      ...exercise,
      sets
    });
    setShowSettings(false);
  };

  return (
    <div 
      ref={cardRef}
      className={`bg-gray-800/90 rounded-lg overflow-hidden border ${colors.border} hover:shadow-md transition-all ${isExpanded ? 'mb-4' : 'mb-2'}`}
    >
      <div className="flex justify-between items-center p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center flex-1">
          <div className={`${colors.bg} p-2 rounded-lg mr-3`}>
            <Dumbbell className={`w-4 h-4 ${colors.text}`} />
          </div>
                      <div className="flex-1 min-w-0 relative">
              <div className="absolute inset-0 -mx-1 -my-1 bg-blue-500/10 -z-10 pointer-events-none rounded-md"></div>
                          <input
              type="text"
              value={exercise.name}
              onChange={(e) => onChange({ ...exercise, name: e.target.value })}
              placeholder={`Exercise ${index + 1}`}
              className="w-full bg-transparent border-none px-0 py-0 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex text-xs text-gray-400 mt-0.5">
              <span>{exercise.equipment || 'No equipment'}</span>
              <span className="mx-1.5">•</span>
              <span>{exercise.sets.length} sets</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          {!isExpanded && exercise.sets.length > 0 && (
            <div className="mr-3 px-2 py-0.5 bg-blue-500/10 rounded text-xs text-blue-400 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span>{exercise.sets.length} sets</span>
            </div>
          )}
          
          <div className="flex">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
                setShowTemplates(false);
              }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Exercise Settings Menu */}
          {showSettings && (
            <div className="absolute right-0 mt-8 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 w-48 py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  onDuplicate();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Exercise
              </button>
              <div className="px-4 py-1 text-xs text-gray-500">Set Presets</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('5x5');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                5 x 5 reps
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('3x8');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                3 x 8 reps
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('4x8');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                4 x 8 reps
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  applyPresetSets('4xPyramid');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                4 x 12/10/8/6 reps
              </button>
              <div className="border-t border-gray-700 my-1"></div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  if (confirm('Delete this exercise?')) {
                    onDelete();
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Exercise
              </button>
            </div>
          )}
          
          {/* Removed templates menu */}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Equipment</label>
              <select
                value={exercise.equipment || ''}
                onChange={(e) => onChange({ ...exercise, equipment: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
              >
                <option value="">Select Equipment</option>
                {EQUIPMENT_OPTIONS.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={exercise.notes || ''}
                onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm"
                placeholder="Form cues, targets, etc."
              />
            </div>
          </div>
          
          <SetsTable 
            sets={exercise.sets} 
            onChange={(newSets) => onChange({ ...exercise, sets: newSets })}
            exerciseId={exercise.id}
          />
        </div>
      )}
    </div>
  );
};

const WorkoutLogForm = ({ log = null, onSubmit, onClose, programs = [] }) => {
  const { gyms, loading: gymsLoading, error: gymsError, refreshGyms } = useGyms();
  const colors = POST_TYPE_COLORS.workout_log;
  
  const [formData, setFormData] = useState(() => initializeFormData(log));
  const [showAddGym, setShowAddGym] = useState(false);
  const [activeTab, setActiveTab] = useState('workout');
  const [errors, setErrors] = useState({});
  const [isTouched, setIsTouched] = useState({});
  const [showBeginnersGuide, setShowBeginnersGuide] = useState(!log && localStorage.getItem('seenWorkoutGuide') !== 'true');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const exercisesEndRef = useRef(null);

  useEffect(() => {
    setFormData(initializeFormData(log));
  }, [log]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Workout name is required";
    }
    
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    
    if (formData.exercises.length === 0) {
      newErrors.exercises = "Add at least one exercise";
    } else {
      // Validate each exercise has a name and at least one set
      formData.exercises.forEach((exercise, index) => {
        if (!exercise.name.trim()) {
          newErrors[`exercise_${index}_name`] = "Exercise name is required";
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for validation
    const touchedFields = {};
    Object.keys(formData).forEach(key => {
      touchedFields[key] = true;
    });
    setIsTouched(touchedFields);
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addExercise = () => {
    const newExercise = {
      id: Date.now(),
      name: '',
      order: formData.exercises.length,
      sets: [{
        id: Date.now() + 1,
        reps: 10,
        weight: 0,
        rest_time: 60,
        order: 0
      }]
    };
    
    setFormData({
      ...formData,
      exercises: [...formData.exercises, newExercise]
    });
    
    // Set timeout to ensure DOM update before scrolling
    setTimeout(() => {
      if (exercisesEndRef.current) {
        exercisesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  const duplicateExercise = (exerciseIndex) => {
    const exerciseToDuplicate = formData.exercises[exerciseIndex];
    const duplicatedExercise = {
      ...exerciseToDuplicate,
      id: Date.now(),
      sets: exerciseToDuplicate.sets.map(set => ({
        ...set,
        id: Date.now() + Math.random() * 1000
      }))
    };
    
    const newExercises = [...formData.exercises];
    newExercises.splice(exerciseIndex + 1, 0, duplicatedExercise);
    
    setFormData({
      ...formData,
      exercises: newExercises
    });
  };
  
  const MoodIndicator = ({ value }) => {
    let emoji, label;
    
    if (value >= 8) {
      emoji = "😀";
      label = "Great";
    } else if (value >= 6) {
      emoji = "🙂";
      label = "Good";
    } else if (value >= 4) {
      emoji = "😐";
      label = "Okay";
    } else if (value >= 2) {
      emoji = "☹️";
      label = "Poor";
    } else {
      emoji = "😫";
      label = "Terrible";
    }
    
    return (
      <div className="flex items-center bg-gray-800 px-3 py-1.5 rounded-r-lg border border-l-0 border-gray-700">
        <span className="text-lg mr-1">{emoji}</span>
        <span className="text-sm text-gray-300">{label}</span>
      </div>
    );
  };
  
  const DifficultyIndicator = ({ value }) => {
    let color, label;
    
    if (value >= 8) {
      color = "text-red-400";
      label = "Very Hard";
    } else if (value >= 6) {
      color = "text-orange-400";
      label = "Hard";
    } else if (value >= 4) {
      color = "text-yellow-400";
      label = "Moderate";
    } else {
      color = "text-green-400";
      label = "Easy";
    }
    
    return (
      <div className="flex items-center bg-gray-800 px-3 py-1.5 rounded-r-lg border border-l-0 border-gray-700">
        <Flame className={`w-4 h-4 mr-1 ${color}`} />
        <span className="text-sm text-gray-300">{label}</span>
      </div>
    );
  };

  // Beginners guide that appears the first time they log a workout
  const BeginnersGuide = () => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-blue-500/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Award className="w-6 h-6 mr-2 text-blue-400" />
            Welcome to Workout Logging
          </h2>
          <button
            onClick={() => {
              setShowBeginnersGuide(false);
              localStorage.setItem('seenWorkoutGuide', 'true');
            }}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            Logging your workouts is key to tracking your progress. Here's a quick guide:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                              <h3 className="font-bold text-white mb-2 flex items-center">
                <div className={`${colors.bg} p-2 rounded-lg mr-2`}>
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
                Basic Info
              </h3>
              <p className="text-gray-300 text-sm">
                Start by naming your workout and setting the date and duration.
              </p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h3 className="font-bold text-white mb-2 flex items-center">
                <div className={`${colors.bg} p-2 rounded-lg mr-2`}>
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                </div>
                Add Exercises
              </h3>
              <p className="text-gray-300 text-sm">
                Tap the "+" button to add exercises. Use templates for quick setup.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowBeginnersGuide(false);
              localStorage.setItem('seenWorkoutGuide', 'true');
            }}
            className={`px-6 py-3 ${colors.bg} ${colors.hoverBg} text-white rounded-xl transition-colors font-medium`}
          >
            Got it, let's start logging!
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {log ? 'Edit Workout Log' : 'New Workout Log'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('workout')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'workout'
                ? `text-${colors.text} border-b-2 border-${colors.text}`
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Workout
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? `text-${colors.text} border-b-2 border-${colors.text}`
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Details & Notes
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 120px)' }}>
          <div className="p-6">
            {activeTab === 'workout' ? (
              <div className="grid grid-cols-12 gap-6">
                {/* Left column - Workout details */}
                <div className="col-span-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 mb-6">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Workout Name
                        {errors.name && isTouched.name && (
                          <span className="text-red-400 ml-2 text-xs">{errors.name}</span>
                        )}
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setIsTouched({ ...isTouched, name: true });
                        }}
                        className={`w-full bg-gray-900 border ${errors.name && isTouched.name ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2 text-white text-sm`}
                        placeholder="e.g., Morning Upper Body, Leg Day"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-xs text-gray-400 mb-1">Date</label>
                      <div className="relative">
                        <input
                          required
                          type="date"
                          value={formData.date}
                          onChange={(e) => {
                            setFormData({ ...formData, date: e.target.value });
                            setIsTouched({ ...isTouched, date: true });
                          }}
                          className={`w-full bg-gray-900 border ${errors.date && isTouched.date ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2 text-white text-sm`}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={formData.duration || ''}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                        placeholder="e.g., 45"
                        min="1"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-xs text-gray-400 mb-1">Status</label>
                      <select
                        value={formData.completed}
                        onChange={(e) => setFormData({ ...formData, completed: e.target.value === 'true' })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                      >
                        <option value="true">Completed</option>
                        <option value="false">In Progress</option>
                      </select>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="mt-4 text-sm text-gray-400 hover:text-gray-300 flex items-center"
                    >
                      {showAdvancedOptions ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                    </button>
                    
                    {showAdvancedOptions && (
                      <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-4">
                        <div>
                          <GymSelect
                            value={formData.gym}
                            onChange={(e) => setFormData({ ...formData, gym: e.target.value ? parseInt(e.target.value) : null })}
                            gyms={gyms}
                            loading={gymsLoading}
                            error={gymsError}
                            onAddGym={() => setShowAddGym(true)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Program (optional)</label>
                          <select
                            value={formData.program || ''}
                            onChange={(e) => setFormData({ ...formData, program: e.target.value || null })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="">No Program</option>
                            {programs?.map(program => (
                              <option key={program.id} value={program.id}>{program.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Mood Rating</label>
                          <div className="flex">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={formData.mood_rating || 5}
                              onChange={(e) => setFormData({ ...formData, mood_rating: parseInt(e.target.value) })}
                              className="w-full rounded-l-lg"
                            />
                            <MoodIndicator value={formData.mood_rating} />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Perceived Difficulty</label>
                          <div className="flex">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={formData.perceived_difficulty || 5}
                              onChange={(e) => setFormData({ ...formData, perceived_difficulty: parseInt(e.target.value) })}
                              className="w-full rounded-l-lg"
                            />
                            <DifficultyIndicator value={formData.perceived_difficulty} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right column - Exercises */}
                <div className="col-span-8">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-white">Exercises</h3>
                      {errors.exercises && isTouched.exercises && (
                        <p className="text-red-400 text-xs mt-1">{errors.exercises}</p>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={addExercise}
                      className={`px-3 py-2 ${colors.bg} ${colors.hoverBg} rounded-lg transition-colors flex items-center space-x-2`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add Exercise</span>
                    </button>
                  </div>

                  <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(95vh - 150px)' }}>
                    {formData.exercises.map((exercise, index) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        index={index}
                        exercisesLength={formData.exercises.length}
                        onChange={(updatedExercise) => {
                          const newExercises = [...formData.exercises];
                          newExercises[index] = updatedExercise;
                          setFormData({ ...formData, exercises: newExercises });
                        }}
                        onDelete={() => {
                          if (formData.exercises.length > 1 || window.confirm("Remove this exercise? You need at least one exercise for your workout log.")) {
                            setFormData({
                              ...formData,
                              exercises: formData.exercises.filter((_, i) => i !== index)
                            });
                          }
                        }}
                        onDuplicate={() => duplicateExercise(index)}
                        colors={colors}
                      />
                    ))}
                    
                    {/* Empty state */}
                    {formData.exercises.length === 0 && (
                      <div className="text-center py-10 px-6 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700">
                        <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-400">No exercises added yet</h3>
                        <p className="text-gray-500 mt-1 mb-4">Click the "Add Exercise" button to start building your workout</p>
                        <button
                          type="button"
                          onClick={addExercise}
                          className={`px-4 py-2 ${colors.bg} ${colors.hoverBg} rounded-lg transition-colors flex items-center space-x-2 mx-auto`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Exercise</span>
                        </button>
                      </div>
                    )}
                    
                    <div ref={exercisesEndRef} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Performance Notes</label>
                  <textarea
                    value={formData.performance_notes || ''}
                    onChange={(e) => setFormData({ ...formData, performance_notes: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    rows={6}
                    placeholder="How did the workout feel? Any PRs or notable achievements? Things to remember for next time?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Photos
                    <span className="text-gray-500 text-xs ml-2">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {formData.media.map((file, index) => (
                      <div key={index} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-square">
                        <img 
                          src={file instanceof File ? URL.createObjectURL(file) : (file.url || file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newMedia = [...formData.media];
                            newMedia.splice(index, 1);
                            setFormData({ ...formData, media: newMedia });
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    
                    <label className="flex flex-col items-center justify-center bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl aspect-square cursor-pointer hover:border-gray-600 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setFormData({ 
                            ...formData, 
                            media: [...formData.media, ...files]
                          });
                        }}
                      />
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">Add Photos</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-between items-center">
            <div>
              {activeTab === 'workout' && formData.exercises.length === 0 && (
                <p className="text-yellow-400 text-sm flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  Add at least one exercise to save your workout
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center space-x-2 text-sm`}
              >
                <Save className="w-4 h-4" />
                <span>{log ? 'Save Changes' : 'Create Log'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {showAddGym && (
        <AddGymModal
          onClose={() => setShowAddGym(false)}
          onSuccess={(newGym) => {
            refreshGyms();
            setFormData({ ...formData, gym: newGym.id });
            setShowAddGym(false);
          }}
        />
      )}
      
      {showBeginnersGuide && <BeginnersGuide />}
    </div>
  );
};

export default WorkoutLogForm;