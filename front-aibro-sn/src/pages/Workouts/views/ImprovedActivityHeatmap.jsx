import React, { useMemo } from 'react';
import { parseDate } from './ActivityComponents';

const ImprovedActivityHeatmap = ({ logs }) => {
  // Create activity data for the past 6 months (26 weeks)
  const heatmapData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    // Initialize activity count for each day
    const activityCount = {};
    
    // Pre-populate with zeros for all days in our range
    for (let d = new Date(sixMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      activityCount[dateStr] = 0;
    }
    
    // Count workouts for each day
    logs.forEach(log => {
      try {
        const date = parseDate(log.date);
        if (date >= sixMonthsAgo && date <= now) {
          const dateStr = date.toISOString().split('T')[0];
          activityCount[dateStr] = (activityCount[dateStr] || 0) + 1;
        }
      } catch (err) {
        console.error("Error parsing date:", log.date);
      }
    });
    
    return activityCount;
  }, [logs]);
  
  // Generate month labels for the last 6 months
  const monthLabels = useMemo(() => {
    const labels = [];
    const now = new Date();
    
    for (let i = 0; i < 6; i++) {
      const month = new Date(now);
      month.setMonth(now.getMonth() - i);
      labels.unshift(month.toLocaleDateString('en-US', { month: 'short' }));
    }
    
    return labels;
  }, []);

  // Generate weeks for calendar display (last 26 weeks)
  const weeks = useMemo(() => {
    const result = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    
    for (let i = 0; i < 26; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      
      const days = [];
      for (let j = 0; j < 7; j++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + j);
        days.push(day.toISOString().split('T')[0]);
      }
      
      result.unshift({
        weekStart,
        days
      });
    }
    
    return result;
  }, []);
  
  // Helper to get color based on activity intensity
  const getActivityColor = (count) => {
    if (!count) return 'bg-gray-800';
    if (count === 1) return 'bg-blue-900';
    if (count === 2) return 'bg-blue-700';
    if (count === 3) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Activity Heatmap</h2>
      
      {/* Month labels */}
      <div className="flex pl-10 mb-1">
        {monthLabels.map((month, idx) => (
          <div key={idx} className="flex-1 text-xs text-gray-400 text-center">{month}</div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="relative flex">
        {/* Day labels */}
        <div className="flex flex-col pr-2">
          {['Mon', 'Wed', 'Fri', 'Sun'].map(day => (
            <div key={day} className="h-4 text-xs text-gray-500 flex items-center">
              {day}
            </div>
          ))}
        </div>
        
        {/* Activity grid */}
        <div className="flex-1 grid grid-flow-col gap-1 auto-cols-fr">
          {weeks.map((week) => (
            <div key={week.weekStart.toISOString()} className="flex flex-col gap-1">
              {week.days.slice(1).map((dateStr, index) => (
                <div 
                  key={dateStr}
                  className={`h-4 w-4 ${getActivityColor(heatmapData[dateStr])} rounded-sm`}
                  title={`${new Date(dateStr).toLocaleDateString()}: ${heatmapData[dateStr] || 0} workouts`}
                >
                  {/* Skip Monday, Wednesday, Friday for alignment */}
                  {index % 2 !== 0 && <div className="invisible"></div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-end">
        <div className="text-xs text-gray-400 mr-2">Less</div>
        <div className="bg-gray-800 h-3 w-3 rounded-sm"></div>
        <div className="bg-blue-900 h-3 w-3 rounded-sm ml-1"></div>
        <div className="bg-blue-700 h-3 w-3 rounded-sm ml-1"></div>
        <div className="bg-blue-500 h-3 w-3 rounded-sm ml-1"></div>
        <div className="bg-blue-400 h-3 w-3 rounded-sm ml-1"></div>
        <div className="text-xs text-gray-400 ml-2">More</div>
      </div>
    </div>
  );
};

export default ImprovedActivityHeatmap;