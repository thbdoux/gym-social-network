import React, { useState, useEffect  } from 'react';
import { Plus, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

import api from './../../../api';

const SPLIT_METHODS = [
  'full_body',
  'push_pull_legs',
  'upper_lower',
  'custom'
];

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbells',
  'Machine',
  'Bodyweight',
  'Smith Machine',
  'Cables',
  'Kettlebell',
  'Resistance Bands',
  'Other'
];

const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const WorkoutForm = ({ 
  onSubmit, 
  initialData = null, 
  onCancel,
  inProgram = false,
  selectedPlan,
  onWorkoutAdded
}) => {
  const [workoutData, setWorkoutData] = useState(() => ({
    name: '',
    description: '',
    split_method: 'full_body',
    preferred_weekday: 0,
    exercises: [],
    ...initialData
  }));

  const [expandedExercises, setExpandedExercises] = useState({});
  const [existingTemplates, setExistingTemplates] = useState([]);
  const [isSelectingExisting, setIsSelectingExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!inProgram) return;
      
      setIsLoading(true);
      try {
        const response = await api.get('/workouts/templates/');
        const templates = response.data.results || response.data || [];
        setExistingTemplates(templates);
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [inProgram]);

  const handleDaySelect = async (e, templateId) => {
    const weekday = parseInt(e.target.value);
    if (!isNaN(weekday)) {
      try {
        await api.post(`/workouts/programs/${selectedPlan.id}/add_workout/`, {
          template_id: templateId,
          preferred_weekday: weekday,
          order: selectedPlan.workouts?.length || 0
        });
        
        // Notify parent component of successful addition
        if (onWorkoutAdded) {
          onWorkoutAdded();
        }
        
        // Close the form
        if (onCancel) {
          onCancel();
        }
      } catch (err) {
        console.error('Error adding existing workout:', err);
      }
    }
  };

  const handleAddExistingWorkout = async (templateId, preferred_weekday) => {
    try {
      await api.post(`/workouts/programs/${selectedPlan.id}/add_workout/`, {
        template_id: templateId,
        preferred_weekday,
        order: selectedPlan.workouts?.length || 0
      });
      onCancel(); // Close the form
    } catch (err) {
      console.error('Error adding existing workout:', err);
    }
  };

  const toggleExercise = (index) => {
    setExpandedExercises(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addExercise = () => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: '',
          equipment: '',
          notes: '',
          order: prev.exercises.length,
          sets: [{
            reps: 10,
            weight: 0,
            rest_time: 60,
            order: 0
          }]
        }
      ]
    }));
    setExpandedExercises(prev => ({
      ...prev,
      [workoutData.exercises.length]: true
    }));
  };

  const duplicateExercise = (index) => {
    const exercise = { 
      ...workoutData.exercises[index],
      order: workoutData.exercises.length
    };
    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));
  };

  const removeExercise = (index) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index, field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const addSet = (exerciseIndex) => {
    const exercise = workoutData.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1] || {
      reps: 10,
      weight: 0,
      rest_time: 60
    };
    
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: [
            ...ex.sets,
            { ...lastSet, order: ex.sets.length }
          ]
        } : ex
      )
    }));
  };

  const removeSet = (exerciseIndex, setIndex) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: ex.sets.filter((_, si) => si !== setIndex)
        } : ex
      )
    }));
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: ex.sets.map((set, si) => 
            si === setIndex ? { ...set, [field]: Number(value) } : set
          )
        } : ex
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...workoutData,
      exercises: workoutData.exercises.map((ex, i) => ({
        ...ex,
        order: i,
        sets: ex.sets.map((set, j) => ({
          ...set,
          order: j
        }))
      }))
    });
  };

  if (inProgram && isSelectingExisting) {
    return (
      <div className="space-y-6 bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Select Existing Workout</h3>
          <button
            type="button"
            onClick={() => setIsSelectingExisting(false)}
            className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Create New Instead
          </button>
        </div>

        <div className="space-y-4">
          {existingTemplates.map(template => (
            <div key={template.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white">{template.name}</h4>
                <p className="text-gray-400">{template.split_method.replace(/_/g, ' ')}</p>
                {template.description && (
                  <p className="text-gray-400 text-sm mt-1">{template.description}</p>
                )}
              </div>
              <select
                onChange={(e) => handleDaySelect(e, template.id)}
                className="bg-gray-600 rounded px-3 py-2 text-white"
                defaultValue=""
              >
                <option value="">Select Day</option>
                {WEEKDAYS.map((day, index) => (
                  <option key={day} value={index}>{day}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg">
      {inProgram && (
  <div className="mb-6">
    <button
      type="button"
      onClick={() => setIsSelectingExisting(!isSelectingExisting)}
      className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
    >
      {isSelectingExisting ? 'Create New Workout' : 'Select Existing Workout'}
    </button>

    {isSelectingExisting && (
      <div className="mt-4 space-y-4">
        {existingTemplates.map(template => (
          <div key={template.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h4 className="font-bold">{template.name}</h4>
              <p className="text-gray-400">{template.split_method}</p>
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddExistingWorkout(template.id, parseInt(e.target.value));
                }
              }}
              className="bg-gray-600 rounded px-3 py-2"
              defaultValue=""
            >
              <option value="">Select Day</option>
              {WEEKDAYS.map((day, index) => (
                <option key={day} value={index}>{day}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )}
  </div>
)}
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Workout Name *
          </label>
          <input
            value={workoutData.name}
            onChange={(e) => setWorkoutData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Description
          </label>
          <textarea
            value={workoutData.description || ''}
            onChange={(e) => setWorkoutData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Split Method *
          </label>
          <select
            value={workoutData.split_method}
            onChange={(e) => setWorkoutData(prev => ({ ...prev, split_method: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
            required
          >
            {SPLIT_METHODS.map(method => (
              <option key={method} value={method}>
                {method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {inProgram && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Preferred Day *
            </label>
            <select
              value={workoutData.preferred_weekday}
              onChange={(e) => setWorkoutData(prev => ({ 
                ...prev, 
                preferred_weekday: Number(e.target.value) 
              }))}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
              required
            >
              {WEEKDAYS.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Exercises</h3>
          <button
            type="button"
            onClick={addExercise}
            className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>

        <div className="space-y-4">
          {workoutData.exercises.map((exercise, exerciseIndex) => (
            <div key={exerciseIndex} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <input
                  value={exercise.name}
                  onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                  placeholder="Exercise name *"
                  className="flex-1 px-3 py-2 rounded bg-gray-600 text-white border border-gray-600"
                  required
                />
                <div className="flex space-x-2 ml-2">
                  <button
                    type="button"
                    onClick={() => duplicateExercise(exerciseIndex)}
                    className="p-2 hover:bg-gray-500 rounded transition-colors"
                    title="Duplicate exercise"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(exerciseIndex)}
                    className="p-2 hover:bg-gray-500 rounded transition-colors text-red-400"
                    title="Remove exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExercise(exerciseIndex)}
                    className="p-2 hover:bg-gray-500 rounded transition-colors"
                  >
                    {expandedExercises[exerciseIndex] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {expandedExercises[exerciseIndex] && (
                <div className="mt-4 space-y-4">
                  <select
                    value={exercise.equipment}
                    onChange={(e) => updateExercise(exerciseIndex, 'equipment', e.target.value)}
                    className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-600"
                  >
                    <option value="">Select Equipment</option>
                    {EQUIPMENT_OPTIONS.map(equipment => (
                      <option key={equipment} value={equipment}>
                        {equipment}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-200">Sets</label>
                      <button
                        type="button"
                        onClick={() => addSet(exerciseIndex)}
                        className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      >
                        Add Set
                      </button>
                    </div>

                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div 
                          key={setIndex}
                          className="grid grid-cols-4 gap-2 items-center bg-gray-600 p-2 rounded"
                        >
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Reps *
                            </label>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                              min="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Weight (kg)
                            </label>
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                              min="0"
                              step="0.5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Rest (sec)
                            </label>
                            <input
                              type="number"
                              value={set.rest_time}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'rest_time', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                              min="0"
                              step="5"
                            />
                          </div>
                          <div className="flex items-end justify-end h-full">
                            <button
                              type="button"
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              className="p-1 hover:bg-gray-500 rounded transition-colors text-red-400"
                              title="Remove set"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>
    </form>
  );
};

export default WorkoutForm;