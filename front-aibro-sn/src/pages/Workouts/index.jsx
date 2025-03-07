import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Activity, 
  Target, 
  Loader2,
  LayoutGrid,
  BarChart2,
  Clock,
  Plus,
  ChevronRight,
  Dumbbell,
  Search
} from 'lucide-react';
import WorkoutPlansGrid from './components/WorkoutPlansGrid';
import EmptyState from './components/EmptyState';
import { useWorkoutPlans } from './hooks/useWorkoutPlans';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useWorkoutLogs } from './hooks/useWorkoutLogs';
import WorkoutLogCard from './components/WorkoutLogCard';
import NextWorkout from './components/NextWorkout';
import WorkoutLogForm from './components/WorkoutLogForm';
import { LogWorkoutModal, WorkoutInstanceSelector } from './components/LogWorkoutModal';
import { POST_TYPE_COLORS } from './../../utils/postTypeUtils';
import ShareProgramModal from './components/ShareProgramModal';
import ExpandableWorkoutModal from './components/ExpandableWorkoutModal';
import AllWorkoutLogsView from './views/AllWorkoutLogsView';
import EnhancedCreatePlanView from './views/EnhancedCreatePlanView';
import EnhancedPlanDetailView from './views/EnhancedPlanDetailView';
import EnhancedAllWorkoutsView from './views/EnhancedAllWorkoutsView';
import PlansListView from './views/PlansListView';
// Import centralized API services
import { programService, logService } from '../../api/services';

const workoutColors = POST_TYPE_COLORS.workout_log;

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

