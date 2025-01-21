import React, { useState, useEffect } from 'react';
import * as api from '../../api/api';
import CreateWorkout from './CreateWorkout';

export default function WorkoutList() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const response = await api.getWorkouts();
      setWorkouts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">My Workouts</h1>
        <CreateWorkout onWorkoutCreated={loadWorkouts} />
      </div>

      <div className="space-y-4">
        {workouts.map((workout) => (
          <div key={workout.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">
                  {new Date(workout.date).toLocaleDateString()}
                </p>
                <p className="text-gray-600 mt-1">{workout.notes}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Exercises:</h3>
              <div className="space-y-2">
                {workout.exercises.map((exercise, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="font-medium">{exercise.name}</span>
                    <span className="mx-2">-</span>
                    <span>{exercise.sets} sets</span>
                    <span className="mx-2">×</span>
                    <span>{exercise.reps} reps</span>
                    {exercise.weight && (
                      <>
                        <span className="mx-2">@</span>
                        <span>{exercise.weight} kg</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}