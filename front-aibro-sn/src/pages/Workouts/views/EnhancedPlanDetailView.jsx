import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Calendar, Users, Activity, Clock, Award, X } from 'lucide-react';
import WeeklyCalendar from '../components/WeeklyCalendar';
import EnhancedWorkoutCard from '../components/EnhancedWorkoutCard';
import ExpandableWorkoutModal from './../components/ExpandableWorkoutModal';
import TemplateSelector from '../components/TemplateSelector';
import EnhancedProgramForm from '../components/EnhancedProgramForm';
import EnhancedWorkoutForm from '../components/EnhancedWorkoutForm';
import api from './../../../api';

const EnhancedPlanDetailView = ({
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
  const [error, setError] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showEditProgram, setShowEditProgram] = useState(false);
  const [workoutBeingEdited, setWorkoutBeingEdited] = useState(null);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);

  // Check if user has edit permissions
  const canEdit = user && plan && (user.username === plan.creator_username || user.is_staff);

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading program details...</p>
      </div>
    );
  }

  const getLatestWorkoutData = (workoutId) => {
    return plan.workouts.find(w => w.id === workoutId);
  };

  const refreshPlans = async () => {
    try {
      const updatedPlan = await api.get(`/workouts/programs/${plan.id}/`);
      if (updatedPlan.data) {
        onUpdate(plan.id, updatedPlan.data);
      }
    } catch (error) {
      console.error('Error refreshing plan data:', error);
    }
  };

  const handleDayChange = async (workoutId, newDay) => {
    try {
      // 1. First, get the current workout data
      const currentWorkoutResponse = await api.get(`/workouts/programs/${plan.id}/workouts/${workoutId}/`);
      const currentWorkout = currentWorkoutResponse.data;
      
      // 2. Create a copy of the workout data with the new weekday
      const updatedWorkout = {
        ...currentWorkout,
        preferred_weekday: newDay
      };
      
      // 3. Send the entire workout data back with just the weekday changed
      const response = await api.put(
        `/workouts/programs/${plan.id}/workouts/${workoutId}/`,
        updatedWorkout,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      // 4. Refresh the plan data to update UI
      await refreshPlans();
    } catch (err) {
      console.error('Error updating workout day:', err);
      setError('Failed to update workout day');
    }
  };

  const handleCreateNewWorkout = async (workoutData) => {
    try {
      // First create the template
      const templateData = {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method,
        difficulty_level: workoutData.difficulty_level,
        estimated_duration: workoutData.estimated_duration,
        equipment_required: workoutData.equipment_required || [],
        tags: workoutData.tags || [],
        is_public: workoutData.is_public !== false
      };

      const response = await api.post('/workouts/templates/', templateData);
      const newTemplate = response.data;

      // Add exercises to the template if they exist
      if (workoutData.exercises?.length > 0) {
        for (const exercise of workoutData.exercises) {
          await api.post(`/workouts/templates/${newTemplate.id}/add_exercise/`, {
            name: exercise.name,
            equipment: exercise.equipment || '',
            notes: exercise.notes || '',
            order: exercise.order,
            sets: exercise.sets.map((set, idx) => ({
              reps: parseInt(set.reps),
              weight: parseFloat(set.weight),
              rest_time: parseInt(set.rest_time),
              order: idx
            }))
          });
        }
      }

      // Then add it to the program with the preferred weekday
      await onAddWorkout(plan.id, newTemplate.id, workoutData.preferred_weekday || 0);
      setShowCreateWorkout(false);
    } catch (err) {
      console.error('Error creating workout:', err);
      setError(err.response?.data?.detail || 'Failed to create new workout');
    }
  };

  const handleEditWorkout = (workout) => {
    // Get the latest version of the workout from the plan
    const latestWorkout = getLatestWorkoutData(workout.id);
    setWorkoutBeingEdited(latestWorkout);
  };
  
  const handleWorkoutUpdate = async (updatedWorkout) => {
    try {
      await onUpdateWorkout(plan.id, updatedWorkout.id, updatedWorkout);
      setWorkoutBeingEdited(null);
    } catch (err) {
      setError('Failed to update workout');
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Are you sure you want to remove this workout from the program?')) {
      return;
    }
    try {
      await onRemoveWorkout(plan.id, workoutId);
    } catch (err) {
      setError('Failed to remove workout from program');
    }
  };

  const handleDeleteProgram = async () => {
    if (!window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return;
    }
    try {
      await onDelete(plan.id);
      onBack();
    } catch (err) {
      setError('Failed to delete program');
    }
  };

  const handleTemplateSelect = async (templateId, weekday) => {
    try {
      await onAddWorkout(plan.id, templateId, weekday);
      setShowTemplateSelector(false);
    } catch (err) {
      setError('Failed to add workout to program');
    }
  };

  const handleUpdateProgram = async (updatedData) => {
    try {
      await onUpdate(plan.id, updatedData);
      setShowEditProgram(false);
    } catch (err) {
      setError('Failed to update program');
    }
  };

  // Get program focus icon
  const getFocusIcon = (focus) => {
    switch(focus) {
      case 'strength': return <Award className="w-4 h-4 text-red-400" />;
      case 'hypertrophy': return <Users className="w-4 h-4 text-purple-400" />;
      case 'endurance': return <Activity className="w-4 h-4 text-green-400" />;
      case 'weight_loss': return <Award className="w-4 h-4 text-blue-400" />;
      case 'strength_hypertrophy': return <Award className="w-4 h-4 text-indigo-400" />;
      default: return <Award className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{plan.name}</h1>
            <div className="flex items-center text-gray-400 mt-1">
              <span className="capitalize mr-3">{plan.focus.replace(/_/g, ' ')}</span>
              <span>•</span>
              <span className="mx-3">{plan.sessions_per_week}x per week</span>
              <span>•</span>
              <span className="mx-3 capitalize">{plan.difficulty_level}</span>
              <span>by {plan.creator_username}</span>
            </div>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowEditProgram(true)}
              className="p-2 hover:bg-blue-900/20 rounded-lg transition-colors text-blue-400"
              title="Edit program"
            >
              <Edit className="w-6 h-6" />
            </button>
            <button
              onClick={handleDeleteProgram}
              className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-red-400"
              title="Delete program"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Program Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center text-gray-400 mb-1 text-sm">
            <Activity className="w-4 h-4 mr-1 text-blue-400" />
            <span>Workouts</span>
          </div>
          <p className="text-white font-bold text-lg">
            {plan.workouts?.length || 0}
          </p>
        </div>
        
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center text-gray-400 mb-1 text-sm">
            <Calendar className="w-4 h-4 mr-1 text-purple-400" />
            <span>Duration</span>
          </div>
          <p className="text-white font-bold text-lg">
            {plan.estimated_completion_weeks}<span className="text-sm font-normal"> weeks</span>
          </p>
        </div>
        
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center text-gray-400 mb-1 text-sm">
            <Users className="w-4 h-4 mr-1 text-indigo-400" />
            <span>Focus</span>
          </div>
          <p className="text-white font-bold text-lg flex items-center">
            <span className="capitalize mr-1">{plan.focus.split('_')[0]}</span>
            {getFocusIcon(plan.focus)}
          </p>
        </div>
        
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center text-gray-400 mb-1 text-sm">
            <Award className="w-4 h-4 mr-1 text-red-400" />
            <span>Difficulty</span>
          </div>
          <p className="text-white font-bold text-lg capitalize">
            {plan.difficulty_level}
          </p>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h2>
        <WeeklyCalendar 
          workouts={plan.workouts}
          onWorkoutClick={handleEditWorkout}
        />
      </div>

      {/* Workouts List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Workouts</h2>
          {canEdit && (
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                       transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Workout</span>
            </button>
          )}
        </div>

        {plan.workouts.map((workout) => (
          <EnhancedWorkoutCard
            key={workout.id}
            workout={workout}
            onDelete={canEdit ? () => handleDeleteWorkout(workout.id) : undefined}
            onDayChange={canEdit ? (newDay) => handleDayChange(workout.id, newDay) : undefined}
            onEdit={canEdit ? () => handleEditWorkout(workout) : undefined}
            inProgram={true}
          />
        ))}

        {plan.workouts.length === 0 && (
          <div className="text-center py-8 px-6 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-700">
            <Award className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-400">No workouts added yet</h3>
            <p className="text-gray-500 mt-1 mb-4">Add workouts to build your complete program</p>
            {canEdit && (
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Workout
              </button>
            )}
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TemplateSelector
              templates={templates}
              onSelect={handleTemplateSelect}
              onCreateNew={() => {
                setShowTemplateSelector(false);
                setShowCreateWorkout(true);
              }}
              onBack={() => setShowTemplateSelector(false)}
              currentProgramWorkouts={plan.workouts}
            />
          </div>
        </div>
      )}

      {showCreateWorkout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowCreateWorkout(false);
                    setShowTemplateSelector(true);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-400" />
                </button>
                <h2 className="text-2xl font-bold text-white">Create New Workout</h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateWorkout(false);
                  setShowTemplateSelector(true);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
                {error}
                <button 
                  onClick={() => setError('')}
                  className="float-right text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            )}
            
            <EnhancedWorkoutForm
              onSubmit={handleCreateNewWorkout}
              onCancel={() => {
                setShowCreateWorkout(false);
                setShowTemplateSelector(true);
              }}
              inProgram={true}
              selectedPlan={plan}
              initialData={{
                name: '',
                description: '',
                split_method: 'full_body',
                preferred_weekday: 0,
                difficulty_level: 'intermediate',
                estimated_duration: 60,
                equipment_required: [],
                tags: [],
                exercises: [],
                is_public: true
              }}
            />
          </div>
        </div>
      )}

      {/* Program Edit Modal */}
      {showEditProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-bold text-white">Edit Program</h2>
              <button
                onClick={() => setShowEditProgram(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <EnhancedProgramForm
              initialData={plan}
              onSubmit={handleUpdateProgram}
              onCancel={() => setShowEditProgram(false)}
            />
          </div>
        </div>
      )}

      {/* Workout Edit Modal */}
      {workoutBeingEdited && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-bold text-white">Edit Workout</h2>
              <button
                onClick={() => setWorkoutBeingEdited(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <EnhancedWorkoutForm
              key={`edit-${workoutBeingEdited.id}-${JSON.stringify(workoutBeingEdited)}`}
              initialData={workoutBeingEdited}
              onSubmit={handleWorkoutUpdate}
              onCancel={() => setWorkoutBeingEdited(null)}
              inProgram={true}
              selectedPlan={plan}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPlanDetailView;