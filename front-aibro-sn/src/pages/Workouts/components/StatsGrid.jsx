import React from 'react';

const StatCard = ({ label, value }) => (
  <div className="bg-gray-800/40 p-4 rounded-xl">
    <div className="text-gray-400 text-sm mb-1">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

const StatsGrid = ({ totalWorkouts, daysPerWeek, totalExercises }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Total Workouts" value={totalWorkouts} />
      <StatCard label="Days per Week" value={daysPerWeek} />
      <StatCard label="Total Exercises" value={totalExercises} />
    </div>
  );
};

export default StatsGrid;