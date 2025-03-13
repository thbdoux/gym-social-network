import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Search, X, SlidersHorizontal, 
  Dumbbell, Loader2 
} from 'lucide-react';
import EnhancedWorkoutCard from '../components/EnhancedWorkoutCard';
import ExpandableWorkoutModal from '../components/ExpandableWorkoutModal';
import EmptyState from '../components/EmptyState';
import TemplateWizard from '../components/workout-wizard/TemplateWizard';

const EnhancedAllWorkoutsView = ({
  workoutTemplates,
  isLoading,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  setView
}) => {
  // State management
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
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
      setShowWorkoutForm(false);
    } catch (err) {
      setError('Failed to update template');
      console.error('Error updating template:', err);
    }
  };

  const clearFilters = () => {
    setFilters({
      splitMethod: 'all',
      difficultyLevel: 'all'
    });
    setSearchQuery('');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading workout templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with title, search and action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center">
            <button
              onClick={() => setView('logs')}
              className="p-2 mr-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
              Workout Templates
            </h1>
          </div>
          <p className="text-gray-400 ml-10 text-sm">Build reusable workout blueprints for maximum efficiency and progress.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search bar */}
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-9 w-full bg-gray-800 rounded-lg py-2 text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filter button */}
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-lg transition-colors relative ${
              Object.values(filters).some(val => val !== 'all')
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
            title="Filter Templates"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {Object.values(filters).some(val => val !== 'all') && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-medium text-blue-500">
                {Object.values(filters).filter(val => val !== 'all').length}
              </span>
            )}
          </button>
          
          {/* Create template button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 
                     transition-all shadow-lg shadow-blue-700/20"
            title="Create New Template"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* Filter panel */}
      {showFilterPanel && (
        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Split Method</label>
              <select
                value={filters.splitMethod}
                onChange={(e) => setFilters({...filters, splitMethod: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Split Types</option>
                <option value="full_body">Full Body</option>
                <option value="push_pull_legs">Push/Pull/Legs</option>
                <option value="upper_lower">Upper/Lower</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Difficulty Level</label>
              <select
                value={filters.difficultyLevel}
                onChange={(e) => setFilters({...filters, difficultyLevel: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div className="sm:col-span-2 flex justify-end">
              {(filters.splitMethod !== 'all' || filters.difficultyLevel !== 'all' || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                           transition-colors text-sm"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active filters display */}
      {(filters.splitMethod !== 'all' || filters.difficultyLevel !== 'all') && (
        <div className="flex items-center flex-wrap gap-2 bg-gray-800/50 rounded-lg p-3">
          <span className="text-sm font-medium text-gray-400">Active filters:</span>
          
          {filters.splitMethod !== 'all' && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center">
              Split: {filters.splitMethod.replace(/_/g, ' ')}
              <button
                onClick={() => setFilters({...filters, splitMethod: 'all'})}
                className="ml-2 hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.difficultyLevel !== 'all' && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center">
              Difficulty: {filters.difficultyLevel}
              <button
                onClick={() => setFilters({...filters, difficultyLevel: 'all'})}
                className="ml-2 hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-gray-400 hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="col-span-full">
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
          </div>
        )}
      </div>

      {/* Footer info */}
      {filteredWorkouts.length > 0 && (
        <div className="flex justify-between mt-8 text-sm text-gray-500">
          <span>Showing {filteredWorkouts.length} of {workoutTemplates.length} templates</span>
        </div>
      )}

      {/* Modals */}
      {showWorkoutModal && (
        <ExpandableWorkoutModal
          workoutId={selectedWorkout?.id}
          initialWorkoutData={selectedWorkout}
          isOpen={showWorkoutModal}
          onClose={() => setShowWorkoutModal(false)}
          onEdit={() => handleEditWorkout(selectedWorkout)}
          isTemplate={true}
        />
      )}

      {/* Workout Edit Form */}
      {showWorkoutForm && selectedWorkout && (
        <TemplateWizard
          template={selectedWorkout}
          onClose={() => setShowWorkoutForm(false)}
          onSubmit={handleUpdateTemplate}
        />
      )}

      {showCreateModal && (
        <TemplateWizard
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTemplate}
        />
      )}
    </div>
  );
};

export default EnhancedAllWorkoutsView;