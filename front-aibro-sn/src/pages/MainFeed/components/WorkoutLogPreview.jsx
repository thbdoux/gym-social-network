import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Link, 
         Clock, Target, ChevronDown, ChevronUp, ClipboardList, MapPin} from 'lucide-react';
import { FileEdit } from "lucide-react";
import api from '../../../api';

const WorkoutLogPreview = ({ workoutLogId, workoutLog: initialWorkoutLog, canEdit }) => {
    const [expanded, setExpanded] = useState(false);
    const [workoutLog, setWorkoutLog] = useState(initialWorkoutLog);
    const [loading, setLoading] = useState(!initialWorkoutLog);
  
    // Fetch workout log details if not provided
    useEffect(() => {
      const fetchWorkoutLog = async () => {
        if (!workoutLogId || workoutLog) return;
        
        try {
          setLoading(true);
          const response = await api.get(`/workouts/logs/${workoutLogId}/`);
          console.log('Fetched workout log:', response.data); // Debug log
          setWorkoutLog(response.data);
        } catch (err) {
          console.error('Error fetching workout log:', err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchWorkoutLog();
    }, [workoutLogId]);
  
    if (!workoutLog) return null;
  
    return (
      <div className="mt-4 bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50">
        {/* Status Indicator Line */}
        <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-500" />
        
        <div className="p-4">
          {/* Header with basic info */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">
                {workoutLog.name || "Workout"}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(workoutLog.date).toLocaleDateString()}</span>
                </div>
                {workoutLog.gym && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{workoutLog.gym.name}</span>
                  </div>
                )}
              </div>
            </div>
            
            {canEdit && (
              <Link 
                to={`/workouts/logs/${workoutLog.id}`}
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <FileEdit className="w-5 h-5" />
              </Link>
            )}
          </div>
  
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-gray-800/30 rounded-lg">
            <div className="text-sm">
              <div className="flex items-center text-gray-400 mb-1">
                <Dumbbell className="w-4 h-4 mr-1" />
                <span>Exercises</span>
              </div>
              <p className="text-white font-medium">
                {workoutLog.exercises?.length || 0}
              </p>
            </div>
            
            <div className="text-sm">
              <div className="flex items-center text-gray-400 mb-1">
                <Clock className="w-4 h-4 mr-1" />
                <span>Duration</span>
              </div>
              <p className="text-white font-medium">
                {workoutLog.duration || '-'} min
              </p>
            </div>
            
            <div className="text-sm">
              <div className="flex items-center text-gray-400 mb-1">
                <Target className="w-4 h-4 mr-1" />
                <span>Performance</span>
              </div>
              <p className="text-white font-medium">
                {workoutLog.mood_rating ? `${workoutLog.mood_rating}/10` : '-'}
              </p>
            </div>
          </div>
  
          {/* Expandable Exercise List */}
          {workoutLog.exercises?.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{expanded ? 'Hide' : 'Show'} Exercises</span>
              </button>
  
              {expanded && (
                <div className="mt-3 space-y-3">
                  {workoutLog.exercises.map((exercise, index) => (
                    <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-gray-400" />
                        <h5 className="font-medium text-white">{exercise.name}</h5>
                      </div>
                      {exercise.sets?.length > 0 && (
                        <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                          {exercise.sets.map((set, setIdx) => (
                            <div 
                              key={setIdx}
                              className="bg-gray-800/50 rounded p-2 text-center"
                            >
                              <div className="text-gray-400">Set {setIdx + 1}</div>
                              <div className="text-white font-medium">
                                {set.reps} × {set.weight}kg
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
};

export default WorkoutLogPreview;