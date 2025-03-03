import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Settings, Calendar, Dumbbell, Tag, Clock, 
  ChevronDown, ChevronUp, Save, X, ArrowRight, Info,
  Award
} from 'lucide-react';
import ExerciseCard from './EnhancedExerciseCard';

const SPLIT_METHODS = ['full_body', 'push_pull_legs', 'upper_lower', 'custom'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

const EnhancedWorkoutForm = ({
  onSubmit,
  initialData,
  onCancel,
  inProgram = false,
  selectedPlan,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    split_method: 'full_body',
    preferred_weekday: 0,
    difficulty_level: 'intermediate',
    estimated_duration: 60,
    equipment_required: [],
    tags: [],
    exercises: [],
    is_public: true,
    ...initialData
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...initialData
    }));
  }, [initialData]);

  const [expandedExercises, setExpandedExercises] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('workout');
  const [showGuide, setShowGuide] = useState(!initialData && localStorage.getItem('seenWorkoutGuide') !== 'true');
  const exercisesEndRef = useRef(null);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddExercise = () => {
    const newExercise = {
      name: '',
      equipment: '',
      notes: '',
      order: formData.exercises.length,
      sets: [{
        reps: 10,
        weight: 0,
        rest_time: 60,
        order: 0
      }]
    };
    
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    
    setExpandedExercises(prev => ({
      ...prev,
      [formData.exercises.length]: true
    }));
    
    // Scroll to new exercise
    setTimeout(() => {
      if (exercisesEndRef.current) {
        exercisesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Keep the workout ID when updating
      const submissionData = {
        ...formData,
        id: initialData?.id, // Ensure we keep the ID
        exercises: formData.exercises.map((ex, i) => ({
          ...ex,
          id: ex.id, // Keep exercise IDs if they exist
          order: i,
          sets: ex.sets.map((set, j) => ({
            ...set,
            id: set.id, // Keep set IDs if they exist
            order: j,
            reps: Number(set.reps),
            weight: Number(set.weight),
            rest_time: Number(set.rest_time)
          }))
        }))
      };

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
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
  
  // Beginners guide
  const BeginnersGuide = () => (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-blue-500/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Award className="w-6 h-6 mr-2 text-blue-400" />
            Welcome to Workout Builder
          </h2>
          <button
            onClick={() => {
              setShowGuide(false);
              localStorage.setItem('seenWorkoutGuide', 'true');
            }}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            Creating effective workout templates helps you maintain consistency. Here's a quick guide:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h3 className="font-bold text-white mb-2 flex items-center">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                </div>
                Basic Info
              </h3>
              <p className="text-gray-300 text-sm">
                Name your workout, set the difficulty level, and estimated duration.
              </p>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <h3 className="font-bold text-white mb-2 flex items-center">
                <div className="bg-blue-500/20 p-2 rounded-lg mr-2">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                </div>
                Add Exercises
              </h3>
              <p className="text-gray-300 text-sm">
                Tap the "+" button to add exercises. Use presets for quick setup.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => {
              setShowGuide(false);
              localStorage.setItem('seenWorkoutGuide', 'true');
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
          >
            Got it, let's start building!
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex border-b border-gray-800 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('workout')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'workout'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Workout Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'exercises'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Exercises
        </button>
      </div>

      {activeTab === 'workout' && (
        <div className="bg-gray-800/50 rounded-xl p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Settings className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {initialData ? 'Update Workout' : 'Create New Workout'}
              </h2>
              <p className="text-gray-400">Configure your workout details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Workout Name *</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Split Method *</label>
              <select
                value={formData.split_method}
                onChange={(e) => setFormData(prev => ({ ...prev, split_method: e.target.value }))}
                className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
                required
              >
                {SPLIT_METHODS.map(method => (
                  <option key={method} value={method}>
                    {method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Difficulty Level *</label>
              <select
                value={formData.difficulty_level}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
                className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
                required
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Estimated Duration (min) *</label>
              <input
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: Number(e.target.value) }))}
                className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
                min="15"
                max="180"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white h-10"
                  placeholder="Brief description of your workout"
                  />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Tags</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
                  placeholder="Press Enter to add tags"
                />
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-blue-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {inProgram && (
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-2">Preferred Day *</label>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, preferred_weekday: i }))}
                      className={`p-2 rounded-lg flex flex-col items-center transition-all ${
                        formData.preferred_weekday === i
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      <Calendar className="w-4 h-4 mb-1" />
                      <span className="text-sm">{day}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Dumbbell className="w-6 h-6 mr-2" />
              Exercises
            </h3>
            <button
              type="button"
              onClick={handleAddExercise}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Exercise</span>
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(95vh - 150px)' }}>
            {formData.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id || index}
                exercise={exercise}
                index={index}
                isExpanded={expandedExercises[index]}
                onToggle={(idx) => setExpandedExercises(prev => ({
                  ...prev,
                  [idx]: !prev[idx]
                }))}
                onUpdate={(idx, field, value) => {
                  setFormData(prev => ({
                    ...prev,
                    exercises: prev.exercises.map((ex, i) =>
                      i === idx ? { ...ex, [field]: value } : ex
                    )
                  }));
                }}
                onDuplicate={() => duplicateExercise(index)}
                onDelete={(idx) => {
                  setFormData(prev => ({
                    ...prev,
                    exercises: prev.exercises.filter((_, i) => i !== idx)
                  }));
                }}
                onAddSet={(idx) => {
                  const exercise = formData.exercises[idx];
                  const lastSet = exercise.sets[exercise.sets.length - 1] || {
                    reps: 10,
                    weight: 0,
                    rest_time: 60
                  };
                  setFormData(prev => ({
                    ...prev,
                    exercises: prev.exercises.map((ex, i) =>
                      i === idx ? {
                        ...ex,
                        sets: [...ex.sets, { 
                          id: Date.now() + Math.random() * 1000,
                          ...lastSet, 
                          order: ex.sets.length 
                        }]
                      } : ex
                    )
                  }));
                }}
                onRemoveSet={(idx, setIdx) => {
                  setFormData(prev => ({
                    ...prev,
                    exercises: prev.exercises.map((ex, i) =>
                      i === idx ? {
                        ...ex,
                        sets: ex.sets.filter((_, si) => si !== setIdx)
                      } : ex
                    )
                  }));
                }}
                onUpdateSet={(idx, setIdx, field, value) => {
                  setFormData(prev => ({
                    ...prev,
                    exercises: prev.exercises.map((ex, i) =>
                      i === idx ? {
                        ...ex,
                        sets: ex.sets.map((set, si) =>
                          si === setIdx ? { ...set, [field]: Number(value) } : set
                        )
                      } : ex
                    )
                  }));
                }}
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
                  onClick={handleAddExercise}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Exercise</span>
                </button>
              </div>
            )}
            
            <div ref={exercisesEndRef} />
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-between items-center">
        <div>
          {activeTab === 'exercises' && formData.exercises.length === 0 && (
            <p className="text-yellow-400 text-sm flex items-center">
              <Info className="w-4 h-4 mr-1" />
              Add at least one exercise to save your workout
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium flex items-center space-x-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{initialData ? 'Save Changes' : 'Create Workout'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
      
      {showGuide && <BeginnersGuide />}
    </form>
  );
};

export default EnhancedWorkoutForm;