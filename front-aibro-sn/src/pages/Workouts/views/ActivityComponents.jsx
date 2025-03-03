import React, { useMemo } from 'react';
import { 
  Activity,
  Clock,
  Dumbbell,
} from 'lucide-react';

// Helper function to parse dates
export function parseDate(dateStr) {
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }
  return new Date(dateStr);
}

// Activity streak component
export const StreakTracker = ({ logs }) => {
  // Calculate current streak
  const streak = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    let currentStreak = 1;
    let lastDate = new Date(sortedLogs[0].date);
    
    // Check for consecutive days
    for (let i = 1; i < sortedLogs.length; i++) {
      const currentDate = new Date(sortedLogs[i].date);
      const daysDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
        lastDate = currentDate;
      } else if (daysDiff > 1) {
        break;
      }
    }
    
    return currentStreak;
  }, [logs]);
  
  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-indigo-500/20 rounded-xl p-6">
      <h2 className="font-bold text-lg mb-2 text-white">Current Streak</h2>
      <div className="flex items-baseline">
        <span className="text-4xl font-bold text-blue-400">{streak}</span>
        <span className="ml-2 text-blue-300">days</span>
      </div>
      <p className="text-sm text-blue-200 mt-2">Keep it up! Consistency builds strength.</p>
    </div>
  );
};

// Workout stats component
export const WorkoutStats = ({ logs }) => {
  // Calculate various stats
  const stats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        totalWorkouts: 0,
        thisMonth: 0,
        averageDuration: 0,
        favoriteExercise: "None",
        mostActive: "None"
      };
    }
    
    // Current month workouts
    const now = new Date();
    const thisMonth = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === now.getMonth() && 
             logDate.getFullYear() === now.getFullYear();
    }).length;
    
    // Average duration
    const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const avgDuration = Math.round(totalDuration / logs.length);
    
    // Count exercises
    const exerciseCounts = {};
    logs.forEach(log => {
      log.exercises?.forEach(ex => {
        if (!exerciseCounts[ex.name]) {
          exerciseCounts[ex.name] = 0;
        }
        exerciseCounts[ex.name]++;
      });
    });
    
    // Find favorite exercise
    let favoriteExercise = "None";
    let maxCount = 0;
    Object.entries(exerciseCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteExercise = name;
      }
    });
    
    // Find most active day
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    logs.forEach(log => {
      const day = parseDate(log.date).getDay();
      dayCount[day]++;
    });
    
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const mostActiveDay = days[dayCount.indexOf(Math.max(...dayCount))];
    
    return {
      totalWorkouts: logs.length,
      thisMonth,
      averageDuration: avgDuration,
      favoriteExercise,
      mostActive: mostActiveDay
    };
  }, [logs]);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center mb-2 text-gray-400">
          <Activity className="w-4 h-4 mr-2" />
          <span className="text-sm">Total Workouts</span>
        </div>
        <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
        <p className="text-xs text-gray-400 mt-1">{stats.thisMonth} this month</p>
      </div>
      
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center mb-2 text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          <span className="text-sm">Avg. Duration</span>
        </div>
        <p className="text-2xl font-bold text-white">{stats.averageDuration}</p>
        <p className="text-xs text-gray-400 mt-1">minutes</p>
      </div>
      
      <div className="bg-gray-800/50 rounded-xl p-4">
        <div className="flex items-center mb-2 text-gray-400">
          <Dumbbell className="w-4 h-4 mr-2" />
          <span className="text-sm">Favorite Exercise</span>
        </div>
        <p className="text-lg font-bold text-white truncate">{stats.favoriteExercise}</p>
        <p className="text-xs text-gray-400 mt-1">Most frequently logged</p>
      </div>
    </div>
  );
};