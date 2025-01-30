import React, { useState } from 'react';
import { Plus } from 'lucide-react';

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
                  className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
                />
                
                <input
                  type="text"
                  value={exercise.equipment}
                  onChange={(e) => updateExercise(exerciseIndex, 'equipment', e.target.value)}
                  placeholder="Equipment needed"
                  className="w-full p-2 rounded bg-gray-600 text-white border-gray-600"
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
                        className="p-2 rounded bg-gray-600 text-white border-gray-600"
                      />
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseInt(e.target.value))}
                        placeholder="Weight"
                        className="p-2 rounded bg-gray-600 text-white border-gray-600"
                      />
                      <input
                        type="number"
                        value={set.rest_time}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'rest_time', parseInt(e.target.value))}
                        placeholder="Rest (sec)"
                        className="p-2 rounded bg-gray-600 text-white border-gray-600"
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

export default WorkoutForm;