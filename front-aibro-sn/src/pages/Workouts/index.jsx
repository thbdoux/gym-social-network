// pages/WorkoutsPage.jsx
import React, { useState } from 'react';
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

  // Custom hooks
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

  const {
    workoutLogs,
    isLoading: logsLoading,
    error: logsError,
    createLogFromInstance,
    updateLog,
    refreshLogs
  } = useWorkoutLogs();

  const handlePlanSelect = async (plan) => {
    try {
      console.log("Handling plan selection:", plan);
      const updatedPlan = await refreshPlanData(plan.id);
      setSelectedPlan(updatedPlan);
      setView('plan-detail');
    } catch (err) {
      console.error('Error loading plan details:', err);
      setError('Failed to load plan details');
    }
  };

  const handleLogSelect = (log) => {
    setSelectedLog(log);
    setView('log-detail');
  };

  const handleLogWorkout = async (instanceId) => {
    try {
      const newLog = await createLogFromInstance(instanceId);
      setSelectedLog(newLog);
      setView('log-detail');
    } catch (err) {
      console.error('Error creating workout log:', err);
      setError('Failed to create workout log');
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

  const renderView = () => {
    switch (view) {
      case 'logs':
        return (
          <LogsView
        workoutLogs={workoutLogs}
        workoutPlans={workoutPlans}
        isLoading={logsLoading}
        onLogSelect={(log) => {
          setSelectedLog(log);
          setView('log-detail');
        }}
        onViewWorkouts={() => setView('all-workouts')}
        onViewPrograms={() => setView('plans')}
        onPlanSelect={handlePlanSelect}
        onCreateLogFromInstance={handleLogWorkout}
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
            onPlanSelect={handlePlanSelect}
            setView={setView}
            user={user}
            deletePlan={deletePlan}
            togglePlanActive={togglePlanActive}
          />
        );

        case 'plan-detail':
          return (
            <PlanDetailView
              selectedPlan={selectedPlan}
              setView={setView}
              setSelectedPlan={setSelectedPlan}
              refreshPlanData={refreshPlanData}
              createWorkout={createWorkout}
              updateWorkout={updateWorkout}
              deleteWorkout={deleteWorkout}
              handleDayChange={handleDayChange}
              handleDuplicateWorkout={handleDuplicateWorkout}
              setError={setError}
              user={user}
              workoutTemplates={workoutTemplates}
            />
          );

      case 'all-workouts':
        return (
          <AllWorkoutsView
            workoutTemplates={workoutTemplates}
            onCreateWorkout={createWorkout}
            onUpdateWorkout={updateWorkout}
            onDeleteWorkout={deleteWorkout}
            setView={setView}
          />
        );
      
      case 'create-plan':
        return (
          <CreatePlanView
            onCreatePlan={createPlan}
            onCancel={() => setView('plans')}
            workoutTemplates={workoutTemplates}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {(error || logsError) && (
        <ErrorAlert 
          message={error || logsError} 
          onClose={() => setError('')} 
        />
      )}
      {renderView()}
    </div>
  );
};

export default WorkoutsPage;