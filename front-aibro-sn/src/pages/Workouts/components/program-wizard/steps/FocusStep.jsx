import React from 'react';
import { Target, Award, Check } from 'lucide-react';

const FOCUS_CHOICES = [
  { value: 'strength', label: 'Strength', description: 'Focus on building maximal strength', icon: '💪', 
    color: "from-blue-500 to-cyan-400", bgClass: "bg-gradient-to-br from-blue-500/10 to-cyan-400/10", borderClass: "border-blue-500/30" },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Optimize muscle growth', icon: '🏋️', 
    color: "from-purple-500 to-pink-400", bgClass: "bg-gradient-to-br from-purple-500/10 to-pink-400/10", borderClass: "border-purple-500/30" },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina', icon: '🏃', 
    color: "from-green-500 to-emerald-400", bgClass: "bg-gradient-to-br from-green-500/10 to-emerald-400/10", borderClass: "border-green-500/30" },
  { value: 'weight_loss', label: 'Weight Loss', description: 'Combine strength and cardio', icon: '⚖️', 
    color: "from-red-500 to-orange-400", bgClass: "bg-gradient-to-br from-red-500/10 to-orange-400/10", borderClass: "border-red-500/30" },
  { value: 'strength_hypertrophy', label: 'Strength & Hypertrophy', description: 'Balance strength and size', icon: '💯', 
    color: "from-indigo-500 to-blue-400", bgClass: "bg-gradient-to-br from-indigo-500/10 to-blue-400/10", borderClass: "border-indigo-500/30" },
  { value: 'general_fitness', label: 'General Fitness', description: 'Well-rounded fitness', icon: '🔄', 
    color: "from-amber-500 to-yellow-400", bgClass: "bg-gradient-to-br from-amber-500/10 to-yellow-400/10", borderClass: "border-amber-500/30" }
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to training', icon: '🌱', 
    color: "from-green-500 to-emerald-400", bgClass: "bg-gradient-to-br from-green-500/10 to-emerald-400/10", borderClass: "border-green-500/30" },
  { value: 'intermediate', label: 'Intermediate', description: 'Some training experience', icon: '🔄', 
    color: "from-blue-500 to-cyan-400", bgClass: "bg-gradient-to-br from-blue-500/10 to-cyan-400/10", borderClass: "border-blue-500/30" },
  { value: 'advanced', label: 'Advanced', description: 'Experienced trainee', icon: '🔥', 
    color: "from-red-500 to-orange-400", bgClass: "bg-gradient-to-br from-red-500/10 to-orange-400/10", borderClass: "border-red-500/30" }
];

const FocusStep = ({ formData, updateFormData }) => {
  // Handle focus selection
  const handleFocusSelect = (focus) => {
    updateFormData({ focus: focus });
  };

  // Handle difficulty selection
  const handleDifficultySelect = (level) => {
    updateFormData({ 
      difficulty_level: level,
      recommended_level: level 
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Focus Selection */}
      <div>
        <h3 className="text-xl font-bold text-center text-white mb-6">
          What's the main focus of this program?
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FOCUS_CHOICES.map((focus) => {
            const isSelected = formData.focus === focus.value;
            
            return (
              <div
                key={focus.value}
                onClick={() => handleFocusSelect(focus.value)}
                className={`
                  p-4 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                  ${isSelected ? `${focus.borderClass} ${focus.bgClass}` : 'border-gray-700 hover:border-gray-500'}
                  transform hover:scale-[1.02]
                `}
              >
                <div className="flex items-center justify-between">
                  {/* Icon & Info */}
                  <div className="flex items-center">
                    <div className={`
                      p-2 rounded-lg mr-3 transition-all duration-300 text-2xl
                      ${isSelected 
                        ? `bg-gradient-to-r ${focus.color} shadow-lg` 
                        : 'bg-gray-800'}
                    `}>
                      {focus.icon}
                    </div>
                    
                    <div>
                      <div className="text-lg font-semibold text-white">{focus.label}</div>
                      <div className="text-xs text-gray-400 mt-1">{focus.description}</div>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                    ${isSelected ? `bg-gradient-to-r ${focus.color}` : 'bg-gray-700'}
                  `}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
                
                {/* Bottom gradient bar for selected item */}
                {isSelected && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${focus.color}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="mt-10">
        <h3 className="text-xl font-bold text-center text-white mb-6">
          Choose a difficulty level
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          {DIFFICULTY_LEVELS.map((level) => {
            const isSelected = formData.difficulty_level === level.value;
            
            return (
              <div
                key={level.value}
                onClick={() => handleDifficultySelect(level.value)}
                className={`
                  p-4 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                  ${isSelected ? `${level.borderClass} ${level.bgClass}` : 'border-gray-700 hover:border-gray-500'}
                  transform hover:scale-[1.02] flex-1
                `}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className={`
                    p-3 rounded-full mb-3 transition-all duration-300 text-3xl
                    ${isSelected 
                      ? `bg-gradient-to-r ${level.color} shadow-lg` 
                      : 'bg-gray-800'}
                  `}>
                    {level.icon}
                  </div>
                  
                  <div className="text-lg font-semibold text-white">{level.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{level.description}</div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs bg-gradient-to-r ${level.color} text-white`}>
                      Selected
                    </div>
                  )}
                </div>
                
                {/* Bottom gradient bar for selected item */}
                {isSelected && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${level.color}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FocusStep;