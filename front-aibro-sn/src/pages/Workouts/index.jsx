import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutPlans } from './hooks/useWorkoutPlans';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import ErrorAlert from '../../components/common/ErrorAlert';

// Import views
import PlansListView from './views/PlansListView';
import CreatePlanView from './views/CreatePlanView';
import PlanDetailView from './views/PlanDetailView';
import AllWorkoutsView from './views/AllWorkoutsView';

const WorkoutsPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');

  const {
    workoutPlans,
    createPlan,
    deletePlan,
    togglePlanActive,
    refreshPlanData
  } = useWorkoutPlans();

  const {
    workoutTemplates,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    handleDayChange,
    handleDuplicateWorkout,
  } = useWorkoutTemplates();

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    setView('plan-detail');
    try {
      const updatedPlan = await refreshPlanData(plan.id);
      
      setSelectedPlan(updatedPlan); // Make sure to update with fresh data
    } catch (err) {
      console.error('Error refreshing plan:', err);
      setError('Failed to load plan details');
    }
  };

  const viewProps = {
    user,
    setView,
    setError,
    workoutPlans,
    workoutTemplates,
    selectedPlan,
    setSelectedPlan,
    createPlan,
    deletePlan,
    togglePlanActive,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refreshPlanData,
    handleDayChange,
    handleDuplicateWorkout
  };

  const renderView = () => {
    switch (view) {
      case 'plans':
        return (
          <PlansListView
            {...viewProps}
            onPlanSelect={handlePlanSelect}
          />
        );

      case 'plan-detail':
        return <PlanDetailView {...viewProps} />;

      case 'all-workouts':
        return <AllWorkoutsView {...viewProps} />;

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {error && <ErrorAlert message={error} onClose={() => setError('')} />}
      {renderView()}
    </div>
  );
};

export default WorkoutsPage;