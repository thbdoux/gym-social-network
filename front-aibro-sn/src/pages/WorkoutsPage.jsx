// src/pages/WorkoutsPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react';
import api from '../api';

// Workout Form Component
const WorkoutForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [workoutData, setWorkoutData] = useState(
    initialData || {
      name: '',
      description: '',
      frequency: '',
      split_method: 'full_body',
      is_template: false,
      exercises: []
    }
  );

  const addExercise = () => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        name: '',
        equipment: '',
        notes: '',
        order: prev.exercises.length,
        sets: [{
          reps: 0,
          weight: 0,
          rest_time: 60,
          order: 0
        }]
      }]
    }));
  };

  const addSet = (exerciseIndex) => {
    const newExercises = [...workoutData.exercises];
    newExercises[exerciseIndex].sets.push({
      reps: 0,
      weight: 0,
      rest_time: 60,
      order: newExercises[exerciseIndex].sets.length
    });
    setWorkoutData({ ...workoutData, exercises: newExercises });
  };

  const updateExercise = (index, field, value) => {
    const newExercises = [...workoutData.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setWorkoutData({ ...workoutData, exercises: newExercises });
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const newExercises = [...workoutData.exercises];
    newExercises[exerciseIndex].sets[setIndex] = {
      ...newExercises[exerciseIndex].sets[setIndex],
      [field]: value
    };
    setWorkoutData({ ...workoutData, exercises: newExercises });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(workoutData);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-white">
        {initialData ? 'Edit Workout' : 'Create New Workout'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 text-gray-200">Name</label>
          <input
            type="text"
            value={workoutData.name}
            onChange={(e) => setWorkoutData({ ...workoutData, name: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 text-gray-200">Split Method</label>
          <select
            value={workoutData.split_method}
            onChange={(e) => setWorkoutData({ ...workoutData, split_method: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="full_body">Full Body</option>
            <option value="push_pull_legs">Push/Pull/Legs</option>
            <option value="upper_lower">Upper/Lower</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 text-gray-200">Frequency</label>
          <input
            type="text"
            value={workoutData.frequency}
            onChange={(e) => setWorkoutData({ ...workoutData, frequency: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., 3 times per week"
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-200">Description</label>
          <textarea
            value={workoutData.description}
            onChange={(e) => setWorkoutData({ ...workoutData, description: e.target.value })}
            className="w-full p-2 rounded bg-gray-700 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows="3"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-gray-200">Exercises</h4>
            <button
              type="button"
              onClick={addExercise}
              className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Exercise</span>
            </button>
          </div>

          {workoutData.exercises.map((exercise, exerciseIndex) => (
            <div key={exerciseIndex} className="mb-6 p-4 bg-gray-700 rounded-lg">
              <div className="space-y-4">
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                  placeholder="Exercise name"
                  className="w-full p-2 rounded bg-gray-600 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                
                <input
                  type="text"
                  value={exercise.equipment}
                  onChange={(e) => updateExercise(exerciseIndex, 'equipment', e.target.value)}
                  placeholder="Equipment needed"
                  className="w-full p-2 rounded bg-gray-600 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <div>
                  <h5 className="font-medium mb-2 text-gray-200">Sets</h5>
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value))}
                        placeholder="Reps"
                        className="p-2 rounded bg-gray-600 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseInt(e.target.value))}
                        placeholder="Weight (kg)"
                        className="p-2 rounded bg-gray-600 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={set.rest_time}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'rest_time', parseInt(e.target.value))}
                        placeholder="Rest (sec)"
                        className="p-2 rounded bg-gray-600 text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addSet(exerciseIndex)}
                    className="mt-2 px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Set
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {initialData ? 'Update Workout' : 'Create Workout'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Workout Card Component
const WorkoutCard = ({ workout, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{workout.name}</h3>
            <p className="text-gray-400">{workout.split_method.replace(/_/g, ' ')} • {workout.frequency}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(workout)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(workout.id)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          {workout.description && (
            <p className="text-gray-400">{workout.description}</p>
          )}
          <div className="space-y-6">
            {workout.exercises.map((exercise, index) => (
              <div key={index} className="border-t border-gray-700 pt-4">
                <h4 className="font-bold text-white mb-2">{exercise.name}</h4>
                <p className="text-gray-400 mb-2">Equipment: {exercise.equipment}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-gray-400">Reps</div>
                  <div className="text-gray-400">Weight</div>
                  <div className="text-gray-400">Rest</div>
                  {exercise.sets.map((set, setIndex) => (
                    <React.Fragment key={setIndex}>
                      <div className="text-gray-300">{set.reps}</div>
                      <div className="text-gray-300">{set.weight}kg</div>
                      <div className="text-gray-300">{set.rest_time}s</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main WorkoutsPage Component
const WorkoutsPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await api.get('/workouts/workouts/');
      setWorkouts(response.data);
    } catch (err) {
      setError('Failed to fetch workouts');
      console.error('Error fetching workouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkout = async (workoutData) => {
    try {
      const response = await api.post('/workouts/workouts/', workoutData);
      setWorkouts([...workouts, response.data]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to create workout');
      console.error('Error creating workout:', err);
    }
  };

  const handleUpdateWorkout = async (workoutData) => {
    try {
      const response = await api.put(`/workouts/workouts/${editingWorkout.id}/`, workoutData);
      setWorkouts(workouts.map(w => w.id === editingWorkout.id ? response.data : w));
      setEditingWorkout(null);
      setShowForm(false);
    } catch (err) {
      setError('Failed to update workout');
      console.error('Error updating workout:', err);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await api.delete(`/workouts/workouts/${workoutId}/`);
        setWorkouts(workouts.filter(w => w.id !== workoutId));
      } catch (err) {
        setError('Failed to delete workout');
        console.error('Error deleting workout:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Workouts</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Workout</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {showForm ? (
        <WorkoutForm
          onSubmit={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
          initialData={editingWorkout}
          onCancel={() => {
            setShowForm(false);
            setEditingWorkout(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {workouts.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <div className="flex flex-col items-center space-y-4">
                <Dumbbell className="w-12 h-12 text-gray-600" />
                <p className="text-gray-400">No workouts yet. Create your first workout!</p>
              </div>
            </div>
          ) : (
            workouts.map(workout => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onEdit={workout => {
                  setEditingWorkout(workout);
                  setShowForm(true);
                }}
                onDelete={handleDeleteWorkout}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};


export default WorkoutsPage;
  