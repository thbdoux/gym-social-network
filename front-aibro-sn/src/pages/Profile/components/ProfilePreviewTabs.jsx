import React, { useState } from 'react';
import { 
  Trophy, 
  Dumbbell, 
  Activity, 
  Users, 
  Heart, 
  Target, 
  Calendar, 
  TrendingUp, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';
import { getAvatarUrl } from '../../../utils/imageUtils';
import { ProgramCard } from '../../Workouts/components/ProgramCard';
import WorkoutLogCard from '../../Workouts/components/WorkoutLogCard';
import OverviewTab from './tabs/OverviewTab';
import StatsTab from './tabs/StatsTab';
import ActivityTab from './tabs/ActivityTab';

// Tab button component
const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 relative ${
      active ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    <div className="flex items-center gap-2">
      {label}
    </div>
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
    )}
  </button>
);

const ProfilePreviewTabs = ({ 
  userData, 
  workoutLogs, 
  posts, 
  friends, 
  fullProgramData,
  activeTab, 
  setActiveTab,
  handleProgramSelect,
  handleWorkoutLogSelect
}) => {
  return (
    <>
      {/* Tab Navigation */}
      <div className="border-b border-gray-700/50 px-6 mt-6">
        <div className="flex">
          <TabButton 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <TabButton 
            label="Stats" 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')} 
          />
          <TabButton 
            label="Recent Activity" 
            active={activeTab === 'activity'} 
            onClick={() => setActiveTab('activity')} 
          />
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            userData={userData}
            friends={friends}
            fullProgramData={fullProgramData}
            handleProgramSelect={handleProgramSelect}
          />
        )}
        
        {activeTab === 'stats' && (
          <StatsTab 
            userData={userData}
            workoutLogs={workoutLogs}
            posts={posts}
            friends={friends}
          />
        )}
        
        {activeTab === 'activity' && (
          <ActivityTab 
            userData={userData}
            posts={posts}
            handleWorkoutLogSelect={handleWorkoutLogSelect}
            handleProgramSelect={handleProgramSelect}
          />
        )}
      </div>
    </>
  );
};

export default ProfilePreviewTabs;