const TemplatePreview = ({ templates, onViewAll }) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <LayoutGrid className="w-5 h-5 mr-2 text-purple-400" />
          Templates
        </h2>
        <button 
          onClick={onViewAll}
          className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 text-sm"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="text-gray-300 text-sm">
        {templates.length === 0 ? (
          <p>Create your first workout template to get started.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
};

const WorkoutSpace = () => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [view, setView] = useState('main');
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [programToShare, setProgramToShare] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Use our API client directly for this one-off call
        const response = await programService.getCurrentUser();
        setCurrentUser(response);
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
    deleteLog,
    refreshLogs,
    nextWorkout
  } = useWorkoutLogs(activeProgram);
  
  // Filter logs by search query - Using logService filter utility
  const filteredLogs = logService.filterLogs(logs, searchQuery);

  const handlePlanSelect = async (plan) => {
    if (!plan.is_owner && !plan.program_shares?.length && plan.forked_from === null) {
      console.error('Unauthorized access attempt to plan:', plan.id);
      alert('You do not have permission to view this program.');
      return;
    }
    
    try {
      const programData = await programService.getProgramById(plan.id);
      setSelectedPlan(programData);
      setView('plan-detail');
    } catch (err) {
      console.error('Error accessing plan:', err);
      alert('You do not have permission to view this program.');
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

  const handleTogglePlanActive = async (planId) => {
    try {
      await programService.toggleProgramActive(planId);
      await refreshPlans();
    } catch (err) {
      console.error('Error toggling plan active status:', err);
    }
  };

  const handleShareProgram = (program) => {
    setProgramToShare(program);
    setShowShareModal(true);
  };

  const handleForkProgram = async (program) => {
    try {
      if (window.confirm(`Do you want to fork "${program.name}" by ${program.creator_username}?`)) {
        await programService.forkProgram(program.id);
        await refreshPlans();
      }
    } catch (err) {
      console.error('Error forking program:', err);
      alert('Failed to fork program. Please try again.');
    }
  };

  // Use logService utility to calculate stats
  const stats = logService.calculateStats(logs);

  const handleViewNextWorkout = () => {
    if (nextWorkout) {
      setSelectedWorkout(nextWorkout);
      setShowWorkoutModal(true);
    }
  };

  if (plansError || templatesError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {plansError || templatesError}
        </div>
      </div>
    );
  }

  if (view === 'logs') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <AllWorkoutLogsView 
          onBack={() => setView('main')}
          activeProgram={activeProgram}
          user = {currentUser?.username}
        />
      </div>
    );
  }

  if (view === 'plans') {
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
          onEditProgram={(plan) => {
            setSelectedPlan(plan);
            setView('plan-detail');
          }}
        />
        
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

  if (view === 'all-workouts') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <EnhancedAllWorkoutsView
          workoutTemplates={templates}
          isLoading={templatesLoading}
          onCreateTemplate={createTemplate}
          onUpdateTemplate={updateTemplate}
          onDeleteTemplate={deleteTemplate}
          setView={setView}
        />
      </div>
    );
  }
  
  if (view === 'plan-detail') {
    if (!selectedPlan) return null;
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <EnhancedPlanDetailView
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
      </div>
    );
  }
  
  if (view === 'create-plan') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <EnhancedCreatePlanView
          onCreatePlan={handleCreatePlan}
          onCancel={() => setView('plans')}
          onError={(error) => console.error('Create plan error:', error)}
          workoutTemplates={templates}
        />
      </div>
    );
  }
  
  if (view !== 'main') return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
          Tinker Your Fitness Routine
        </h1>
        <p className="mt-2 text-gray-400 max-w-3xl">
          Track your progress, customize your workouts, and reach your fitness goals.
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main content - Two-Column 50/50 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Workout Logs (50%) */}
          <div className="space-y-6">
            {/* Search and Log Button */}
            <div className="flex items-center gap-4 mb-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workout logs..."
                  className="pl-10 w-full bg-gray-800 border border-gray-700 rounded-lg py-2 text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button 
                onClick={() => {
                  setSelectedLog(null);
                  setShowLogModal(true);
                }}
                className={`px-4 py-2 ${workoutColors.bg} hover:${workoutColors.hoverBg} rounded-lg transition-colors flex items-center space-x-2 shadow-md border ${workoutColors.border}`}
              >
                <Plus className="w-5 h-5" />
                <span className={workoutColors.text}>Log Workout</span>
              </button>
            </div>
            
            {/* Workout Logs Section */}
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700/30 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Workout Logs</h2>
                  <p className="text-gray-400 text-sm mt-1">Track and monitor your fitness progress</p>
                </div>
                
                <div className="flex items-center">
                  <button 
                    onClick={() => setView('logs')}
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>View All Logs</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* List of workout logs */}
              <div className="p-6">                      
                <div className="space-y-4">
                  {logsLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <span className="ml-2 text-gray-400">Loading logs...</span>
                    </div>
                  ) : filteredLogs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredLogs.slice(0, 5).map((log) => (
                        <WorkoutLogCard
                          user = {currentUser?.username}
                          key={log.id}
                          log={log}
                          onEdit={(log) => {
                            setSelectedLog(log);
                            setShowLogForm(true);
                          }}
                          onDelete={async (log) => {
                            if (window.confirm('Are you sure you want to delete this workout log?')) {
                              try {
                                await deleteLog(log.id);
                                await refreshLogs();
                              } catch (err) {
                                console.error('Error deleting log:', err);
                              }
                            }
                          }}
                          inFeedMode = {false}
                          expandable = {true}
                          canEdit = {true}
                        />
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No workout logs found matching "{searchQuery}"</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-blue-400 hover:text-blue-300"
                      >
                        Clear search
                      </button>
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
              
                {/* View All Logs Button */}
                {filteredLogs.length > 5 && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center space-x-2 shadow-md"
                      onClick={() => setView('logs')}
                    >
                      <span>View All Workout Logs</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Stats */}
            <QuickStats stats={stats} />
          </div>

          {/* Right Column - Current Program & Next Workout (50%) */}
          <div className="space-y-6">
            {/* Current Program Section */}
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700/30 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Current Program</h2>
                  <p className="text-gray-400 text-sm mt-1">Your active training plan</p>
                </div>
                
                <button 
                  onClick={() => setView('plans')}
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>View All Programs</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6">
                {plansLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="ml-2 text-gray-400">Loading...</span>
                  </div>
                ) : activeProgram ? (
                  <WorkoutPlansGrid
                    plans={[activeProgram]}
                    onSelect={handlePlanSelect}
                    onDelete={deletePlan}
                    onToggleActive={handleTogglePlanActive}
                    onShare={handleShareProgram}
                    onFork={handleForkProgram}
                    currentUser={currentUser?.username}
                    singleColumn={true}
                  />
                ) : (
                  <EmptyState
                    title="No active program"
                    description="Select or create a program to get started"
                    action={{
                      label: 'Browse Programs',
                      onClick: () => setView('plans')
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Next Workout - Clickable */}
            <div onClick={handleViewNextWorkout} className="cursor-pointer">
              <NextWorkout workout={nextWorkout} />
            </div>
            
            {/* Templates Preview */}
            <TemplatePreview 
              templates={templates.slice(0, 3)} 
              onViewAll={() => setView('all-workouts')}
            />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {/* Log Workout Form */}
      {showLogForm && (
        <WorkoutLogForm
          log={selectedLog}
          programs={workoutPlans}
          onSubmit={async (formData) => {
            try {
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
                await updateLog(selectedLog.id, updateData);
              } else {
                await createLog(preparedData);
              }
              
              setShowLogForm(false);
              setSelectedLog(null);
              await refreshLogs();
            } catch (err) {
              console.error('Error saving log:', err);
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

      {/* Workout Detail Modal */}
      {showWorkoutModal && selectedWorkout && (
        <ExpandableWorkoutModal
          workoutId={selectedWorkout.id}
          initialWorkoutData={selectedWorkout}
          isOpen={showWorkoutModal}
          onClose={() => {
            setShowWorkoutModal(false);
            setSelectedWorkout(null);
          }}
          isTemplate={false}
        />
      )}
    </div>
  );
};

export default WorkoutSpace;