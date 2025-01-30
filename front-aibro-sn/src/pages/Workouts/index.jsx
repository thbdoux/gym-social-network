// src/pages/Workouts/index.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Folders, ArrowLeft, Trash2, LayoutGrid } from 'lucide-react';
import api from '../../api';
import WorkoutCard from './components/WorkoutCard';
import WorkoutForm from './components/WorkoutForm';
import WorkoutPlanForm from './components/WorkoutPlanForm';

const WorkoutsPage = () => {
  // States for workout plans
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  // States for workouts
  const [workouts, setWorkouts] = useState([]);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [draftWorkout, setDraftWorkout] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('plans'); // 'plans', 'create-plan', 'plan-detail', 'create-workout'

  // Load workout plans on mount
  useEffect(() => {
    fetchWorkoutPlans();
    fetchAllWorkouts();
  }, []);

  // Load saved draft if exists
  useEffect(() => {
    const savedDraft = localStorage.getItem('workout-draft');
    if (savedDraft) {
      setDraftWorkout(JSON.parse(savedDraft));
    }
  }, []);

  // Save draft when switching views
  useEffect(() => {
    if (draftWorkout) {
      localStorage.setItem('workout-draft', JSON.stringify(draftWorkout));
    }
  }, [draftWorkout]);

  const fetchAllWorkouts = async () => {
    try {
      const response = await api.get('/workouts/templates/');
      setAllWorkouts(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching all workouts:', err);
      setError('Failed to load workouts');
    }
  };
  
  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/programs/');
      // Handle paginated response - use the results array
      const plans = response.data.results || [];
      setWorkoutPlans(plans);
      console.log('Workout plans:', plans);
    } catch (err) {
      console.error('Error fetching workout plans:', err);
      setError('Failed to load workout plans');
      setWorkoutPlans([]);
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
    }
  };

  const handleSelectPlan = async (plan) => {
    try {
      setSelectedPlan(plan);
      // The workouts are already in plan.plan_workouts from the API
      // We don't need an additional fetch
      setWorkouts(plan.plan_workouts || []);
      setView('plan-detail');
    } catch (err) {
      setError('Failed to load workouts for this plan');
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
    }
  };

  const handleCreateWorkout = async (workoutData) => {
    try {
      // First create the workout template
      const templateResponse = await api.post('/workouts/templates/', {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method
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

      // If we're in a plan, add the workout to the plan
      if (selectedPlan) {
        await api.post(`/workouts/programs/${selectedPlan.id}/schedule_workout/`, {
          workout_template: templateResponse.data.id,
          preferred_weekday: 0,
          order: selectedPlan.scheduled_workouts?.length || 0
        });
      }

      // Refresh data
      await fetchAllWorkouts();
      if (selectedPlan) {
        const updatedPlan = await api.get(`/workouts/programs/${selectedPlan.id}/`);
        setSelectedPlan(updatedPlan.data);
      }

      setShowWorkoutForm(false);
      setDraftWorkout(null);
      localStorage.removeItem('workout-draft');
    } catch (err) {
      console.error('Failed to create workout:', err);
      setError('Failed to create workout: ' + err.message);
    }
  };

  const handleUpdateWorkout = async (workoutData) => {
    try {
      // Update template basic info
      const templateResponse = await api.put(`/workouts/templates/${editingWorkout.id}/`, {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method
      });

      // Delete all existing exercises and recreate them
      // Note: This is a simplified approach. In production, you might want to do a diff
      await api.delete(`/workouts/templates/${editingWorkout.id}/exercises/`);

      // Add updated exercises
      for (const exercise of workoutData.exercises) {
        await api.post(`/workouts/templates/${editingWorkout.id}/add_exercise/`, {
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
      await fetchAllWorkouts();
      if (selectedPlan) {
        const updatedPlan = await api.get(`/workouts/programs/${selectedPlan.id}/`);
        setSelectedPlan(updatedPlan.data);
      }

      setEditingWorkout(null);
      setShowWorkoutForm(false);
      setDraftWorkout(null);
    } catch (err) {
      setError('Failed to update workout: ' + err.message);
    }
  };

  const renderWorkoutsList = (workoutsList, showAddButton = true) => (
    <div className="space-y-6">
      {showAddButton && !showWorkoutForm && (
        <button
          onClick={() => setShowWorkoutForm(true)}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Workout</span>
        </button>
      )}

      {showWorkoutForm ? (
        <WorkoutForm
          onSubmit={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
          initialData={editingWorkout || draftWorkout}
          onCancel={() => {
            setShowWorkoutForm(false);
            setEditingWorkout(null);
          }}
          onSaveDraft={setDraftWorkout}
        />
      ) : (
        <div className="grid gap-6">
          {workoutsList.map(workout => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onEdit={(workout) => {
                setEditingWorkout(workout);
                setShowWorkoutForm(true);
              }}
              onDelete={handleDeleteWorkout}
            />
          ))}
          {workoutsList.length === 0 && !showWorkoutForm && (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-gray-400">No workouts available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) return;

    try {
      // First remove it from the plan if it's in one
      if (selectedPlan) {
        const planWorkout = selectedPlan.plan_workouts.find(pw => pw.workout === workoutId);
        if (planWorkout) {
          await api.delete(`/workouts/programs/${selectedPlan.id}/remove_workout/${planWorkout.id}/`);
        }
      }

      // Then delete the workout itself
      await api.delete(`/workouts/workouts/${workoutId}/`);
      setWorkouts(workouts.filter(w => w.id !== workoutId));
    } catch (err) {
      setError('Failed to delete workout');
    }
  };

  const handleTogglePlanActive = async (planId) => {
    try {
      const response = await api.post(`/workouts/programs/${planId}/toggle_active/`);
      setWorkoutPlans(plans => 
        plans.map(plan => 
          plan.id === planId ? response.data : plan
        )
      );
    } catch (err) {
      setError('Failed to toggle plan status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
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
                  <LayoutGrid className="w-5 h-5" />
                  <span>View Plans</span>
                </button>
              </div>
            </div>
            {renderWorkoutsList(allWorkouts)}
          </div>
        );
      case 'plans':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-white">Workout Plans</h1>
              <button
                onClick={() => setView('create-plan')}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Plan</span>
              </button>
            </div>

            {(!Array.isArray(workoutPlans) || workoutPlans.length === 0) ? (
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
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-gray-400">{plan.description}</p>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlan(plan.id);
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Delete plan"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>{plan.sessions_per_week}x per week</span>
                      <span>•</span>
                      <span>{plan.focus.replace('_', ' ')}</span>
                    </div>
                    <button
                      onClick={() => handleSelectPlan(plan)}
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
            
            {!showWorkoutForm && (
              <button
                onClick={() => setShowWorkoutForm(true)}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Workout</span>
              </button>
            )}

            {showWorkoutForm ? (
              <WorkoutForm
                onSubmit={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
                initialData={editingWorkout || draftWorkout}
                onCancel={() => {
                  setShowWorkoutForm(false);
                  setEditingWorkout(null);
                }}
                onSaveDraft={setDraftWorkout}
              />
            ) : (
              <div className="grid gap-6">
                {workouts.map(workout => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onEdit={(workout) => {
                      setEditingWorkout(workout);
                      setShowWorkoutForm(true);
                    }}
                    onDelete={handleDeleteWorkout}
                  />
                ))}
                {workouts.length === 0 && !showWorkoutForm && (
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">No workouts in this plan yet. Add your first workout!</p>
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
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex space-x-4 border-b border-gray-700">
        <button
          onClick={() => setView('plans')}
          className={`px-4 py-2 ${
            view === 'plans' 
              ? 'text-blue-400 border-b-2 border-blue-400' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Workout Plans
        </button>
        <button
          onClick={() => setView('all-workouts')}
          className={`px-4 py-2 ${
            view === 'all-workouts'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          All Workouts
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 underline hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {renderView()}
    </div>
  );
};

export default WorkoutsPage;