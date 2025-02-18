import React, { useState } from 'react';
import { Target, Calendar, Sparkles, Tag } from 'lucide-react';

const FOCUS_OPTIONS = [
  { value: 'strength', label: 'Strength', description: 'Focus on building maximal strength' },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Optimize muscle growth' },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina' },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Combine strength and cardio' },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', description: 'Balance strength and size' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Well-rounded fitness' }
];

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];
const EQUIPMENT_OPTIONS = ['Dumbbells', 'Barbell', 'Machine', 'Bodyweight', 'Smith Machine', 'Cables', 'Kettlebell', 'Resistance Bands'];

const WorkoutPlanForm = ({ onSubmit, initialData }) => {
  const [tags, setTags] = useState(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [equipment, setEquipment] = useState(initialData?.required_equipment || []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      focus: formData.get('focus'),
      difficulty_level: formData.get('difficulty_level'),
      recommended_level: formData.get('difficulty_level'),
      required_equipment: equipment,
      estimated_completion_weeks: parseInt(formData.get('estimated_completion_weeks'), 10),
      sessions_per_week: parseInt(formData.get('sessions_per_week'), 10),
      tags: tags,
      is_active: formData.get('is_active') === 'true',
      is_public: formData.get('is_public') === 'true'
    };
    onSubmit(data);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleEquipmentToggle = (item) => {
    setEquipment(prev => 
      prev.includes(item) 
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Focus <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {FOCUS_OPTIONS.map(option => (
                <label key={option.value} className="relative flex cursor-pointer rounded-lg border border-gray-600 bg-gray-700/50 p-4">
                  <input
                    type="radio"
                    name="focus"
                    value={option.value}
                    defaultChecked={initialData?.focus === option.value}
                    className="peer sr-only"
                    required
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-medium text-white">{option.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{option.description}</p>
                  </div>
                  <div className="absolute -inset-px rounded-lg border-2 border-transparent peer-checked:border-blue-500" />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty Level <span className="text-red-400">*</span>
            </label>
            <select
              name="difficulty_level"
              defaultValue={initialData?.difficulty_level || 'beginner'}
              className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Required Equipment</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EQUIPMENT_OPTIONS.map(item => (
                <label key={item} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={equipment.includes(item)}
                    onChange={() => handleEquipmentToggle(item)}
                    className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Weeks to Complete <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="estimated_completion_weeks"
                defaultValue={initialData?.estimated_completion_weeks || 4}
                className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sessions per Week <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="sessions_per_week"
                defaultValue={initialData?.sessions_per_week || 3}
                className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                min="1"
                max="7"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="space-y-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Press Enter to add tags"
              />
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
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

          <div className="flex flex-col space-y-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={initialData?.is_active !== false}
                value="true"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-300">Set as Active Plan</span>
            </label>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_public"
                defaultChecked={initialData?.is_public !== false}
                value="true"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-300">Make Public</span>
            </label>
          </div>
        </div>

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