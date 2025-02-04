import React, { useState } from 'react';
import WorkoutCard from './WorkoutCard';

const DraggableWorkoutList = ({ 
  workouts, 
  onOrderChange,
  onUpdate,
  onEdit,
  onDelete,
  programId 
}) => {
  const [draggedWorkout, setDraggedWorkout] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, workout, index) => {
    setDraggedWorkout({ workout, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (!draggedWorkout) return;

    const { workout, index: startIndex } = draggedWorkout;
    
    // Don't do anything if dropping on the same spot
    if (dropIndex === startIndex) return;

    try {
      // Call the API to update the order
      await onUpdate(workout.instance_id, {
        order: dropIndex
      });

      // Let parent component know about the reorder
      if (onOrderChange) {
        onOrderChange(startIndex, dropIndex);
      }
    } catch (error) {
      console.error('Error updating workout order:', error);
    }

    setDraggedWorkout(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {workouts.map((workout, index) => (
        <div
          key={workout.instance_id}
          draggable
          onDragStart={(e) => handleDragStart(e, workout, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          className={`${
            dragOverIndex === index ? 'border-2 border-blue-500 rounded-lg' : ''
          }`}
        >
          <WorkoutCard
            workout={workout}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdate={onUpdate}
            inProgram={true}
            index={index}
            isDragging={draggedWorkout?.workout.instance_id === workout.instance_id}
            dragHandleProps={{
              draggable: true,
              onDragStart: (e) => handleDragStart(e, workout, index),
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default DraggableWorkoutList;