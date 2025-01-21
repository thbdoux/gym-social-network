import React, { useState } from 'react';
import * as api from '../../api/api';

export default function CreateWorkout() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    exercises: [{ name: '', sets: '', reps: '', weight: '' }]
  });

  const handleExerciseChange = (index, field, value) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = {
      ...newExercises[index],
      [field]: value
    };
    setFormData({ ...formData, exercises: newExercises });
  };

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { name: '', sets: '', reps: '', weight: '' }]
    });
  };

  const removeExercise = (index) => {
    const newExercises = formData.exercises.filter((_, i) => i !== index);
    setFormData({ ...formData, exercises: newExercises });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createWorkout(formData);
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        notes: '',
        exercises: [{ name: '', sets: '', reps: '', weight: '' }]
      });
    } catch (error) {
      console.error('Failed to create workout:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Workout</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows="2"
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Exercises</label>
          {formData.exercises.map((exercise, index) => (
            <div key={index} className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Exercise name"
                value={exercise.name}
                onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Sets"
                value={exercise.sets}
                onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Reps"
                value={exercise.reps}
                onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Weight (kg)"
                value={exercise.weight}
                onChange={(e) => handleExerciseChange(index, 'weight', e.target.value)}
                className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {formData.exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={addExercise}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Exercise
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Workout
          </button>
        </div>
      </form>
    </div>
  );
}