// src/pages/Workouts/components/WorkoutPlanForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const GOALS = [
  'Strength', 'Hypertrophy', 'Endurance', 'Weight Loss', 'General Fitness'
];

const WorkoutPlanForm = ({ onSubmit, initialData }) => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: initialData || {
      name: '',
      description: '',
      workoutsPerWeek: 3,
      preferredDays: [],
      goals: [],
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-gray-800 p-6 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Plan Name
        </label>
        <input
          {...register('name')}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Description
        </label>
        <textarea
          {...register('description')}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Workouts per Week
        </label>
        <input
          type="number"
          {...register('workoutsPerWeek', { min: 1, max: 7 })}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="1"
          max="7"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Preferred Days
        </label>
        <div className="grid grid-cols-2 gap-4">
          {DAYS_OF_WEEK.map(day => (
            <label key={day} className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('preferredDays')}
                value={day}
                className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-200">{day}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Goals
        </label>
        <div className="grid grid-cols-2 gap-4">
          {GOALS.map(goal => (
            <label key={goal} className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('goals')}
                value={goal}
                className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-200">{goal}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Workout Plan
      </button>
    </form>
  );
};

export default WorkoutPlanForm;