import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, Dumbbell, Calendar, Scale, Clock, ChevronDown, ChevronUp, CircleDot } from 'lucide-react';
import { useGyms } from '../hooks/useGyms';
import { GymSelect, AddGymModal } from './GymComponents';

const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbell",
  "Kettlebell",
  "Machine",
  "Cable",
  "Smith Machine",
  "Bodyweight",
  "Resistance Band",
  "Other"
];

// Helper to initialize form data from a log
// In WorkoutLogForm.jsx, replace the initializeFormData function with this improved version:

const initializeFormData = (log) => {
  console.log('Initializing form data with log:', log); // Debug log
  
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
      notes: '',
      media: []
    };
  }
  
  // Process based_on_instance
  let basedOnInstance = null;
  if (log.based_on_instance !== undefined && log.based_on_instance !== null) {
    console.log('based_on_instance type:', typeof log.based_on_instance); // Debug type
    
    if (typeof log.based_on_instance === 'object' && log.based_on_instance !== null) {
      basedOnInstance = log.based_on_instance.id;
    } else {
      // Ensure it's an integer if it's a string representation of a number
      basedOnInstance = typeof log.based_on_instance === 'string' ? 
        parseInt(log.based_on_instance, 10) : log.based_on_instance;
    }
  }
  console.log('Processed based_on_instance:', basedOnInstance); // Debug processed value
  
  // Process program
  let program = null;
  if (log.program !== undefined && log.program !== null) {
    console.log('program type:', typeof log.program); // Debug type
    
    if (typeof log.program === 'object' && log.program !== null) {
      program = log.program.id;
    } else {
      // Ensure it's an integer if it's a string representation of a number
      program = typeof log.program === 'string' ? 
        parseInt(log.program, 10) : log.program;
    }
  }
  console.log('Processed program:', program); // Debug processed value
  
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

  const exercises = log.exercises?.map(exercise => ({
    id: exercise.id || Math.floor(Date.now() + Math.random() * 1000), // Use Math.floor to get integer
    name: exercise.name || '',
    equipment: exercise.equipment || '',
    notes: exercise.notes || '',
    order: exercise.order || 0,
    sets: exercise.sets?.map(set => ({
      id: set.id || Math.floor(Date.now() + Math.random() * 1000), // Use Math.floor to get integer
      reps: set.reps || 0,
      weight: set.weight || 0,
      rest_time: set.rest_time || 60,
      order: set.order || 0
    })) || []
  })) || [];

  const result = {
    name: log.name || '',
    date: formatDate(log.date),
    completed: log.completed ?? true,
    exercises: exercises,
    mood_rating: log.mood_rating || 5,
    perceived_difficulty: log.perceived_difficulty || 5,
    performance_notes: log.performance_notes || '',
    program: program,
    based_on_instance: basedOnInstance,
    gym: log.gym ? (typeof log.gym === 'object' ? log.gym.id : log.gym) : null,
    notes: log.notes || '',
    media: log.media || []
  };
  
  console.log('Final form data:', result); // Debug final result
  return result;
};

