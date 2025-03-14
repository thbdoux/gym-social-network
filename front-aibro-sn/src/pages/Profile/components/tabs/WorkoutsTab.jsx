import React, { useState } from 'react';
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  Filter,
  ChevronDown
} from 'lucide-react';
import WorkoutLogCard from '../../../Workouts/components/WorkoutLogCard';

/**
 * Dedicated tab for workout logs and history
 */
const WorkoutsTab = ({ userData, workoutLogs, handleWorkoutLogSelect }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // Options: all, recent, year

  // Helper to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Apply filters to workout logs
  const getFilteredLogs = () => {
    if (!workoutLogs || workoutLogs.length === 0) return [];
    
    let filtered = [...workoutLogs];
    
    if (filter === 'recent') {
      // Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(log => new Date(log.date) >= thirtyDaysAgo);
    } else if (filter === 'year') {
      // Current year
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(log => new Date(log.date).getFullYear() === currentYear);
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const filteredLogs = getFilteredLogs();

  // Workout summary stats
  const workoutStats = {
    total: userData?.workout_count || 0,
    streak: userData?.current_streak || 0,
    avgPerWeek: userData?.avg_workouts_per_week || 0
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Workout Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800/40">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Total Workouts</span>
            <Dumbbell className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{workoutStats.total}</div>
        </div>
        
        <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800/40">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Current Streak</span>
            <Calendar className="w-4 h-4 text-green-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{workoutStats.streak} days</div>
        </div>
        
        <div className="bg-gray-900/60 rounded-lg p-4 border border-gray-800/40">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Weekly Average</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{workoutStats.avgPerWeek}</div>
        </div>
      </div>
      
      {/* Filters and Workout List */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800/40">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/40">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-400" />
            Workout History
          </h3>
          
          {/* Filter dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800/60 hover:bg-gray-800 rounded-lg text-gray-300 transition-colors"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="w-4 h-4" />
              {filter === 'all' ? 'All Time' : filter === 'recent' ? 'Last 30 Days' : 'This Year'}
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-gray-800 rounded-lg shadow-lg z-10 overflow-hidden">
                <div className="py-1">
                  <button 
                    className={`px-4 py-2 text-sm w-full text-left ${filter === 'all' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => { setFilter('all'); setFilterOpen(false); }}
                  >
                    All Time
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm w-full text-left ${filter === 'recent' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => { setFilter('recent'); setFilterOpen(false); }}
                  >
                    Last 30 Days
                  </button>
                  <button 
                    className={`px-4 py-2 text-sm w-full text-left ${filter === 'year' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => { setFilter('year'); setFilterOpen(false); }}
                  >
                    This Year
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Workout Logs List */}
        <div className="divide-y divide-gray-800/40">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div 
                key={log.id}
                className="p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                onClick={() => handleWorkoutLogSelect(log)}
              >
                <WorkoutLogCard
                  user={userData?.username}
                  logId={log.id}
                  log={log}
                  inFeedMode={true}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-400">No workout logs available</p>
              {filter !== 'all' && (
                <button 
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                  onClick={() => setFilter('all')}
                >
                  Show all workouts
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutsTab;