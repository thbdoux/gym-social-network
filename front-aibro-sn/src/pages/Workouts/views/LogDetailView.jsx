// views/LogDetailView.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Activity,
  ThumbsUp, ThumbsDown, Save, BarChart2, Plus
} from 'lucide-react';
import ExerciseCard from '../../Workouts/components/cards/ExerciseCard';
import api from './../../../api';

const RatingInput = ({ value, onChange, max = 10, isEditing }) => {
  if (!isEditing) {
    return (
      <div className="flex space-x-1">
        {[...Array(max)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-6 rounded ${
              i < value 
                ? 'bg-blue-500' 
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <input
      type="range"
      min="1"
      max={max}
      value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      className="w-full"
    />
  );
};

const LogDetailView = ({ 
  log,
  onBack,
  onUpdate,
  isUpdating = false
}) => {
  const [editedLog, setEditedLog] = useState(log || createEmptyLog());
  const [isEditing, setIsEditing] = useState(log?.id === 'new');
  const [expandedExercises, setExpandedExercises] = useState(new Set());

  // Exercise handlers
  const handleAddExercise = () => {
    setEditedLog(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: `temp-${Date.now()}`,
          name: '',
          equipment: '',
          notes: '',
          sets: [{
            reps: 0,
            weight: 0,
            rest_time: 60,
            order: 0
          }]
        }
      ]
    }));
  };

  const handleUpdateExercise = (index, field, value) => {
    setEditedLog(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const handleDeleteExercise = (index) => {
    setEditedLog(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleDuplicateExercise = (index) => {
    const exerciseToDuplicate = editedLog.exercises[index];
    setEditedLog(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          ...exerciseToDuplicate,
          id: `temp-${Date.now()}`,
          sets: exerciseToDuplicate.sets.map(set => ({...set}))
        }
      ]
    }));
  };

  const handleAddSet = (exerciseIndex) => {
    setEditedLog(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: [
            ...ex.sets,
            {
              reps: ex.sets[ex.sets.length - 1]?.reps || 0,
              weight: ex.sets[ex.sets.length - 1]?.weight || 0,
              rest_time: ex.sets[ex.sets.length - 1]?.rest_time || 60,
              order: ex.sets.length
            }
          ]
        } : ex
      )
    }));
  };

  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    setEditedLog(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: ex.sets.map((set, si) => 
            si === setIndex ? { ...set, [field]: value } : set
          )
        } : ex
      )
    }));
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    setEditedLog(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: ex.sets.filter((_, si) => si !== setIndex)
        } : ex
      )
    }));
  };

  const toggleExercise = (index) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (log) {
      setEditedLog(log);
      setIsEditing(log.id === 'new');
    }
  }, [log]);

  const handleSave = async () => {
    try {
      if (editedLog.id === 'new') {
        let newLog;
        
        if (editedLog.workout_instance) {
          // Create from program instance
          newLog = await api.post('/workouts/logs/log_from_instance/', {
            instance_id: editedLog.workout_instance,
            date: editedLog.date.slice(0, 16), // "YYYY-MM-DDTHH:mm"
            gym_id: editedLog.gym,
            notes: editedLog.notes,
            mood_rating: editedLog.mood_rating,
            perceived_difficulty: editedLog.perceived_difficulty,
            performance_notes: editedLog.performance_notes,
            completed: editedLog.completed
          });
        } else {
          // Create custom workout log with all data at once
          newLog = await api.post('/workouts/logs/create_custom/', {
            date: editedLog.date.slice(0, 16), // "YYYY-MM-DDTHH:mm"
            gym_id: editedLog.gym,
            notes: editedLog.notes,
            exercises: editedLog.exercises.map((ex, index) => ({
              name: ex.name,
              equipment: ex.equipment,
              notes: ex.notes,
              order: index,
              sets: ex.sets.map((set, setIndex) => ({
                reps: set.reps,
                weight: set.weight,
                rest_time: set.rest_time,
                order: setIndex
              }))
            })),
            mood_rating: editedLog.mood_rating,
            perceived_difficulty: editedLog.perceived_difficulty,
            performance_notes: editedLog.performance_notes,
            completed: editedLog.completed
          });
        }
  
        // Update state with the new log from the response
        const createdLog = newLog.data; // Access the data from the response
        setEditedLog(createdLog);
        setIsEditing(false);
        if (onUpdate) await onUpdate(createdLog);
        
      } else {
        // For existing logs, ensure we have a valid ID before updating exercises
        if (!editedLog.id) {
          throw new Error('Cannot update exercises: Log ID is undefined');
        }
  
        // Update exercises one by one
        const updatedExercises = await Promise.all(
          editedLog.exercises.map(async exercise => {
            // Skip exercises that don't need updating
            if (!exercise.id || exercise.id.toString().startsWith('temp-')) {
              // Handle new exercises differently - they need to be created first
              const response = await api.post(`/workouts/logs/${editedLog.id}/add_exercise/`, {
                name: exercise.name,
                equipment: exercise.equipment,
                notes: exercise.notes,
                order: exercise.order,
                sets: exercise.sets
              });
              return response.data;
            }
  
            // Update existing exercises
            const response = await api.post(`/workouts/logs/${editedLog.id}/update_exercise/`, {
              exercise_id: exercise.id,
              name: exercise.name,
              equipment: exercise.equipment,
              notes: exercise.notes,
              sets: exercise.sets
            });
            return response.data;
          })
        );
  
        // Update the log with the new exercises
        const updatedLog = {
          ...editedLog,
          exercises: updatedExercises
        };
        
        setEditedLog(updatedLog);
        setIsEditing(false);
        if (onUpdate) await onUpdate(updatedLog);
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
      // You might want to show an error message to the user here
    }
  };

  
  const handleExerciseUpdate = (exerciseId, field, value) => {
    setEditedLog(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {editedLog.workout_name}
            </h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(editedLog.date).toLocaleDateString()}
              </div>
              {editedLog.gym_name && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {editedLog.gym_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                     transition-colors flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                     transition-colors"
          >
            Edit Workout
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Exercises */}
          <div className="bg-gray-800/40 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Exercises</h2>
              {isEditing && (
                <button
                  onClick={handleAddExercise}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                          transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Exercise</span>
                </button>
              )}
            </div>
            <div className="space-y-4">
              {editedLog.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  isExpanded={expandedExercises.has(index)}
                  onToggle={toggleExercise}
                  onUpdate={handleUpdateExercise}
                  onDuplicate={handleDuplicateExercise}
                  onDelete={handleDeleteExercise}
                  onAddSet={handleAddSet}
                  onRemoveSet={handleRemoveSet}
                  onUpdateSet={handleUpdateSet}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="bg-gray-800/40 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Performance</h2>
            
            {/* Mood Rating */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">Mood</label>
                  <span className="text-sm text-white">
                    {editedLog.mood_rating}/10
                  </span>
                </div>
                <RatingInput
                  value={editedLog.mood_rating}
                  onChange={(value) => 
                    setEditedLog(prev => ({ ...prev, mood_rating: value }))
                  }
                  isEditing={isEditing}
                />
              </div>

              {/* Perceived Difficulty */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">Difficulty</label>
                  <span className="text-sm text-white">
                    {editedLog.perceived_difficulty}/10
                  </span>
                </div>
                <RatingInput
                  value={editedLog.perceived_difficulty}
                  onChange={(value) => 
                    setEditedLog(prev => ({ ...prev, perceived_difficulty: value }))
                  }
                  isEditing={isEditing}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Notes</label>
                {isEditing ? (
                  <textarea
                    value={editedLog.performance_notes || ''}
                    onChange={(e) => 
                      setEditedLog(prev => ({ 
                        ...prev, 
                        performance_notes: e.target.value 
                      }))
                    }
                    className="w-full h-24 bg-gray-700 border-none rounded-lg 
                             px-3 py-2 text-white resize-none"
                    placeholder="How did the workout feel?"
                  />
                ) : editedLog.performance_notes ? (
                  <p className="text-gray-300">{editedLog.performance_notes}</p>
                ) : (
                  <p className="text-gray-500 italic">No notes added</p>
                )}
              </div>
            </div>
          </div>

          {/* Completion Status */}
          <div className="bg-gray-800/40 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Status</h3>
              {isEditing ? (
                <button
                  onClick={() => 
                    setEditedLog(prev => ({ 
                      ...prev, 
                      completed: !prev.completed 
                    }))
                  }
                  className={`px-3 py-1 rounded-full text-sm font-medium 
                    ${editedLog.completed 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-700 text-gray-400'
                    }`}
                >
                  {editedLog.completed ? 'Completed' : 'In Progress'}
                </button>
              ) : (
                <span className={`px-3 py-1 rounded-full text-sm font-medium 
                  ${editedLog.completed 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {editedLog.completed ? 'Completed' : 'In Progress'}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-800/40 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center">
              <BarChart2 className="w-4 h-4 mr-2" />
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Total Volume</div>
                <div className="text-lg font-semibold text-white">
                  {editedLog.exercises.reduce((total, ex) => 
                    total + ex.sets.reduce((setTotal, set) => 
                      setTotal + (set.reps * set.weight), 0
                    ), 0
                  )} kg
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Total Sets</div>
                <div className="text-lg font-semibold text-white">
                  {editedLog.exercises.reduce((total, ex) => 
                    total + ex.sets.length, 0
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailView;