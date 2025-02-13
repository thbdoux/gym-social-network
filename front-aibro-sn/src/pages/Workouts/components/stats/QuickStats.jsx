// components/stats/QuickStats.jsx
import React from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';

const QuickStats = ({ weeklyWorkouts, totalWorkouts }) => {
  return (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <BarChart2 className="w-5 h-5 mr-2" />
          Quick Stats
        </h2>
        <span className="text-sm text-gray-400">This Week</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Week</div>
            <div className="bg-blue-500/20 p-1 rounded">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {weeklyWorkouts}
          </div>
          <div className="text-sm text-gray-400 mt-1">workouts</div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Total</div>
            <div className="bg-purple-500/20 p-1 rounded">
              <BarChart2 className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {totalWorkouts}
          </div>
          <div className="text-sm text-gray-400 mt-1">workouts</div>
        </div>
      </div>
    </div>
  );
};

export default QuickStats;