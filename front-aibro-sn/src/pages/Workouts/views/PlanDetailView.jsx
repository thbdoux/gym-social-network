import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import EnhancedWorkoutForm from '../components/forms/EnhancedWorkoutForm';
import UnifiedWorkoutCard from '../components/cards/UnifiedWorkoutCard';
import WeeklyCalendar from '../components/layout/WeeklyCalendar';
import WorkoutDetailModal from '../components/modals/WorkoutDetailModal';
import StatsGrid from '../components/layout/StatsGrid';
import TemplateSelector from '../components/modals/TemplateSelector';
import api from '../../../api';

// Choice Modal Component
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
            <div className="font-medium text-white">Select Existing Workout</div>
            <div className="text-sm text-gray-400">Use a workout template you've created before</div>
          </button>
          <button
            onClick={() => {
              onClose();
              onCreateNew();
            }}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
          >
            <div className="font-medium text-white">Create New Workout</div>
            <div className="text-sm text-gray-400">Design a new workout from scratch</div>
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const PlanDetailView = ({
  selectedPlan,
  setView,
  setSelectedPlan,
  refreshPlanData,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  handleDayChange,
  handleDuplicateWorkout,
  setError,
  user,
  workoutTemplates
}) => {
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  if (!selectedPlan) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading program details...</p>
      </div>
    );
  }
  
  const canEdit = user?.username === selectedPlan.creator_username;

  const handleWorkoutSubmit = async (workoutData) => {
    try {
      if (editingWorkout) {
        await updateWorkout(editingWorkout.id, workoutData);
      } else {
        await createWorkout(workoutData, selectedPlan.id);
      }
      // Get fresh data and update UI
      const updatedPlan = await refreshPlanData(selectedPlan.id);
      setSelectedPlan(updatedPlan);
      setShowWorkoutForm(false);
      setEditingWorkout(null);
    } catch (err) {
      setError(editingWorkout ? 'Failed to update workout' : 'Failed to create workout');
    }
  };
  
  const handleDeleteWorkoutLocal = async (workoutId) => {
    if (!window.confirm('Are you sure you want to remove this workout from the program?')) {
      return;
    }
  
    try {
      await deleteWorkout(workoutId, selectedPlan.id);
      // Get fresh data and update UI
      const updatedPlan = await refreshPlanData(selectedPlan.id);
      setSelectedPlan(updatedPlan);
    } catch (err) {
      setError('Failed to remove workout from program');
    }
  };
  
  const handleTemplateSelect = async (templateId, weekday) => {
    try {
      await api.post(`/workouts/programs/${selectedPlan.id}/add_workout/`, {
        template_id: templateId,
        preferred_weekday: weekday,
        order: selectedPlan.workouts?.length || 0
      });
      // Get fresh data and update UI
      const updatedPlan = await refreshPlanData(selectedPlan.id);
      setSelectedPlan(updatedPlan);
      setShowTemplateSelector(false);
    } catch (err) {
      console.error('Error adding workout:', err);
      setError('Failed to add workout to program');
    }
  };
  
  const handleDayChangeLocal = async (instanceId, newDay) => {
    try {
      // Make the API call to update the day
      await handleDayChange(selectedPlan.id, instanceId, newDay);
      
      // Get fresh data
      const updatedPlan = await refreshPlanData(selectedPlan.id);
      
      // Update both the local state and parent state
      setSelectedPlan(updatedPlan);
    } catch (err) {
      console.error('Error in handleDayChangeLocal:', err);
      setError('Failed to update workout day');
    }
  };
  
  const handleDuplicateWorkoutLocal = async (instanceId) => {
    try {
      await handleDuplicateWorkout(selectedPlan.id, instanceId);
      // Get fresh data and update UI
      const updatedPlan = await refreshPlanData(selectedPlan.id);
      setSelectedPlan(updatedPlan);
    } catch (err) {
      setError('Failed to duplicate workout');
    }
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => {
            setView('plans');
            setSelectedPlan(null);
          }}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{selectedPlan.name}</h1>
            <span className="text-gray-400 text-lg">by {selectedPlan.creator_username}</span>
          </div>
          <p className="text-gray-400 mt-1">
            {selectedPlan.focus.replace('_', ' ')} • {selectedPlan.sessions_per_week}x per week
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <StatsGrid
        totalWorkouts={selectedPlan.workouts.length}
        daysPerWeek={new Set(selectedPlan.workouts.map(w => w.preferred_weekday)).size}
        totalExercises={selectedPlan.workouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0)}
      />

      {showWorkoutForm ? (
        <EnhancedWorkoutForm
          onSubmit={handleWorkoutSubmit}
          initialData={editingWorkout}
          onCancel={() => {
            setShowWorkoutForm(false);
            setEditingWorkout(null);
          }}
          inProgram={true}
          selectedPlan={selectedPlan}
        />
      ) : (
        <>
          {/* Calendar View */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h2>
            <WeeklyCalendar 
              workouts={selectedPlan.workouts}
              onWorkoutClick={setSelectedWorkout}
            />
          </div>

          {/* Workout List */}
          <div className="space-y-4">
            {selectedPlan.workouts.map((workout) => (
              <UnifiedWorkoutCard
              key={workout.instance_id}
              workout={workout}
              onEdit={canEdit ? () => {
                setEditingWorkout(workout);
                setShowWorkoutForm(true);
              } : undefined}
              onDelete={canEdit ? () => handleDeleteWorkoutLocal(workout.instance_id) : undefined}
              onDuplicate={canEdit ? () => handleDuplicateWorkoutLocal(workout.instance_id) : undefined}
              inProgram={true}
              onDayChange={canEdit ? (newDay) => handleDayChangeLocal(workout.instance_id, newDay) : undefined}
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
        </>
      )}

      {/* Add Choice Modal */}
      <AddWorkoutChoiceModal
        isOpen={showAddChoice}
        onClose={() => setShowAddChoice(false)}
        onSelectExisting={() => setShowTemplateSelector(true)}
        onCreateNew={() => setShowWorkoutForm(true)}
      />

      {/* Template Selector */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <TemplateSelector
              templates={workoutTemplates}
              onSelect={handleTemplateSelect}
              onCancel={() => setShowTemplateSelector(false)}
              currentProgramWorkouts={selectedPlan.workouts}
              onError={setError}
            />
          </div>
        </div>
      )}

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
        />
      )}
    </div>
  );
};

export default PlanDetailView;

