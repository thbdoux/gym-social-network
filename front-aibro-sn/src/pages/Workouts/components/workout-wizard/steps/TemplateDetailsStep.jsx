import React, { useState } from 'react';
import { Settings, Dumbbell, Clock, Tag, X } from 'lucide-react';

const SPLIT_METHODS = ['full_body', 'push_pull_legs', 'upper_lower', 'custom'];
const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

const TemplateDetailsStep = ({ formData, updateFormData, colors }) => {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        updateFormData({
          tags: [...formData.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    updateFormData({
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="bg-blue-500/20 p-3 rounded-xl">
          <Settings className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            Template Details
          </h2>
          <p className="text-gray-400">Configure your workout template settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Split Method *</label>
          <select
            value={formData.split_method}
            onChange={(e) => updateFormData({ split_method: e.target.value })}
            className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
            required
          >
            {SPLIT_METHODS.map(method => (
              <option key={method} value={method}>
                {method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Difficulty Level *</label>
          <select
            value={formData.difficulty_level}
            onChange={(e) => updateFormData({ difficulty_level: e.target.value })}
            className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
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
          <label className="block text-sm text-gray-400 mb-2">Estimated Duration (min) *</label>
          <div className="flex items-center">
            <input
              type="number"
              value={formData.estimated_duration}
              onChange={(e) => updateFormData({ estimated_duration: Number(e.target.value) })}
              className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
              min="15"
              max="180"
              required
            />
            <Clock className="w-5 h-5 text-gray-400 ml-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Visibility</label>
          <div className="flex space-x-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={formData.is_public}
                onChange={() => updateFormData({ is_public: true })}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full mr-2 ${formData.is_public ? colors.bg : 'bg-gray-700'}`}></div>
              <span className="text-white">Public</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={!formData.is_public}
                onChange={() => updateFormData({ is_public: false })}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full mr-2 ${!formData.is_public ? colors.bg : 'bg-gray-700'}`}></div>
              <span className="text-white">Private</span>
            </label>
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white h-24"
            placeholder="Brief description of your workout template"
          ></textarea>
        </div>

        <div className="col-span-2">
          <label className="block text-sm text-gray-400 mb-2 flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            Tags
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white pr-10"
                placeholder="Press Enter to add tags"
              />
              {tagInput && (
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                      updateFormData({
                        tags: [...formData.tags, tagInput.trim()]
                      });
                    }
                    setTagInput('');
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300"
                >
                  <Tag className="w-4 h-4" />
                </button>
              )}
            </div>
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
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {formData.tags.length === 0 && (
                <span className="text-gray-500 text-sm">No tags added yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetailsStep;