import React from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

const ScheduleStep = ({ formData, updateFormData }) => {
  // Days per week options
  const daysPerWeekOptions = [
    { value: 2, label: "2 days per week", description: "Minimal frequency, good for beginners" },
    { value: 3, label: "3 days per week", description: "Popular for full body routines" },
    { value: 4, label: "4 days per week", description: "Common for upper/lower splits" },
    { value: 5, label: "5 days per week", description: "Good for push/pull/legs routines" },
    { value: 6, label: "6 days per week", description: "High frequency for advanced trainees" }
  ];
  
  // Duration options
  const durationOptions = [
    { value: 4, label: "4 weeks", description: "Short introductory program" },
    { value: 6, label: "6 weeks", description: "Brief specialization cycle" },
    { value: 8, label: "8 weeks", description: "Standard program length" },
    { value: 12, label: "12 weeks", description: "Comprehensive training block" },
    { value: 16, label: "16 weeks", description: "Long-term periodized program" }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* Days per week selection */}
      <div>
        <h3 className="text-xl font-bold text-center text-white mb-6">
          How many workouts per week?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {daysPerWeekOptions.map((option) => {
            const isSelected = formData.sessions_per_week === option.value;
            
            return (
              <div
                key={option.value}
                onClick={() => updateFormData({ sessions_per_week: option.value })}
                className={`
                  p-4 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? 'border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-blue-800/20' 
                    : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
                  transform hover:scale-[1.02]
                `}
              >
                <div className="flex items-center mb-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mr-3 text-lg font-bold
                    ${isSelected 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                      : 'bg-gray-700 text-gray-300'}
                  `}>
                    {option.value}
                  </div>
                  <div className="text-white font-medium">{option.label}</div>
                </div>
                
                <p className="text-xs text-gray-400 ml-13">
                  {option.description}
                </p>
                
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                
                {/* Bottom gradient bar for selected item */}
                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Program duration selection */}
      <div>
        <h3 className="text-xl font-bold text-center text-white mb-6">
          Program duration
        </h3>
        
        <div className="flex flex-col items-center">
          {/* Duration slider */}
          <div className="w-full max-w-lg flex items-center mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 mr-4">
              <Calendar className="w-6 h-6" />
            </div>
            
            <div className="flex-1 px-2">
              <input
                type="range"
                min="4"
                max="16"
                step="2"
                value={formData.estimated_completion_weeks}
                onChange={(e) => updateFormData({ estimated_completion_weeks: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>4 weeks</span>
                <span>8 weeks</span>
                <span>12 weeks</span>
                <span>16 weeks</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 ml-4 relative">
              <div className="absolute inset-1 bg-blue-600/10 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{formData.estimated_completion_weeks}</div>
                  <div className="text-xs text-gray-400">weeks</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Duration cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full">
            {durationOptions.map((option) => {
              const isSelected = formData.estimated_completion_weeks === option.value;
              
              return (
                <div
                  key={option.value}
                  onClick={() => updateFormData({ estimated_completion_weeks: option.value })}
                  className={`
                    p-3 rounded-lg border overflow-hidden cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500/50 bg-blue-600/10' 
                      : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
                  `}
                >
                  <div className="flex items-center">
                    <div className={`
                      w-4 h-4 rounded-full mr-2
                      ${isSelected ? 'bg-blue-500' : 'bg-gray-600'}
                    `}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-white font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-6">
                    {option.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleStep;