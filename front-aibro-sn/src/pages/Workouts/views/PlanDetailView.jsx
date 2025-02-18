import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import UnifiedWorkoutCard from '../components/UnifiedWorkoutCard';
import WeeklyCalendar from '../components/WeeklyCalendar';
import WorkoutDetailModal from '../components/WorkoutDetailModal';
import StatsGrid from '../components/StatsGrid';
import TemplateSelector from '../components/TemplateSelector';
import EnhancedWorkoutForm from '../components/EnhancedWorkoutForm';

const AddWorkoutChoiceModal = ({ isOpen, onClose, onSelectExisting, onCreateNew }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-6">Add Workout</h3>
        <div className="space-y-4">
          <button
            onClick={() => {
              onClose();
              onSelectExisting();
            }}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
          >
            <div className="font-medium text-white">Select Existing Template</div>
            <div className="text-sm text-gray-400">Use a workout template you've created before</div>
          </button>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

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
  onRefreshPlan
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [error, setError] = useState('');
  const [workoutBeingEdited, setWorkoutBeingEdited] = useState(null);

  const handleEditClick = (workout) => {
    setWorkoutBeingEdited(workout);
  };


  const handleWorkoutUpdate = async (updatedWorkout) => {
    try {
      await onUpdateWorkout(plan.id, updatedWorkout.id, updatedWorkout);
      setWorkoutBeingEdited(null); // Close the form
      if (onRefreshPlan) {
        await onRefreshPlan(plan.id);
      }
    } catch (err) {
      setError('Failed to update workout');
    }
  };
  const handleTemplateSelect = async (templateId, weekday) => {
    try {
      await onAddWorkout(plan.id, templateId, weekday);
      setShowTemplateSelector(false);
      // Refresh plan data immediately after adding workout
      if (onRefreshPlan) {
        await onRefreshPlan(plan.id);
      }
    } catch (err) {
      console.error('Error adding workout:', err);
      setError('Failed to add workout to program');
    }
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading program details...</p>
      </div>
    );
  }

  const canEdit = user?.username === plan.creator_username;

  const handleDeleteWorkout = async (workoutId) => {
    try {
      if (!window.confirm('Are you sure you want to remove this workout from the program?')) {
        return;
      }
      await onRemoveWorkout(plan.id, workoutId);
      if (onRefreshPlan) {
        await onRefreshPlan(plan.id);
      }
    } catch (err) {
      setError('Failed to remove workout from program');
    }
  };

  const handleDayChange = async (workoutId, newDay) => {
    try {
      await onUpdateWorkout(plan.id, workoutId, { preferred_weekday: newDay });
      // Immediately refresh after the update
      if (onRefreshPlan) {
        await onRefreshPlan(plan.id);
      }
    } catch (err) {
      setError('Failed to update workout day');
    }
  };

  // write a handleUpdateWorkout 

  const handleDeleteProgram = async () => {
    try {
      if (!window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
        return;
      }
      await onDelete(plan.id);
      onBack();
    } catch (err) {
      setError('Failed to delete program');
    }
  };

  return (
    <div className="space-y-6 relative pb-20">
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
          <button
            onClick={handleDeleteProgram}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
            title="Delete program"
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <StatsGrid
        totalWorkouts={plan.workouts.length}
        daysPerWeek={new Set(plan.workouts.map(w => w.preferred_weekday)).size}
        totalExercises={plan.workouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0)}
      />

      {/* Calendar View */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h2>
        <WeeklyCalendar 
          workouts={plan.workouts}
          onWorkoutClick={setSelectedWorkout}
        />
      </div>

      {/* Workout List */}
      <div className="space-y-4">
      {plan.workouts.map((workout) => (
        <UnifiedWorkoutCard
          key={workout.id}
          workout={workout}
          onEdit={() => handleEditClick(workout)}  // Changed this line
          onDelete={canEdit ? () => handleDeleteWorkout(workout.id) : undefined}
          inProgram={true}
          onDayChange={canEdit ? (newDay) => handleDayChange(workout.id, newDay) : undefined}
          onClick={() => setSelectedWorkout(workout)}
        />
      ))}
      </div>

      {/* Add Workout Button */}
      {canEdit && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setShowAddChoice(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                     transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Workout</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <AddWorkoutChoiceModal
        isOpen={showAddChoice}
        onClose={() => setShowAddChoice(false)}
        onSelectExisting={() => setShowTemplateSelector(true)}
      />

      {showTemplateSelector && (
        <TemplateSelector
          templates={templates}
          onSelect={handleTemplateSelect}
          onCancel={() => setShowTemplateSelector(false)}
          currentProgramWorkouts={plan.workouts}
          onError={setError}
        />
      )}

      {selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
        />
      )}

      {workoutBeingEdited && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <EnhancedWorkoutForm
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