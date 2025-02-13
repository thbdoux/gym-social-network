// // views/LogsView.jsx
// import React, { useState, useEffect } from 'react';
// import { LayoutGrid, Activity } from 'lucide-react';
// import EmptyState from '../components/layout/EmptyState';
// import WorkoutLogPreview from '../components/cards/WorkoutLogPreview';
// import ProgramPreview from '../components/cards/ProgramPreview';
// import QuickStats from '../components/stats/QuickStats';
// import LogWorkoutDialog from './LogWorkoutDialog';

// const LogsView = ({ 
//   workoutLogs,
//   workoutPlans,
//   isLoading,
//   onLogSelect,
//   onViewWorkouts,
//   onViewPrograms,
//   onPlanSelect,
//   onCreateLogFromInstance
// }) => {
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [weeklyStats, setWeeklyStats] = useState({
//     weeklyCount: 0,
//     totalCount: 0
//   });

//   // Get next workout from active program
//   const nextWorkout = workoutPlans?.find(p => p.is_active)?.workouts?.find(w => {
//     const today = new Date();
//     return new Date(w.preferred_weekday) >= today;
//   });
// // 
//   useEffect(() => {
//     const logs = Array.isArray(workoutLogs) ? workoutLogs : [];
//     const weekAgo = new Date();
//     weekAgo.setDate(weekAgo.getDate() - 7);
    
//     const weeklyCount = logs.filter(log => 
//       new Date(log.date) > weekAgo
//     ).length;
    
//     setWeeklyStats({
//       weeklyCount,
//       totalCount: logs.length
//     });
//   }, [workoutLogs]);

//   const handleLogProgramWorkout = async (workout) => {
//     try {
//       const newLog = await onCreateLogFromInstance(workout.instance_id);
//       onLogSelect(newLog);
//     } catch (error) {
//       console.error('Failed to create workout log:', error);
//     }
//   };

//   const handleLogCustomWorkout = () => {
//     onLogSelect({
//       id: 'new',
//       workout_name: '',
//       date: new Date().toISOString(),
//       exercises: [],
//       completed: false,
//       mood_rating: 7,
//       perceived_difficulty: 7
//     });
//   };

//   return (
//     <div className="grid grid-cols-3 gap-6">
//       <div className="col-span-2 space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-4xl font-bold text-white">Workout Log</h1>
//           <div className="flex space-x-3">
//             <LogWorkoutDialog
//               nextWorkout={nextWorkout && {
//                 ...nextWorkout,
//                 program_name: workoutPlans.find(p => p.is_active)?.name
//               }}
//               onLogProgramWorkout={handleLogProgramWorkout}
//               onLogCustomWorkout={handleLogCustomWorkout}
//               isOpen={isDialogOpen}
//               setIsOpen={setIsDialogOpen}
//             />
//             <button
//               onClick={onViewWorkouts}
//               className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 
//                        transition-colors flex items-center space-x-2"
//             >
//               <LayoutGrid className="w-5 h-5" />
//               <span>All Workouts</span>
//             </button>
//           </div>
//         </div>
        
//         {isLoading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="text-gray-400">Loading...</div>
//           </div>
//         ) : Array.isArray(workoutLogs) && workoutLogs.length > 0 ? (
//           <div className="space-y-4">
//             {workoutLogs.map(log => (
//               <WorkoutLogPreview
//                 key={log.id}
//                 log={log}
//                 onClick={() => onLogSelect(log)}
//               />
//             ))}
//           </div>
//         ) : (
//           <EmptyState
//             title="No workout logs yet"
//             description="Click the 'Log Workout' button to record your first workout"
//             icon={Activity}
//           />
//         )}
//       </div>
      
//       <div className="space-y-6">
//         <ProgramPreview 
//           programs={workoutPlans}
//           onViewAll={onViewPrograms}
//           onSelectProgram={onPlanSelect}
//         />
        
//         <QuickStats
//           weeklyWorkouts={weeklyStats.weeklyCount}
//           totalWorkouts={weeklyStats.totalCount}
//         />
//       </div>
//     </div>
//   );
// };

// export default LogsView;

// views/LogsView.jsx
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Activity } from 'lucide-react';
import EmptyState from '../components/layout/EmptyState';
import WorkoutLogPreview from '../components/cards/WorkoutLogPreview';
import ProgramPreview from '../components/cards/ProgramPreview';
import QuickStats from '../components/stats/QuickStats';
import LogWorkoutDialog from './LogWorkoutDialog';

const createEmptyLog = () => ({
  id: 'new',
  workout_name: '',
  date: new Date().toISOString(),
  exercises: [],
  completed: false,
  mood_rating: 7,
  perceived_difficulty: 7,
  performance_notes: '',
  gym_name: '',
  exercises: []
});

const createLogFromWorkout = (workout) => ({
  id: 'new',
  workout_name: workout.name,
  date: new Date().toISOString(),
  exercises: workout.exercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    sets: ex.sets.map(set => ({
      ...set,
      reps: set.reps,
      weight: set.weight,
      rest_time: set.rest_time
    })),
    notes: ex.notes || '',
    equipment: ex.equipment
  })),
  completed: false,
  mood_rating: 7,
  perceived_difficulty: 7,
  performance_notes: '',
  gym_name: '',
  program_name: workout.program_name
});

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
  onCreateLogFromInstance
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
    // Weekly stats calculation remains the same
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
    // Create date with current time
    const now = new Date();
    const dateTimeString = now.toISOString().slice(0, 16); // Format: "YYYY-MM-DDTHH:mm"
  
    onLogSelect({
      id: 'new',
      workout_name: workout.name,
      workout_instance: workout.instance_id,
      program_name: workout.program_name,
      date: dateTimeString,
      exercises: workout.exercises,
      completed: false,
      mood_rating: 7,
      perceived_difficulty: 7,
      performance_notes: '',
      gym_name: ''
    });
  };

  const handleLogCustomWorkout = () => {
    const now = new Date();
    const dateTimeString = now.toISOString().slice(0, 16); // Format: "YYYY-MM-DDTHH:mm"
  
    onLogSelect({
      id: 'new',
      workout_name: '',
      date: dateTimeString,
      exercises: [],
      completed: false,
      mood_rating: 7,
      perceived_difficulty: 7,
      performance_notes: '',
      gym_name: ''
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
              onLogCustomWorkout={handleLogCustomWorkout}
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
