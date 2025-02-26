import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Calendar } from 'lucide-react';
import WeeklyCalendar from '../components/WeeklyCalendar';
import UnifiedWorkoutCard from '../components/UnifiedWorkoutCard';
import TemplateSelector from '../components/TemplateSelector';
import ProgramForm from '../components/ProgramForm';
import EnhancedWorkoutForm from '../components/EnhancedWorkoutForm';
import api from './../../../api';

const PlanDetailView = ({
  plan,
  templates,
  onBack,
  onUpdate,
  onDelete,
  onAddWorkout,
  onUpdateWorkout,
  onRemoveWorkout,
  user,
}) => {
  const [error, setError] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [workoutBeingEdited, setWorkoutBeingEdited] = useState(null);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);

  // Check if user has edit permissions
  const canEdit = user && plan && (user.username === plan.creator_username || user.is_staff);

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading program details...</p>
      </div>
    );
  }

  const getLatestWorkoutData = (workoutId) => {
    return plan.workouts.find(w => w.id === workoutId);
  };

  const handleDayChange = async (workoutId, newDay) => {
    try {
      await onUpdateWorkout(plan.id, workoutId, { preferred_weekday: newDay });
    } catch (err) {
      setError('Failed to update workout day');
    }
  };

  const handleCreateNewWorkout = async (workoutData) => {
    try {
      // First create the template
      const templateData = {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method,
        difficulty_level: workoutData.difficulty_level,
        estimated_duration: workoutData.estimated_duration,
        equipment_required: workoutData.equipment_required || [],
        tags: workoutData.tags || [],
        is_public: workoutData.is_public !== false
      };

      const response = await api.post('/workouts/templates/', templateData);
      const newTemplate = response.data;

      // Add exercises to the template if they exist
      if (workoutData.exercises?.length > 0) {
        for (const exercise of workoutData.exercises) {
          await api.post(`/workouts/templates/${newTemplate.id}/add_exercise/`, {
            name: exercise.name,
            equipment: exercise.equipment || '',
            notes: exercise.notes || '',
            order: exercise.order,
            sets: exercise.sets.map((set, idx) => ({
              reps: parseInt(set.reps),
              weight: parseFloat(set.weight),
              rest_time: parseInt(set.rest_time),
              order: idx
            }))
          });
        }
      }

      // Then add it to the program with the preferred weekday
      await onAddWorkout(plan.id, newTemplate.id, workoutData.preferred_weekday || 0);
      setShowCreateWorkout(false);
    } catch (err) {
      console.error('Error creating workout:', err);
      setError(err.response?.data?.detail || 'Failed to create new workout');
    }
  };

  const handleEditWorkout = (workout) => {
    // Get the latest version of the workout from the plan
    const latestWorkout = getLatestWorkoutData(workout.id);
    setWorkoutBeingEdited(latestWorkout);
  };
  
  const handleWorkoutUpdate = async (updatedWorkout) => {
    try {
      await onUpdateWorkout(plan.id, updatedWorkout.id, updatedWorkout);
      setWorkoutBeingEdited(null);
    } catch (err) {
      setError('Failed to update workout');
    }
  };


  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Are you sure you want to remove this workout from the program?')) {
      return;
    }
    try {
      await onRemoveWorkout(plan.id, workoutId);
    } catch (err) {
      setError('Failed to remove workout from program');
    }
  };

  const handleDeleteProgram = async () => {
    if (!window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return;
    }
    try {
      await onDelete(plan.id);
      onBack();
    } catch (err) {
      setError('Failed to delete program');
    }
  };

  const handleTemplateSelect = async (templateId, weekday) => {
    try {
      await onAddWorkout(plan.id, templateId, weekday);
      setShowTemplateSelector(false);
    } catch (err) {
      setError('Failed to add workout to program');
    }
  };

  const handleUpdateProgram = async (updatedData) => {
    try {
      await onUpdate(plan.id, updatedData);
      setShowEditProgram(false);
    } catch (err) {
      setError('Failed to update program');
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{plan.name}</h1>
              <span className="text-gray-400 text-lg">by {plan.creator_username}</span>
            </div>
            <p className="text-gray-400 mt-1">
              {plan.focus} • {plan.sessions_per_week}x per week
            </p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowEditProgram(true)}
              className="p-2 hover:bg-blue-900/20 rounded-lg transition-colors text-blue-400"
              title="Edit program"
            >
              <Edit className="w-6 h-6" />
            </button>
            <button
              onClick={handleDeleteProgram}
              className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
              title="Delete program"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Weekly Calendar */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h2>
        <WeeklyCalendar 
          workouts={plan.workouts}
          onWorkoutClick={handleEditWorkout}
        />
      </div>

      {/* Workouts List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Workouts</h2>
          {canEdit && (
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                       transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Workout</span>
            </button>
          )}
        </div>

        {plan.workouts.map((workout) => (
          <UnifiedWorkoutCard
            key={workout.id}
            workout={workout}
            onDelete={canEdit ? () => handleDeleteWorkout(workout.id) : undefined}
            onDayChange={canEdit ? (newDay) => handleDayChange(workout.id, newDay) : undefined}
            onEdit={canEdit ? () => handleEditWorkout(workout) : undefined}
            inProgram={true}
          />
        ))}

        {plan.workouts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No workouts added to this program yet.
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TemplateSelector
              templates={templates}
              onSelect={handleTemplateSelect}
              onCreateNew={() => {
                setShowTemplateSelector(false);
                setShowCreateWorkout(true);
              }}
              onBack={() => setShowTemplateSelector(false)}
              currentProgramWorkouts={plan.workouts}
            />
          </div>
        </div>
      )}

      {showCreateWorkout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => {
                  setShowCreateWorkout(false);
                  setShowTemplateSelector(true);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-400" />
              </button>
              <h2 className="text-2xl font-bold text-white">Create New Workout</h2>
            </div>
            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                {error}
                <button 
                  onClick={() => setError('')}
                  className="float-right text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            )}
            <EnhancedWorkoutForm
              onSubmit={handleCreateNewWorkout}
              onCancel={() => {
                setShowCreateWorkout(false);
                setShowTemplateSelector(true);
              }}
              inProgram={true}
              selectedPlan={plan}
              initialData={{
                name: '',
                description: '',
                split_method: 'full_body',
                preferred_weekday: 0,
                difficulty_level: 'intermediate',
                estimated_duration: 60,
                equipment_required: [],
                tags: [],
                exercises: [],
                is_public: true
              }}
            />
          </div>
        </div>
      )}

      {/* Program Edit Modal */}
      {showEditProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">Edit Program</h2>
            <ProgramForm
              initialData={plan}
              onSubmit={handleUpdateProgram}
              onCancel={() => setShowEditProgram(false)}
            />
          </div>
        </div>
      )}

      {/* Workout Edit Modal */}
      {workoutBeingEdited && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EnhancedWorkoutForm
              key={`edit-${workoutBeingEdited.id}-${JSON.stringify(workoutBeingEdited)}`}
              initialData={workoutBeingEdited}
              onSubmit={handleWorkoutUpdate}
              onCancel={() => setWorkoutBeingEdited(null)}
              inProgram={true}
              selectedPlan={plan}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanDetailView;