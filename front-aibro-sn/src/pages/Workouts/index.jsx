import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  Calendar, 
  Dumbbell,
  Plus,
  Loader2
} from 'lucide-react';
import { ProgramCard } from './components/ProgramCard';
import EmptyState from './components/EmptyState';
import WorkoutLogCard from './components/WorkoutLogCard';
import WorkoutTimeline from './components/WorkoutTimeline';
import WorkoutWizard from './components/workout-wizard/WorkoutWizard';
import { LogWorkoutModal, WorkoutInstanceSelector } from './components/LogWorkoutModal';
import { POST_TYPE_COLORS } from './../../utils/postTypeUtils';
import ShareProgramModal from './components/ShareProgramModal';
import AllWorkoutLogsView from './views/AllWorkoutLogsView';
import EnhancedCreatePlanView from './views/EnhancedCreatePlanView';
import PlanDetailView from './views/PlanDetailView';
import EnhancedAllWorkoutsView from './views/EnhancedAllWorkoutsView';
import PlansListView from './views/PlansListView';

// Import React Query hooks
import { usePrograms, useProgram, useCreateProgram, useUpdateProgram, useDeleteProgram, 
  useToggleProgramActive, useAddWorkoutToProgram, useUpdateProgramWorkout, 
  useRemoveWorkoutFromProgram, useForkProgram } from '../../hooks/query/useProgramQuery';
import { useWorkoutTemplates } from '../../hooks/query/useWorkoutQuery';
import { useLogs, useCreateLog, useUpdateLog, useDeleteLog } from '../../hooks/query/useLogQuery';
import { useCurrentUser } from '../../hooks/query/useUserQuery';
import { useQueryClient } from '@tanstack/react-query';

// Import centralized API services
import { programService, logService } from '../../api/services';

const workoutColors = POST_TYPE_COLORS.workout_log;

