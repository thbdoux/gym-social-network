import React from 'react';
import WorkoutCard from './WorkoutCard';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ProgramWorkoutsView = ({
  workouts,
  onDelete,
  onEdit,
  onUpdate,
  onOrderChange,
  programId
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onOrderChange(result.source.index, result.destination.index);
  };

  return (
    <div className="space-y-4">
      {/* Program Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Total Workouts</div>
          <div className="text-2xl font-bold text-white">{workouts.length}</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Days per Week</div>
          <div className="text-2xl font-bold text-white">
            {new Set(workouts.map(w => w.preferred_weekday)).size}
          </div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-xl">
          <div className="text-gray-400 text-sm mb-1">Total Exercises</div>
          <div className="text-2xl font-bold text-white">
            {workouts.reduce((acc, w) => acc + (w.exercises?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Workouts List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="workouts">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4 transition-all duration-200"
            >
              {workouts.map((workout, index) => (
                <Draggable
                  key={workout.instance_id}
                  draggableId={workout.instance_id.toString()}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="transition-transform duration-200"
                    >
                      <div className="transform transition-all duration-200 hover:scale-[1.02]">
                        <WorkoutCard
                          workout={workout}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onUpdate={onUpdate}
                          inProgram={true}
                          index={index}
                          isDragging={snapshot.isDragging}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {workouts.length === 0 && (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Workouts Yet</h3>
          <p className="text-gray-400">Start by adding your first workout to this program</p>
        </div>
      )}
    </div>
  );
};

export default ProgramWorkoutsView;