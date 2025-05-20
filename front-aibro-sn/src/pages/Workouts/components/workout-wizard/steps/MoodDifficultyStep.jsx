import React from 'react';
import { Flame, Shield, Target, Zap } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

const MoodDifficultyStep = ({ formData, updateFormData, colors }) => {
  const { t } = useLanguage();
  
  // Mood levels with emojis
  const getMoodLevels = () => [
    { value: 2, emoji: "😫", label: t("terrible") },
    { value: 4, emoji: "☹️", label: t("poor") },
    { value: 6, emoji: "🙂", label: t("good") },
    { value: 8, emoji: "😀", label: t("great") },
    { value: 10, emoji: "🔥", label: t("amazing") }
  ];
  
  // Difficulty levels with visual presentation
  const getDifficultyLevels = () => [
    { 
      value: 2, 
      label: t("easy"), 
      icon: <Shield className="w-5 h-5" />,
      bgColor: "from-green-500 to-green-400",
      description: t("light_effort")
    },
    { 
      value: 5, 
      label: t("moderate"), 
      icon: <Target className="w-5 h-5" />,
      bgColor: "from-yellow-500 to-yellow-400",
      description: t("medium_effort")
    },
    { 
      value: 8, 
      label: t("hard"), 
      icon: <Flame className="w-5 h-5" />,
      bgColor: "from-orange-500 to-orange-400",
      description: t("challenging")
    },
    { 
      value: 10, 
      label: t("extreme"), 
      icon: <Zap className="w-5 h-5" />,
      bgColor: "from-red-500 to-red-400",
      description: t("maximum_effort")
    }
  ];
  
  const moodLevels = getMoodLevels();
  const difficultyLevels = getDifficultyLevels();
  
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
  
  // Improved vertical mood gauge (without right-side emoji indicators)
  const renderMoodGauge = () => {
    const maxValue = 10;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative h-52 mb-6 flex justify-center">
          {/* Mood gauge */}
          <div className="h-full w-16 bg-gray-800 rounded-full overflow-hidden flex items-end justify-center relative shadow-inner">
            <div 
              className="w-full rounded-t-full bg-gradient-to-t from-blue-500 to-purple-400 transition-all duration-300"
              style={{ height: `${(formData.mood_rating / maxValue) * 100}%` }}
            ></div>
            
            {/* Level markers */}
            {moodLevels.map((level) => {
              const position = (level.value / maxValue) * 100;
              return (
                <div 
                  key={`mood-level-${level.value}`}
                  className="absolute w-full h-px bg-white/20 flex items-center"
                  style={{ bottom: `${position}%` }}
                >
                  <div className="absolute -left-8 text-xs text-gray-400 flex items-center">
                    <span className="mr-1">{level.value}</span>
                  </div>
                </div>
              );
            })}
            
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
            
            {/* Gauge level indicator line */}
            <div className="absolute w-full h-1 bg-white/30 z-20 transition-all duration-300"
                 style={{ bottom: `${(formData.mood_rating / maxValue) * 100}%` }}></div>
          </div>
        </div>
        
        {/* Current mood indicator at the bottom */}
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-2 animate-pulse">
            {currentMood.emoji}
          </div>
          <div className="text-white font-medium">
            {currentMood.label}
          </div>
        </div>
      </div>
    );
  };
  
  // Enhanced vertical difficulty gauge
  const renderDifficultyGauge = () => {
    const maxValue = 10;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative h-52 mb-6 flex justify-center">
          {/* Difficulty gauge */}
          <div className="h-full w-16 bg-gray-800 rounded-full overflow-hidden flex items-end justify-center relative shadow-inner">
            <div 
              className={`w-full rounded-t-full bg-gradient-to-t ${currentLevel.bgColor} transition-all duration-300`}
              style={{ height: `${(formData.perceived_difficulty / maxValue) * 100}%` }}
            ></div>
            
            {/* Level markers */}
            {difficultyLevels.map((level) => {
              const position = (level.value / maxValue) * 100;
              return (
                <div 
                  key={`diff-level-${level.value}`}
                  className="absolute w-full h-px bg-white/20 flex items-center"
                  style={{ bottom: `${position}%` }}
                >
                  <div className="absolute -left-8 text-xs text-gray-400 flex items-center">
                    <span className="mr-1">{level.value}</span>
                  </div>
                </div>
              );
            })}
            
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
            
            {/* Gauge level indicator line */}
            <div className="absolute w-full h-1 bg-white/30 z-20 transition-all duration-300"
                 style={{ bottom: `${(formData.perceived_difficulty / maxValue) * 100}%` }}></div>
          </div>
        </div>
        
        {/* Current level icon and description at the bottom */}
        <div className="flex flex-col items-center">
          <div className="text-2xl p-3 rounded-full bg-gray-800 mb-2 animate-pulse">
            {currentLevel.icon}
          </div>
          <div className="text-white font-medium">
            {currentLevel.label}
          </div>
          <div className="text-gray-400 text-sm mt-1">
            {currentLevel.description}
          </div>
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
            {t("how_did_you_feel")}
          </label>
          {renderMoodGauge()}
        </div>
        
        {/* Right column - Difficulty */}
        <div>
          <label className="block text-gray-300 mb-4 font-medium text-center">
            {t("how_difficult_was_it")}
          </label>
          {renderDifficultyGauge()}
        </div>
      </div>
    </div>
  );
};

export default MoodDifficultyStep;