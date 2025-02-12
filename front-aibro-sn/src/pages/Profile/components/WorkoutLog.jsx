
// import React, { useState, useEffect } from 'react';
// import { 
//   X, 
//   Users, 
//   LineChart,
//   ChevronRight,
//   ChevronLeft,
//   Edit,
//   Check,
// } from 'lucide-react';

// const WorkoutLog = ({ logs }) => (
//     <div className="bg-gray-800/40 rounded-xl p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-bold">Workout Log</h2>
//         <div className="flex gap-2">
//           <button className="p-1 rounded-lg hover:bg-gray-700">
//             <ChevronLeft className="w-5 h-5" />
//           </button>
//           <button className="p-1 rounded-lg hover:bg-gray-700">
//             <ChevronRight className="w-5 h-5" />
//           </button>
//         </div>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {logs.slice(0, 3).map((log) => (
//           <div key={log.id} className="bg-gray-900/50 rounded-lg p-4">
//             <div className="text-sm text-gray-400">{log.date}</div>
//             <div className="font-medium mt-1">{log.workout_name}</div>
//             <div className="text-sm text-gray-400 mt-2">
//               {log.exercises?.length || 0} exercises
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   export default WorkoutLog;

import React from 'react';
import { Calendar } from 'lucide-react';

const WorkoutLog = ({ logs = [] }) => {
  // Ensure logs is an array
  const workoutLogs = Array.isArray(logs) ? logs : [];

  return (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 text-white">Recent Workouts</h2>
      
      {workoutLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No workout logs yet. Start logging your workouts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workoutLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">
                    {log.workout_name || 'Unnamed Workout'}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                </div>
                
                {log.gym_name && (
                  <p className="text-sm text-gray-400 mt-1">
                    at {log.gym_name}
                  </p>
                )}
                
                {log.exercises && log.exercises.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      {log.exercises.length} exercise{log.exercises.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
                
                {log.notes && (
                  <p className="mt-2 text-sm text-gray-300">{log.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutLog;