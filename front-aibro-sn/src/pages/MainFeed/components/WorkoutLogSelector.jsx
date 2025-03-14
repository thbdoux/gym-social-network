import React, { useState, useEffect } from 'react';
import { Search, X, Activity, Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useWorkoutLogs } from './../../Workouts/hooks/useWorkoutLogs';
import { gymService } from '../../../api/services';

const WorkoutLogSelector = ({ onSelect, onCancel }) => {
  const { logs, loading } = useWorkoutLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState({});
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);

  // Fetch gym data for all logs that have a gym ID
  useEffect(() => {
    const fetchGyms = async () => {
      if (!logs.length) return;
      
      // Collect unique gym IDs
      const gymIds = [...new Set(logs.filter(log => log.gym).map(log => log.gym))];
      if (!gymIds.length) return;
      
      setLoadingGyms(true);
      
      try {
        // Create a map of gym IDs to gym names
        const gymMap = {};
        
        // Fetch each gym individually using gymService
        await Promise.all(gymIds.map(async (gymId) => {
          try {
            const gymData = await gymService.getGymById(gymId);
            gymMap[gymId] = gymData.name || 'Unknown Gym';
          } catch (error) {
            console.error(`Error fetching gym ${gymId}:`, error);
            gymMap[gymId] = 'Unknown Gym';
          }
        }));
        
        setGyms(gymMap);
      } catch (error) {
        console.error('Error fetching gyms:', error);
      } finally {
        setLoadingGyms(false);
      }
    };
    
    fetchGyms();
  }, [logs]);

  // Filter logs based on search query
  const filteredLogs = logs.filter(log =>
    log.workout_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.date?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogSelect = (log) => {
    setSelectedLogId(log.id);
    // Don't call onSelect here, wait for confirm button
  };

  const handleConfirm = () => {
    if (selectedLogId) {
      const selectedLog = logs.find(log => log.id === selectedLogId);
      onSelect(selectedLog);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl overflow-hidden shadow-xl border border-gray-800">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
          <h3 className="text-xl font-semibold text-white">Select Workout to Share</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-green-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your workouts..."
              className="w-full bg-gray-800/70 border border-gray-700 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
            />
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="bg-green-900/30 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
              <p className="text-gray-400">Loading your workouts...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
              <div className="bg-green-900/30 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Activity className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                {searchQuery ? "No matching workouts found" : "You haven't logged any workouts yet"}
              </h4>
              <p className="text-gray-400 max-w-md mx-auto">
                {searchQuery 
                  ? "Try adjusting your search terms or browse all your workouts below." 
                  : "Your completed workouts will appear here when you log them."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
              {filteredLogs.map(log => {
                const isSelected = selectedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => handleLogSelect(log)}
                    className={`
                      p-4 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                      ${isSelected 
                        ? 'border-green-500/50 bg-gradient-to-br from-green-900/20 to-emerald-800/20 transform scale-[1.02]' 
                        : 'border-gray-700 hover:border-gray-500 bg-gray-800/50 hover:scale-[1.02]'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center mb-2">
                        <div className={`
                          p-2.5 rounded-lg mr-3 transition-all duration-300
                          ${isSelected 
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg' 
                            : 'bg-green-900/30'}
                        `}>
                          <Activity className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-green-400'}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white flex items-center text-base">
                            <span className="truncate">{log.workout_name || log.name || "Unnamed Workout"}</span>
                          </h4>
                          {log.program_name && (
                            <span className="text-xs bg-gray-700/50 text-green-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                              {log.program_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selection indicator */}
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                        ${isSelected ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-700'}
                      `}>
                        {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-green-400" />
                      <span>{log.date || "No date"}</span>
                    </div>
                    
                    <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-green-400" />
                      <span>{log.duration_mins || 0} mins</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3 bg-gray-800/70 p-2 rounded-lg text-center">
                      <div>
                        <span className="text-xs text-gray-500">Exercises</span>
                        <p className="text-sm font-medium text-white">
                          {log.exercise_count || log.exercises?.length || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Volume</span>
                        <p className="text-sm font-medium text-white">
                          {log.total_volume || 0} kg
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Location</span>
                        <p className="text-sm font-medium text-white truncate">
                          {log.location || (log.gym && gyms[log.gym]) || "—"}
                        </p>
                      </div>
                    </div>
                    
                    {/* Bottom gradient bar for selected item */}
                    {isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800 flex justify-between bg-gray-800/50">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={!selectedLogId}
            className={`
              px-6 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2
              ${selectedLogId 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
            `}
          >
            <Activity className="w-4 h-4" />
            Share Workout
          </button>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WorkoutLogSelector;