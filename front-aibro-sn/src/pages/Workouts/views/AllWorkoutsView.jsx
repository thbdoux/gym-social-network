// views/AllWorkoutsView.jsx
import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import UnifiedWorkoutCard from '../components/cards/UnifiedWorkoutCard';
import WorkoutDetailModal from '../components/modals/WorkoutDetailModal';

const AllWorkoutsView = ({
  workoutTemplates,
  onCreateWorkout,
  onUpdateWorkout,
  onDeleteWorkout,
  setView  // Receive setView instead of onBack
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView('logs')}  // Use setView directly
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

      {/* Templates List */}
      <div className="space-y-4">
        {workoutTemplates.map(workout => (
          <UnifiedWorkoutCard
            key={workout.id}
            workout={workout}
            onEdit={() => setSelectedWorkout(workout)}
            onDelete={() => onDeleteWorkout(workout.id)}
          />
        ))}

        {workoutTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No workout templates yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                       transition-colors"
            >
              Create Your First Template
            </button>
          </div>
        )}
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          onSave={onUpdateWorkout}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <WorkoutDetailModal
          onClose={() => setShowCreateModal(false)}
          onSave={onCreateWorkout}
          isNew={true}
        />
      )}
    </div>
  );
};

export default AllWorkoutsView;