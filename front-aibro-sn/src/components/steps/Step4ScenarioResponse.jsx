import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Step4ScenarioResponse = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [animationStage, setAnimationStage] = useState(0);
  const [showScenario, setShowScenario] = useState(false);
  
  useEffect(() => {
    // Initial load animation
    setTimeout(() => setIsLoaded(true), 300);
    
    // Start the scenario animation sequence
    setTimeout(() => setAnimationStage(1), 800);
    setTimeout(() => setAnimationStage(2), 1600);
    setTimeout(() => setAnimationStage(3), 2400);
    setTimeout(() => {
      setAnimationStage(4);
      setShowScenario(true);
    }, 3200);
  }, []);
  
  const scenarioResponses = [
    {
      id: 'ignore',
      name: 'scenario_response_ignore',
      description: 'scenario_response_ignore_desc',
      icon: '🏋️',
      animation: 'animate-bounce',
      score: { optimizer: 3, diplomate: 0, mentor: 0, versatile: 1 }
    },
    {
      id: 'standby',
      name: 'scenario_response_standby',
      description: 'scenario_response_standby_desc',
      icon: '⏱️',
      animation: 'animate-pulse',
      score: { optimizer: 1, diplomate: 2, mentor: 1, versatile: 2 }
    },
    {
      id: 'encourage',
      name: 'scenario_response_encourage',
      description: 'scenario_response_encourage_desc',
      icon: '🙌',
      animation: 'animate-wiggle',
      score: { optimizer: 0, diplomate: 3, mentor: 2, versatile: 0 }
    },
    {
      id: 'explain',
      name: 'scenario_response_explain',
      description: 'scenario_response_explain_desc',
      icon: '👨‍🏫',
      animation: 'animate-fade-in-out',
      score: { optimizer: 2, diplomate: 0, mentor: 3, versatile: 0 }
    }
  ];
  
  const handleSelect = (index) => {
    setSelectedResponse(index);
  };
  
  const handleContinue = () => {
    if (selectedResponse !== null) {
      onComplete(scenarioResponses[selectedResponse].score);
    }
  };
  
  // Get animation classes for the scenario illustration
  const getAnimationClass = () => {
    switch (animationStage) {
      case 1: return 'scale-110';
      case 2: return 'scale-105 rotate-3';
      case 3: return 'scale-105 rotate-0';
      case 4: return 'scale-100';
      default: return 'scale-90 opacity-70';
    }
  };
  
  return (
    <div className={`flex flex-col h-full transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-xl font-bold text-center text-white mb-2">
        {t('scenario_title')}
      </h2>
      <p className="text-center text-gray-400 mb-4">
        {t('scenario_subtitle')}
      </p>
      
      {/* Animated scenario illustration */}
      <div className="relative h-64 bg-gray-800/30 rounded-xl mb-4 border border-gray-700/30 overflow-hidden">
        {/* Background scene - gym environment */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800/80 to-gray-900/90"></div>
        
        {/* Animated elements */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {/* Person asking for help - appears and bobs */}
          <div className={`text-center transition-all duration-700 ${
            animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="text-6xl mb-2 animate-bounce">😵‍💫🏋️‍♂️🥵🏋️‍♂️</div>
          </div>
          
          {/* Speech bubble - appears after person */}
          <div className={`relative mt-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl max-w-sm transition-all duration-700 ${
            animationStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="absolute w-4 h-4 bg-white/10 transform rotate-45 -top-2 left-1/2 -translate-x-1/2"></div>
            <p className="text-white text-center text-sm">
              {showScenario ? t('scenario_speech_bubble') : '...'}
            </p>
          </div>
          
          {/* Your response choices - only show after full scenario is visible */}
          <div className={`absolute bottom-4 right-4 bg-blue-500/20 rounded-full p-2 transition-all duration-500 ${
            animationStage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
            <div className="text-2xl animate-pulse">❓</div>
          </div>
        </div>
      </div>
      
      {/* Scenario description - concise version */}
      {showScenario && (
        <div className="bg-gray-800/40 p-3 rounded-lg mb-4 border border-gray-700/30">
          <p className="text-center text-white text-sm">
            {t('scenario_description_short')}
          </p>
        </div>
      )}
      
      {/* Response options with animations */}
      {showScenario && (
        <div className="space-y-3 mb-4">
          {scenarioResponses.map((response, index) => (
            <div
              key={response.id}
              className={`rounded-xl p-3 cursor-pointer transition-all duration-200 border relative overflow-hidden flex items-center ${
                selectedResponse === index 
                  ? 'border-blue-500 bg-gradient-to-r from-blue-900/20 to-indigo-900/20' 
                  : 'border-gray-700/30 bg-gray-800/40 hover:bg-gray-800/60'
              }`}
              onClick={() => handleSelect(index)}
            >
              {selectedResponse === index && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              )}
              
              <div className={`text-3xl mr-3 ${selectedResponse === index ? response.animation : ''}`}>
                {response.icon}
              </div>
              
              <div>
                <h3 className="font-medium text-white text-sm">
                  {t(response.name)}
                </h3>
                <p className="text-xs text-gray-400">
                  {t(response.description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-auto">
        <button
          disabled={selectedResponse === null}
          onClick={handleContinue}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2
            ${selectedResponse !== null
              ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-700/90 hover:to-indigo-700/90'
              : 'bg-gray-700/50 cursor-not-allowed'
            } transition-all duration-300`}
        >
          <span>{t('continue')}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Step4ScenarioResponse;