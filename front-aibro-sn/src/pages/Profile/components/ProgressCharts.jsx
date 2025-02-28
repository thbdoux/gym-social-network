import React, { useState } from 'react';
import { 
  LineChart as LineChartIcon, 
  ArrowUpRight,
  BarChart2,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ProgressCharts = ({ stats }) => {
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  
  const charts = [
    {
      title: "Workouts Per Week",
      icon: <LineChartIcon className="w-5 h-5 text-blue-400" />,
      color: "blue",
      data: [3, 4, 5, 3, 6, 5, 4],
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      increase: "+20%",
      period: "vs last week"
    },
    {
      title: "Total Weight Lifted",
      icon: <BarChart2 className="w-5 h-5 text-purple-400" />,
      color: "purple",
      data: [12500, 13200, 15400, 14800, 16000],
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      increase: "+28%",
      period: "vs last month"
    },
    {
      title: "Workout Intensity",
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      color: "emerald",
      data: [65, 70, 75, 72, 80, 82],
      labels: ["Mon", "Wed", "Fri", "Mon", "Wed", "Fri"],
      increase: "+10%",
      period: "vs last week"
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
          border: 'border-blue-500/30'
        };
      case 'purple':
        return {
          bgLight: 'bg-purple-500/20',
          bg: 'bg-purple-500',
          text: 'text-purple-400',
          border: 'border-purple-500/30'
        };
      case 'emerald':
        return {
          bgLight: 'bg-emerald-500/20',
          bg: 'bg-emerald-500',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30'
        };
      default:
        return {
          bgLight: 'bg-blue-500/20',
          bg: 'bg-blue-500',
          text: 'text-blue-400',
          border: 'border-blue-500/30'
        };
    }
  };
  
  const colorClasses = getColorClasses(currentChart.color);
  
  // Function to find the max value in the data array for scaling
  const maxValue = Math.max(...currentChart.data);
  
  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:from-gray-800/60 hover:to-gray-900/80">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {currentChart.icon}
          <h2 className="text-xl font-bold">{currentChart.title}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 ${colorClasses.text}`}>
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-sm font-medium">{currentChart.increase}</span>
            <span className="text-xs text-gray-400">{currentChart.period}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={prevChart}
              className="p-1.5 rounded-full bg-gray-800/70 hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextChart}
              className="p-1.5 rounded-full bg-gray-800/70 hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-500">
          <div>{maxValue}</div>
          <div>{Math.round(maxValue/2)}</div>
          <div>0</div>
        </div>
        
        {/* Chart content */}
        <div className="ml-8">
          <div className="h-64 flex items-end justify-between gap-1 mb-2">
            {currentChart.data.map((value, index) => {
              const heightPercentage = (value / maxValue) * 100;
              return (
                <div 
                  key={index} 
                  className="group relative flex-1 flex flex-col items-center justify-end h-full"
                >
                  <div className={`w-full ${colorClasses.bgLight} rounded-t opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute inset-0`}></div>
                  
                  {/* Tooltip */}
                  <div className={`absolute -top-8 px-2 py-1 ${colorClasses.bgLight} ${colorClasses.text} text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    {value}
                  </div>
                  
                  <div 
                    className={`w-full ${colorClasses.bg} rounded-t transition-all duration-500 group-hover:opacity-90`}
                    style={{ height: `${heightPercentage}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between">
            {currentChart.labels.map((label, index) => (
              <div key={index} className="text-center text-xs text-gray-500 mt-1">{label}</div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chart navigation dots */}
      <div className="flex justify-center gap-2 mt-6">
        {charts.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveChartIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeChartIndex 
                ? `${colorClasses.bg} w-4` 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressCharts;