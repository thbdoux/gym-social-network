import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Calendar, 
  Dumbbell,
  Plus,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { ProgramCard } from './components/ProgramCard';
import EmptyState from './components/EmptyState';
import { useWorkoutPlans } from './hooks/useWorkoutPlans';
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';
import { useWorkoutLogs } from './hooks/useWorkoutLogs';
import WorkoutLogCard from './components/WorkoutLogCard';
import NextWorkout from './components/NextWorkout';
import WorkoutWizard from './components/workout-wizard/WorkoutWizard';
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
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
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
          user={currentUser?.username}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Title and Navigation */}
          <div className="lg:col-span-7">
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
              Your Fitness Journey
            </h1>
            
            {/* Navigation buttons - Updated order and colors */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button 
                onClick={() => setView('all-workouts')}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors flex items-center space-x-2 shadow-md"
              >
                <LayoutGrid className="w-5 h-5 text-white" />
                <span className="text-white">Templates</span>
              </button>
              
              <button 
                onClick={() => setView('plans')}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors flex items-center space-x-2 shadow-md"
              >
                <Dumbbell className="w-5 h-5 text-white" />
                <span className="text-white">Programs</span>
              </button>
              
              <button 
                onClick={() => setView('logs')}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg transition-colors flex items-center space-x-2 shadow-md"
              >
                <Calendar className="w-5 h-5 text-white" />
                <span className="text-white">Workout History</span>
              </button>
              
              <button 
                onClick={() => {
                  setSelectedLog(null);
                  setShowLogModal(true);
                }}
                className={`px-4 py-2 ${workoutColors.bg} hover:${workoutColors.hoverBg} rounded-lg transition-colors flex items-center space-x-2 shadow-md`}
              >
                <Plus className="w-5 h-5" />
                <span className={workoutColors.text}>Log</span>
              </button>
            </div>
          </div>
          
          {/* Right Column: Current Program - Adjusted column ratio */}
          <div className="lg:col-span-5">
            {plansLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : activeProgram ? (
              <ProgramCard
                program={activeProgram}
                currentUser={currentUser?.username}
                canManage={true}
                onProgramSelect={handlePlanSelect}
                onDelete={deletePlan}
                onToggleActive={handleTogglePlanActive}
                onShare={handleShareProgram}
                onFork={handleForkProgram}
                singleColumn={true}
                canEdit
                compact={true}
              />
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No active program"
                  description="Set up a program"
                  action={{
                    label: 'Browse Programs',
                    onClick: () => setView('plans')
                  }}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Full-width Timeline */}
        <div className="relative p-6">
          {(logsLoading || plansLoading) ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : (nextWorkout || logs.length > 0) ? (
            <div className="relative">
              {/* Horizontal timeline line - Removed border */}
              <div className="absolute left-0 right-0 top-6 h-0.5 bg-gray-700"></div>
              
              <div className="flex flex-col lg:flex-row items-start mt-16 lg:mt-0 space-y-8 lg:space-y-0 lg:space-x-6">
                {/* Next Workout - Left side with future indicator */}
                {nextWorkout && (
                  <div className="lg:w-1/4 relative">
                    {/* Timeline dot and label - Fixed z-index and positioning */}
                    <div className="absolute left-1/2 lg:left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                      <div className="w-4 h-4 rounded-full bg-blue-500 shadow-md"></div>
                      <div className="mt-2 text-blue-400 text-sm font-medium whitespace-nowrap">
                        Coming up on {nextWorkout.preferred_weekday !== undefined ? 
                          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][nextWorkout.preferred_weekday] : 
                          'soon'}
                      </div>
                      {/* Vertical connector line - Made more visible */}
                      <div className="w-0.5 h-16 bg-blue-700 mt-2"></div>
                    </div>
                    
                    {/* Upcoming workout card - Using the same style as past workout cards */}
                    <div className="mt-20 lg:mt-16" onClick={handleViewNextWorkout}>
                      <div className="bg-gray-800 border border-blue-700/30 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-500/50">
                        {/* Status Indicator Line - Blue for upcoming workout */}
                        <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                        
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">{nextWorkout.name}</h3>
                            <div className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded-full">
                              Upcoming
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <span className="flex items-center text-sm text-gray-400">
                              <TrendingUp className="w-4 h-4 mr-1 text-blue-400" />
                              {nextWorkout.exercises?.length || 0} exercises
                            </span>
                            
                            {activeProgram && (
                              <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded-full">
                                {activeProgram.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Today marker - Center point of timeline */}
                <div className={`${nextWorkout ? 'lg:w-1/12' : 'lg:w-1/6'} hidden lg:block relative`}>
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                    <div className="w-4 h-4 rounded-full bg-gray-500 shadow-md"></div>
                    <div className="mt-2 text-gray-400 text-sm font-medium">Today</div>
                  </div>
                </div>
                
                {/* Past Workouts - Right side */}
                <div className={`${nextWorkout ? 'lg:w-8/12' : 'lg:w-5/6'} relative`}>
                  {logs.length > 0 ? (
                    <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
                      {logs.slice(0, 3).map((log, index) => {
                        // Calculate relative date label
                        let logDate;
                        try {
                          // Handle French date format (DD/MM/YYYY)
                          if (log.date.includes('/')) {
                            const parts = log.date.split('/');
                            if (parts.length === 3) {
                              // Day/Month/Year format
                              logDate = new Date(parts[2], parts[1] - 1, parts[0]);
                            } else {
                              logDate = new Date(log.date);
                            }
                          } else {
                            // Standard ISO format
                            logDate = new Date(log.date);
                          }
                        } catch (e) {
                          // Fallback if parsing fails
                          logDate = new Date();
                        }
                        
                        const today = new Date();
                        
                        // Reset time parts to compare dates properly
                        today.setHours(0, 0, 0, 0);
                        logDate.setHours(0, 0, 0, 0);
                        
                        // Simple difference in days calculation
                        const diffMs = today.getTime() - logDate.getTime();
                        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
                        
                        let dateLabel = "Today";
                        if (diffDays === 1) dateLabel = "Yesterday";
                        else if (diffDays > 1) dateLabel = `${diffDays} days ago`;
                        else if (diffDays === -1) dateLabel = "Tomorrow";
                        else if (diffDays < -1) dateLabel = `In ${Math.abs(diffDays)} days`;
                        
                        // Get mood emoji
                        const getMoodEmoji = (rating) => {
                          switch(rating) {
                            case 1: return "😞";
                            case 2: return "😕";
                            case 3: return "😐";
                            case 4: return "🙂";
                            case 5: return "😄";
                            default: return "🙂";
                          }
                        };
                        
                        return (
                          <div key={log.id} className="relative">
                            {/* Timeline dot and date label - Fixed z-index and positioning */}
                            <div className="absolute left-1/2 lg:left-1/2 transform -translate-x-1/2 top-0 lg:-top-10 flex flex-col items-center z-20">
                              <div className="w-3 h-3 rounded-full bg-green-500 shadow-md"></div>
                              <div className="mt-2 text-green-400 text-sm font-medium whitespace-nowrap">{dateLabel}</div>
                              {/* Vertical connector line - Made more visible */}
                              <div className="w-0.5 h-16 bg-green-700 mt-2"></div>
                            </div>
                            
                            {/* Simplified Workout Card */}
                            <div className="mt-20 lg:mt-16">
                              <div 
                                className="bg-gray-800 border border-green-700/30 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-green-500/50"
                                onClick={() => {
                                  setSelectedWorkout(log);
                                  setShowWorkoutModal(true);
                                }}
                              >
                                {/* Status Indicator Line - Green for completed workout */}
                                <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-600"></div>
                                
                                <div className="p-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-white">{log.workout_name}</h3>
                                    <div className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded-full">
                                      {getMoodEmoji(log.rating || 4)}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3 flex items-center justify-between">
                                    <span className="flex items-center text-sm text-gray-400">
                                      <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
                                      {log.exercises?.length || 0} exercises
                                    </span>
                                    
                                    {log.program_name && (
                                      <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded-full">
                                        {log.program_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-12">
                      <EmptyState
                        title="No workouts logged"
                        description="Log your first workout"
                        action={{
                          label: 'Log Workout',
                          onClick: () => {
                            setSelectedLog(null); 
                            setShowLogForm(true);
                          }
                        }}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <EmptyState
                title="No workout history"
                description="Start your fitness journey by logging a workout or setting up a program"
                action={{
                  label: 'Get Started',
                  onClick: () => {
                    setSelectedLog(null); 
                    setShowLogForm(true);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Modals - Keep all the existing modals */}
      {showLogForm && (
        <WorkoutWizard
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

      {showShareModal && programToShare && (
        <ShareProgramModal 
          program={programToShare}
          onClose={() => {
            setShowShareModal(false);
            setProgramToShare(null);
          }}
        />
      )}

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