
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  LineChart,
  ChevronRight,
  ChevronLeft,
  Edit,
  Check,
} from 'lucide-react';

const WorkoutLog = ({ logs }) => (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Workout Log</h2>
        <div className="flex gap-2">
          <button className="p-1 rounded-lg hover:bg-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="p-1 rounded-lg hover:bg-gray-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {logs.slice(0, 3).map((log) => (
          <div key={log.id} className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">{log.date}</div>
            <div className="font-medium mt-1">{log.workout_name}</div>
            <div className="text-sm text-gray-400 mt-2">
              {log.exercises?.length || 0} exercises
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  export default WorkoutLog;