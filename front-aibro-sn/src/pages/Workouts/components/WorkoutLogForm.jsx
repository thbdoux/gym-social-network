import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { useGyms } from '../hooks/useGyms';
import { GymSelect, AddGymModal } from './GymComponents';

// Helper to initialize form data from a log
const initializeFormData = (log) => {
  if (!log) {
    return {
      name: '',
      date: new Date().toISOString().split('T')[0],
      completed: true,
      exercises: [],
      mood_rating: 5,
      perceived_difficulty: 5,
      performance_notes: '',
      program: null,
      based_on_instance: null,
      gym: null,
      media: []
    };
  }

  // Convert date from DD/MM/YYYY to YYYY-MM-DD format
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Check if date is in DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // Convert from DD/MM/YYYY to YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    
    // If date is already in YYYY-MM-DD format or another format,
    // try to parse it and return in correct format
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  // Map exercises and sets from the log
  const exercises = log.exercises?.map(exercise => ({
    id: exercise.id || Date.now() + Math.random(), // Ensure unique IDs
    name: exercise.name || '',
    equipment: exercise.equipment || '',
    notes: exercise.notes || '',
    order: exercise.order || 0,
    sets: exercise.sets?.map(set => ({
      id: set.id || Date.now() + Math.random(),
      reps: set.reps || 0,
      weight: set.weight || 0,
      rest_time: set.rest_time || 60,
      order: set.order || 0
    })) || []
  })) || [];

  return {
    name: log.name || '',
    date: formatDate(log.date),
    completed: log.completed ?? true,
    exercises: exercises,
    mood_rating: log.mood_rating || 5,
    perceived_difficulty: log.perceived_difficulty || 5,
    performance_notes: log.performance_notes || '',
    program: log.program ? (typeof log.program === 'object' ? log.program.id : log.program) : null,
    based_on_instance: log.based_on_instance?.id || null,
    gym: typeof log.gym === 'object' ? log.gym.id : log.gym,
    notes: log.notes || '',
    media: log.media || []
  };
};

// Component to handle set inputs
const SetInput = ({ set, onChange, onDelete }) => (
  <div className="grid grid-cols-4 gap-4 bg-gray-800/50 p-3 rounded-lg">
    <div>
      <label className="text-sm text-gray-400">Reps</label>
      <input
        type="number"
        value={set.reps}
        onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value) })}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
      />
    </div>
    <div>
      <label className="text-sm text-gray-400">Weight (kg)</label>
      <input
        type="number"
        value={set.weight}
        onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) })}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
      />
    </div>
    <div>
      <label className="text-sm text-gray-400">Rest (sec)</label>
      <input
        type="number"
        value={set.rest_time}
        onChange={(e) => onChange({ ...set, rest_time: parseInt(e.target.value) })}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
      />
    </div>
    <div className="flex items-end">
      <button
        type="button"
        onClick={onDelete}
        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-3 py-2 hover:bg-red-500/20"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// Component to handle exercise inputs
const ExerciseInput = ({ exercise, onChange, onDelete }) => {
  const addSet = () => {
    const newSet = {
      id: Date.now(), // Temporary ID for new sets
      reps: 0,
      weight: 0,
      rest_time: 60,
      order: exercise.sets.length
    };
    onChange({
      ...exercise,
      sets: [...exercise.sets, newSet]
    });
  };

  const updateSet = (index, updatedSet) => {
    const newSets = [...exercise.sets];
    newSets[index] = updatedSet;
    onChange({ ...exercise, sets: newSets });
  };

  const deleteSet = (index) => {
    onChange({
      ...exercise,
      sets: exercise.sets.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm text-gray-400">Exercise Name</label>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => onChange({ ...exercise, name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Equipment (optional)</label>
            <input
              type="text"
              value={exercise.equipment || ''}
              onChange={(e) => onChange({ ...exercise, equipment: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Notes (optional)</label>
            <textarea
              value={exercise.notes || ''}
              onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
              rows={2}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={onDelete}
          className="ml-4 p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-400">Sets</h4>
          <button
            type="button"
            onClick={addSet}
            className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-400/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {exercise.sets.map((set, index) => (
          <SetInput
            key={set.id}
            set={set}
            onChange={(updatedSet) => updateSet(index, updatedSet)}
            onDelete={() => deleteSet(index)}
          />
        ))}
      </div>
    </div>
  );
};

const WorkoutLogForm = ({ log = null, onSubmit, onClose, programs = [] }) => {
  const { gyms, loading: gymsLoading, error: gymsError, refreshGyms } = useGyms();
  const [formData, setFormData] = useState(() => initializeFormData(log));
  const [showAddGym, setShowAddGym] = useState(false);

  // Initialize form data when log prop changes
  useEffect(() => {
    setFormData(initializeFormData(log));
  }, [log]);

  useEffect(() => {
    console.log('Log gym:', log?.gym);
    console.log('Form data gym:', formData.gym);
  }, [log, formData.gym]);

  const addExercise = () => {
    const newExercise = {
      id: Date.now(),
      name: '',
      order: formData.exercises.length,
      sets: []
    };
    setFormData({
      ...formData,
      exercises: [...formData.exercises, newExercise]
    });
  };

  const updateExercise = (index, updatedExercise) => {
    const newExercises = [...formData.exercises];
    newExercises[index] = updatedExercise;
    setFormData({ ...formData, exercises: newExercises });
  };

  const deleteExercise = (index) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {log ? 'Edit Workout Log' : 'New Workout Log'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Form fields remain the same but now use formData state */}
          <div>
            <label className="text-sm text-gray-400">Workout Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
              placeholder="e.g. Morning Upper Body"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-400">Date</label>
              <input
                required
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
              />
            </div>

            <div>
              <GymSelect
                value={formData.gym}
                onChange={(e) => setFormData({ ...formData, gym: e.target.value ? parseInt(e.target.value) : null })}
                gyms={gyms}
                loading={gymsLoading}
                error={gymsError}
                onAddGym={() => setShowAddGym(true)}
              />
            </div>

            <div>
                <label className="text-sm text-gray-400">Program (optional)</label>
                <select
                    value={formData.program ? (typeof formData.program === 'object' ? formData.program.id : formData.program) : ''}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value || null })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                    >
                <option value="">No Program</option>
                {programs?.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                ))}
                </select>
            </div>

            {/* Add a new section for ratings */}
            <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="text-sm text-gray-400">Mood Rating (1-10)</label>
                <input
                type="number"
                min="1"
                max="10"
                value={formData.mood_rating || 5}
                onChange={(e) => setFormData({ ...formData, mood_rating: parseInt(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                />
            </div>
            
            <div>
                <label className="text-sm text-gray-400">Perceived Difficulty (1-10)</label>
                <input
                type="number"
                min="1"
                max="10"
                value={formData.perceived_difficulty || 5}
                onChange={(e) => setFormData({ ...formData, perceived_difficulty: parseInt(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                />
            </div>
            </div>

            <div>
            <label className="text-sm text-gray-400">Performance Notes (optional)</label>
            <textarea
                value={formData.performance_notes || ''}
                onChange={(e) => setFormData({ ...formData, performance_notes: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                rows={2}
                placeholder="How did you perform? Any PRs?"
            />
            </div>

            <div>
              <label className="text-sm text-gray-400">Status</label>
              <select
                value={formData.completed}
                onChange={(e) => setFormData({ ...formData, completed: e.target.value === 'true' })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
              >
                <option value="true">Completed</option>
                <option value="false">In Progress</option>
              </select>
            </div>
          </div>

          {/* Exercises section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Exercises</h3>
              <button
                type="button"
                onClick={addExercise}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exercise</span>
              </button>
            </div>

            {formData.exercises.map((exercise, index) => (
              <ExerciseInput
                key={exercise.id}
                exercise={exercise}
                onChange={(updatedExercise) => updateExercise(index, updatedExercise)}
                onDelete={() => deleteExercise(index)}
              />
            ))}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {log ? 'Save Changes' : 'Create Log'}
            </button>
          </div>
        </form>
      </div>

      {showAddGym && (
        <AddGymModal
          onClose={() => setShowAddGym(false)}
          onSuccess={(newGym) => {
            refreshGyms();
            setFormData({ ...formData, gym: newGym.id });
            setShowAddGym(false);
          }}
        />
      )}
    </div>
  );
};

export default WorkoutLogForm;