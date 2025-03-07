import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  Loader2,
  Search,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart,
  Dumbbell
} from 'lucide-react';
import { useWorkoutLogs } from '../hooks/useWorkoutLogs';
import WorkoutLogCard from '../components/WorkoutLogCard';
import api from '../../../api';

// Import modular components
import { StreakTracker, WorkoutStats, parseDate } from './ActivityComponents';
import { TimelineView, EnhancedCalendar } from './ViewComponents';
import ImprovedActivityHeatmap from './ImprovedActivityHeatmap';
import FilterPanel from './FilterPanel';
import WorkoutLogForm from '../components/WorkoutLogForm';

// Main component: Enhanced Workout Logs View
const AllWorkoutLogsView = ({ onBack, activeProgram, user }) => {
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
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

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
    createLog,
    updateLog,
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

  // Handle edit log
  const handleEditLog = (log) => {
    setSelectedLog(log);
    setShowLogForm(true);
  };

  // Handle delete log
  const handleDeleteLog = async (log) => {
    if (window.confirm('Are you sure you want to delete this workout log?')) {
      try {
        await api.delete(`/workouts/logs/${log.id}/`);
        await refreshLogs();
      } catch (err) {
        console.error('Error deleting log:', err);
      }
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
                    onEditLog={handleEditLog}
                    onDeleteLog={handleDeleteLog}
                    user = {user}
                  />
                </div>
                <div>
                  <StreakTracker logs={logs} />
                </div>
              </div>
            )}
            
            {view === 'stats' && (
              <div className="space-y-6">
                <ImprovedActivityHeatmap logs={logs} />
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
            
            {view === 'timeline' && (
              <TimelineView 
                logs={filteredLogs} 
                onEditLog={handleEditLog}
                onDeleteLog={handleDeleteLog}
                user = {user}
              />
            )}
            
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
                        onEdit={() => handleEditLog(log)}
                        onDelete={() => handleDeleteLog(log)}
                        inFeedMode = {false}
                        expandable = {true}
                        user= {user}
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

      {/* Workout Log Form Modal */}
      {showLogForm && (
        <WorkoutLogForm
          log={selectedLog}
          programs={programs}
          onSubmit={async (formData) => {
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
          }}
          onClose={() => {
            setShowLogForm(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

export default AllWorkoutLogsView;