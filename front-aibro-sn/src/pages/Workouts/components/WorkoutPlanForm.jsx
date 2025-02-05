import React from 'react';
import { Target, Calendar, Sparkles } from 'lucide-react';

const FOCUS_OPTIONS = [
  { value: 'strength', label: 'Strength', 
    description: 'Focus on building maximal strength with compound movements' },
  { value: 'hypertrophy', label: 'Hypertrophy', 
    description: 'Optimize muscle growth with volume and progressive overload' },
  { value: 'endurance', label: 'Endurance', 
    description: 'Improve stamina and muscular endurance' },
  { value: 'weight_loss', label: 'Weight Loss', 
    description: 'Combine strength training with cardio for fat loss' },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', 
    description: 'Balance strength gains with muscle growth' },
  { value: 'general_fitness', label: 'General Fitness', 
    description: 'Well-rounded approach to improve overall fitness' }
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
    <div className="max-w-4xl mx-auto">
      <p className="text-gray-400 mb-8">Design your perfect training program</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Form Content */}
        <div className="space-y-6">
          {/* Plan Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plan Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              defaultValue={initialData?.name}
              className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              placeholder="e.g., Summer Shred 2025"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              rows="3"
              placeholder="Describe your workout plan's goals and structure..."
            />
          </div>

          {/* Focus Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Focus <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {FOCUS_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className="relative flex cursor-pointer rounded-lg border border-gray-600 bg-gray-700/50 p-4 focus-within:ring-2 focus-within:ring-blue-500 hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="radio"
                    name="focus"
                    value={option.value}
                    defaultChecked={initialData?.focus === option.value || (!initialData && option.value === 'general_fitness')}
                    className="peer sr-only"
                    required
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-medium text-white">{option.label}</span>
                      </div>
                      <p className="mt-1 flex items-center text-sm text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <div className="absolute -inset-px rounded-lg border-2 border-transparent peer-checked:border-blue-500" aria-hidden="true" />
                </label>
              ))}
            </div>
          </div>

          {/* Sessions per Week */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sessions per Week <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                name="sessions_per_week"
                defaultValue={initialData?.sessions_per_week || 3}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                min="1"
                max="7"
                required
              />
            </div>
          </div>

          {/* Active Plan Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              defaultChecked={initialData?.is_active !== false}
              value="true"
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Set as Active Plan</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center justify-center space-x-2 text-lg font-medium"
        >
          <span>Create Plan</span>
        </button>
      </form>
    </div>
  );
};

export default WorkoutPlanForm;