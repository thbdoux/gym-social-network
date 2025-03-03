import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, Dumbbell, BarChart2, ChevronLeft, ChevronRight, TrendingUp, Info } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ProgressCharts = ({ workoutData = [] }) => {
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const [periodFilter, setPeriodFilter] = useState('month');
  const [hoveredInsight, setHoveredInsight] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);

  // Process workout data to generate charts data
  const processWorkoutData = () => {
    // Mock data generation (in a real app, this would come from workoutData)
    const currentDate = new Date();
    const mockData = {
      weeklyWorkouts: generateWeeklyWorkouts(currentDate),
      monthlyWorkouts: generateMonthlyWorkouts(currentDate),
      exerciseProgress: generateExerciseProgress(),
      weightLifted: generateWeightLifted()
    };
    
    return mockData;
  };

  // Generate mock weekly workout data
  const generateWeeklyWorkouts = (currentDate) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dayOfWeek = days[date.getDay()];
      
      data.push({
        day: dayOfWeek,
        workouts: Math.floor(Math.random() * 2),
        duration: Math.floor(Math.random() * 120) + 30,
        intensity: Math.floor(Math.random() * 5) + 5
      });
    }
    
    return data;
  };

  // Generate mock monthly workout data
  const generateMonthlyWorkouts = (currentDate) => {
    const data = [];
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    for (let i = 0; i < 12; i++) {
      const month = new Date(currentYear, i, 1);
      data.push({
        month: month.toLocaleString('default', { month: 'short' }),
        workouts: Math.floor(Math.random() * 18) + 5,
        duration: Math.floor(Math.random() * 1000) + 500,
        target: 16
      });
    }
    
    return data;
  };

  // Generate mock exercise progress data
  const generateExerciseProgress = () => {
    const data = [];
    const exercises = ['Bench Press', 'Squat', 'Deadlift'];
    
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      
      const entry = { date: formattedDate };
      
      exercises.forEach(exercise => {
        // Base weight + incremental progress
        const baseWeight = exercise === 'Bench Press' ? 135 : 
                         exercise === 'Squat' ? 185 : 
                         225;
        const progress = Math.floor(Math.random() * 5) * 5;
        entry[exercise] = baseWeight + progress + (i * 5);
      });
      
      data.unshift(entry); // Add to front to maintain chronological order
    }
    
    return data;
  };

  // Generate mock total weight lifted data
  const generateWeightLifted = () => {
    const data = [];
    
    for (let i = 0; i < 8; i++) {
      const week = `Week ${i+1}`;
      data.push({
        week,
        weight: 10000 + (i * 1000) + Math.floor(Math.random() * 1000),
        avg: 9500 + (i * 800)
      });
    }
    
    return data;
  };

  // Process data
  const chartData = processWorkoutData();
  
  // Define charts
  const charts = [
    {
      title: "Workout Frequency",
      description: "Track how often you're hitting the gym",
      icon: <Activity className="w-5 h-5 text-blue-400 group-hover:animate-pulse" />,
      color: "blue",
      component: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={periodFilter === 'week' ? chartData.weeklyWorkouts : chartData.monthlyWorkouts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" vertical={false} />
            <XAxis 
              dataKey={periodFilter === 'week' ? "day" : "month"} 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
              itemStyle={{ color: '#f3f4f6' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
            />
            <Bar 
              dataKey="workouts" 
              name="Workouts" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              barSize={periodFilter === 'week' ? 30 : 20}
              animationDuration={1500}
            />
            {periodFilter === 'month' && (
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#1f2937' }}
                animationDuration={1500}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Exercise Progress",
      description: "Track your strength gains over time",
      icon: <TrendingUp className="w-5 h-5 text-green-400 group-hover:rotate-6 transition-transform duration-300" />,
      color: "green",
      component: () => (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.exerciseProgress}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }}
              label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
              itemStyle={{ color: '#f3f4f6' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Bench Press" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: '#1f2937' }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#1f2937' }}
              animationDuration={1500}
            />
            <Line 
              type="monotone" 
              dataKey="Squat" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ stroke: '#10b981', strokeWidth: 2, r: 4, fill: '#1f2937' }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#1f2937' }}
              animationDuration={1700}
            />
            <Line 
              type="monotone" 
              dataKey="Deadlift" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ stroke: '#ef4444', strokeWidth: 2, r: 4, fill: '#1f2937' }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#1f2937' }}
              animationDuration={1900}
            />
          </LineChart>
        </ResponsiveContainer>
      )
    },
    {
      title: "Total Weight Lifted",
      description: "Your volume progress over time",
      icon: <Dumbbell className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-all duration-300" />,
      color: "purple",
      component: () => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.weightLifted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" vertical={false} />
            <XAxis 
              dataKey="week" 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }} 
              axisLine={{ stroke: '#4b5563' }}
              label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }}
              itemStyle={{ color: '#f3f4f6' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
            />
            <Legend />
            <Bar 
              dataKey="weight" 
              name="Total Weight" 
              fill="#8b5cf6" 
              radius={[4, 4, 0, 0]} 
              barSize={40}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="avg"
              name="Average"
              stroke="#ec4899"
              strokeWidth={2}
              dot={false}
              animationDuration={1800}
            />
          </BarChart>
        </ResponsiveContainer>
      )
    }
  ];
  
  const currentChart = charts[activeChartIndex];
  
  const nextChart = () => {
    setActiveChartIndex((prev) => (prev + 1) % charts.length);
  };
  
  const prevChart = () => {
    setActiveChartIndex((prev) => (prev - 1 + charts.length) % charts.length);
  };
  
  // Function to get color classes based on the chart color
  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return {
          bgLight: 'bg-blue-500/20',
          bg: 'bg-blue-500',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          hover: 'hover:bg-blue-500/30',
          gradient: 'from-blue-500/20 to-blue-600/10'
        };
      case 'green':
        return {
          bgLight: 'bg-green-500/20',
          bg: 'bg-green-500',
          text: 'text-green-400',
          border: 'border-green-500/30',
          hover: 'hover:bg-green-500/30',
          gradient: 'from-green-500/20 to-green-600/10'
        };
      case 'purple':
        return {
          bgLight: 'bg-purple-500/20',
          bg: 'bg-purple-500',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          hover: 'hover:bg-purple-500/30',
          gradient: 'from-purple-500/20 to-purple-600/10'
        };
      default:
        return {
          bgLight: 'bg-blue-500/20',
          bg: 'bg-blue-500',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          hover: 'hover:bg-blue-500/30',
          gradient: 'from-blue-500/20 to-blue-600/10'
        };
    }
  };
  
  const colorClasses = getColorClasses(currentChart.color);
  
  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl p-6 shadow-xl transition-all duration-500 hover:shadow-2xl hover:from-gray-800/60 hover:to-gray-900/80 transform hover:scale-[1.01]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col group">
          <div className="flex items-center gap-2">
            {currentChart.icon}
            <h2 className="text-xl font-bold group-hover:text-white transition-colors duration-300">{currentChart.title}</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors duration-300">{currentChart.description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Filter */}
          {activeChartIndex === 0 && (
            <div className="flex">
              <button
                onClick={() => setPeriodFilter('week')}
                className={`px-3 py-1 text-sm rounded-l-lg transition-all duration-300 ${
                  periodFilter === 'week' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } hover:shadow-md`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-3 py-1 text-sm rounded-r-lg transition-all duration-300 ${
                  periodFilter === 'month' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } hover:shadow-md`}
              >
                Month
              </button>
            </div>
          )}
          
          {/* Chart Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevChart}
              onMouseEnter={() => setHoveredNav('prev')}
              onMouseLeave={() => setHoveredNav(null)}
              className="p-1.5 rounded-full bg-gray-800/70 hover:bg-gray-700 transition-all duration-300 hover:shadow-md"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${hoveredNav === 'prev' ? '-translate-x-0.5' : ''}`} />
            </button>
            <button
              onClick={nextChart}
              onMouseEnter={() => setHoveredNav('next')}
              onMouseLeave={() => setHoveredNav(null)}
              className="p-1.5 rounded-full bg-gray-800/70 hover:bg-gray-700 transition-all duration-300 hover:shadow-md"
            >
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${hoveredNav === 'next' ? 'translate-x-0.5' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart Display */}
      <div className="mt-4 pt-2 animate-fadeIn bg-gray-800/30 p-4 rounded-lg transition-all duration-300 hover:bg-gray-800/40">
        {currentChart.component()}
      </div>
      
      {/* Chart navigation dots */}
      <div className="flex justify-center gap-2 mt-6">
        {charts.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveChartIndex(index)}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === activeChartIndex 
                ? `${colorClasses.bg} w-8` 
                : 'bg-gray-600 hover:bg-gray-500 w-2 hover:w-4'
            }`}
          />
        ))}
      </div>
      
      {/* Chart Insights */}
      <div 
        className={`mt-6 pt-4 border-t ${colorClasses.border} px-4 py-3 ${colorClasses.bgLight} rounded-lg transition-all duration-300 ${colorClasses.hover} relative cursor-pointer group`}
        onMouseEnter={() => setHoveredInsight(true)}
        onMouseLeave={() => setHoveredInsight(false)}
      >
        <div className="flex items-start gap-2">
          <Info className={`${colorClasses.text} w-4 h-4 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:rotate-12`} />
          <div>
            <h3 className={`text-sm font-medium ${colorClasses.text} mb-1 group-hover:translate-x-0.5 transition-transform duration-300`}>Insights</h3>
            <p className="text-sm text-gray-300 transition-all duration-300 group-hover:text-white">
              {activeChartIndex === 0 && "You've completed 12 workouts this month, 25% more than last month. Keep up the good work!"}
              {activeChartIndex === 1 && "Your bench press has improved by 15 lbs in the last 4 weeks. Great progress on your strength goals!"}
              {activeChartIndex === 2 && "You're lifting 8% more total weight each week compared to your average. Your volume is trending up!"}
            </p>
          </div>
        </div>
        
        {/* Pulse animation on hover */}
        <div className={`absolute inset-0 ${colorClasses.gradient} rounded-lg opacity-0 transition-opacity duration-500 pointer-events-none ${hoveredInsight ? 'opacity-100 animate-pulse' : ''}`}></div>
      </div>
    </div>
  );
};

export default ProgressCharts;