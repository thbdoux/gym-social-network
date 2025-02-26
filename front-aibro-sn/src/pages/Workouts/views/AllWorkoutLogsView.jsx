import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  List,
  BarChart,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Clock,
  Dumbbell,
  Activity,
  TrendingUp,
  Tag,
  X,
  SlidersHorizontal,
  LayoutGrid,
  ChevronsLeftRightEllipsisIcon
} from 'lucide-react';
import { useWorkoutLogs } from '../hooks/useWorkoutLogs';
import WorkoutLogCard from '../components/WorkoutLogCard';
import api from '../../../api';


function parseDate(dateStr) {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
    return new Date(dateStr);
  }

// Activity streak component
const StreakTracker = ({ logs }) => {
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
const WorkoutStats = ({ logs }) => {
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

// Timeline view component
const TimelineView = ({ logs }) => {
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
                
                <WorkoutLogCard log={log} />
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

// Heatmap visualization component
const ActivityHeatmap = ({ logs }) => {
  // Create a map of dates to workout counts
  const heatmapData = useMemo(() => {
    const data = {};
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1); // 6 months ago
    
    logs.forEach(log => {
      const date = parseDate(log.date);
      if (date >= startDate) {
        const dateStr = date.toISOString().split('T')[0];
        if (!data[dateStr]) {
          data[dateStr] = 0;
        }
        data[dateStr]++;
      }
    });
    
    return data;
  }, [logs]);
  
  // Generate month labels for the last 6 months
  const monthLabels = useMemo(() => {
    const labels = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(month.toLocaleDateString(undefined, { month: 'short' }));
    }
    
    return labels;
  }, []);
  
  // Generate the weeks list (first day of each week for the past 26 weeks)
  const weeks = useMemo(() => {
    const weeksList = [];
    const now = new Date();
    const startDate = new Date(now);
    
    // Go back to the beginning of the current week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Generate each week's starting day (go back 26 weeks = 6 months approximately)
    for (let i = 0; i < 26; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weeksList.unshift(weekStart);
    }
    
    return weeksList;
  }, []);
  
  // Helper to get intensity based on workout count
  const getIntensity = (count) => {
    if (!count) return "bg-gray-800";
    if (count === 1) return "bg-blue-900";
    if (count === 2) return "bg-blue-700";
    if (count === 3) return "bg-blue-500";
    return "bg-blue-400";
  };
  
  return (
    <div className="bg-gray-800/50 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Activity Heatmap</h2>
      
      {/* Month labels */}
      <div className="flex mb-1">
        <div className="w-10"></div>
        <div className="flex-1 grid grid-cols-6">
          {monthLabels.map((month, idx) => (
            <div key={idx} className="text-xs text-gray-400">{month}</div>
          ))}
        </div>
      </div>
      
      {/* Week rows */}
      <div className="flex">
        {/* Day of week labels */}
        <div className="w-10 flex flex-col pt-2">
          {['M', 'W', 'F'].map((day, idx) => (
            <div key={day} className="h-3 text-xs text-gray-500 my-1">{day}</div>
          ))}
        </div>
        
        {/* Activity squares */}
        <div className="flex-1 grid grid-cols-26 gap-1">
          {weeks.map((weekStart) => {
            const weekDays = [];
            
            // For each weekday (Monday=1 through Sunday=0)
            for (let i = 1; i < 8; i++) {
              const day = new Date(weekStart);
              day.setDate(day.getDate() + (i % 7));
              const dateStr = day.toISOString().split('T')[0];
              
              weekDays.push(
                <div 
                  key={dateStr} 
                  className={`h-3 w-3 ${getIntensity(heatmapData[dateStr])} rounded-sm`}
                  title={`${day.toLocaleDateString()}: ${heatmapData[dateStr] || 0} workouts`}
                ></div>
              );
            }
            
            return (
              <div key={weekStart.toISOString()} className="flex flex-col gap-1">
                {weekDays}
              </div>
            );
          })}
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

// Enhanced calendar component
const EnhancedCalendar = ({ logs, onDateClick, selectedDate }) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState([]);
  const [workoutsByDate, setWorkoutsByDate] = useState({});
  
  // Prepare data for calendar
  useEffect(() => {
    // Create a map of dates to workout logs
    const workoutMap = {};
    logs.forEach(log => {
      const dateStr = log.date;
      console.log(dateStr);
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
    </div>
  );
};

// Filter panel component
const FilterPanel = ({ filters, setFilters, programs, onClearFilters, isOpen, onClose }) => {
  const [localFilters, setLocalFilters] = useState({ ...filters });
  
  // Reset local filters when panel opens
  useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters, isOpen]);
  
  const handleApplyFilters = () => {
    setFilters(localFilters);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex justify-end">
      <div className="bg-gray-800 h-full w-full max-w-md overflow-y-auto p-6 animate-slide-in-right">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Date range filter */}
          <div>
            <h3 className="text-white font-medium mb-2">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">From</label>
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    startDate: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">To</label>
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    endDate: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>
          
          {/* Program filter */}
          <div>
            <h3 className="text-white font-medium mb-2">Program</h3>
            <select
              value={localFilters.program || ''}
              onChange={(e) => setLocalFilters({
                ...localFilters,
                program: e.target.value
              })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Completion status */}
          <div>
            <h3 className="text-white font-medium mb-2">Status</h3>
            <div className="flex">
              <button
                className={`flex-1 py-2 px-4 rounded-l-lg ${
                  localFilters.completed === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setLocalFilters({
                  ...localFilters,
                  completed: null
                })}
              >
                All
              </button>
              <button
                className={`flex-1 py-2 px-4 ${
                  localFilters.completed === true
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setLocalFilters({
                  ...localFilters,
                  completed: true
                })}
              >
                Completed
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-r-lg ${
                  localFilters.completed === false
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
                onClick={() => setLocalFilters({
                  ...localFilters,
                  completed: false
                })}
              >
                In Progress
              </button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between pt-4 mt-6 border-t border-gray-700">
            <button
              onClick={() => {
                setLocalFilters({
                  program: null,
                  startDate: null,
                  endDate: null,
                  completed: null
                });
                onClearFilters();
                onClose();
              }}
              className="px-4 py-2 text-gray-400 hover:text-gray-300"
            >
              Clear All
            </button>
            
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component: Enhanced Workout Logs View
const AllWorkoutLogsView = ({ onBack, activeProgram }) => {
  const [view, setView] = useState('grid'); // 'grid', 'list', 'calendar', 'timeline', 'stats'
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    program: null,
    startDate: null,
    endDate: null,
    completed: null
  });

  // Get all programs for filters
  const [programs, setPrograms] = useState([]);
  
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get('/workouts/programs/');
        setPrograms(response.data.results || []);
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };
    
    fetchPrograms();
  }, []);
  
  const { 
    logs, 
    loading, 
    error, 
    refreshLogs 
  } = useWorkoutLogs(activeProgram);
  
  // Apply filters and search to logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter(log => {
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = log.workout_name?.toLowerCase().includes(query);
        const exerciseMatch = log.exercises?.some(ex => 
          ex.name?.toLowerCase().includes(query)
        );
        const gymMatch = log.gym_name?.toLowerCase().includes(query);
        
        if (!(nameMatch || exerciseMatch || gymMatch)) {
          return false;
        }
      }
      
      // Apply date filter
      if (selectedDate) {
        // Convert log date to YYYY-MM-DD format for comparison
        let logDate;
        try {
          const date = parseDate(log.date);
          logDate = date.toISOString().split('T')[0];
        } catch (e) {
          // Handle case where date format is different
          return false;
        }
        
        if (logDate !== selectedDate) {
          return false;
        }
      }
      
      // Apply date range filter
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        const logDate = parseDate(log.date);
        if (logDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        const logDate = parseDate(log.date);
        if (logDate > endDate) return false;
      }
      
      // Apply program filter
      if (filters.program && log.program !== filters.program) {
        return false;
      }
      
      // Apply completion status filter
      if (filters.completed !== null && log.completed !== filters.completed) {
        return false;
      }
      
      return true;
    });
  }, [logs, searchQuery, selectedDate, filters]);
  
  const clearFilters = () => {
    setFilters({
      program: null,
      startDate: null,
      endDate: null,
      completed: null
    });
    setSelectedDate(null);
    setSearchQuery('');
  };
  
  // Calendar date selection handler
  const handleDateClick = (dateStr) => {
    if (selectedDate === dateStr) {
      // If clicking the same date, clear the selection
      setSelectedDate(null);
    } else {
      setSelectedDate(dateStr);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-white">Workout History</h1>
            <p className="text-gray-400 mt-1">
              View and track your fitness progress over time
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View toggles */}
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('timeline')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'timeline' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Timeline View"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('stats')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'stats' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Statistics View"
            >
              <BarChart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workout name, exercise, or gym..."
            className="w-full bg-gray-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilterPanel(true)}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
            Object.values(filters).some(val => val !== null)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filters</span>
          {Object.values(filters).some(val => val !== null) && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-blue-500">
              {Object.values(filters).filter(val => val !== null).length}
            </span>
          )}
        </button>
      </div>
      
      {/* Active filters display */}
      {Object.values(filters).some(val => val !== null) && (
        <div className="flex items-center flex-wrap gap-2 bg-gray-800/50 rounded-lg p-3">
          <span className="text-sm font-medium text-gray-400">Active filters:</span>
          
          {filters.program && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center">
              Program: {programs.find(p => p.id === filters.program)?.name || 'Unknown'}
              <button
                onClick={() => setFilters({...filters, program: null})}
                className="ml-2 hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.startDate && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center">
              From: {new Date(filters.startDate).toLocaleDateString()}
              <button
                onClick={() => setFilters({...filters, startDate: null})}
                className="ml-2 hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.endDate && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center">
              To: {new Date(filters.endDate).toLocaleDateString()}
              <button
                onClick={() => setFilters({...filters, endDate: null})}
                className="ml-2 hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {filters.completed !== null && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center">
              Status: {filters.completed ? 'Completed' : 'In Progress'}
              <button
                onClick={() => setFilters({...filters, completed: null})}
                className="ml-2 hover:text-blue-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-gray-400 hover:text-gray-300"
          >
            Clear all
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-400">Loading workout history...</span>
        </div>
      ) : (
        <>
          {/* Main Content based on selected view */}
          <div className="space-y-6">
            {view === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <EnhancedCalendar 
                    logs={logs}
                    onDateClick={handleDateClick}
                    selectedDate={selectedDate}
                  />
                </div>
                <div>
                  <StreakTracker logs={logs} />
                </div>
              </div>
            )}
            
            {view === 'stats' && (
              <div className="space-y-6">
                <ActivityHeatmap logs={logs} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <WorkoutStats logs={logs} />
                  </div>
                  <div>
                    <StreakTracker logs={logs} />
                  </div>
                </div>
              </div>
            )}
            
            {view === 'timeline' && <TimelineView logs={filteredLogs} />}
            
            {(view === 'grid' || view === 'list') && (
              <>
                {selectedDate && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-blue-400">
                      Showing logs for {new Date(selectedDate).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Clear date filter
                    </button>
                  </div>
                )}
                
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800/40 rounded-xl">
                    <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400">No workout logs found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your filters or add your first workout log.</p>
                  </div>
                ) : (
                  <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                    {filteredLogs.map((log) => (
                      <WorkoutLogCard 
                        key={log.id} 
                        log={log}
                        onEdit={() => {}} // Would need to implement editing functionality
                        onDelete={() => {}} // Would need to implement deletion functionality
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="flex justify-between mt-8 text-sm text-gray-500">
            <span>Showing {filteredLogs.length} of {logs.length} workouts</span>
            <span>
              Last synchronized: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </>
      )}
      
      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        programs={programs}
        onClearFilters={clearFilters}
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
      />
    </div>
  );
};

export default AllWorkoutLogsView;