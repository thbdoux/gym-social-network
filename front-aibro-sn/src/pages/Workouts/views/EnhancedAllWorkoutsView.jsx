import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, Filter, SortDesc } from 'lucide-react';
import EnhancedWorkoutCard from './../components/EnhancedWorkoutCard';
import ExpandableWorkoutModal from './../components/ExpandableWorkoutModal';
import EnhancedWorkoutDetailModal from './../components/EnhancedWorkoutDetailModal';
import EmptyState from '../components/EmptyState';

const EnhancedAllWorkoutsView = ({
  workoutTemplates,
  isLoading,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  setView
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    splitMethod: 'all',
    difficultyLevel: 'all'
  });

  const handleCreateTemplate = async (templateData) => {
    try {
      await onCreateTemplate(templateData);
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create template');
      console.error('Error creating template:', err);
    }
  };

  const handleWorkoutCardClick = (workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutModal(true);
  };

  const handleEditWorkout = (workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutForm(true);
  };
  
  const handleUpdateTemplate = async (templateData) => {
    try {
      await onUpdateTemplate(templateData.id, templateData);
      setSelectedWorkout(null);
    } catch (err) {
      setError('Failed to update template');
      console.error('Error updating template:', err);
    }
  };

  // Filter and search workouts
  const filteredWorkouts = workoutTemplates.filter(workout => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workout.description && workout.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Split method filter
    const matchesSplit = filters.splitMethod === 'all' || 
      workout.split_method === filters.splitMethod;
    
    // Difficulty filter
    const matchesDifficulty = filters.difficultyLevel === 'all' || 
      workout.difficulty_level === filters.difficultyLevel;
    
    return matchesSearch && matchesSplit && matchesDifficulty;
  });

  const clearFilters = () => {
    setFilters({
      splitMethod: 'all',
      difficultyLevel: 'all'
    });
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading workout templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView('logs')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Workout Templates</h1>
            <p className="text-gray-400 mt-1">
              Create and manage your workout templates
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                   transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

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

      {/* Search and Filters */}
      <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-10 w-full bg-gray-900 border border-gray-700 rounded-lg py-2 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                       transition-colors flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
            
            {(filters.splitMethod !== 'all' || filters.difficultyLevel !== 'all' || searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                         transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {filterOpen && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Split Method</label>
              <select
                value={filters.splitMethod}
                onChange={(e) => setFilters({...filters, splitMethod: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white"
              >
                <option value="all">All Split Types</option>
                <option value="full_body">Full Body</option>
                <option value="push_pull_legs">Push/Pull/Legs</option>
                <option value="upper_lower">Upper/Lower</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Difficulty Level</label>
              <select
                value={filters.difficultyLevel}
                onChange={(e) => setFilters({...filters, difficultyLevel: e.target.value})}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredWorkouts.length > 0 ? (
          filteredWorkouts.map(workout => (
            <EnhancedWorkoutCard
              key={workout.id}
              workout={workout}
              onEdit={() => handleEditWorkout(workout)}
              onDelete={() => onDeleteTemplate(workout.id)}
              onClick={handleWorkoutCardClick}
            />
          ))
        ) : (
          <EmptyState
            title={searchQuery || filters.splitMethod !== 'all' || filters.difficultyLevel !== 'all' 
              ? "No matching templates found" 
              : "No workout templates yet"}
            description={searchQuery || filters.splitMethod !== 'all' || filters.difficultyLevel !== 'all'
              ? "Try adjusting your search or filters"
              : "Create your first template to get started"}
            action={{
              label: 'Create Template',
              onClick: () => setShowCreateModal(true)
            }}
          />
        )}
      </div>

      {/* Modals */}
      <ExpandableWorkoutModal
        workoutId={selectedWorkout?.id}
        initialWorkoutData={selectedWorkout}
        isOpen={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onEdit={() => {handleEditWorkout}}
        // onDuplicate = {() => {}}
        isTemplate={true}
      />

      {/* Workout Edit Form */}
      {showWorkoutForm && selectedWorkout && (
  <EnhancedWorkoutDetailModal
    workout={selectedWorkout}
    onClose={() => setShowWorkoutForm(false)}
    onSave={async (updatedWorkout) => {
      await onUpdateTemplate(updatedWorkout.id, updatedWorkout);
      setShowWorkoutForm(false);
    }}
    isNew={false}
  />
)}

      {showCreateModal && (
        <EnhancedWorkoutDetailModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTemplate}
          isNew={true}
        />
      )}
    </div>
  );
};

export default EnhancedAllWorkoutsView;