import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Award, Heart, Activity, Calendar, Clock, PieChart as PieChartIcon,
  Dumbbell, BarChart2
} from 'lucide-react';
import { parseDate } from './ActivityComponents';

// Main Statistics View component
const WorkoutStatisticsView = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-800/40 rounded-xl">
        <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-400">No workout data available</h3>
        <p className="text-gray-500 mt-1">Log workouts to see your statistics and progress.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6">
          <WorkoutProgressChart logs={logs} />
        </div>
        <div className="space-y-6">
          <StreakTracker logs={logs} />
          <WorkoutCategoryBreakdown logs={logs} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gray-800 rounded-xl p-6">
          <ExerciseStrengthProgress logs={logs} />
        </div>
        <div className="lg:col-span-1 bg-gray-800 rounded-xl p-6">
          <WorkoutMoodAnalysis logs={logs} />
        </div>
        <div className="lg:col-span-1 bg-gray-800 rounded-xl p-6">
          <WeekdayDistribution logs={logs} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <PersonalRecords logs={logs} />
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <WorkoutDurationTrend logs={logs} />
        </div>
      </div>
    </div>
  );
};

// Streak Tracker component
const StreakTracker = ({ logs }) => {
  // Calculate current streak
  const streak = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    
    // Sort logs by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    let currentStreak = 1;
    let lastDate = new Date(sortedLogs[0].date);
    
    // Check for consecutive days
    for (let i = 1; i < sortedLogs.length; i++) {
      const currentDate = new Date(sortedLogs[i].date);
      const daysDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
        lastDate = currentDate;
      } else if (daysDiff > 1) {
        break;
      }
    }
    
    return currentStreak;
  }, [logs]);
  
  // Calculate longest streak
  const longestStreak = useMemo(() => {
    if (!logs || logs.length === 0) return 0;
    
    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
    
    let maxStreak = 1;
    let currentStreak = 1;
    let lastDate = new Date(sortedLogs[0].date);
    
    // Check for consecutive days
    for (let i = 1; i < sortedLogs.length; i++) {
      const currentDate = new Date(sortedLogs[i].date);
      const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (daysDiff > 1) {
        currentStreak = 1;
      }
      
      lastDate = currentDate;
    }
    
    return maxStreak;
  }, [logs]);
  
  return (
    <div className="bg-gradient-to-r from-blue-600/20 to-indigo-500/20 rounded-xl p-6">
      <h2 className="font-bold text-lg mb-3 text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        Workout Streaks
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-3xl font-bold text-blue-400">{streak}</div>
          <div className="text-xs text-blue-300">Current streak</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-3xl font-bold text-indigo-400">{longestStreak}</div>
          <div className="text-xs text-indigo-300">Longest streak</div>
        </div>
      </div>
      
      <p className="text-sm text-blue-200 mt-3">Keep going! Consistency is key to reaching your fitness goals.</p>
    </div>
  );
};

// Workout Progress Chart component
const WorkoutProgressChart = ({ logs }) => {
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group by week for clearer trends
    const weeklyData = {};
    sortedLogs.forEach(log => {
      const date = parseDate(log.date);
      // Get week number (approximate - first day of week / 7)
      const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
      
      if (!weeklyData[weekNum]) {
        weeklyData[weekNum] = {
          week: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          totalWeight: 0,
          workoutCount: 0,
          avgIntensity: 0
        };
      }
      
      // Calculate total weight lifted
      let weightLifted = 0;
      log.exercises?.forEach(exercise => {
        exercise.sets?.forEach(set => {
          if (set.weight && set.reps) {
            weightLifted += (set.weight * set.reps);
          }
        });
      });
      
      weeklyData[weekNum].totalWeight += weightLifted;
      weeklyData[weekNum].workoutCount += 1;
      weeklyData[weekNum].avgIntensity += (log.rating || 3);
    });
    
    // Convert to array and calculate averages
    return Object.values(weeklyData).map(week => ({
      ...week,
      avgIntensity: Math.round((week.avgIntensity / week.workoutCount) * 10) / 10
    })).slice(-8); // Show last 8 weeks
  }, [logs]);
  
  return (
    <div>
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <span>Workout Progress</span>
      </h2>
      
      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="week" 
                tick={{ fill: '#ccc', fontSize: 12 }} 
                axisLine={{ stroke: '#666' }}
              />
              <YAxis 
                yAxisId="left" 
                tick={{ fill: '#ccc', fontSize: 12 }} 
                axisLine={{ stroke: '#666' }}
                orientation="left"
                label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: '#ccc', fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fill: '#ccc', fontSize: 12 }} 
                axisLine={{ stroke: '#666' }}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ color: '#ccc' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="totalWeight" 
                stroke="#4c8bf5" 
                strokeWidth={2}
                name="Total Weight Lifted"
                dot={{ r: 4, fill: '#4c8bf5' }}
                activeDot={{ r: 6, fill: '#4c8bf5' }}
              />
              <Bar 
                yAxisId="right"
                dataKey="workoutCount" 
                barSize={20} 
                fill="#34a853"
                name="Workout Count"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgIntensity" 
                stroke="#fbbc05" 
                strokeWidth={2}
                name="Avg. Intensity"
                dot={{ r: 4, fill: '#fbbc05' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          Not enough data to display progress trends.
        </div>
      )}
    </div>
  );
};

