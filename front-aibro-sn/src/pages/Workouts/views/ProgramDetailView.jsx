import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, ChevronDown, Users, Share2, Calendar, ArrowUpRight, Clock, AlertCircle, Dumbbell } from 'lucide-react';
import EnhancedWorkoutCard from '../components/EnhancedWorkoutCard';
import TemplateSelector from '../components/TemplateSelector';
import ProgramWizard from '../components/program-wizard/ProgramWizard';
import TemplateWizard from '../components/workout-wizard/TemplateWizard';
import WeeklyCalendar from '../components/WeeklyCalendar';

// Import Language Context
import { useLanguage } from '../../../context/LanguageContext';

// Import React Query hooks
import { 
  useProgram, 
  useUpdateProgramWorkout, 
  useRemoveWorkoutFromProgram,
  useAddWorkoutToProgram,
  useToggleProgramActive 
} from '../../../hooks/query/useProgramQuery';
import { 
  useCreateWorkoutTemplate 
} from '../../../hooks/query/useWorkoutQuery';

const ProgramDetailView = ({
  plan,
  templates,
  onBack,
  onUpdate,
  onDelete,
  onAddWorkout,
  onUpdateWorkout,
  onRemoveWorkout,
  user,
}) => {
  // Get translation function from language context
  const { t } = useLanguage();
  
  const [error, setError] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showProgramWizard, setShowProgramWizard] = useState(false);
  const [workoutBeingEdited, setWorkoutBeingEdited] = useState(null);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // For mobile view filtering
  const [loadingState, setLoadingState] = useState(false);
  const [programData, setProgramData] = useState(plan); // Local state to store program data

  // React Query hooks
  const { data: currentProgramData, refetch: refetchProgram } = useProgram(plan?.id, {
    // Only fetch when initially mounted or manually triggered
    enabled: !!plan?.id,
    // Disable automatic refetching on window focus to prevent unnecessary API calls
    refetchOnWindowFocus: false,
    // Prevent this query from automatically re-running
    staleTime: Infinity
  });
  
  const updateWorkoutMutation = useUpdateProgramWorkout();
  const removeWorkoutMutation = useRemoveWorkoutFromProgram();
  const createTemplateMutation = useCreateWorkoutTemplate();
  const addWorkoutMutation = useAddWorkoutToProgram();
  const toggleProgramActiveMutation = useToggleProgramActive();

  // Update local state when plan or currentProgramData changes
  useEffect(() => {
    if (plan) {
      setProgramData(plan);
    }
  }, [plan]);

  useEffect(() => {
    if (currentProgramData) {
      setProgramData(currentProgramData);
    }
  }, [currentProgramData]);

  // Check if user has edit permissions
  const canEdit = user && programData && (user.username === programData.creator_username || user.is_staff);

  useEffect(() => {
    // Reset selected day whenever plan changes
    setSelectedDay(null);
  }, [programData?.id]);

  if (!programData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-t-blue-500 border-gray-700 animate-spin"></div>
      </div>
    );
  }

  const getLatestWorkoutData = (workoutId) => {
    return programData.workouts.find(w => w.id === workoutId);
  };

  const refreshPlans = async () => {
    try {
      if (loadingState) return;
      setLoadingState(true);
      const refreshedProgram = await refetchProgram();
      if (refreshedProgram.data) {
        setProgramData(refreshedProgram.data);
      }
    } catch (error) {
      console.error('Error refreshing plan data:', error);
    } finally {
      setLoadingState(false);
    }
  };

  const handleDayChange = async (workoutId, newDay) => {
    try {
      setLoadingState(true);
      const result = await updateWorkoutMutation.mutateAsync({
        programId: programData.id,
        workoutId,
        updates: {
          preferred_weekday: newDay
        }
      });
      
      // Update local state immediately with the change
      setProgramData(prevData => ({
        ...prevData,
        workouts: prevData.workouts.map(workout => 
          workout.id === workoutId 
            ? { ...workout, preferred_weekday: newDay } 
            : workout
        )
      }));
      
      // Still refresh to ensure consistent state
      await refreshPlans();
    } catch (err) {
      console.error('Error updating workout day:', err);
      setError(t('failed_update_workout_day'));
    } finally {
      setLoadingState(false);
    }
  };

  const handleCreateNewWorkout = async (workoutData) => {
    try {
      setLoadingState(true);
      const templateData = {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method,
        difficulty_level: workoutData.difficulty_level,
        estimated_duration: workoutData.estimated_duration,
        equipment_required: workoutData.equipment_required || [],
        tags: workoutData.tags || [],
        is_public: workoutData.is_public !== false,
        exercises: workoutData.exercises || []
      };

      const newTemplate = await createTemplateMutation.mutateAsync(templateData);
      
      // Use React Query mutation to add workout
      const result = await addWorkoutMutation.mutateAsync({
        programId: programData.id,
        templateId: newTemplate.id,
        weekday: workoutData.preferred_weekday || 0
      });
      
      // Refresh to get the new workout included
      await refreshPlans();
      
      setShowCreateWorkout(false);
    } catch (err) {
      console.error('Error creating workout:', err);
      setError(err.response?.data?.detail || t('failed_create_workout'));
    } finally {
      setLoadingState(false);
    }
  };

  const handleEditWorkout = (workout) => {
    const latestWorkout = getLatestWorkoutData(workout.id);
    setWorkoutBeingEdited(latestWorkout);
  };
  
  const handleWorkoutUpdate = async (updatedWorkout) => {
    try {
      setLoadingState(true);
      await onUpdateWorkout(programData.id, updatedWorkout.id, updatedWorkout);
      
      // Update local state immediately
      setProgramData(prevData => ({
        ...prevData,
        workouts: prevData.workouts.map(workout => 
          workout.id === updatedWorkout.id ? updatedWorkout : workout
        )
      }));
      
      setWorkoutBeingEdited(null);
      await refreshPlans();
    } catch (err) {
      setError(t('failed_update_workout'));
    } finally {
      setLoadingState(false);
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm(t('confirm_remove_workout'))) {
      return;
    }
    try {
      setLoadingState(true);
      await removeWorkoutMutation.mutateAsync({
        programId: programData.id,
        workoutId
      });
      
      // Update local state immediately
      setProgramData(prevData => ({
        ...prevData,
        workouts: prevData.workouts.filter(workout => workout.id !== workoutId)
      }));
      
      // Refresh to ensure consistent state
      await refreshPlans();
    } catch (err) {
      setError(t('failed_remove_workout'));
    } finally {
      setLoadingState(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!window.confirm(t('confirm_delete_program'))) {
      return;
    }
    try {
      setLoadingState(true);
      await onDelete(programData.id);
      onBack();
    } catch (err) {
      setError(t('failed_delete_program'));
    } finally {
      setLoadingState(false);
    }
  };

  const handleTemplateSelect = async (templateId, weekday) => {
    try {
      setLoadingState(true);
      
      // Use React Query mutation to add workout
      await addWorkoutMutation.mutateAsync({
        programId: programData.id,
        templateId,
        weekday
      });
      
      await refreshPlans();
      setShowTemplateSelector(false);
    } catch (err) {
      setError(t('failed_add_workout'));
    } finally {
      setLoadingState(false);
    }
  };

  const handleUpdateProgram = async (updatedData) => {
    try {
      setLoadingState(true);
      const result = await onUpdate(programData.id, updatedData);
      
      // Update local state immediately
      if (result) {
        setProgramData(prevData => ({
          ...prevData,
          ...updatedData
        }));
      }
      
      setShowProgramWizard(false);
      await refreshPlans();
    } catch (err) {
      setError(t('failed_update_program'));
    } finally {
      setLoadingState(false);
    }
  };

  // Weekly calendar days
  const WEEKDAYS = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];
  
  // Group workouts by day
  const workoutsByDay = WEEKDAYS.map((day, index) => ({
    day,
    dayIndex: index,
    workouts: programData.workouts.filter(w => w.preferred_weekday === index)
  }));
  
  // Days with workouts for mobile view
  const daysWithWorkouts = workoutsByDay.filter(day => day.workouts.length > 0);

  // Get currently displayed workouts based on selected day (mobile) or all (desktop)
  const getDisplayedWorkouts = () => {
    if (selectedDay !== null) {
      return workoutsByDay[selectedDay].workouts;
    }
    // For desktop, return all workouts
    return programData.workouts;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Minimalist header with nav, title and actions in one line */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-gray-900 py-2">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors mr-2"
            disabled={loadingState}
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{programData.name}</h1>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowProgramWizard(true)}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors text-blue-400"
              disabled={loadingState}
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteProgram}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors text-red-400"
              disabled={loadingState}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Program info with calendar inline */}
      <div className="relative">
        {loadingState && (
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
            <div className="w-10 h-10 rounded-full border-4 border-t-blue-500 border-gray-700 animate-spin"></div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-full md:w-1/3">
            
            {/* Program card with animated gradient border */}
            <div className="mt-4 p-5 rounded-2xl bg-gray-800/30 border border-gray-700/50 relative overflow-hidden group">
              {/* Subtle animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500">{t('focus')}</span>
                    <span className="capitalize text-white">{t(programData.focus.replace(/_/g, ''))}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500">{t('frequency')}</span>
                    <span className="text-white">{programData.sessions_per_week}x {t('per_week')}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500">{t('creator')}</span>
                    <div className="flex items-center">
                      <span className="text-blue-400 mr-2">{programData.creator_username}</span>
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500">{t('level')}</span>
                    <span className="capitalize text-white">{t(programData.difficulty_level)}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500">{t('duration')}</span>
                    <div className="flex items-center">
                      <span className="text-white mr-2">{programData.estimated_completion_weeks} {t('weeks')}</span>
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500">{t('workouts')}</span>
                    <span className="text-white">{programData.workouts.length} {t('total')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Weekly schedule visualization */}
          <div className="w-full md:w-2/3">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4">
              <h2 className="flex items-center mb-4 text-lg font-semibold text-white">
                <Calendar className="w-4 h-4 mr-2 text-blue-400" />
                {t('weekly_schedule')}
              </h2>
              
              {/* Use the WeeklyCalendar component with drag-and-drop functionality */}
              <WeeklyCalendar 
                workouts={programData.workouts} 
                onDayChange={canEdit ? handleDayChange : undefined}
              />
            </div>
            
            {/* Mobile day selector (visible only on small screens) */}
            <div className="block md:hidden mt-4">
              <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-400">
                    {selectedDay !== null ? `${WEEKDAYS[selectedDay]} ${t('workouts')}` : t('all_workouts')}
                  </h3>
                  
                  <div className="relative">
                    <select 
                      value={selectedDay === null ? "" : selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value === "" ? null : Number(e.target.value))}
                      className="appearance-none bg-gray-800 border border-gray-700 rounded-lg py-1.5 pl-3 pr-8 text-sm text-white focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">{t('all_days')}</option>
                      {daysWithWorkouts.map((day) => (
                        <option key={day.dayIndex} value={day.dayIndex}>
                          {day.day} ({day.workouts.length})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message - only shown when needed */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Workouts Container */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Dumbbell className="w-5 h-5 mr-2 text-blue-400" />
            {selectedDay !== null ? `${WEEKDAYS[selectedDay]} ${t('workouts')}` : t('all_workouts')}
          </h2>
          {canEdit && (
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
              disabled={loadingState}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="text-sm">{t('add')}</span>
            </button>
          )}
        </div>

        {getDisplayedWorkouts().length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getDisplayedWorkouts().map((workout) => (
              <EnhancedWorkoutCard
                key={workout.id}
                workout={workout}
                onDelete={canEdit ? () => handleDeleteWorkout(workout.id) : undefined}
                onDayChange={canEdit ? (newDay) => handleDayChange(workout.id, newDay) : undefined}
                onEdit={canEdit ? () => handleEditWorkout(workout) : undefined}
                inProgram={true}
                className="transform transition-all hover:scale-102 hover:shadow-lg hover:shadow-blue-900/20"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-gray-800/30 rounded-xl border border-dashed border-gray-700/50 
                         transition-all hover:bg-gray-800/40">
            {selectedDay !== null ? (
              <div className="space-y-3">
                <p className="text-gray-400">{t('no_workouts_for_day', { day: WEEKDAYS[selectedDay] })}</p>
                {canEdit && (
                  <button
                    onClick={() => setShowTemplateSelector(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('add_workout')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex p-3 rounded-full bg-gray-800 mx-auto">
                  <Dumbbell className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-400">{t('no_workouts_added')}</p>
                {canEdit && (
                  <button
                    onClick={() => setShowTemplateSelector(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('add_workout')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700/50">
            <TemplateSelector
              templates={templates}
              onSelect={handleTemplateSelect}
              onCreateNew={() => {
                setShowTemplateSelector(false);
                setShowCreateWorkout(true);
              }}
              onBack={() => setShowTemplateSelector(false)}
              currentProgramWorkouts={programData.workouts}
            />
          </div>
        </div>
      )}

      {/* Create New Workout Modal */}
      {showCreateWorkout && (
        <TemplateWizard
          onSubmit={handleCreateNewWorkout}
          onClose={() => {
            setShowCreateWorkout(false);
            setShowTemplateSelector(true);
          }}
          inProgram={true}
          selectedPlan={programData}
        />
      )}

      {/* Program Edit Wizard */}
      {showProgramWizard && (
        <ProgramWizard
          program={programData}
          onSubmit={handleUpdateProgram}
          onClose={() => setShowProgramWizard(false)}
        />
      )}

      {/* Edit Workout Modal - Full page */}
      {workoutBeingEdited && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50">
            <TemplateWizard
              template={workoutBeingEdited}
              onSubmit={handleWorkoutUpdate}
              onClose={() => setWorkoutBeingEdited(null)}
              inProgram={true}
              selectedPlan={programData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramDetailView;