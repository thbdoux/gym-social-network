import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Calendar, Activity, Target, Loader2 } from 'lucide-react';
import WorkoutPlansGrid from './components/WorkoutPlansGrid';
import EmptyState from './components/EmptyState';
import PlansListView from './views/PlansListView';
import PlanDetailView from './views/PlanDetailView';
import AllWorkoutsView from './views/AllWorkoutsView';
import CreatePlanView from './views/CreatePlanView';
import { useWorkoutPlans } from './hooks/useWorkoutPlans';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useWorkoutLogs } from './hooks/useWorkoutLogs';
import WorkoutLogCard from './components/WorkoutLogCard';
import WorkoutLogForm from './components/WorkoutLogForm';
import api from './../../api';

const QuickStats = () => (
  <div className="bg-gray-800 rounded-xl p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-white">Quick Stats</h2>
      <span className="text-sm text-gray-400">This Week</span>
    </div>
    
    <div className="grid grid-cols-2 gap-6">
      <div>
        <span className="text-gray-400 text-sm">Week</span>
        <div className="flex items-baseline mt-1">
          <span className="text-3xl font-bold text-white">1</span>
          <span className="text-gray-400 ml-2">workouts</span>
        </div>
      </div>
      
      <div>
        <span className="text-gray-400 text-sm">Total</span>
        <div className="flex items-baseline mt-1">
          <span className="text-3xl font-bold text-white">1</span>
          <span className="text-gray-400 ml-2">workouts</span>
        </div>
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
    <p>{message}</p>
  </div>
);

