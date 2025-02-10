import React from 'react';
import { Activity, Target, ChevronRight } from 'lucide-react';

const ProgressCard = ({ stats }) => (
  <div className="group relative bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1">
    {/* Progress Bar Background */}
    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-violet-500 opacity-75" />
    
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
            Progress
          </h3>
          <p className="text-gray-400 mt-1">Your fitness journey this month</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400">
          This Month
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center text-gray-400 mb-2">
            <Activity className="w-4 h-4 mr-2" />
            <span className="text-sm">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.completion_rate || 0}%
          </p>
          <p className="text-sm text-gray-400 mt-1">Target: 80%</p>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center text-gray-400 mb-2">
            <Target className="w-4 h-4 mr-2" />
            <span className="text-sm">Workouts</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.completed_workouts || 0}
          </p>
          <p className="text-sm text-gray-400 mt-1">of {stats.total_workouts || 0} planned</p>
        </div>
      </div>

      {/* View History Button */}
      <button className="w-full bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center group">
        <span>View History</span>
        <ChevronRight className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

export default ProgressCard;