// Updated PlansListView.jsx
import React, { useState } from 'react';
import { Plus, LayoutGrid, ArrowLeft } from 'lucide-react';
import WorkoutPlansGrid from '../components/WorkoutPlansGrid';
import EmptyState from '../components/EmptyState';
import ShareProgramModal from '../components/ShareProgramModal';
import api from '../../../api';

const PlansListView = ({
  workoutPlans,
  onPlanSelect,
  setView,
  user,
  deletePlan,
  togglePlanActive,
}) => {
  // State for share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [programToShare, setProgramToShare] = useState(null);
  
  // Check if there are any workout plans
  const hasPlans = workoutPlans.length > 0;

  // Calculate some stats for the header
  const totalWorkouts = workoutPlans.reduce((acc, plan) => acc + (plan.workouts?.length || 0), 0);
  const averageSessionsPerWeek = workoutPlans.reduce((acc, plan) => acc + (plan.sessions_per_week || 0), 0) / workoutPlans.length || 0;

  const handleDeletePlan = async (planId) => {
    try {
      await deletePlan(planId);
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const handleToggleActive = async (planId) => {
    try {
      await togglePlanActive(planId);
    } catch (err) {
      console.error('Error toggling plan active state:', err);
    }
  };

  const handleShareProgram = (program) => {
    setProgramToShare(program);
    setShowShareModal(true);
  };

  const handleForkProgram = async (program) => {
    try {
      if (window.confirm(`Do you want to fork "${program.name}" by ${program.creator_username}?`)) {
        const response = await api.post(`/workouts/programs/${program.id}/fork/`);
        // Redirect to the newly forked program
        onPlanSelect(response.data);
      }
    } catch (err) {
      console.error('Error forking program:', err);
      alert('Failed to fork program. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => setView('main')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to Workout Logs"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">Your Programs</h1>
          </div>
          {hasPlans && (
            <p className="text-gray-400 mt-1">
              {workoutPlans.length} programs • {totalWorkouts} total workouts • 
              {averageSessionsPerWeek.toFixed(1)} avg. sessions/week
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setView('all-workouts')}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                     transition-colors flex items-center space-x-2"
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Workout Templates</span>
          </button>
          <button
            onClick={() => setView('create-plan')}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                     transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Program</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {hasPlans ? (
        <WorkoutPlansGrid
          plans={workoutPlans}
          onSelect={onPlanSelect}
          onDelete={handleDeletePlan}
          onToggleActive={handleToggleActive}
          onCreatePlan={() => setView('create-plan')}
          onShare={handleShareProgram}
          onFork={handleForkProgram}
          currentUser={user?.username}
        />
      ) : (
        <EmptyState
          title="No workout plans yet"
          description="Create your first workout plan to start tracking your fitness journey"
          action={{
            label: 'Create Workout Plan',
            onClick: () => setView('create-plan')
          }}
        />
      )}

      {/* Share Program Modal */}
      {showShareModal && programToShare && (
        <ShareProgramModal 
          program={programToShare}
          onClose={() => {
            setShowShareModal(false);
            setProgramToShare(null);
          }}
        />
      )}
    </div>
  );
};

export default PlansListView;