const WorkoutSpace = ({ user }) => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [view, setView] = useState('main');
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/users/me/');  // Adjust this endpoint based on your API
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  const {
    workoutPlans,
    loading: plansLoading,
    error: plansError,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans,
    addWorkoutToPlan,
    updateWorkoutInstance,
    removeWorkoutFromPlan
  } = useWorkoutPlans();

  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useWorkoutTemplates();

  // Get the active program
  const activeProgram = workoutPlans.find(plan => plan.is_active);

  const {
    logs,
    loading: logsLoading,
    error: logsError,
    createLog,
    updateLog,
    refreshLogs
  } = useWorkoutLogs(activeProgram);
  // Get only the 3 most recent logs for the preview
  const recentLogs = logs.slice(0, 3);

  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    setView('plan-detail');
  };

  const handleTogglePlanActive = async (planId) => {
    try {
      // Call the API to toggle the active status
      await api.post(`/workouts/programs/${planId}/toggle_active/`);
      
      // Refresh the plans to get the updated data
      await refreshPlans();
    } catch (err) {
      console.error('Error toggling plan active status:', err);
      throw err;
    }
  };

  const handleCreatePlan = async (planData) => {
    try {
      const newPlan = await createPlan(planData);
      await refreshPlans();
      setView('main');
      return newPlan;
    } catch (err) {
      console.error('Error creating plan:', err);
      throw err;
    }
  };

  const handleAddWorkout = async (planId, templateId, weekday) => {
    try {
      await addWorkoutToPlan(planId, templateId, weekday);
      // After adding a workout, get the fresh plan data
      const updatedPlans = await refreshPlans();
      // Update the selected plan with the fresh data
      const updatedPlan = updatedPlans.find(p => p.id === planId);
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      }
    } catch (err) {
      console.error('Error adding workout:', err);
      throw err;
    }
  };

  const handleUpdateWorkout = async (planId, instanceId, updates) => {
    try {
      await updateWorkoutInstance(planId, instanceId, updates);
      await refreshPlans();
    } catch (err) {
      console.error('Error updating workout:', err);
      throw err;
    }
  };

  const handleRemoveWorkout = async (planId, instanceId) => {
    try {
      await removeWorkoutFromPlan(planId, instanceId);
      await refreshPlans();
    } catch (err) {
      console.error('Error removing workout:', err);
      throw err;
    }
  };

  if (plansError || templatesError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <ErrorMessage message={plansError || templatesError} />
      </div>
    );
  }

  switch (view) {
    case 'plans':
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <PlansListView
            workoutPlans={workoutPlans}
            isLoading={plansLoading}
            onPlanSelect={handlePlanSelect}
            setView={setView}
            user={currentUser}
            deletePlan={deletePlan}
            onCreatePlan={handleCreatePlan}
            togglePlanActive = {handleTogglePlanActive}
          />
        </div>
      );

    case 'plan-detail':
      if (!selectedPlan) return null;
      return (
        <PlanDetailView
        plan={workoutPlans.find(p => p.id === selectedPlan.id) || selectedPlan}
        templates={templates.results || templates}
        onBack={() => {
          setSelectedPlan(null);
          setView('main');
        }}
        onUpdate={async (planId, updates) => {
          await updatePlan(planId, updates);
          const updatedPlans = await refreshPlans();
          const updatedPlan = updatedPlans.find(p => p.id === planId);
          if (updatedPlan) {
            setSelectedPlan(updatedPlan);
          }
        }}
        onDelete={deletePlan}
        onAddWorkout={async (planId, templateId, weekday) => {
          await addWorkoutToPlan(planId, templateId, weekday);
          const updatedPlans = await refreshPlans();
          const updatedPlan = updatedPlans.find(p => p.id === planId);
          if (updatedPlan) {
            setSelectedPlan(updatedPlan);
          }
        }}
        onUpdateWorkout={async (planId, workoutId, updates) => {
          await updateWorkoutInstance(planId, workoutId, updates);
          const updatedPlans = await refreshPlans();
          const updatedPlan = updatedPlans.find(p => p.id === planId);
          if (updatedPlan) {
            setSelectedPlan(updatedPlan);
          }
        }}
        onRemoveWorkout={async (planId, workoutId) => {
          await removeWorkoutFromPlan(planId, workoutId);
          const updatedPlans = await refreshPlans();
          const updatedPlan = updatedPlans.find(p => p.id === planId);
          if (updatedPlan) {
            setSelectedPlan(updatedPlan);
          }
        }}
        user={currentUser}
      />
  );

    case 'all-workouts':
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <AllWorkoutsView
            workoutTemplates={templates}
            isLoading={templatesLoading}
            onCreateTemplate={createTemplate}
            onUpdateTemplate={updateTemplate}
            onDeleteTemplate={deleteTemplate}
            setView={setView}
          />
        </div>
      );

    case 'create-plan':
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
          <CreatePlanView
            onCreatePlan={handleCreatePlan}
            onCancel={() => setView('plans')}
            onError={(error) => console.error('Create plan error:', error)}
            workoutTemplates={templates}
          />
        </div>
      );

    default:
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">Workout Space</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Workout Logs Section */}
                <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Workout Logs</h2>
                    <button 
                        onClick={() => setShowLogForm(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Log Workout</span>
                    </button>
                    </div>
                    
                    <div className="space-y-4">
                    {logsLoading ? (
                        <LoadingSpinner />
                    ) : recentLogs.length > 0 ? (
                        recentLogs.map((log, index) => (
                        <WorkoutLogCard
                            key={log.id || `pending-${index}`}
                            log={log}
                            onEdit={(log) => {
                            setSelectedLog(log);
                            setShowLogForm(true);
                            }}
                            onDelete={async (log) => {
                            if (window.confirm('Are you sure you want to delete this workout log?')) {
                                try {
                                // TODO: Implement delete log API call
                                await api.delete(`/workouts/logs/${log.id}/`);
                                await refreshLogs();
                                } catch (err) {
                                console.error('Error deleting log:', err);
                                }
                            }
                            }}
                        />
                        ))
                    ) : (
                        <EmptyState
                        title="No workout logs yet"
                        description="Start logging your workouts to track your progress"
                        action={{
                            label: 'Log First Workout',
                            onClick: () => {
                            setSelectedLog(null); // Explicitly set to null for new log
                            setShowLogForm(true);
                            }
                        }}
                        />
                    )}
                    </div>

                    {showLogForm && (
                    <WorkoutLogForm
                        log={selectedLog}
                        programs={workoutPlans}
                        onSubmit={async (formData) => {
                            try {
                                if (selectedLog?.id) {
                                // Edit existing log
                                await updateLog(selectedLog.id, formData);
                                } else if (selectedLog?.based_on_instance) {
                                // Log from program instance
                                await createLog({
                                    ...formData,
                                    instance_id: selectedLog.based_on_instance
                                });
                                } else {
                                // Create new custom log
                                await createLog(formData);
                                }
                                setShowLogForm(false);
                                setSelectedLog(null);
                                await refreshLogs();
                            } catch (err) {
                            console.error('Error saving log:', err);
                        }
                        }}
                        onClose={() => {
                        setShowLogForm(false);
                        setSelectedLog(null);
                        }}
                    />
                    )}
                    
                    <button className="w-full mt-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <span>View All Logs</span>
                    <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                {/* Active Programs Section */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Active Programs</h2>
                    <button 
                        onClick={() => setView('plans')}
                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1"
                    >
                        <span>View All</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    </div>
                    
                    {plansLoading ? (
                    <LoadingSpinner />
                    ) : activeProgram ? (
                        <div className="mx-[-1rem]">
                        <WorkoutPlansGrid
                        plans={[activeProgram]}
                        onSelect={handlePlanSelect}
                        onDelete={deletePlan}
                        hideActions={true}
                        singleColumn={true}
                        onToggleActive={handleTogglePlanActive}
                        />
                    </div>
                    ) : (
                    <EmptyState
                        title="No active program"
                        description="Select or create a program to start your fitness journey"
                        action={{
                        label: 'Browse Programs',
                        onClick: () => setView('plans')
                        }}
                    />
                    )}
                </div>

                {/* Quick Stats Section */}
                <QuickStats />
                </div>
            </div>
            </div>
        );
    };
}

export default WorkoutSpace;