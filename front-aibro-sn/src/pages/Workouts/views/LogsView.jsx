import React, { useState, useEffect } from 'react';
import { LayoutGrid, Activity } from 'lucide-react';
import EmptyState from '../components/layout/EmptyState';
import WorkoutLogPreview from '../components/cards/WorkoutLogPreview';
import ProgramPreview from '../components/cards/ProgramPreview';
import QuickStats from '../components/stats/QuickStats';
import LogWorkoutDialog from './LogWorkoutDialog';

const getNextWorkoutDetails = (workouts) => {
  if (!workouts || workouts.length === 0) return null;
  
  const today = new Date().getDay();
  const todayAdjusted = today === 0 ? 7 : today;
  
  const nextWorkout = workouts
    .sort((a, b) => a.preferred_weekday - b.preferred_weekday)
    .find(w => w.preferred_weekday >= todayAdjusted);
  
  const workout = nextWorkout || workouts[0];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = workout.preferred_weekday % 7;

  return {
    ...workout,
    weekday_name: days[dayIndex]
  };
};

const LogsView = ({ 
  workoutLogs,
  workoutPlans,
  isLoading,
  onLogSelect,
  onViewWorkouts,
  onViewPrograms,
  onPlanSelect,
  onCreateLogFromInstance,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    weeklyCount: 0,
    totalCount: 0
  });

  // Get the active program and its next workout
  const activeProgram = workoutPlans?.find(program => program.is_active);
  const nextWorkout = activeProgram ? {
    ...getNextWorkoutDetails(activeProgram.workouts),
    program_name: activeProgram.name
  } : null;

  useEffect(() => {
    const logs = Array.isArray(workoutLogs) ? workoutLogs : [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyCount = logs.filter(log => 
      new Date(log.date) > weekAgo
    ).length;
    
    setWeeklyStats({
      weeklyCount,
      totalCount: logs.length
    });
  }, [workoutLogs]);

  const handleLogProgramWorkout = (workout) => {
    onCreateLogFromInstance(workout.id, {
      date: new Date().toISOString(),
      workout_name: workout.name,
      program_name: workout.program_name
    });
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">Workout Log</h1>
          <div className="flex space-x-3">
            <LogWorkoutDialog
              nextWorkout={nextWorkout}
              onLogProgramWorkout={handleLogProgramWorkout}
              isOpen={isDialogOpen}
              setIsOpen={setIsDialogOpen}
            />
            <button
              onClick={onViewWorkouts}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
                       transition-colors flex items-center space-x-2"
            >
              <LayoutGrid className="w-5 h-5" />
              <span>All Workouts</span>
            </button>
          </div>
        </div>
 
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : Array.isArray(workoutLogs) && workoutLogs.length > 0 ? (
          <div className="space-y-4">
            {workoutLogs.map(log => (
              <WorkoutLogPreview
                key={log.id}
                log={log}
                onClick={() => onLogSelect(log)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No workout logs yet"
            description="Click the 'Log Workout' button to record your first workout"
            icon={Activity}
          />
        )}
      </div>
      
      <div className="space-y-6">
        <ProgramPreview 
          programs={workoutPlans}
          onViewAll={onViewPrograms}
          onSelectProgram={onPlanSelect}
        />
        
        <QuickStats
          weeklyWorkouts={weeklyStats.weeklyCount}
          totalWorkouts={weeklyStats.totalCount}
        />
      </div>
    </div>
  );
};

export default LogsView;