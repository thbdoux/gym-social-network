// views/LogDetailView.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, MapPin, Activity,
  ThumbsUp, ThumbsDown, Save, BarChart2, Plus
} from 'lucide-react';
import ExerciseCard from '../components/cards/ExerciseCard';

const RatingInput = ({ value, onChange, max = 10, isEditing }) => {
  if (!isEditing) {
    return (
      <div className="flex space-x-1">
        {[...Array(max)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-6 rounded ${
              i < value ? 'bg-blue-500' : 'bg-gray-600'
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
  const [editedLog, setEditedLog] = useState(log);
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
    console.log('Updating exercise:', { index, field, value }); // Debug log
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

  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    console.log('Updating set:', { exerciseIndex, setIndex, field, value }); // Debug log
    setEditedLog(prev => ({
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
  
  const handleRemoveSet = (exerciseIndex, setIndex) => {
    console.log('Removing set:', { exerciseIndex, setIndex }); // Debug log
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

  const handleSave = async () => {
    try {
      const updatedLog = await onUpdate(editedLog);
      if (updatedLog) {
        setEditedLog(updatedLog);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
    }
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

  if (!editedLog) return null;

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
              {editedLog.name || 'New Workout'}
            </h1>
            <div className="flex items-center space-x-4 mt-2 text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(editedLog.date).toLocaleDateString()}
              </div>
              {editedLog.gym_id && (
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
                key={exercise.id || index}
                exercise={exercise}
                index={index}
                isExpanded={expandedExercises.has(index)}
                onToggle={() => toggleExercise(index)}
                onUpdate={handleUpdateExercise}
                onDelete={() => handleDeleteExercise(index)}
                onAddSet={() => handleAddSet(index)}
                onUpdateSet={(setIndex, field, value) => handleUpdateSet(index, setIndex, field, value)}
                onRemoveSet={(setIndex) => handleRemoveSet(index, setIndex)}
                isEditing={isEditing}
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
                ) : (
                  <p className="text-gray-300">
                    {editedLog.performance_notes || 'No notes added'}
                  </p>
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