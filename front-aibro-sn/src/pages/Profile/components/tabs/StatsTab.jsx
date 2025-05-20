import React from 'react';
import { 
  Trophy, 
  Dumbbell, 
  Activity, 
  Users, 
  Heart, 
  Target, 
  Calendar, 
  TrendingUp 
} from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext';

// Stat card component
const StatCard = ({ label, value, icon, className = "" }) => (
  <div className={`rounded-lg p-4 text-center ${className}`}>
    <div className="flex flex-col items-center">
      {icon && <div className="mb-2">{icon}</div>}
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  </div>
);

const StatsTab = ({ userData, workoutLogs, posts, friends }) => {
  const { t } = useLanguage();
  
  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label={t('workouts')} 
          value={userData?.workout_count || 0} 
          icon={<Dumbbell className="w-5 h-5 text-blue-400" />} 
          className="bg-blue-900/20"
        />
        <StatCard 
          label={t('posts')} 
          value={userData?.posts?.length || 0} 
          icon={<Activity className="w-5 h-5 text-purple-400" />} 
          className="bg-purple-900/20"
        />
        <StatCard 
          label={t('friends')} 
          value={userData?.friend_count || 0} 
          icon={<Users className="w-5 h-5 text-green-400" />} 
          className="bg-green-900/20"
        />
        <StatCard 
          label={t('likes')} 
          value={userData?.total_likes || 0} 
          icon={<Heart className="w-5 h-5 text-pink-400" />} 
          className="bg-pink-900/20"
        />
      </div>
      
      <div className="bg-gray-800/40 rounded-xl p-5 mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          {t('training_history')}
        </h3>
        
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700/30">
            <div className="text-gray-300">{t('current_streak')}</div>
            <div className="flex items-center gap-1 text-blue-400">
              <Calendar className="w-4 h-4" />
              <span className="font-bold">{userData?.current_streak || 0} {t('days')}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700/30">
            <div className="text-gray-300">{t('longest_streak')}</div>
            <div className="flex items-center gap-1 text-green-400">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{userData?.longest_streak || 0} {t('days')}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-700/30">
            <div className="text-gray-300">{t('avg_workouts_per_week')}</div>
            <div className="flex items-center gap-1 text-purple-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold">{userData?.avg_workouts_per_week || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      {userData?.fitness_goals && (
        <div className="bg-gray-800/40 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            {t('fitness_goals')}
          </h3>
          <p className="text-gray-300">{userData.fitness_goals}</p>
        </div>
      )}
      
      {/* Workout Frequency Graph - Placeholder */}
      <div className="bg-gray-800/40 rounded-xl p-5 mt-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          {t('workout_frequency')}
        </h3>
        
        <div className="h-40 bg-gray-900/50 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">
            {t('workout_frequency_chart_placeholder')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;