import React, { useState, useEffect } from 'react';
import { Plus, Folders, ArrowLeft, Trash2, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api';  // Your API configuration
import WorkoutCard from './components/WorkoutCard';
import WorkoutForm from './components/WorkoutForm';
import WorkoutPlanForm from './components/WorkoutPlanForm';
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

  // API Functions
  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/programs/');
      // Handle paginated response
      const plans = response.data.results || response.data || [];
      console.log('Fetched plans:', plans); // Debug log
      setWorkoutPlans(Array.isArray(plans) ? plans : []);
    } catch (err) {
      setError('Failed to load workout plans');
      console.error('Error fetching plans:', err);
      setWorkoutPlans([]); // Set to empty array on error
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

  const handleUpdateWorkout = async (workoutId, workoutData) => {
    try {
      // Update template details using the new PATCH endpoint
      await api.patch(`/workouts/templates/${workoutId}/update_details/`, {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method,
        preferred_weekday: workoutData.preferred_weekday
      });

      // Get current exercises to find ones to remove
      const currentTemplate = await api.get(`/workouts/templates/${workoutId}/`);
      
      // Remove each exercise using the new endpoint
      for (const exercise of currentTemplate.data.exercises) {
        await api.delete(`/workouts/templates/${workoutId}/remove_exercise/`, {
          data: { exercise_id: exercise.id }
        });
      }

      // Add new exercises using the existing endpoint
      for (const exercise of workoutData.exercises) {
        await api.post(`/workouts/templates/${workoutId}/add_exercise/`, {
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

      // Refresh data
      await fetchWorkoutTemplates();
      if (selectedPlan) {
        const updatedPlan = await api.get(`/workouts/programs/${selectedPlan.id}/`);
        setSelectedPlan(updatedPlan.data);
      }

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
    // Different confirmation messages based on context
    const confirmMessage = selectedPlan 
      ? 'Are you sure you want to remove this workout from the program?'
      : 'Are you sure you want to delete this workout template completely?';

    if (!window.confirm(confirmMessage)) return;

    try {
      if (selectedPlan) {
        // If we're in a program, just remove the workout from the program
        await api.post(`/workouts/programs/${selectedPlan.id}/remove_workout/`, {
          template_id: workoutId
        });
        
        // Refresh the program data to show updated workout list
        await refreshPlanData(selectedPlan.id);
      } else {
        // If we're in the all workouts view, delete the template completely
        await api.delete(`/workouts/templates/${workoutId}/`);
        // Refresh the templates list
        await fetchWorkoutTemplates();
      }
    } catch (err) {
      const errorMessage = selectedPlan
        ? 'Failed to remove workout from program'
        : 'Failed to delete workout template';
      setError(errorMessage);
      console.error('Error:', err);
    }
  };

  const handleRemoveFromProgram = async (workoutId) => {
    if (!window.confirm('Are you sure you want to remove this workout from the program?')) return;

    try {
      await api.post(`/workouts/programs/${selectedPlan.id}/remove_workout/`, {
        template_id: workoutId
      });
      
      // Refresh the program data
      await refreshPlanData(selectedPlan.id);
    } catch (err) {
      setError('Failed to remove workout from program');
      console.error('Error removing workout from program:', err);
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

            {!Array.isArray(workoutPlans) || workoutPlans.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <Folders className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No workout plans yet. Create your first plan!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {workoutPlans.map(plan => (
                  <div
                    key={plan.id}
                    className="bg-gray-800 p-6 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-gray-400">{plan.description}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4 mt-2">
                          <span>{plan.sessions_per_week}x per week</span>
                          <span>•</span>
                          <span>{plan.focus.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePlanActive(plan.id)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            plan.is_active 
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }`}
                        >
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                          title="Delete plan"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlanSelect(plan)}
                      className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View Details →
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <WorkoutPlanForm onSubmit={handleCreatePlan} />
          </div>
        );

      case 'plan-detail':
        if (!selectedPlan) return null;
        return (
          <div className="space-y-6">
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
            
            {showWorkoutForm ? (
              <WorkoutForm
              onSubmit={editingWorkout ? 
                (data) => handleUpdateWorkout(editingWorkout.id, data) : 
                handleCreateWorkout
              }
              initialData={editingWorkout}
              onCancel={() => {
                setShowWorkoutForm(false);
                setEditingWorkout(null);
              }}
              onWorkoutAdded={handleWorkoutAdded}  // Add this prop
              inProgram={true}
              selectedPlan={selectedPlan}
            />
            ) : (
              <>
                <button
                  onClick={() => setShowWorkoutForm(true)}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Workout</span>
                </button>

                <div className="grid gap-6">
                  {selectedPlan.workouts?.map(workout => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                      onEdit={() => {
                        setEditingWorkout(workout);
                        setShowWorkoutForm(true);
                      }}
                      onDelete={() => handleRemoveFromProgram(workout.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'all-workouts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">All Workouts</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setView('plans')}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Plans</span>
                </button>
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
            </div>

            {showWorkoutForm ? (
              <WorkoutForm
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
                inProgram={view === 'plan-detail'}
                selectedPlan={selectedPlan}
              />
            ) : (
              <div className="grid gap-6">
                {workoutTemplates.map(workout => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onEdit={() => {
                      setEditingWorkout(workout);
                      setShowWorkoutForm(true);
                    }}
                    onDelete={() => handleDeleteWorkout(workout.id)}
                  />
                ))}
                {workoutTemplates.length === 0 && (
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">No workouts available.</p>
                  </div>
                )}
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