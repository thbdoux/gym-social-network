import React from 'react';

const FOCUS_OPTIONS = [
  'strength',
  'hypertrophy',
  'endurance',
  'weight_loss',
  'strength_hypertrophy',
  'general_fitness'
];

const WorkoutPlanForm = ({ onSubmit, initialData }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      focus: formData.get('focus'),
      sessions_per_week: parseInt(formData.get('sessions_per_week'), 10),
      is_active: formData.get('is_active') === 'true'
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Plan Name *
        </label>
        <input
          name="name"
          defaultValue={initialData?.name}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Description
        </label>
        <textarea
          name="description"
          defaultValue={initialData?.description}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Focus *
        </label>
        <select
          name="focus"
          defaultValue={initialData?.focus || 'general_fitness'}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        >
          {FOCUS_OPTIONS.map(focus => (
            <option key={focus} value={focus}>
              {focus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Sessions per Week *
        </label>
        <input
          type="number"
          name="sessions_per_week"
          defaultValue={initialData?.sessions_per_week || 3}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          min="1"
          max="7"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          defaultChecked={initialData?.is_active !== false}
          value="true"
          className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-200">
          Set as Active Plan
        </label>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {initialData ? 'Update Plan' : 'Create Plan'}
      </button>
    </form>
  );
};

export default WorkoutPlanForm;