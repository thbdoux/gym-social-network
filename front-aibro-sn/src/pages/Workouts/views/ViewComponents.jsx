import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
} from 'lucide-react';
import WorkoutLogCard from '../components/WorkoutLogCard';
import { parseDate } from './ActivityComponents';

// Timeline view component
export const TimelineView = ({ logs, onEditLog, onDeleteLog }) => {
  // Sort logs chronologically
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  // Group logs by month and year
  const groupedLogs = {};
  sortedLogs.forEach(log => {
    const date = parseDate(log.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!groupedLogs[key]) {
      groupedLogs[key] = {
        month: date.toLocaleDateString(undefined, { month: 'long' }),
        year: date.getFullYear(),
        logs: []
      };
    }
    
    groupedLogs[key].logs.push(log);
  });
  
  return (
    <div className="space-y-6">
      {Object.values(groupedLogs).map((group, index) => (
        <div key={`${group.year}-${group.month}`} className="relative">
          {/* Month/Year header */}
          <div className="sticky top-0 z-10 bg-gray-900 py-2">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="bg-blue-500 w-3 h-3 rounded-full mr-3"></span>
              {group.month} {group.year}
              <span className="ml-2 text-sm text-gray-400">({group.logs.length} workouts)</span>
            </h3>
          </div>
          
          {/* Timeline line */}
          <div className="absolute left-1.5 top-10 bottom-0 w-0.5 bg-gray-700"></div>
          
          {/* Log cards with timeline connector */}
          <div className="space-y-4 ml-8 mt-4">
            {group.logs.map((log) => (
              <div key={log.id} className="relative">
                {/* Timeline connector */}
                <div className="absolute -left-8 top-6 w-6 h-0.5 bg-gray-700"></div>
                <div className="absolute -left-10 top-4 w-4 h-4 rounded-full bg-blue-500"></div>
                
                <WorkoutLogCard 
                  log={log} 
                  onEdit={() => onEditLog(log)} 
                  onDelete={() => onDeleteLog(log)} 
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {Object.keys(groupedLogs).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No workout logs to display in timeline view.
        </div>
      )}
    </div>
  );
};

// Enhanced calendar component
export const EnhancedCalendar = ({ logs, onDateClick, selectedDate, onEditLog, onDeleteLog }) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState([]);
  const [workoutsByDate, setWorkoutsByDate] = useState({});
  
  // Prepare data for calendar
  useEffect(() => {
    // Create a map of dates to workout logs
    const workoutMap = {};
    logs.forEach(log => {
      const dateStr = log.date;
      if (!dateStr) return;
      
      // Handle different date formats
      let date;
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        date = new Date(dateStr).toISOString().split('T')[0];
      }
      
      if (!workoutMap[date]) {
        workoutMap[date] = [];
      }
      workoutMap[date].push(log);
    });
    
    setWorkoutsByDate(workoutMap);
  }, [logs]);
  
  // Generate calendar dates for the month
  useEffect(() => {
    const dates = [];
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add days from previous month to fill the first week
    for (let i = firstDayOfWeek; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      dates.push({
        date,
        isCurrentMonth: false,
        dateStr: date.toISOString().split('T')[0]
      });
    }
    
    // Add days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      dates.push({
        date,
        isCurrentMonth: true,
        dateStr: date.toISOString().split('T')[0]
      });
    }
    
    // Fill the remaining spots in the last week
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const date = new Date(year, month + 1, i);
      dates.push({
        date,
        isCurrentMonth: false,
        dateStr: date.toISOString().split('T')[0]
      });
    }
    
    setCalendarDates(dates);
  }, [calendarDate]);
  
  // Navigation handlers
  const navigatePrevious = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCalendarDate(newDate);
  };
  
  const navigateNext = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarDate(newDate);
  };
  
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          <span>Workout Calendar</span>
        </h2>
        
        <div className="flex items-center gap-4">
          <button
            onClick={navigatePrevious}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <h3 className="text-lg font-medium text-white whitespace-nowrap">
            {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h3>
          
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">{day}</div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDates.map(({ date, isCurrentMonth, dateStr }) => {
          const hasWorkouts = workoutsByDate[dateStr]?.length > 0;
          const workoutsCount = workoutsByDate[dateStr]?.length || 0;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const isSelected = selectedDate === dateStr;
          
          return (
            <button
              key={dateStr}
              onClick={() => onDateClick(dateStr)}
              className={`p-2 rounded-lg h-20 flex flex-col items-center transition-colors relative
                ${isCurrentMonth ? 'bg-gray-700/50' : 'bg-gray-800/50 text-gray-500'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${isSelected ? 'bg-blue-500/20' : ''}
                ${hasWorkouts ? 'hover:bg-blue-500/10' : 'hover:bg-gray-700'}`}
            >
              <span className={`text-sm font-medium ${isCurrentMonth ? 'text-white' : 'text-gray-500'}`}>
                {date.getDate()}
              </span>
              
              {hasWorkouts && (
                <div className="mt-2 flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center
                    ${isSelected ? 'bg-blue-500 text-white' : ''}`}>
                    {workoutsCount}
                  </div>
                </div>
              )}
              
              {/* Add a small indicator of the workout type if present */}
              {workoutsCount > 0 && (
                <div className="mt-1 flex flex-wrap justify-center">
                  {workoutsByDate[dateStr].slice(0, 3).map((workout, idx) => (
                    <div 
                      key={idx}
                      className="w-2 h-2 rounded-full bg-blue-400 mx-0.5"
                      title={workout.workout_name}
                    ></div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Show selected date logs */}
      {selectedDate && workoutsByDate[selectedDate]?.length > 0 && (
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h3 className="text-lg font-medium text-white mb-3">
            Workouts on {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <div className="space-y-3">
            {workoutsByDate[selectedDate].map(log => (
              <WorkoutLogCard 
                key={log.id} 
                log={log} 
                onEdit={() => onEditLog(log)} 
                onDelete={() => onDeleteLog(log)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};