// Workout Category Breakdown component
const WorkoutCategoryBreakdown = ({ logs }) => {
  const pieData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    const categoryMap = {};
    logs.forEach(log => {
      // Determine primary focus (could be enhanced with real categorization)
      let category = "Other";
      
      // Simple heuristic - check workout name for common categories
      const name = log.workout_name?.toLowerCase() || '';
      if (name.includes('leg') || name.includes('squat')) {
        category = "Legs";
      } else if (name.includes('chest') || name.includes('bench')) {
        category = "Chest";
      } else if (name.includes('back') || name.includes('pull')) {
        category = "Back";
      } else if (name.includes('arm') || name.includes('bicep') || name.includes('tricep')) {
        category = "Arms";
      } else if (name.includes('shoulder') || name.includes('press')) {
        category = "Shoulders";
      } else if (name.includes('cardio') || name.includes('run')) {
        category = "Cardio";
      } else if (name.includes('core') || name.includes('ab')) {
        category = "Core";
      }
      
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      
      categoryMap[category]++;
    });
    
    // Convert to array for chart display
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);
  
  // Color mapping for categories
  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658', '#ff8042'];
  
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
        <PieChartIcon className="w-4 h-4 text-blue-400" />
        <span>Workout Focus</span>
      </h2>
      
      {pieData.length > 0 ? (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }}
                formatter={(value) => [`${value} workouts`, ``]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No category data available.
        </div>
      )}
    </div>
  );
};

