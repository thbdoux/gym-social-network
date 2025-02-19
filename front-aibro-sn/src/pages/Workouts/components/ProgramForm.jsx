import React, { useState } from 'react';
import { Target, Calendar, Tag } from 'lucide-react';

const FOCUS_CHOICES = [
  { value: 'strength', label: 'Strength', description: 'Focus on building maximal strength' },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Optimize muscle growth' },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina' },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Combine strength and cardio' },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', description: 'Balance strength and size' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Well-rounded fitness' }
];

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

const ProgramForm = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    focus: 'strength',
    sessions_per_week: 3,
    difficulty_level: 'intermediate',
    recommended_level: 'intermediate',
    required_equipment: [],
    estimated_completion_weeks: 8,
    tags: [],
    is_active: false,
    is_public: true,
    ...initialData
  });

  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (err) {
      setError('Failed to save program');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Program Name <span className="text-red-400">*</span>
          </label>
          <input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Focus <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.focus}
            onChange={(e) => setFormData(prev => ({ ...prev, focus: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500"
            required
          >
            {FOCUS_CHOICES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sessions per Week <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={formData.sessions_per_week}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              sessions_per_week: parseInt(e.target.value) 
            }))}
            className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500"
            min={1}
            max={7}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Difficulty Level <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.difficulty_level}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              difficulty_level: e.target.value,
              recommended_level: e.target.value 
            }))}
            className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500"
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
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estimated Weeks <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={formData.estimated_completion_weeks}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              estimated_completion_weeks: parseInt(e.target.value) 
            }))}
            className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500"
            min={1}
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
          <div className="space-y-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full px-4 py-3 bg-gray-700/50 rounded-lg text-white border border-gray-600 focus:border-blue-500"
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

        <div className="col-span-2 flex flex-col space-y-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                is_active: e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">Set as Active Program</span>
          </label>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                is_public: e.target.checked 
              }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">Make Public</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Update Program' : 'Create Program'}
        </button>
      </div>
    </form>
  );
};

export default ProgramForm;