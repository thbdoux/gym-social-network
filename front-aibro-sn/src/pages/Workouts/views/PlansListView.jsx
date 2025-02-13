import React from 'react';
import { Plus, LayoutGrid } from 'lucide-react';
import WorkoutPlansGrid from '../components/cards/WorkoutPlansGrid';
import { FilterBar } from '../components/layout/FilterBar';
import EmptyState from '../components/layout/EmptyState';

const PlansListView = ({
  workoutPlans,
  onPlanSelect,
  setView,
  user,
  deletePlan,
  togglePlanActive,
}) => {
  // Check if there are any workout plans
  const hasPlans = workoutPlans.length > 0;

  // Filter active and completed plans
  const activePlans = workoutPlans.filter(plan => plan.is_active);
  const completedPlans = workoutPlans.filter(plan => !plan.is_active);

  // Calculate some stats for the header
  const totalWorkouts = workoutPlans.reduce((acc, plan) => acc + (plan.workouts?.length || 0), 0);
  const averageSessionsPerWeek = workoutPlans.reduce((acc, plan) => acc + (plan.sessions_per_week || 0), 0) / workoutPlans.length || 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">Your Programs</h1>
          {hasPlans && (
            <p className="text-gray-400 mt-1">
              {workoutPlans.length} programs • {totalWorkouts} total workouts • 
              {averageSessionsPerWeek.toFixed(1)} avg. sessions/week
            </p>
          )}
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setView && setView('all-workouts')}  // Add null check
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                     transition-colors flex items-center space-x-2"
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Workout Templates</span>
          </button>
          <button
            onClick={() => setView && setView('create-plan')}  // Add null check
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                     transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Program</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Active Plans Section */}
      {hasPlans ? (
            <div className="space-y-4">
              <WorkoutPlansGrid
                plans={workoutPlans}
                onSelect={onPlanSelect}
                onDelete={deletePlan}
                onToggleActive={togglePlanActive}
                currentUser={user}
              />
            </div>
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
    </div>
  );
};

export default PlansListView;