import React, { useState } from 'react';
import { Target, Calendar, Tag, Users, Clock, Award, Info, Dumbbell, ChevronDown, ChevronUp, ArrowRight, CheckCircle, Save, Plus, X, Settings} from 'lucide-react';

const FOCUS_CHOICES = [
  { value: 'strength', label: 'Strength', description: 'Focus on building maximal strength' },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Optimize muscle growth' },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina' },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Combine strength and cardio' },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', description: 'Balance strength and size' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Well-rounded fitness' }
];

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];
const EQUIPMENT_OPTIONS = ['Dumbbells', 'Barbell', 'Machine', 'Bodyweight', 'Smith Machine', 'Cables', 'Kettlebell', 'Resistance Bands'];

const EnhancedProgramForm = ({ onSubmit, initialData, onCancel }) => {
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
  const [activeTab, setActiveTab] = useState('details');

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

  const handleEquipmentToggle = (item) => {
    setFormData(prev => {
      const newEquipment = prev.required_equipment.includes(item)
        ? prev.required_equipment.filter(e => e !== item)
        : [...prev.required_equipment, item];
      return { ...prev, required_equipment: newEquipment };
    });
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
          <button 
            onClick={() => setError('')}
            className="float-right text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex border-b border-gray-800 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Program Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'preferences'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Advanced Options
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <Dumbbell className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Program Information</h2>
                <p className="text-gray-400">Basic details about your workout program</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Program Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Summer Shred 2025"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows="3"
                  placeholder="Tell users what this program is about and what they can expect to achieve"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Focus <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.focus}
                  onChange={(e) => setFormData(prev => ({ ...prev, focus: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  Difficulty Level <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    difficulty_level: e.target.value,
                    recommended_level: e.target.value 
                  }))}
                  className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  Sessions per Week <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.sessions_per_week}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    sessions_per_week: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  min="1"
                  max="7"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Weeks to Complete <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.estimated_completion_weeks}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimated_completion_weeks: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 bg-gray-900 rounded-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                <div className="space-y-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="flex-1 px-4 py-3 bg-gray-900 rounded-l-lg text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Press Enter to add tags"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim()) {
                          if (!formData.tags.includes(tagInput.trim())) {
                            setFormData(prev => ({
                              ...prev,
                              tags: [...prev.tags, tagInput.trim()]
                            }));
                          }
                          setTagInput('');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-r-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400"
                      >
                        <Tag className="w-3 h-3 mr-1" />
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
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h3 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Tips for creating effective programs:
            </h3>
            <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
              <li>Balance workout intensity across the week</li>
              <li>Include rest and recovery days</li>
              <li>Consider progressive overload principles</li>
              <li>Create variety to maintain engagement</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-purple-500/20 p-3 rounded-xl">
                <Settings className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Advanced Settings</h2>
                <p className="text-gray-400">Configure additional program options</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Required Equipment</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
                  {EQUIPMENT_OPTIONS.map(item => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.required_equipment.includes(item)}
                        onChange={() => handleEquipmentToggle(item)}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-medium text-white mb-4">Visibility & Status</h3>
                <div className="space-y-4">
                  <label className="relative inline-flex items-center cursor-pointer bg-gray-900 p-4 rounded-lg border border-gray-700 w-full">
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
                    <div className="ml-4">
                      <span className="text-white font-medium">Set as Active Program</span>
                      <p className="text-sm text-gray-400 mt-1">Make this your current active workout program</p>
                    </div>
                  </label>

                  <label className="relative inline-flex items-center cursor-pointer bg-gray-900 p-4 rounded-lg border border-gray-700 w-full">
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
                    <div className="ml-4">
                      <span className="text-white font-medium">Make Public</span>
                      <p className="text-sm text-gray-400 mt-1">Allow other users to view and fork this program</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {initialData ? 'Update Program' : 'Create Program'}
        </button>
      </div>
    </form>
  );
};

export default EnhancedProgramForm;