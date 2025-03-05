import React, { useState, useEffect } from 'react';
import { Search, X, Dumbbell, Calendar, Target, Loader2, GitFork, Users, Clock } from 'lucide-react';
import api from '../../../api';

const ProgramSelector = ({ onSelect, onCancel }) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const response = await api.get('/workouts/programs/');
        
        // Get all programs from the response
        const allPrograms = response.data.results || response.data;
        
        const me = await api.get('/users/me');
        console.log("ME : ", me.data.username);
        // Only allow sharing programs that you created (not forked)
        const createdPrograms = allPrograms.filter(program => 
          program.creator_username === me.data.username
        );
        
        console.log('All programs:', allPrograms);
        console.log('Created programs:', createdPrograms);
        
        setPrograms(createdPrograms);
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const filteredPrograms = programs.filter(program => 
    program.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">Select Program to Share</h3>
          <button
            onClick={onCancel}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
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
              placeholder="Search your programs..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-6">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
              <p className="mt-2 text-gray-400">Loading programs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-400">
              {error}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              {searchQuery ? "No matching programs found" : "You haven't created any programs yet"}
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {filteredPrograms.map(program => (
                <div
                  key={program.id}
                  onClick={() => onSelect(program)}
                  className="p-4 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer mb-3 border border-gray-700/50 hover:border-purple-500/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500/20 p-2 rounded-lg">
                        <Dumbbell className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-base">{program.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-700 text-purple-400 px-2 py-0.5 rounded-full">
                            {program.focus.replace(/_/g, ' ')}
                          </span>
                          {program.forked_from && (
                            <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <GitFork className="w-3 h-3" />
                              Forked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 line-clamp-2 my-3 bg-gray-800/50 p-2 rounded-lg">
                    {program.description || "No description available"}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex flex-col items-center p-2 border-r border-gray-700">
                      <span className="text-xs text-gray-400">Frequency</span>
                      <span className="text-sm font-medium text-white mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        {program.sessions_per_week}x weekly
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2">
                      <span className="text-xs text-gray-400">Workouts</span>
                      <span className="text-sm font-medium text-white mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-400" />
                        {program.workouts?.length || 0}
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

export default ProgramSelector;