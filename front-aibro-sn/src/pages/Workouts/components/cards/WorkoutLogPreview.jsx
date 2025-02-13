// components/cards/WorkoutLogPreview.jsx
import React from 'react';
import { Activity, Calendar, MapPin, BarChart2 } from 'lucide-react';

const WorkoutLogPreview = ({ log, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-gray-800/40 p-6 rounded-xl hover:bg-gray-800/60 
               transition-all cursor-pointer group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div className="bg-blue-500/20 p-3 rounded-xl">
          <Activity className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 
                       transition-colors">
            {log.workout_name}
          </h3>
          <div className="flex items-center space-x-4 mt-1 text-gray-400">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(log.date).toLocaleDateString()}
            </div>
            {log.gym_name && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {log.gym_name}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {log.completed ? (
        <span className="px-3 py-1 bg-green-500/20 text-green-400 
                      rounded-full text-sm">
          Completed
        </span>
      ) : (
        <span className="px-3 py-1 bg-gray-700 text-gray-400 
                      rounded-full text-sm">
          In Progress
        </span>
      )}
    </div>
    
    {log.performance_notes && (
      <p className="text-gray-400 mb-4 line-clamp-2">{log.performance_notes}</p>
    )}
    
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="text-sm text-gray-400 mb-1">Exercises</div>
        <div className="text-lg font-semibold text-white">
          {log.exercises?.length || 0}
        </div>
      </div>
      
      {log.mood_rating && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-sm text-gray-400 mb-1">Mood</div>
          <div className="text-lg font-semibold text-white">
            {log.mood_rating}/10
          </div>
        </div>
      )}
      
      {log.perceived_difficulty && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-sm text-gray-400 mb-1">Difficulty</div>
          <div className="text-lg font-semibold text-white">
            {log.perceived_difficulty}/10
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="text-sm text-gray-400 mb-1">Volume</div>
        <div className="text-lg font-semibold text-white">
          {log.exercises?.reduce((total, ex) => 
            total + ex.sets.reduce((setTotal, set) => 
              setTotal + (set.reps * set.weight), 0
            ), 0
          )} kg
        </div>
      </div>
    </div>
  </div>
);

export default WorkoutLogPreview;