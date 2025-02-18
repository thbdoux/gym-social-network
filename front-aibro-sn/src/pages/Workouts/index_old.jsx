import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutPlans } from './hooks/useWorkoutPlans';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useWorkoutLogs } from './hooks/useWorkoutLogs';
import ErrorAlert from '../../components/common/ErrorAlert';

// Import views
import LogsView from './views/LogsView';
import LogDetailView from './views/LogDetailView';
import PlansListView from './views/PlansListView';
import CreatePlanView from './views/CreatePlanView';
import PlanDetailView from './views/PlanDetailView';
import AllWorkoutsView from './views/AllWorkoutsView';

const WorkoutsPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState('logs');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState('');

  // Custom hooks with updated functionality
  const {
    workoutPlans,
    loading: plansLoading,
    error: plansError,
    createPlan,
    updatePlan,
    deletePlan,
    addWorkoutToPlan,
    updateWorkoutInstance,
    removeWorkoutFromPlan,
    refreshPlans
  } = useWorkoutPlans();

  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates
  } = useWorkoutTemplates();

  const {
    workoutLogs,
    isLoading: logsLoading,
    error: logsError,
    createLogFromInstance,
    createCustomLog,
    updateLog,
    refreshLogs
  } = useWorkoutLogs();

  const handlePlanSelect = async (plan) => {
    try {
      setSelectedPlan(plan);
      setView('plan-detail');
    } catch (err) {
      console.error('Error loading plan details:', err);
      setError('Failed to load plan details');
    }
  };
  
  const handleRefreshPlan = async (planId) => {
    try {
      const updatedPlan = await refreshPlans(); // This should be from your useWorkoutPlans hook
      const refreshedPlan = workoutPlans.find(p => p.id === planId);
      if (refreshedPlan) {
        setSelectedPlan(refreshedPlan);
      }
    } catch (err) {
      console.error('Error refreshing plan:', err);
      setError('Failed to refresh plan details');
    }
  };

  const handleLogSelect = (log) => {
    setSelectedLog(log);
    setView('log-detail');
  };

  const handleLogWorkout = async (instanceId, additionalData = {}) => {
    try {
      const newLog = await createLogFromInstance(instanceId, additionalData);
      setSelectedLog(newLog);
      setView('log-detail');
    } catch (err) {
      console.error('Error creating workout log:', err);
      setError('Failed to create workout log');
    }
  };

  const handleCustomLog = async (logData) => {
    try {
      const newLog = await createCustomLog(logData);
      setSelectedLog(newLog);
      setView('log-detail');
    } catch (err) {
      console.error('Error creating custom log:', err);
      setError('Failed to create custom workout log');
    }
  };

  const handleLogUpdate = async (updatedLog) => {
    try {
      await updateLog(updatedLog.id, updatedLog);
      await refreshLogs();
      setError('');
    } catch (err) {
      setError('Failed to update workout log');
    }
  };

  const handleCreatePlan = async (planData) => {
    try {
      const newPlan = await createPlan(planData);
      setSelectedPlan(newPlan);
      setView('plan-detail');
      return newPlan; // Return the new plan for the CreatePlanView to know it succeeded
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('Failed to create workout plan');
      throw err; // Rethrow so CreatePlanView can handle it
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
        return;
      }
      await deletePlan(planId);
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
        setView('plans');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete workout plan');
    }
  };
  
  

  const handleUpdatePlan = async (planId, updates) => {
    try {
      const updatedPlan = await updatePlan(planId, updates);
      setSelectedPlan(updatedPlan);
      await refreshPlans();
    } catch (err) {
      setError('Failed to update workout plan');
    }
  };

  useEffect(() => {
    if (view === 'all-workouts') {
      refreshTemplates();
    }
  }, [view]);

  const renderView = () => {
    switch (view) {
      case 'logs':
        return (
          <LogsView
            workoutLogs={workoutLogs}
            workoutPlans={workoutPlans}
            isLoading={logsLoading}
            onLogSelect={handleLogSelect}
            onViewWorkouts={() => setView('all-workouts')}
            onViewPrograms={() => setView('plans')}
            onPlanSelect={handlePlanSelect}
            onCreateLogFromInstance={handleLogWorkout}
            onCreateCustomLog={handleCustomLog}
          />
        );

      case 'log-detail':
        return (
          <LogDetailView
            log={selectedLog}
            onBack={() => setView('logs')}
            onUpdate={handleLogUpdate}
          />
        );

      case 'plans':
        return (
          <PlansListView
            workoutPlans={workoutPlans}
            isLoading={plansLoading}
            onPlanSelect={handlePlanSelect}
            setView={setView}
            user={user}
            deletePlan={deletePlan}
            onCreatePlan={handleCreatePlan}
          />
        );

      case 'plan-detail':
        return (
          <PlanDetailView
          plan={selectedPlan}
          templates={templates}
          onBack={() => setView('plans')}
          onUpdate={handleUpdatePlan}
          onDelete={deletePlan}
          onAddWorkout={addWorkoutToPlan}
          onUpdateWorkout={updateWorkoutInstance}
          onRemoveWorkout={removeWorkoutFromPlan}
          user={user}
          onRefreshPlan={handleRefreshPlan}  // Add this prop
        />
        );

      case 'all-workouts':
        return (
          <AllWorkoutsView
            workoutTemplates={templates || []}  // Ensure we pass an empty array if undefined
            isLoading={templatesLoading}
            onCreateTemplate={createTemplate}
            onUpdateTemplate={updateTemplate}
            onDeleteTemplate={deleteTemplate}
            setView={setView}
          />
        );
      
      case 'create-plan':
        return (
          <CreatePlanView
          onCreatePlan={handleCreatePlan}  // Pass the handler function
          onCancel={() => setView('plans')}
          workoutTemplates={templates}
          onError={setError}   // Pass error handler
        />
        );

      default:
        return null;
    }
  };

  // Combine all errors
  const combinedError = error || plansError || templatesError || logsError;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {combinedError && (
        <ErrorAlert 
          message={combinedError} 
          onClose={() => setError('')} 
        />
      )}
      {renderView()}
    </div>
  );
};

export default WorkoutsPage;
