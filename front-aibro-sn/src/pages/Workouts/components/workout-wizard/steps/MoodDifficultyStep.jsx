import React from 'react';
import { Flame, Shield, Target, Zap } from 'lucide-react';

const MoodDifficultyStep = ({ formData, updateFormData, colors }) => {
  // Mood levels with emojis
  const moodLevels = [
    { value: 2, emoji: "😫", label: "Terrible" },
    { value: 4, emoji: "☹️", label: "Poor" },
    { value: 6, emoji: "🙂", label: "Good" },
    { value: 8, emoji: "😀", label: "Great" },
    { value: 10, emoji: "🔥", label: "Amazing" }
  ];
  
  // Difficulty levels with visual presentation
  const difficultyLevels = [
    { 
      value: 2, 
      label: "Easy", 
      icon: <Shield className="w-5 h-5" />,
      bgColor: "from-green-500 to-green-400"
    },
    { 
      value: 5, 
      label: "Moderate", 
      icon: <Target className="w-5 h-5" />,
      bgColor: "from-yellow-500 to-yellow-400"
    },
    { 
      value: 8, 
      label: "Hard", 
      icon: <Flame className="w-5 h-5" />,
      bgColor: "from-orange-500 to-orange-400"
    },
    { 
      value: 10, 
      label: "Extreme", 
      icon: <Zap className="w-5 h-5" />,
      bgColor: "from-red-500 to-red-400"
    }
  ];
  
  // Get current mood details
  const getCurrentMoodDetails = () => {
    return moodLevels.find(m => m.value >= formData.mood_rating) || moodLevels[moodLevels.length - 1];
  };
  
  // Get current difficulty level
  const getCurrentDifficultyLevel = () => {
    return difficultyLevels.find(d => d.value >= formData.perceived_difficulty) || difficultyLevels[difficultyLevels.length - 1];
  };
  
  const currentMood = getCurrentMoodDetails();
  const currentLevel = getCurrentDifficultyLevel();

  // Ensure completed is set to true by default
  React.useEffect(() => {
    if (formData.completed === undefined || formData.completed === null) {
      updateFormData({ completed: true });
    }
  }, []);
  
  // Vertical mood gauge
  const renderMoodGauge = () => {
    const maxValue = 10;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative h-52 mb-3 flex justify-center">
          {/* Mood gauge */}
          <div className="h-full w-12 bg-gray-800 rounded-full overflow-hidden flex items-end justify-center relative">
            <div 
              className="w-full rounded-t-full bg-gradient-to-t from-blue-500 to-purple-400 transition-all duration-300"
              style={{ height: `${(formData.mood_rating / maxValue) * 100}%` }}
            ></div>
            
            {/* Clickable areas for mood */}
            <div className="absolute inset-0">
              {[...Array(maxValue)].map((_, index) => {
                const moodValue = maxValue - index;
                return (
                  <div
                    key={`mood-${moodValue}`}
                    onClick={() => updateFormData({ mood_rating: moodValue })}
                    className="absolute w-full cursor-pointer"
                    style={{ 
                      height: `${100 / maxValue}%`, 
                      top: `${(index * 100) / maxValue}%`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
          
          {/* Current mood indicator - right side - aligned to center */}
          <div className="absolute left-16 top-0 h-full flex items-center justify-center">
            {moodLevels.map((mood, index) => {
              const isActive = formData.mood_rating >= mood.value;
              const nextMood = moodLevels[index + 1];
              const topPosition = nextMood 
                ? 100 - ((nextMood.value / maxValue) * 100)
                : 0;
              const heightPercentage = nextMood 
                ? ((nextMood.value - mood.value) / maxValue) * 100
                : (mood.value / maxValue) * 100;
              
              return (
                <div 
                  key={mood.value}
                  className={`absolute left-0 transition-all duration-300 hover:scale-105
                    ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-50'}`}
                  style={{ 
                    top: `${topPosition}%`,
                    height: `${heightPercentage}%`
                  }}
                  onClick={() => updateFormData({ mood_rating: mood.value })}
                >
                  <div className={`p-3 rounded-full text-xl ${isActive ? colors.bg : 'bg-gray-700'} 
                    flex items-center justify-center hover:shadow-lg transition-all cursor-pointer`}>
                    {mood.emoji}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current mood emoji indicator */}
        <div className="text-3xl animate-pulse">
          {currentMood.emoji}
        </div>
      </div>
    );
  };
  
  // Vertical difficulty gauge
  const renderDifficultyGauge = () => {
    const maxValue = 10;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative h-52 mb-3 flex justify-center">
          {/* Difficulty gauge */}
          <div className="h-full w-12 bg-gray-800 rounded-full overflow-hidden flex items-end justify-center relative">
            <div 
              className={`w-full rounded-t-full bg-gradient-to-t ${currentLevel.bgColor} transition-all duration-300`}
              style={{ height: `${(formData.perceived_difficulty / maxValue) * 100}%` }}
            ></div>
            
            {/* Clickable areas for difficulty */}
            <div className="absolute inset-0">
              {[...Array(maxValue)].map((_, index) => {
                const diffValue = maxValue - index;
                return (
                  <div
                    key={`diff-${diffValue}`}
                    onClick={() => updateFormData({ perceived_difficulty: diffValue })}
                    className="absolute w-full cursor-pointer"
                    style={{ 
                      height: `${100 / maxValue}%`, 
                      top: `${(index * 100) / maxValue}%`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
          
          {/* Current level indicator - right side - aligned to center */}
          <div className="absolute left-16 top-0 h-full flex items-center justify-center">
            {difficultyLevels.map((level, index) => {
              const isActive = formData.perceived_difficulty >= level.value;
              const nextLevel = difficultyLevels[index + 1];
              const topPosition = nextLevel 
                ? 100 - ((nextLevel.value / maxValue) * 100)
                : 0;
              const heightPercentage = nextLevel 
                ? ((nextLevel.value - level.value) / maxValue) * 100
                : (level.value / maxValue) * 100;
              
              return (
                <div 
                  key={level.value}
                  className={`absolute left-0 transition-all duration-300 hover:scale-105
                    ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-50'}`}
                  style={{ 
                    top: `${topPosition}%`,
                    height: `${heightPercentage}%`
                  }}
                  onClick={() => updateFormData({ perceived_difficulty: level.value })}
                >
                  <div className={`p-3 rounded-full ${isActive ? colors.bg : 'bg-gray-700'} 
                    hover:shadow-lg transition-all cursor-pointer`}>
                    {level.icon}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current level icon indicator */}
        <div className="text-3xl p-2 rounded-full bg-gray-800 animate-pulse">
          {currentLevel.icon}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Left column - Mood */}
        <div>
          <label className="block text-gray-300 mb-4 font-medium text-center">
            How did you feel?
          </label>
          {renderMoodGauge()}
        </div>
        
        {/* Right column - Difficulty */}
        <div>
          <label className="block text-gray-300 mb-4 font-medium text-center">
            How difficult was it?
          </label>
          {renderDifficultyGauge()}
        </div>
      </div>
    </div>
  );
};

export default MoodDifficultyStep;