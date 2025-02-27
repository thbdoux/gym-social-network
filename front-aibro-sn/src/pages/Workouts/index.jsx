import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Calendar, 
  Activity, 
  Target, 
  Loader2,
  LayoutGrid,
  BarChart2,
  Clock,
  Filter
} from 'lucide-react';
import WorkoutPlansGrid from './components/WorkoutPlansGrid';
import EmptyState from './components/EmptyState';
import PlansListView from './views/PlansListView';
import PlanDetailView from './views/PlanDetailView';
import AllWorkoutLogsView from './views/AllWorkoutLogsView';
import AllWorkoutsView from './views/AllWorkoutsView';
import CreatePlanView from './views/CreatePlanView';
import { useWorkoutPlans } from './hooks/useWorkoutPlans';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useWorkoutLogs } from './hooks/useWorkoutLogs';
import WorkoutLogCard from './components/WorkoutLogCard';
import NextWorkout from './components/NextWorkout';
import WorkoutLogForm from './components/WorkoutLogForm';
import { LogWorkoutModal, WorkoutInstanceSelector } from './components/LogWorkoutModal';

import api from './../../api';

const QuickStats = ({ stats = {} }) => {
  const weeklyWorkouts = stats.weeklyWorkouts || 0;
  const totalWorkouts = stats.totalWorkouts || 0;
  const streak = stats.streak || 0;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-6 shadow-lg overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full -ml-12 -mb-12"></div>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-blue-400" />
          Quick Stats
        </h2>
        <span className="text-sm text-gray-400 px-3 py-1 bg-gray-700/50 rounded-full">This Week</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700/40 p-4 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Week</div>
          <div className="text-2xl font-bold text-white">{weeklyWorkouts}</div>
          <div className="text-xs text-gray-400 mt-1">workouts</div>
        </div>
        
        <div className="bg-gray-700/40 p-4 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Total</div>
          <div className="text-2xl font-bold text-white">{totalWorkouts}</div>
          <div className="text-xs text-gray-400 mt-1">workouts</div>
        </div>
        
        <div className="bg-gray-700/40 p-4 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Streak</div>
          <div className="text-2xl font-bold text-white">{streak}</div>
          <div className="text-xs text-gray-400 mt-1">days</div>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    <span className="ml-2 text-gray-400">Loading...</span>
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center">
    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mr-3">
      <span className="text-red-400 font-bold">!</span>
    </div>
    <p>{message}</p>
  </div>
);

