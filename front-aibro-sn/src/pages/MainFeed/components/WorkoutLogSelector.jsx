import React, { useState, useEffect } from 'react';
import { Search, X, Activity, Calendar, Clock, Loader2 } from 'lucide-react';
import { useWorkoutLogs } from './../../Workouts/hooks/useWorkoutLogs';
import { gymService } from '../../../api/services';

const WorkoutLogSelector = ({ onSelect, onCancel }) => {
  const { logs, loading } = useWorkoutLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState({});
  const [loadingGyms, setLoadingGyms] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Select Workout to Share</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your workouts..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="mt-2 text-gray-400">Loading workout logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              {searchQuery ? "No matching workouts found" : "You haven't logged any workouts yet"}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  onClick={() => onSelect(log)}
                  className="p-4 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer mb-3 border border-gray-700/50 hover:border-green-500/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500/20 p-2 rounded-lg">
                        <Activity className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-base">
                          {log.workout_name || log.name || "Unnamed Workout"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-700 text-green-400 px-2 py-0.5 rounded-full">
                            {log.program_name || "No Program"}
                          </span>
                          {log.is_complete && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {log.date || "No date"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {log.location || (log.gym && gyms[log.gym]) || "No location"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mt-3 bg-gray-800/50 p-2 rounded-lg">
                    <div className="flex flex-col items-center p-2 border-r border-gray-700">
                      <span className="text-xs text-gray-400">Duration</span>
                      <span className="text-sm font-medium text-white mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-green-400" />
                        {log.duration_mins || 0} mins
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 border-r border-gray-700">
                      <span className="text-xs text-gray-400">Volume</span>
                      <span className="text-sm font-medium text-white mt-1">
                        {log.total_volume || 0} kg
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2">
                      <span className="text-xs text-gray-400">Exercises</span>
                      <span className="text-sm font-medium text-white mt-1">
                        {log.exercise_count || log.exercises?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutLogSelector;