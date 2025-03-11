import React, { useState } from 'react';
import { 
  Trophy, ChevronUp, ChevronDown, Dumbbell, 
  Activity, Users, Heart, TrendingUp, Target
} from 'lucide-react';

const StatsCard = ({ user, workoutLogs, friends, posts }) => {
  const [showStats, setShowStats] = useState(true);

  // StatCard Component
  const StatCard = ({ count, label, icon, bgColor, hoverColor }) => (
    <div className={`rounded-lg p-3 text-center transition-all duration-300 transform hover:scale-105 ${bgColor} ${hoverColor}`}>
      <div className="flex flex-col items-center">
        {icon && <div className="mb-1 transition-all duration-300 hover:scale-110">{icon}</div>}
        <div className="text-xl font-bold">{count}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl overflow-hidden shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2 group">
            <Trophy className="w-5 h-5 text-yellow-400 transition-transform duration-300 group-hover:rotate-12" />
            <span className="group-hover:text-yellow-300 transition-colors duration-300">Stats</span>
          </h2>
          <button 
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800/70 rounded-full"
          >
            {showStats ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Condensed Stats Summary */}
        <div className={`grid grid-cols-2 gap-3 mt-4 transition-all duration-500 ${showStats ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <StatCard 
            count={user?.total_workouts || workoutLogs.length} 
            label="Workouts" 
            icon={<Dumbbell className="w-4 h-4 text-blue-400" />} 
            bgColor="bg-blue-900/20"
            hoverColor="hover:bg-blue-900/30"
          />
          
          <StatCard 
            count={posts.length} 
            label="Posts" 
            icon={<Activity className="w-4 h-4 text-purple-400" />} 
            bgColor="bg-purple-900/20"
            hoverColor="hover:bg-purple-900/30"
          />
          
          <StatCard 
            count={friends.length} 
            label="Friends" 
            icon={<Users className="w-4 h-4 text-green-400" />}
            bgColor="bg-green-900/20"
            hoverColor="hover:bg-green-900/30"
          />
          
          <StatCard 
            count={user?.total_likes || 0} 
            label="Likes" 
            icon={<Heart className="w-4 h-4 text-pink-400" />}
            bgColor="bg-pink-900/20"
            hoverColor="hover:bg-pink-900/30"
          />
        </div>
        
        {/* Extended Stats - Conditionally Shown */}
        {showStats && (
          <div className="mt-5 pt-4 border-t border-gray-700/30 space-y-3 animate-fadeIn">
            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
              <div className="text-gray-400">Current Streak</div>
              <div className="flex items-center gap-1 text-blue-400">
                <Dumbbell className="w-4 h-4" />
                <span className="font-bold">{user?.current_streak || 0} days</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
              <div className="text-gray-400">Longest Streak</div>
              <div className="flex items-center gap-1 text-green-400">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">{user?.longest_streak || 0} days</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/40 transition-colors duration-200">
              <div className="text-gray-400">Avg. Workouts/Week</div>
              <div className="flex items-center gap-1 text-purple-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold">{user?.avg_workouts_per_week || 0}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Fitness Goals */}
        {user?.fitness_goals && (
          <div className="mt-5 pt-4 border-t border-gray-700/30 animate-fadeIn">
            <h3 className="font-medium text-white mb-2 flex items-center gap-1">
              <Target className="w-4 h-4 text-yellow-400" />
              Fitness Goals
            </h3>
            <p className="text-gray-300 text-sm">{user.fitness_goals}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;