const WorkoutSpace = ({ user }) => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [view, setView] = useState('main');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('week'); // 'week', 'month', 'all'

  const [showShareModal, setShowShareModal] = useState(false);
  const [programToShare, setProgramToShare] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/users/me/');
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
  
  // Get only the most recent logs for the preview
  const recentLogs = logs.slice(0, 4);

  // Calculate next workout
  const nextWorkout = logs.find(log => !log.completed);

  const [selectedPlan, setSelectedPlan] = useState(null);

  // Calculate stats for the quick stats component
  const calculateStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = logs.filter(log => 
      new Date(log.date) >= oneWeekAgo && log.completed
    ).length;
    
    const totalWorkouts = logs.filter(log => log.completed).length;
    
    // Calculate streak (simplified)
    let streak = 0;
    const dayMap = {};
    
    // Map logs to days
    logs.forEach(log => {
      if (log.completed) {
        const dateStr = new Date(log.date).toDateString();
        dayMap[dateStr] = true;
      }
    });
    
    // Count streak (not entirely accurate, just for the demo)
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toDateString();
      
      if (dayMap[checkDateStr]) {
        streak++;
      } else if (i < 7) { // Only break streak if within last week
        break;
      }
    }
    
    return { weeklyWorkouts, totalWorkouts, streak };
  };

  const stats = calculateStats();

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    setView('plan-detail');
  };

  const handleTogglePlanActive = async (planId) => {
    try {
      await api.post(`/workouts/programs/${planId}/toggle_active/`);
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

  const handleShareProgram = (program) => {
    setProgramToShare(program);
    setShowShareModal(true);
  };

  // New function to handle program forking
  const handleForkProgram = async (program) => {
    try {
      if (window.confirm(`Do you want to fork "${program.name}" by ${program.creator_username}?`)) {
        const response = await api.post(`/workouts/programs/${program.id}/fork/`);
        await refreshPlans();
        // Select the newly forked program
        handlePlanSelect(response.data);
      }
    } catch (err) {
      console.error('Error forking program:', err);
      alert('Failed to fork program. Please try again.');
    }
  };

  const handleAddWorkout = async (planId, templateId, weekday) => {
    try {
      await addWorkoutToPlan(planId, templateId, weekday);
      const updatedPlans = await refreshPlans();
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
  
  // Add state for all logs view
  const [showAllLogs, setShowAllLogs] = useState(false);
  
  if (showAllLogs) {
    return (
      <AllWorkoutLogsView 
        onBack={() => setShowAllLogs(false)}
        activeProgram={activeProgram}
      />
    );
  }

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
            togglePlanActive={handleTogglePlanActive}
            onShareProgram={handleShareProgram}
            onForkProgram={handleForkProgram}
          />
          
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
          onAddWorkout={handleAddWorkout}
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
          <div className="min-h-screen bg-gray-900 text-white">
            {/* Hero header */}
            <div className="bg-gradient-to-b from-indigo-900/30 to-gray-900 border-b border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-4xl font-extrabold text-white mb-2">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Workout Space
                  </span>
                </h1>
                <p className="text-gray-300 text-lg max-w-3xl">
                  Track your progress, log your workouts, and stay motivated on your fitness journey.
                </p>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Active Program + Quick Stats */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Active Program */}
                  <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700/30 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/10 rounded-full"></div>
                    
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white">Active Program</h2>
                      <button 
                        onClick={() => setView('plans')}
                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-1 text-sm"
                      >
                        <span>All Programs</span>
                        <ChevronRight className="w-4 h-4" />
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

                  {/* Quick Stats */}
                  <QuickStats stats={stats} />
                  
                  {/* Next Workout Section - Now separated from logs */}
                  <NextWorkout workout={nextWorkout} />
                  
                  {/* Templates Section */}
                  <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700/30">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <LayoutGrid className="w-5 h-5 mr-2 text-purple-400" />
                        Templates
                      </h2>
                      <button 
                        onClick={() => setView('all-workouts')}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 text-sm"
                      >
                        <span>View All</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-gray-300 text-sm">
                      {templatesLoading ? (
                        <LoadingSpinner />
                      ) : templates.length > 0 ? (
                        <div className="space-y-3">
                          {templates.slice(0, 3).map((template) => (
                            <div key={template.id} className="p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                              <p className="font-medium text-white">{template.name}</p>
                              <div className="flex items-center mt-1 text-xs text-gray-400 space-x-3">
                                <span>{template.split_method?.replace(/_/g, ' ')}</span>
                                <span>•</span>
                                <span>{template.exercises?.length || 0} exercises</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Create your first workout template to get started.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Workout Logs */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700/30 overflow-hidden">
                    {/* Header with filter */}
                    <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Workout Logs</h2>
                        <p className="text-gray-400 text-sm mt-1">Track and monitor your fitness progress</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="hidden sm:flex bg-gray-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setFilterPeriod('week')}
                            className={`px-3 py-1.5 text-sm ${filterPeriod === 'week' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                          >
                            Week
                          </button>
                          <button
                            onClick={() => setFilterPeriod('month')}
                            className={`px-3 py-1.5 text-sm ${filterPeriod === 'month' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                          >
                            Month
                          </button>
                          <button
                            onClick={() => setFilterPeriod('all')}
                            className={`px-3 py-1.5 text-sm ${filterPeriod === 'all' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                          >
                            All
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => setShowLogModal(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 shadow-md"
                        >
                          <Plus className="w-5 h-5" />
                          <span>Log Workout</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* List with filters */}
                    <div className="p-6">                      
                      <div className="space-y-4">
                        {logsLoading ? (
                          <LoadingSpinner />
                        ) : recentLogs.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recentLogs.map((log, index) => (
                              <WorkoutLogCard
                                key={log.id || `log-${index}`}
                                log={log}
                                onEdit={(log) => {
                                  setSelectedLog(log);
                                  setShowLogForm(true);
                                }}
                                onDelete={async (log) => {
                                  if (window.confirm('Are you sure you want to delete this workout log?')) {
                                    try {
                                      await api.delete(`/workouts/logs/${log.id}/`);
                                      await refreshLogs();
                                    } catch (err) {
                                      console.error('Error deleting log:', err);
                                    }
                                  }
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            title="No workout logs yet"
                            description="Start logging your workouts to track your progress"
                            action={{
                              label: 'Log First Workout',
                              onClick: () => {
                                setSelectedLog(null); 
                                setShowLogForm(true);
                              }
                            }}
                          />
                        )}
                      </div>
                    
                      {/* View All Logs Button - Prominent */}
                      {recentLogs.length > 0 && (
                        <div className="mt-8 flex justify-center">
                          <button 
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center space-x-2 shadow-md"
                            onClick={() => setShowAllLogs(true)}
                          >
                            <span>View All Workout Logs</span>
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Instance Selector Modal */}
            {showInstanceSelector && (
              <WorkoutInstanceSelector
                onClose={() => setShowInstanceSelector(false)}
                onSelect={(workout) => {
                  setShowInstanceSelector(false);
                  setSelectedLog({
                    name: workout.name || 'Workout Log',
                    based_on_instance: workout.id,
                    program: activeProgram.id,
                    exercises: workout.exercises?.map(ex => ({
                      ...ex,
                      sets: ex.sets?.map(set => ({
                        ...set,
                        id: Math.floor(Date.now() + Math.random() * 1000)
                      }))
                    })) || []
                  });
                  setShowLogForm(true);
                }}
                activeProgram={activeProgram}
              />
            )}

            {/* Log Workout Form */}
            {showLogForm && (
              <WorkoutLogForm
                log={selectedLog}
                programs={workoutPlans}
                onSubmit={async (formData) => {
                  try {
                    console.log("Form submission data:", formData);
    
                    // Ensure based_on_instance and program are proper integers, not strings
                    const preparedData = {
                      ...formData,
                      based_on_instance: formData.based_on_instance ? 
                        (typeof formData.based_on_instance === 'string' ? 
                          parseInt(formData.based_on_instance, 10) : formData.based_on_instance) : 
                        null,
                      program: formData.program ? 
                        (typeof formData.program === 'string' ? 
                          parseInt(formData.program, 10) : formData.program) : 
                        null
                    };
                    
                    console.log("Prepared data for API:", preparedData);
                    if (selectedLog?.id) {
                      const updateData = {
                        ...preparedData,
                        exercises: preparedData.exercises.map(exercise => ({
                          ...exercise,
                          id: exercise.id,
                          sets: exercise.sets.map(set => ({
                            ...set,
                            id: set.id,
                          }))
                        }))
                      };
                      console.log("Update data:", updateData);
                      await updateLog(selectedLog.id, updateData);
                    } else {
                      console.log("Create data:", preparedData);
                      await createLog(preparedData);
                    }
                    
                    setShowLogForm(false);
                    setSelectedLog(null);
                    await refreshLogs();
                  } catch (err) {
                    console.error('Error saving log:', err);
                    // Display error to user
                    alert(`Error saving workout log: ${err.response?.data?.detail || err.message}`);
                  }
                }}
                
                onClose={() => {
                  setShowLogForm(false);
                  setSelectedLog(null);
                }}
              />
            )}
            
            {/* Log Workout Modal */}
            {showLogModal && (
              <LogWorkoutModal
                onClose={() => setShowLogModal(false)}
                onNewLog={() => {
                  setShowLogModal(false);
                  setSelectedLog(null);
                  setShowLogForm(true);
                }}
                onLogFromInstance={() => {
                  setShowLogModal(false);
                  setShowInstanceSelector(true);
                }}
                activeProgram={activeProgram}
              />
            )}
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
  }
};

export default WorkoutSpace;