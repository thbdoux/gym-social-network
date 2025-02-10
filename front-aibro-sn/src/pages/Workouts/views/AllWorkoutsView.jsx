import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import EnhancedWorkoutForm from '../components/forms/EnhancedWorkoutForm';
import UnifiedWorkoutCard from '../components/cards/UnifiedWorkoutCard';
import FilterBar from '../components/layout/FilterBar';
import EmptyState from '../components/layout/EmptyState';
import { useWorkout } from '../contexts/WorkoutContext';

const AllWorkoutsView = ({
  workoutTemplates,
  setView,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  setError
}) => {
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    splitMethod: '',
    difficulty: '',
    duration: ''
  });

  const workoutContext = useWorkout();
  const { setSelectedWorkouts = () => {} } = workoutContext || {};

  // Filter templates based on search and filters
  const filteredTemplates = workoutTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSplitMethod = !filters.splitMethod || template.split_method === filters.splitMethod;
    const matchesDifficulty = !filters.difficulty || template.difficulty_level === filters.difficulty;
    const matchesDuration = !filters.duration || 
                           (template.estimated_duration <= parseInt(filters.duration));

    return matchesSearch && matchesSplitMethod && matchesDifficulty && matchesDuration;
  });

  const handleWorkoutSubmit = async (workoutData) => {
    try {
      if (editingWorkout) {
        await updateWorkout(editingWorkout.id, workoutData);
      } else {
        await createWorkout(workoutData);
      }
      setShowWorkoutForm(false);
      setEditingWorkout(null);
    } catch (err) {
      setError(editingWorkout ? 'Failed to update workout' : 'Failed to create workout');
    }
  };

  const handleFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

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
          <div>
            <h1 className="text-3xl font-bold text-white">All Workouts</h1>
            <p className="text-gray-400 mt-1">
              {workoutTemplates.length} templates • {
                workoutTemplates.reduce((acc, template) => 
                  acc + (template.exercises?.length || 0), 0)
              } total exercises
            </p>
          </div>
        </div>
        {!showWorkoutForm && (
          <button
            onClick={() => setShowWorkoutForm(true)}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                     transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Workout</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar
        onSearch={setSearchQuery}
        onFilter={handleFilter}
        filters={filters}
        filterOptions={{
          splitMethod: ['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Custom'],
          difficulty: ['Beginner', 'Intermediate', 'Advanced'],
          duration: ['30', '45', '60', '90']
        }}
      />

      {showWorkoutForm ? (
        <EnhancedWorkoutForm
          onSubmit={handleWorkoutSubmit}
          initialData={editingWorkout}
          onCancel={() => {
            setShowWorkoutForm(false);
            setEditingWorkout(null);
          }}
        />
      ) : (
        <>
          {filteredTemplates.length > 0 ? (
            <div className="grid gap-6">
              {filteredTemplates.map(workout => (
                <UnifiedWorkoutCard
                  key={workout.id}
                  workout={workout}
                  onEdit={() => {
                    setEditingWorkout(workout);
                    setShowWorkoutForm(true);
                  }}
                  onDelete={() => deleteWorkout(workout.id)}
                  onSelect={() => setSelectedWorkouts(prev => [...prev, workout])}
                  showSelectOption={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={searchQuery || Object.values(filters).some(Boolean) 
                ? "No matching workouts found"
                : "No workouts created yet"}
              description={searchQuery || Object.values(filters).some(Boolean)
                ? "Try adjusting your search or filters"
                : "Create your first workout template to get started"}
              action={{
                label: 'Create Workout',
                onClick: () => setShowWorkoutForm(true)
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AllWorkoutsView;