// Exercise Strength Progress component
const ExerciseStrengthProgress = ({ logs }) => {
  const topExercises = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Map to track exercises
    const exerciseMap = {};
    
    // Process all exercise data from logs
    logs.forEach(log => {
      log.exercises?.forEach(exercise => {
        if (!exercise.name) return;
        
        if (!exerciseMap[exercise.name]) {
          exerciseMap[exercise.name] = {
            name: exercise.name,
            occurrences: 0,
            maxWeight: 0,
            history: []
          };
        }
        
        // Record this occurrence
        exerciseMap[exercise.name].occurrences++;
        
        // Find max weight for this exercise instance
        let instanceMaxWeight = 0;
        exercise.sets?.forEach(set => {
          if (set.weight && set.weight > instanceMaxWeight) {
            instanceMaxWeight = set.weight;
          }
        });
        
        // Update overall max
        if (instanceMaxWeight > exerciseMap[exercise.name].maxWeight) {
          exerciseMap[exercise.name].maxWeight = instanceMaxWeight;
        }
        
        // Record in history
        exerciseMap[exercise.name].history.push({
          date: log.date,
          weight: instanceMaxWeight
        });
      });
    });
    
    // Convert to array and sort by frequency
    return Object.values(exerciseMap)
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5); // Top 5 exercises
  }, [logs]);
  
  // Calculate progress percentage for each exercise
  const calculateProgress = (exercise) => {
    if (exercise.history.length < 2) return 0;
    
    // Sort by date
    const sortedHistory = [...exercise.history].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    const firstWeight = sortedHistory[0].weight;
    const lastWeight = sortedHistory[sortedHistory.length - 1].weight;
    
    if (firstWeight === 0) return 0;
    return Math.round(((lastWeight - firstWeight) / firstWeight) * 100);
  };
  
  return (
    <div>
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-green-400" />
        <span>Strength Progress</span>
      </h2>
      
      {topExercises.length > 0 ? (
        <div className="space-y-4">
          {topExercises.map(exercise => {
            const progress = calculateProgress(exercise);
            const isPositive = progress >= 0;
            
            return (
              <div key={exercise.name} className="space-y-1">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-white truncate pr-2" title={exercise.name}>
                    {exercise.name}
                  </div>
                  <div className={`text-xs font-medium flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {progress}%
                  </div>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(progress), 100)}%` }}
                  ></div>
                </div>
                
                <div className="text-xs text-gray-400">
                  Max: {exercise.maxWeight} kg • {exercise.occurrences} workouts
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No exercise data available.
        </div>
      )}
    </div>
  );
};

// Workout Mood Analysis component
const WorkoutMoodAnalysis = ({ logs }) => {
  const moodData = useMemo(() => {
    if (!logs || logs.length === 0) return { average: 0, distribution: [] };
    
    // Count workouts by rating
    const ratingCount = [0, 0, 0, 0, 0, 0]; // Index 0 not used (ratings 1-5)
    let totalRating = 0;
    let ratedWorkouts = 0;
    
    logs.forEach(log => {
      if (log.rating) {
        ratingCount[log.rating]++;
        totalRating += log.rating;
        ratedWorkouts++;
      }
    });
    
    const average = ratedWorkouts > 0 ? 
      Math.round((totalRating / ratedWorkouts) * 10) / 10 : 0;
    
    return {
      average,
      distribution: [
        { rating: 1, count: ratingCount[1], label: "😞" },
        { rating: 2, count: ratingCount[2], label: "😕" },
        { rating: 3, count: ratingCount[3], label: "😐" },
        { rating: 4, count: ratingCount[4], label: "🙂" },
        { rating: 5, count: ratingCount[5], label: "😄" }
      ]
    };
  }, [logs]);
  
  return (
    <div>
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-red-400" />
        <span>Workout Satisfaction</span>
      </h2>
      
      {moodData.average > 0 ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-1">
              {moodData.average >= 4.5 ? "😄" :
               moodData.average >= 3.5 ? "🙂" :
               moodData.average >= 2.5 ? "😐" :
               moodData.average >= 1.5 ? "😕" : "😞"}
            </div>
            <div className="text-xl font-bold text-white">{moodData.average}</div>
            <div className="text-xs text-gray-400">Average rating</div>
          </div>
          
          <div className="space-y-2">
            {moodData.distribution.map(item => (
              <div key={item.rating} className="flex items-center">
                <div className="w-8 text-center">{item.label}</div>
                <div className="flex-1 mx-2">
                  <div className="bg-gray-700 h-4 rounded-full overflow-hidden">
                    <div 
                      className={`bg-blue-500 h-full ${item.rating >= 4 ? 'bg-green-500' : item.rating <= 2 ? 'bg-red-500' : 'bg-yellow-500'}`}
                      style={{ 
                        width: `${logs.length ? Math.max((item.count / logs.length) * 100, 0) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-300 w-8 text-right">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No workout ratings available.
        </div>
      )}
    </div>
  );
};

// Weekday Distribution component
const WeekdayDistribution = ({ logs }) => {
  const weekdayData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Count workouts by day of week
    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    
    logs.forEach(log => {
      try {
        const date = parseDate(log.date);
        dayCounts[date.getDay()]++;
      } catch (err) {
        console.error("Error parsing date:", log.date);
      }
    });
    
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    return days.map((day, index) => ({
      day,
      count: dayCounts[index]
    }));
  }, [logs]);
  
  return (
    <div>
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-indigo-400" />
        <span>Workout Days</span>
      </h2>
      
      {weekdayData.some(d => d.count > 0) ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekdayData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="day" 
                tick={{ fill: '#ccc', fontSize: 12 }} 
                axisLine={{ stroke: '#666' }}
              />
              <YAxis 
                tick={{ fill: '#ccc', fontSize: 12 }} 
                axisLine={{ stroke: '#666' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }}
                formatter={(value) => [`${value} workouts`, ``]}
              />
              <Bar 
                dataKey="count" 
                fill="#805AD5" 
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No data available.
        </div>
      )}
    </div>
  );
};

// Personal Records component
const PersonalRecords = ({ logs }) => {
  const records = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    // Map to track personal records
    const prMap = {};
    
    // Process all exercise data
    logs.forEach(log => {
      log.exercises?.forEach(exercise => {
        if (!exercise.name) return;
        
        // Find max weight
        let maxWeight = 0;
        let maxReps = 0;
        let bestSet = null;
        
        exercise.sets?.forEach(set => {
          if (set.weight && set.reps) {
            // Find heaviest weight
            if (set.weight > maxWeight) {
              maxWeight = set.weight;
              bestSet = { ...set, date: log.date };
            }
            
            // Find most reps
            if (set.reps > maxReps) {
              maxReps = set.reps;
            }
            
            // Calculate volume (weight x reps)
            const volume = set.weight * set.reps;
            
            // Update PR if this is bigger
            if (!prMap[exercise.name] || volume > prMap[exercise.name].volume) {
              prMap[exercise.name] = {
                name: exercise.name,
                weight: set.weight,
                reps: set.reps,
                volume: volume,
                date: log.date
              };
            }
          }
        });
      });
    });
    
    // Convert to array and sort by volume
    return Object.values(prMap)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5); // Top 5 PRs
  }, [logs]);
  
  return (
    <div>
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <BarChart2 className="w-5 h-5 text-yellow-400" />
        <span>Personal Records</span>
      </h2>
      
      {records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="pb-2 text-left">Exercise</th>
                <th className="pb-2 text-right">Weight</th>
                <th className="pb-2 text-right">Reps</th>
                <th className="pb-2 text-right">Volume</th>
                <th className="pb-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => {
                // Format date
                let dateStr = "Unknown";
                try {
                  const date = parseDate(record.date);
                  dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } catch (err) {}
                
                return (
                  <tr key={idx} className="text-sm border-b border-gray-700/50">
                    <td className="py-2 text-white truncate pr-4" title={record.name}>{record.name}</td>
                    <td className="py-2 text-right text-yellow-300">{record.weight} kg</td>
                    <td className="py-2 text-right text-gray-300">{record.reps}</td>
                    <td className="py-2 text-right text-gray-300">{record.volume}</td>
                    <td className="py-2 text-right text-gray-400">{dateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No personal records available.
        </div>
      )}
    </div>
  );
};

// Workout Duration Trend component
const WorkoutDurationTrend = ({ logs }) => {
  const durationData = useMemo(() => {
    if (!logs || logs.length === 0) return { average: 0, trend: [] };
    
    const logsWithDuration = logs.filter(log => !!log.duration);
    if (logsWithDuration.length === 0) return { average: 0, trend: [] };
    
    // Calculate average duration
    const totalDuration = logsWithDuration.reduce((sum, log) => sum + log.duration, 0);
    const average = Math.round(totalDuration / logsWithDuration.length);
    
    // Calculate monthly trends
    const monthlyData = {};
    
    logsWithDuration.forEach(log => {
      try {
        const date = parseDate(log.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = {
            label: date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
            total: 0,
            count: 0,
            key
          };
        }
        
        monthlyData[key].total += log.duration;
        monthlyData[key].count++;
      } catch (err) {
        console.error("Error parsing date:", log.date);
      }
    });
    
    // Calculate averages and sort by date
    const trend = Object.values(monthlyData)
      .map(month => ({
        ...month,
        average: Math.round(month.total / month.count)
      }))
      .sort((a, b) => new Date(a.key) - new Date(b.key))
      .slice(-6); // Last 6 months
    
    return { average, trend };
  }, [logs]);
  
  return (
    <div>
      <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-cyan-400" />
        <span>Workout Duration</span>
      </h2>
      
      {durationData.average > 0 ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{durationData.average}</div>
            <div className="text-xs text-gray-400">min. average workout time</div>
          </div>
          
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={durationData.trend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: '#ccc', fontSize: 12 }} 
                  axisLine={{ stroke: '#666' }}
                />
                <YAxis 
                  tick={{ fill: '#ccc', fontSize: 12 }} 
                  axisLine={{ stroke: '#666' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }}
                  formatter={(value) => [`${value} min`, 'Avg. Duration']}
                />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#06b6d4" 
                  fill="url(#colorDuration)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 text-sm">
          No duration data available.
        </div>
      )}
    </div>
  );
};

export default WorkoutStatisticsView;