// Exercise set input component with improved visuals
const SetInput = ({ set, onChange, onDelete, setNumber }) => (
  <div className="grid grid-cols-4 gap-4 bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 hover:border-gray-700 transition-colors">
    <div className="flex items-center justify-center bg-gray-800 rounded-lg p-2">
      <span className="text-lg font-semibold text-gray-400">#{setNumber}</span>
    </div>
    
    <div className="col-span-3 grid grid-cols-3 gap-4">
      <div>
        <div className="flex items-center mb-1 text-sm text-gray-400">
          <Scale className="w-4 h-4 mr-1" />
          <span>Weight (kg)</span>
        </div>
        <input
          type="number"
          value={set.weight}
          onChange={(e) => onChange({ ...set, weight: parseFloat(e.target.value) })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>
      
      <div>
        <div className="flex items-center mb-1 text-sm text-gray-400">
          <CircleDot className="w-4 h-4 mr-1" />
          <span>Reps</span>
        </div>
        <input
          type="number"
          value={set.reps}
          onChange={(e) => onChange({ ...set, reps: parseInt(e.target.value) })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>
      
      <div>
        <div className="flex items-center mb-1 text-sm text-gray-400">
          <Clock className="w-4 h-4 mr-1" />
          <span>Rest (sec)</span>
        </div>
        <input
          type="number"
          value={set.rest_time}
          onChange={(e) => onChange({ ...set, rest_time: parseInt(e.target.value) })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>
    </div>
  </div>
);

// Exercise input component with improved visuals
const ExerciseInput = ({ exercise, onChange, onDelete, exerciseNumber }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = {
      id: Date.now(),
      reps: lastSet ? lastSet.reps : 0,
      weight: lastSet ? lastSet.weight : 0,
      rest_time: lastSet ? lastSet.rest_time : 60,
      order: exercise.sets.length
    };
    onChange({
      ...exercise,
      sets: [...exercise.sets, newSet]
    });
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <Dumbbell className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-white">Exercise {exerciseNumber}</h3>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
              <input
                type="text"
                value={exercise.name}
                onChange={(e) => onChange({ ...exercise, name: e.target.value })}
                placeholder="Exercise name"
                className="mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          
          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Equipment</label>
              <select
                value={exercise.equipment || ''}
                onChange={(e) => onChange({ ...exercise, equipment: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="">Select Equipment</option>
                {EQUIPMENT_OPTIONS.map(eq => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={exercise.notes || ''}
                  onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Any special instructions"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-white">Sets</h4>
                <button
                  type="button"
                  onClick={addSet}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Set</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {exercise.sets.map((set, index) => (
                  <SetInput
                    key={set.id}
                    set={set}
                    setNumber={index + 1}
                    onChange={(updatedSet) => {
                      const newSets = [...exercise.sets];
                      newSets[index] = updatedSet;
                      onChange({ ...exercise, sets: newSets });
                    }}
                    onDelete={() => {
                      onChange({
                        ...exercise,
                        sets: exercise.sets.filter((_, i) => i !== index)
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WorkoutLogForm = ({ log = null, onSubmit, onClose, programs = [] }) => {
  const { gyms, loading: gymsLoading, error: gymsError, refreshGyms } = useGyms();
  
  const [formData, setFormData] = useState(() => initializeFormData(log));
  
  const [showAddGym, setShowAddGym] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    setFormData(initializeFormData(log));
  }, [log]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            {log ? 'Edit Workout Log' : 'New Workout Log'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-8 py-4 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Workout Details
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-8 py-4 text-sm font-medium transition-colors ${
              activeTab === 'exercises'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Exercises
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <div className="p-8 space-y-8">
            {activeTab === 'details' ? (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Workout Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="e.g., Morning Upper Body"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
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
                    <label className="block text-sm text-gray-400 mb-2">Program (optional)</label>
                    <select
                      value={formData.program || ''}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value || null })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                      <option value="">No Program</option>
                      {programs?.map(program => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Mood Rating</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.mood_rating || 5}
                      onChange={(e) => setFormData({ ...formData, mood_rating: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>Low</span>
                      <span className="font-medium text-white">{formData.mood_rating}/10</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Perceived Difficulty</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.perceived_difficulty || 5}
                      onChange={(e) => setFormData({ ...formData, perceived_difficulty: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>Easy</span>
                      <span className="font-medium text-white">{formData.perceived_difficulty}/10</span>
                      <span>Hard</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Performance Notes</label>
                  <textarea
                    value={formData.performance_notes || ''}
                    onChange={(e) => setFormData({ ...formData, performance_notes: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    rows={3}
                    placeholder="How did the workout feel? Any PRs or notable achievements?"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status</label>
                  <select
                    value={formData.completed}
                    onChange={(e) => setFormData({ ...formData, completed: e.target.value === 'true' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  >
                    <option value="true">Completed</option>
                    <option value="false">In Progress</option>
                  </select>
                </div>
               
                  <div className="grid grid-cols-4 gap-4">
                    {formData.media.map((file, index) => (
                      <div key={index} className="relative bg-gray-800 rounded-xl overflow-hidden aspect-square">
                        <img 
                          // Handle both File objects (new uploads) and existing media URLs/objects
                          src={file instanceof File ? URL.createObjectURL(file) : (file.url || file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newMedia = [...formData.media];
                            newMedia.splice(index, 1);
                            setFormData({ ...formData, media: newMedia });
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    
                    <label className="flex items-center justify-center bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl aspect-square cursor-pointer hover:border-gray-600 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setFormData({ 
                            ...formData, 
                            media: [...formData.media, ...files]
                          });
                        }}
                      />
                      <div className="text-center">
                        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-400">Add Photos</span>
                      </div>
                    </label>
                  </div>
              </>
              
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Exercises</h3>
                  <button
                    type="button"
                    onClick={addExercise}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Exercise</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.exercises.map((exercise, index) => (
                    <ExerciseInput
                      key={exercise.id}
                      exercise={exercise}
                      exerciseNumber={index + 1}
                      onChange={(updatedExercise) => {
                        const newExercises = [...formData.exercises];
                        newExercises[index] = updatedExercise;
                        setFormData({ ...formData, exercises: newExercises });
                      }}
                      onDelete={() => {
                        setFormData({
                          ...formData,
                          exercises: formData.exercises.filter((_, i) => i !== index)
                        });
                      }}
                    />
                  ))}

                  {formData.exercises.length === 0 && (
                    <div className="text-center py-12 px-6 bg-gray-800 rounded-2xl border-2 border-dashed border-gray-700">
                      <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-400">No exercises added yet</h3>
                      <p className="text-gray-500 mt-1">Click the "Add Exercise" button to start building your workout</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors font-medium"
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