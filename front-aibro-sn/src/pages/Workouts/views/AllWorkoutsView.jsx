import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import UnifiedWorkoutCard from '../components/cards/UnifiedWorkoutCard';
import WorkoutDetailModal from '../components/modals/WorkoutDetailModal';
import EmptyState from '../components/layout/EmptyState';

const AllWorkoutsView = ({
  workoutTemplates,
  isLoading,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  setView
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateTemplate = async (templateData) => {
    try {
      await onCreateTemplate(templateData);
      setShowCreateModal(false);
    } catch (err) {
      setError('Failed to create template');
      console.error('Error creating template:', err);
    }
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
            <h1 className="text-4xl font-bold text-white">Workout Templates</h1>
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
        </div>
      )}

      {/* Templates List */}
      <div className="space-y-4">
        {workoutTemplates.length > 0 ? (
          workoutTemplates.map(workout => (
            <UnifiedWorkoutCard
              key={workout.id}
              workout={workout}
              onEdit={() => setSelectedWorkout(workout)}
              onDelete={() => onDeleteTemplate(workout.id)}
            />
          ))
        ) : (
          <EmptyState
            title="No workout templates yet"
            description="Create your first template to get started"
            action={{
              label: 'Create Template',
              onClick: () => setShowCreateModal(true)
            }}
          />
        )}
      </div>

      {/* Modals */}
      {selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          onSave={handleUpdateTemplate}
        />
      )}

      {showCreateModal && (
        <WorkoutDetailModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTemplate}
          isNew={true}
        />
      )}
    </div>
  );
};

export default AllWorkoutsView;