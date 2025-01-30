// src/pages/Workouts/index.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Folders, ArrowLeft } from 'lucide-react';
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

  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/plans/');
      setWorkoutPlans(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching workout plans:', err);
      setError('Failed to load workout plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (planData) => {
    try {
      const response = await api.post('/workouts/plans/', planData);
      setWorkoutPlans([...workoutPlans, response.data]);
      setView('plans');
    } catch (err) {
      setError('Failed to create workout plan');
    }
  };

  const handleSelectPlan = async (plan) => {
    try {
      setSelectedPlan(plan);
      const response = await api.get(`/workouts/plans/${plan.id}/workouts/`);
      setWorkouts(Array.isArray(response.data) ? response.data : []);
      setView('plan-detail');
    } catch (err) {
      setError('Failed to load workouts for this plan');
    }
  };

  const handleCreateWorkout = async (workoutData) => {
    try {
      const response = await api.post(`/workouts/plans/${selectedPlan.id}/workouts/`, workoutData);
      setWorkouts([...workouts, response.data]);
      setShowWorkoutForm(false);
      setDraftWorkout(null);
      localStorage.removeItem('workout-draft');
    } catch (err) {
      setError('Failed to create workout');
    }
  };

  const handleUpdateWorkout = async (workoutData) => {
    try {
      const response = await api.put(`/workouts/workouts/${editingWorkout.id}/`, workoutData);
      setWorkouts(workouts.map(w => w.id === editingWorkout.id ? response.data : w));
      setEditingWorkout(null);
      setShowWorkoutForm(false);
      setDraftWorkout(null);
    } catch (err) {
      setError('Failed to update workout');
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) return;

    try {
      await api.delete(`/workouts/workouts/${workoutId}/`);
      setWorkouts(workouts.filter(w => w.id !== workoutId));
    } catch (err) {
      setError('Failed to delete workout');
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

            {workoutPlans.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <Folders className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No workout plans yet. Create your first plan!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {workoutPlans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className="bg-gray-800 p-6 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                  >
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400">{plan.description}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <span>{plan.workoutsPerWeek}x per week</span>
                      <span className="mx-2">•</span>
                      <span>{plan.goals.join(', ')}</span>
                    </div>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setView('plans');
                  setSelectedPlan(null);
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-white">{selectedPlan.name}</h1>
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
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
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