const WorkoutSpace = () => {
  const queryClient = useQueryClient();
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [view, setView] = useState('main');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [programToShare, setProgramToShare] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  
  // Modal state for workout templates and next workouts
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  // State for workout log modal (past workouts)
  const [showWorkoutLogModal, setShowWorkoutLogModal] = useState(false);
  
  // Use React Query hooks
  const { data: currentUser } = useCurrentUser();
  const { data: workoutPlans = [], isLoading: plansLoading, error: plansError, refetch: refreshPlans } = usePrograms();
  const { data: templates = [], isLoading: templatesLoading, error: templatesError } = useWorkoutTemplates();
  const { data: logs = [], isLoading: logsLoading, error: logsError, refetch: refreshLogs } = useLogs();
  
  // Get the active program
  const activeProgram = workoutPlans.find(plan => plan.is_active);
  
  // Calculate next workout based on active program
  const nextWorkout = activeProgram?.workouts?.length
    ? programService.getNextWorkout(activeProgram)
    : null;
  
  // Mutations
  const createPlanMutation = useCreateProgram();
  const updatePlanMutation = useUpdateProgram();
  const deletePlanMutation = useDeleteProgram();
  const toggleActiveMutation = useToggleProgramActive();
  const addWorkoutMutation = useAddWorkoutToProgram();
  const updateWorkoutMutation = useUpdateProgramWorkout(); 
  const removeWorkoutMutation = useRemoveWorkoutFromProgram();
  const createLogMutation = useCreateLog();
  const updateLogMutation = useUpdateLog();
  const deleteLogMutation = useDeleteLog();
  const forkProgramMutation = useForkProgram();

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
      const newPlan = await createPlanMutation.mutateAsync(planData);
      setView('main');
      return newPlan;
    } catch (err) {
      console.error('Error creating plan:', err);
      throw err;
    }
  };
  
  const handleAddWorkout = async (planId, templateId, weekday) => {
    try {
      await addWorkoutMutation.mutateAsync({ programId: planId, templateId, weekday });
      // Fetch updated plan
      const updatedPlan = await programService.getProgramById(planId);
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      }
    } catch (err) {
      console.error('Error adding workout:', err);
      throw err;
    }
  };

  const handleTogglePlanActive = async (planId) => {
    if (isTogglingActive) return;
    
    try {
      setIsTogglingActive(true);
      await toggleActiveMutation.mutateAsync(planId);
    } catch (err) {
      console.error('Error toggling plan active status:', err);
    } finally {
      setIsTogglingActive(false);
    }
  };

  const handleShareProgram = (program) => {
    setProgramToShare(program);
    setShowShareModal(true);
  };

  const handleForkProgram = async (program) => {
    try {
      if (window.confirm(`Do you want to fork "${program.name}" by ${program.creator_username}?`)) {
        await forkProgramMutation.mutateAsync(program.id);
      }
    } catch (err) {
      console.error('Error forking program:', err);
      alert('Failed to fork program. Please try again.');
    }
  };

  // Handle viewing the next/upcoming workout
  const handleViewNextWorkout = () => {
    if (nextWorkout) {
      setSelectedWorkout(nextWorkout);
      setShowWorkoutModal(true);
    }
  };

  // Handle viewing a past workout log
  const handleViewWorkoutLog = (log) => {
    setSelectedLog(log);
    setShowWorkoutLogModal(true);
  };

  const handleLogWorkout = async (formData) => {
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
        await updateLogMutation.mutateAsync({ id: selectedLog.id, logData: updateData });
      } else {
        await createLogMutation.mutateAsync(preparedData);
      }
      
      setShowLogForm(false);
      setSelectedLog(null);
    } catch (err) {
      console.error('Error saving log:', err);
      alert(`Error saving workout log: ${err.response?.data?.detail || err.message}`);
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
          deletePlan={(planId) => deletePlanMutation.mutate(planId)}
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
          onCreateTemplate={(template) => createTemplateMutation.mutate(template)}
          onUpdateTemplate={(id, updates) => updateTemplateMutation.mutate({ id, updates })}
          onDeleteTemplate={(id) => deleteTemplateMutation.mutate(id)}
          setView={setView}
        />
      </div>
    );
  }
  
  if (view === 'plan-detail') {
    if (!selectedPlan) return null;
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <PlanDetailView
          plan={workoutPlans.find(p => p.id === selectedPlan.id) || selectedPlan}
          templates={templates.results || templates}
          onBack={() => {
            setSelectedPlan(null);
            setView('main');
          }}
          onUpdate={async (planId, updates) => {
            await updatePlanMutation.mutateAsync({ id: planId, updates });
            const updatedPlan = await programService.getProgramById(planId);
            if (updatedPlan) {
              setSelectedPlan(updatedPlan);
            }
          }}
          onDelete={(planId) => deletePlanMutation.mutate(planId)}
          onAddWorkout={handleAddWorkout}
          onUpdateWorkout={async (planId, workoutId, updates) => {
            await updateWorkoutMutation.mutateAsync({ programId: planId, workoutId, updates });
            const updatedPlan = await programService.getProgramById(planId);
            if (updatedPlan) {
              setSelectedPlan(updatedPlan);
            }
          }}
          onRemoveWorkout={async (planId, workoutId) => {
            await removeWorkoutMutation.mutateAsync({ programId: planId, workoutId });
            const updatedPlan = await programService.getProgramById(planId);
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
            
            <p className="mt-4 text-lg text-gray-300 max-w-3xl">
              Track your progress, create custom workout templates, manage training programs, and log your fitness journey all in one place.
            </p>
            
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
                onDelete={(planId) => deletePlanMutation.mutate(planId)}
                onToggleActive={handleTogglePlanActive}
                onShare={handleShareProgram}
                onFork={handleForkProgram}
                singleColumn={true}
                onEdit={(plan) => {
                  setSelectedPlan(plan);
                  setView('plan-detail');
                }}
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
        {/* Use the updated WorkoutTimeline component with separate handlers for logs and upcoming workouts */}
        <WorkoutTimeline
          logs={logs}
          nextWorkout={nextWorkout}
          logsLoading={logsLoading}
          plansLoading={plansLoading}
          activeProgram={activeProgram}
          setSelectedWorkout={handleViewWorkoutLog} // For past logs - sets selectedLog and shows log modal
          setShowWorkoutModal={setShowWorkoutLogModal} // For past logs - shows the log modal
          setSelectedLog={setSelectedLog}
          setShowLogForm={setShowLogForm}
          handleViewNextWorkout={handleViewNextWorkout} // For upcoming workouts
        />
        
        {/* Large centered Log Workout button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              setSelectedLog(null);
              setShowLogModal(true);
            }}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl 
                     hover:from-blue-500 hover:to-purple-500 transition-all duration-300 
                     shadow-lg hover:shadow-blue-600/30 flex items-center gap-3 transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-white/20 rounded-full p-1 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg relative z-10">Log Workout</span>
          </button>
        </div>
      </div>
      
      {/* Modals */}
      {showLogForm && (
        <WorkoutWizard
          log={selectedLog}
          programs={workoutPlans}
          onSubmit={handleLogWorkout}
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
    </div>
  );
};

export default WorkoutSpace;