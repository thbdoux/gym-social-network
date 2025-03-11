import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  Loader2,
  Search,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Calendar as CalendarIcon,
  BarChart,
  Dumbbell,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useWorkoutLogs } from '../hooks/useWorkoutLogs';
import WorkoutLogCard from '../components/WorkoutLogCard';
import api from '../../../api';
import { parseDate } from './ActivityComponents';
import FilterPanel from './FilterPanel';
import WorkoutLogForm from '../components/WorkoutLogForm';
import WorkoutStatisticsView from './WorkoutStatisticsView';

const AllWorkoutLogsView = ({ onBack, activeProgram, user }) => {
  // State management
  const [view, setView] = useState('grid'); // 'grid', 'calendar', 'stats'
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    program: null,
    startDate: null,
    endDate: null,
    completed: null
  });
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [programs, setPrograms] = useState([]);
  
  // Fetch programs for filter options
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
  
  // Get workout logs data
  const { 
    logs, 
    loading, 
    error, 
    createLog,
    updateLog,
    deleteLog,
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
        let logDate;
        try {
          const date = parseDate(log.date);
          logDate = date.toISOString().split('T')[0];
        } catch (e) {
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
  
  // Action handlers
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
  
  const handleDateClick = (dateStr) => {
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const handleEditLog = (log) => {
    setSelectedLog(log);
    setShowLogForm(true);
  };

  const handleDeleteLog = async (log) => {
    if (window.confirm('Are you sure you want to delete this workout log?')) {
      try {
        await deleteLog(log.id);
        await refreshLogs();
      } catch (err) {
        console.error('Error deleting log:', err);
      }
    }
  };

  const handleLogFormSubmit = async (formData) => {
    try {
      const preparedData = {
        ...formData,
        based_on_instance: formData.based_on_instance ? 
          (typeof formData.based_on_instance === 'string' ? 
            parseInt(formData.based_on_instance, 10) : formData.based_on_instance) : 
          null,
        program: formData.program ? 
          (typeof formData.program === 'string' ? 
            parseInt(formData.program, 10) : formData.program) : 
          null
      };
      
      if (selectedLog?.id) {
        const updateData = {
          ...preparedData,
          exercises: preparedData.exercises.map(exercise => ({
            ...exercise,
            id: exercise.id,
            sets: exercise.sets.map(set => ({
              ...set,
              id: set.id,
            }))
          }))
        };
        await updateLog(selectedLog.id, updateData);
      } else {
        await createLog(preparedData);
      }
      
      setShowLogForm(false);
      setSelectedLog(null);
      await refreshLogs();
    } catch (err) {
      console.error('Error saving log:', err);
      alert(`Error saving workout log: ${err.response?.data?.detail || err.message}`);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header with integrated search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
            Workout History
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search bar */}
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workouts..."
              className="w-full h-9 bg-gray-800 rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Filter button */}
          <button
            onClick={() => setShowFilterPanel(true)}
            className={`p-2 rounded-lg transition-colors ${
              Object.values(filters).some(val => val !== null)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title="Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
            {Object.values(filters).some(val => val !== null) && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-medium text-blue-500">
                {Object.values(filters).filter(val => val !== null).length}
              </span>
            )}
          </button>
          
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
              onClick={() => setView('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Calendar & Timeline View"
            >
              <CalendarIcon className="w-5 h-5" />
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
      
      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-400">Loading workout history...</span>
        </div>
      ) : (
        <>
          {/* Main Content */}
          <div className="space-y-6">
            {/* Statistics View */}
            {view === 'stats' && <WorkoutStatisticsView logs={logs} />}
            
            {/* Calendar & Timeline View */}
            {view === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <FancyCalendar 
                    logs={logs}
                    onDateClick={handleDateClick}
                    selectedDate={selectedDate}
                    onEditLog={handleEditLog}
                    onDeleteLog={handleDeleteLog}
                    user={user}
                  />
                </div>
                <div>
                  <TimelineView 
                    logs={filteredLogs} 
                    onEditLog={handleEditLog}
                    onDeleteLog={handleDeleteLog}
                    user={user}
                    compact={true}
                  />
                </div>
              </div>
            )}
            
            {/* Grid View */}
            {view === 'grid' && (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLogs.map((log) => (
                      <WorkoutLogCard 
                        key={log.id} 
                        log={log}
                        onEdit={() => handleEditLog(log)}
                        onDelete={() => handleDeleteLog(log)}
                        inFeedMode={false}
                        expandable={true}
                        user={user}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer info */}
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

      {/* Workout Log Form Modal */}
      {showLogForm && (
        <WorkoutLogForm
          log={selectedLog}
          programs={programs}
          onSubmit={handleLogFormSubmit}
          onClose={() => {
            setShowLogForm(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

// Fancy Calendar component
const FancyCalendar = ({ logs, onDateClick, selectedDate, onEditLog, onDeleteLog, user }) => {
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
          <span>Calendar</span>
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
              className={`p-2 rounded-lg h-20 flex flex-col items-center relative overflow-hidden
                ${isCurrentMonth ? 'bg-gray-700/50' : 'bg-gray-800/50 text-gray-500'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${isSelected ? 'ring-2 ring-purple-500' : ''}
                ${hasWorkouts ? 'hover:bg-green-500/10' : 'hover:bg-gray-700'}`}
            >
              {/* Background color for workout days */}
              {hasWorkouts && (
                <div className="absolute inset-0 bg-green-500/10 z-0"></div>
              )}
              
              {/* Date number */}
              <span className={`relative z-10 text-sm font-medium ${isCurrentMonth ? 'text-white' : 'text-gray-500'}`}>
                {date.getDate()}
              </span>
              
              {/* Checkmark and workout info for workout days */}
              {hasWorkouts && (
                <div className="relative z-10 mt-1 flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  
                  {/* Workout name - only show for the first workout if multiple */}
                  {workoutsByDate[dateStr][0] && (
                    <div className="mt-1 text-xs text-green-300 font-medium max-w-full truncate px-1">
                      {workoutsByDate[dateStr][0].workout_name}
                    </div>
                  )}
                  
                  {/* Count if multiple workouts */}
                  {workoutsCount > 1 && (
                    <div className="text-xs text-green-400">
                      +{workoutsCount - 1} more
                    </div>
                  )}
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
                inFeedMode={false}
                expandable={true}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Timeline view component
const TimelineView = ({ logs, onEditLog, onDeleteLog, user, compact = false }) => {
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
    <div className={`${compact ? 'space-y-3' : 'space-y-6'}`}>
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        <span>Timeline</span>
      </h2>
      
      <div className={`${compact ? 'h-[450px] overflow-y-auto pr-2' : ''}`}>
        {Object.values(groupedLogs).map((group, index) => (
          <div key={`${group.year}-${group.month}`} className="relative">
            {/* Month/Year header */}
            <div className="sticky top-0 z-10 bg-gray-800 py-2">
              <h3 className={`${compact ? 'text-base' : 'text-xl'} font-bold text-white flex items-center`}>
                <span className="bg-blue-500 w-3 h-3 rounded-full mr-3"></span>
                {group.month} {group.year}
                <span className="ml-2 text-sm text-gray-400">({group.logs.length})</span>
              </h3>
            </div>
            
            {/* Timeline line */}
            <div className="absolute left-1.5 top-10 bottom-0 w-0.5 bg-gray-700"></div>
            
            {/* Log cards with timeline connector */}
            <div className={`${compact ? 'space-y-2 ml-6 mt-2' : 'space-y-4 ml-8 mt-4'}`}>
              {group.logs.map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline connector */}
                  <div className={`absolute ${compact ? '-left-6 top-4' : '-left-8 top-6'} w-6 h-0.5 bg-gray-700`}></div>
                  <div className={`absolute ${compact ? '-left-8 top-2' : '-left-10 top-4'} w-4 h-4 rounded-full bg-blue-500`}></div>
                  
                  <WorkoutLogCard 
                    log={log} 
                    onEdit={() => onEditLog(log)} 
                    onDelete={() => onDeleteLog(log)} 
                    user={user}
                    compact={compact}
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
    </div>
  );
};

export default AllWorkoutLogsView;