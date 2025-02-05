import React, { useState, useEffect } from 'react';
import { Plus, Folders, ArrowLeft, Trash2, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api';  // Your API configuration
import UnifiedWorkoutCard from './components/UnifiedWorkoutCard';
import WorkoutPlanForm from './components/WorkoutPlanForm';
import WorkoutPlansGrid from './components/WorkoutPlansGrid'; 
import WorkoutDetailModal from './components/WorkoutDetailModal';
import WeeklyCalendar from './components/WeeklyCalendar';
import EnhancedWorkoutForm from './components/EnhancedWorkoutForm';
// Custom Alert component
const ErrorAlert = ({ message, onClose }) => (
  <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex justify-between items-center">
    <span>{message}</span>
    <button 
      onClick={onClose}
      className="ml-4 text-red-200 hover:text-red-100"
    >
      ×
    </button>
  </div>
);

const WorkoutsPage = () => {
  // State Management
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('plans'); // 'plans', 'create-plan', 'all-workouts', 'plan-detail'

  const [selectedWorkout, setSelectedWorkout] = useState(null);
  // Load initial data
  useEffect(() => {
    fetchWorkoutPlans();
    fetchWorkoutTemplates();
  }, []);

  useEffect(() => {
    if (view === 'plan-detail' && selectedPlan) {
      refreshPlanData(selectedPlan.id);
    }
  }, [view, selectedPlan?.id]);

  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/programs/');
      const plans = response.data.results || response.data || [];
      setWorkoutPlans(Array.isArray(plans) ? plans : []);
      
      // If you're getting a specific plan, also update selected plan
      if (selectedPlan) {
        const updatedPlan = plans.find(p => p.id === selectedPlan.id);
        if (updatedPlan) {
          setSelectedPlan(updatedPlan);
        }
      }
    } catch (err) {
      setError('Failed to load workout plans');
      console.error('Error fetching plans:', err);
      setWorkoutPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPlanData = async (planId) => {
    try {
      const response = await api.get(`/workouts/programs/${planId}/`);
      const updatedPlan = response.data;
      
      // Update both the selectedPlan and the plan in workoutPlans
      setSelectedPlan(updatedPlan);
      setWorkoutPlans(plans => 
        plans.map(p => p.id === planId ? updatedPlan : p)
      );
    } catch (err) {
      console.error('Error refreshing plan data:', err);
      setError('Failed to refresh plan data');
    }
  };

  const handleDayChange = async (instanceId, newDay) => {
    try {
      await api.post(`/workouts/programs/${selectedPlan.id}/update_workout/`, {
        instance_id: instanceId,
        preferred_weekday: newDay
      });
      await refreshPlanData(selectedPlan.id);
    } catch (err) {
      setError('Failed to update workout day');
      console.error('Error:', err);
    }
  };


  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    setView('plan-detail');
    await refreshPlanData(plan.id); // Fetch fresh data when selecting plan
  };

  const fetchWorkoutTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/templates/');
      // Handle paginated response
      const templates = response.data.results || response.data || [];
      console.log('Fetched Templates:', templates); // Debug log
      setWorkoutTemplates(Array.isArray(templates) ? templates : []);
    } catch (err) {
      setError('Failed to load workout templates');
      console.error('Error fetching templates:', err);
      setWorkoutTemplates([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (planData) => {
    try {
      const response = await api.post('/workouts/programs/', planData);
      setWorkoutPlans([...workoutPlans, response.data]);
      setView('plans');
    } catch (err) {
      setError('Failed to create workout plan');
      console.error('Error creating plan:', err);
    }
  };

  const handleCreateWorkout = async (workoutData) => {
    try {
      // Create the workout template
      const templateResponse = await api.post('/workouts/templates/', {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method,
        program: selectedPlan?.id,
        preferred_weekday: workoutData.preferred_weekday,
        order: selectedPlan ? selectedPlan.workouts?.length || 0 : undefined
      });

      // Add exercises to template
      for (const exercise of workoutData.exercises) {
        await api.post(`/workouts/templates/${templateResponse.data.id}/add_exercise/`, {
          name: exercise.name,
          equipment: exercise.equipment,
          notes: exercise.notes || '',
          order: exercise.order,
          sets: exercise.sets.map((set, idx) => ({
            reps: set.reps,
            weight: set.weight,
            rest_time: set.rest_time,
            order: idx
          }))
        });
      }

      // If we're in a plan, add the workout to it
      if (selectedPlan) {
        await api.post(`/workouts/programs/${selectedPlan.id}/add_workout/`, {
          template_id: templateResponse.data.id,
          preferred_weekday: workoutData.preferred_weekday,
          order: selectedPlan.workouts?.length || 0
        });

        // Refresh selected plan data
        const updatedPlan = await api.get(`/workouts/programs/${selectedPlan.id}/`);
        setSelectedPlan(updatedPlan.data);
      }

      // Refresh templates list
      await fetchWorkoutTemplates();
      setShowWorkoutForm(false);
      setEditingWorkout(null);
    } catch (err) {
      setError('Failed to create workout');
      console.error('Error creating workout:', err);
    }
  };

  const handleUpdateTemplate = async (templateId, data) => {
    try {
      await api.post(`/workouts/templates/${templateId}/update_workout/`, {
        name: data.name,
        description: data.description,
        split_method: data.split_method,
        exercises: data.exercises
      });
      
      await fetchWorkoutTemplates();
      setShowWorkoutForm(false);
      setEditingWorkout(null);
    } catch (err) {
      setError('Failed to update workout template');
      console.error('Error updating template:', err);
    }
  };

  const handleUpdateWorkout = async (workoutId, updates) => {
    try {
      // First update the template
      await api.post(`/workouts/templates/${workoutId}/update_workout/`, {
        name: updates.name,
        description: updates.description,
        split_method: updates.split_method,
        exercises: updates.exercises
      });
      
      // Then refresh both templates and program data
      await Promise.all([
        fetchWorkoutTemplates(),  // Refresh all templates
        refreshPlanData(selectedPlan.id)  // Refresh program data
      ]);
  
      setShowWorkoutForm(false);
      setEditingWorkout(null);
    } catch (err) {
      setError('Failed to update workout');
      console.error('Error updating workout:', err);
    }
  };


  const handleWorkoutAdded = async () => {
    if (selectedPlan) {
      await refreshPlanData(selectedPlan.id);
    }
    await fetchWorkoutPlans(); // Refresh all plans to keep data in sync
  };

  const handleDeleteWorkout = async (workoutId) => {
    const confirmMessage = selectedPlan 
      ? 'Are you sure you want to remove this workout from the program?'
      : 'Are you sure you want to delete this workout template completely?';
  
    if (!window.confirm(confirmMessage)) return;
  
    try {
      if (selectedPlan) {
        // Use instance_id instead of template_id for removal
        await api.post(`/workouts/programs/${selectedPlan.id}/remove_workout/`, {
          instance_id: workoutId
        });
        await refreshPlanData(selectedPlan.id);
      } else {
        await api.delete(`/workouts/templates/${workoutId}/`);
        await fetchWorkoutTemplates();
      }
    } catch (err) {
      setError(selectedPlan ? 'Failed to remove workout from program' : 'Failed to delete workout template');
      console.error('Error:', err);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      await api.delete(`/workouts/programs/${planId}/`);
      setWorkoutPlans(plans => plans.filter(p => p.id !== planId));
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
        setView('plans');
      }
    } catch (err) {
      setError('Failed to delete plan');
      console.error('Error deleting plan:', err);
    }
  };

  const handleTogglePlanActive = async (planId) => {
    try {
      const plan = workoutPlans.find(p => p.id === planId);
      const response = await api.post(`/workouts/programs/${planId}/`, {
        is_active: !plan.is_active
      });
      setWorkoutPlans(plans => 
        plans.map(p => p.id === planId ? response.data : p)
      );
    } catch (err) {
      setError('Failed to toggle plan status');
      console.error('Error toggling plan status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'plans':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">Workout Plans</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setView('all-workouts')}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span>View All Workouts</span>
                </button>
                <button
                  onClick={() => setView('create-plan')}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Plan</span>
                </button>
              </div>
            </div>

            <WorkoutPlansGrid
              plans={workoutPlans}
              onSelect={handlePlanSelect}
              onDelete={handleDeletePlan}
              onToggleActive={handleTogglePlanActive}
              onCreatePlan={() => setView('create-plan')}
            />
          </div>
        );

        case 'create-plan':
          return (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setView('plans')}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-white">Create Workout Plan</h1>
              </div>
              <WorkoutPlanForm 
                onSubmit={handleCreatePlan}
                initialData={null}
              />
            </div>
          );

        case 'plan-detail':
          if (!selectedPlan) return null;
          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center space-x-4 mb-6">
                <button
                  onClick={() => {
                    setView('plans');
                    setSelectedPlan(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">{selectedPlan.name}</h1>
                  <p className="text-gray-400 mt-1">
                    {selectedPlan.focus.replace('_', ' ')} • {selectedPlan.sessions_per_week}x per week
                  </p>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/40 p-4 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Total Workouts</div>
                  <div className="text-2xl font-bold text-white">{selectedPlan.workouts.length}</div>
                </div>
                <div className="bg-gray-800/40 p-4 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Days per Week</div>
                  <div className="text-2xl font-bold text-white">
                    {new Set(selectedPlan.workouts.map(w => w.preferred_weekday)).size}
                  </div>
                </div>
                <div className="bg-gray-800/40 p-4 rounded-xl">
                  <div className="text-gray-400 text-sm mb-1">Total Exercises</div>
                  <div className="text-2xl font-bold text-white">
                    {selectedPlan.workouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0)}
                  </div>
                </div>
              </div>
        
              {showWorkoutForm ? (
                <EnhancedWorkoutForm
                  onSubmit={editingWorkout ? 
                    (data) => handleUpdateWorkout(editingWorkout.id, data) : 
                    handleCreateWorkout
                  }
                  initialData={editingWorkout}
                  onCancel={() => {
                    setShowWorkoutForm(false);
                    setEditingWorkout(null);
                  }}
                  onWorkoutAdded={handleWorkoutAdded}
                  inProgram={true}
                  selectedPlan={selectedPlan}
                />
              ) : (
                <>
                  {/* Calendar View */}
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Weekly Schedule</h2>
                    <WeeklyCalendar 
                      workouts={selectedPlan.workouts}
                      onWorkoutClick={setSelectedWorkout}
                    />
                  </div>

                  {/* Workout List */}
                  <div className="space-y-4">
                    {selectedPlan.workouts.map((workout) => (
                      <UnifiedWorkoutCard
                        key={workout.instance_id}
                        workout={workout}
                        onEdit={() => {
                          setEditingWorkout(workout);
                          setShowWorkoutForm(true);
                        }}
                        onDelete={handleDeleteWorkout}
                        inProgram={true}
                        onDayChange={handleDayChange}
                        onClick={() => setSelectedWorkout(workout)}
                      />
                    ))}
                  </div>

                  {/* Add Workout Button */}
                  <button
                    onClick={() => {
                      setEditingWorkout(null); // Reset any editing state
                      setShowWorkoutForm(true);
                    }}
                    className="fixed bottom-6 right-6 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Workout</span>
                  </button>
                </>
              )}

              {/* Workout Detail Modal */}
              {selectedWorkout && (
                <WorkoutDetailModal
                  workout={selectedWorkout}
                  onClose={() => setSelectedWorkout(null)}
                />
              )}
            </div>
          );

        case 'all-workouts':
          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setView('plans')}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-3xl font-bold text-white">All Workouts</h1>
                </div>
                {!showWorkoutForm && (
                  <button
                    onClick={() => setShowWorkoutForm(true)}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Workout</span>
                  </button>
                )}
              </div>
        
              {showWorkoutForm ? (
                <EnhancedWorkoutForm
                  onSubmit={editingWorkout ? 
                    (data) => handleUpdateTemplate(editingWorkout.id, data) : 
                    handleCreateWorkout
                  }
                  initialData={editingWorkout}
                  onCancel={() => {
                    setShowWorkoutForm(false);
                    setEditingWorkout(null);
                  }}
                />
              ) : (
                <div className="grid gap-6">
                  {workoutTemplates.map(workout => (
                    <UnifiedWorkoutCard
                      key={workout.id}
                      workout={workout}
                      onEdit={() => {
                        setEditingWorkout(workout);
                        setShowWorkoutForm(true);
                      }}
                      onDelete={handleDeleteWorkout}
                    />
                  ))}
                </div>
              )}
            </div>
          );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {error && (
        <ErrorAlert 
          message={error}
          onClose={() => setError('')}
        />
      )}
      
      {renderView()}
    </div>
  );
};

export default WorkoutsPage;