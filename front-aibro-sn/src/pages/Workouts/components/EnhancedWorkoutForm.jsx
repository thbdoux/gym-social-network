import React, { useState } from 'react';
import { Plus, Settings, Calendar, Dumbbell, Tag, Clock } from 'lucide-react';
import ExerciseCard from './ExerciseCard';

const SPLIT_METHODS = ['full_body', 'push_pull_legs', 'upper_lower', 'custom'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'];

const EnhancedWorkoutForm = ({
  onSubmit,
  initialData = null,
  onCancel,
  inProgram = false,
  selectedPlan,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    split_method: 'full_body',
    preferred_weekday: 0,
    difficulty_level: 'intermediate',
    estimated_duration: 60,
    equipment_required: [],
    tags: [],
    exercises: [],
    is_public: true,
    ...initialData
  });

  const [expandedExercises, setExpandedExercises] = useState({});
  const [tagInput, setTagInput] = useState('');

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

  const handleAddExercise = () => {
    const newExercise = {
      name: '',
      equipment: '',
      notes: '',
      order: formData.exercises.length,
      sets: [{
        reps: 10,
        weight: 0,
        rest_time: 60,
        order: 0
      }]
    };
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    setExpandedExercises(prev => ({
      ...prev,
      [formData.exercises.length]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...formData,
        exercises: formData.exercises.map((ex, i) => ({
          ...ex,
          order: i,
          sets: ex.sets.map((set, j) => ({
            ...set,
            order: j,
            reps: Number(set.reps),
            weight: Number(set.weight),
            rest_time: Number(set.rest_time)
          }))
        }))
      };

      if (initialData?.id) {
        submissionData.id = initialData.id;
      }

      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {initialData ? 'Update Workout' : 'Create New Workout'}
            </h2>
            <p className="text-gray-400">Configure your workout details</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Workout Name *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Split Method *</label>
            <select
              value={formData.split_method}
              onChange={(e) => setFormData(prev => ({ ...prev, split_method: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value }))}
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
            <input
              type="number"
              value={formData.estimated_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: Number(e.target.value) }))}
              className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
              min="15"
              max="180"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white h-10"
              placeholder="Brief description of your workout"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Tags</label>
            <div className="space-y-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500/50 text-white"
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

          {inProgram && (
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Preferred Day *</label>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, preferred_weekday: i }))}
                    className={`p-2 rounded-lg flex flex-col items-center transition-all ${
                      formData.preferred_weekday === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    <Calendar className="w-4 h-4 mb-1" />
                    <span className="text-sm">{day}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Dumbbell className="w-6 h-6 mr-2" />
            Exercises
          </h3>
          <button
            type="button"
            onClick={handleAddExercise}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Exercise</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.exercises.map((exercise, index) => (
            <ExerciseCard
              key={index}
              exercise={exercise}
              index={index}
              isExpanded={expandedExercises[index]}
              onToggle={(idx) => setExpandedExercises(prev => ({
                ...prev,
                [idx]: !prev[idx]
              }))}
              onUpdate={(idx, field, value) => {
                setFormData(prev => ({
                  ...prev,
                  exercises: prev.exercises.map((ex, i) =>
                    i === idx ? { ...ex, [field]: value } : ex
                  )
                }));
              }}
              onDuplicate={(idx) => {
                const exercise = { 
                  ...formData.exercises[idx],
                  order: formData.exercises.length
                };
                setFormData(prev => ({
                  ...prev,
                  exercises: [...prev.exercises, exercise]
                }));
              }}
              onDelete={(idx) => {
                setFormData(prev => ({
                  ...prev,
                  exercises: prev.exercises.filter((_, i) => i !== idx)
                }));
              }}
              onAddSet={(idx) => {
                const exercise = formData.exercises[idx];
                const lastSet = exercise.sets[exercise.sets.length - 1] || {
                  reps: 10,
                  weight: 0,
                  rest_time: 60
                };
                setFormData(prev => ({
                  ...prev,
                  exercises: prev.exercises.map((ex, i) =>
                    i === idx ? {
                      ...ex,
                      sets: [...ex.sets, { ...lastSet, order: ex.sets.length }]
                    } : ex
                  )
                }));
              }}
              onRemoveSet={(idx, setIdx) => {
                setFormData(prev => ({
                  ...prev,
                  exercises: prev.exercises.map((ex, i) =>
                    i === idx ? {
                      ...ex,
                      sets: ex.sets.filter((_, si) => si !== setIdx)
                    } : ex
                  )
                }));
              }}
              onUpdateSet={(idx, setIdx, field, value) => {
                setFormData(prev => ({
                  ...prev,
                  exercises: prev.exercises.map((ex, i) =>
                    i === idx ? {
                      ...ex,
                      sets: ex.sets.map((set, si) =>
                        si === setIdx ? { ...set, [field]: Number(value) } : set
                      )
                    } : ex
                  )
                }));
              }}
            />
          ))}
        </div>
      </div>

      {/* Form Actions */}
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
          {initialData ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>
    </form>
  );
};

export default EnhancedWorkoutForm;