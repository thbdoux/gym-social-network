import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
// Import custom icons instead of lucide-react
import { 
  ArrowRight, 
  Medal, 
  Users, 
  Zap, 
  Dumbbell, 
  LineChart, 
  FlexGrow 
} from './MotivationIcons'; // Update the path to where you save the custom icons

const Step3MotivationCheck = ({ onComplete }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMotivations, setSelectedMotivations] = useState([]);
  
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);
  
  const motivations = [
    {
      id: 'see_friends_records',
      icon: <Medal size={24} className="text-yellow-400" />,
      name: 'motivation_friends_records',
      score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 0 }
    },
    {
      id: 'meet_people',
      icon: <Users size={24} className="text-green-400" />,
      name: 'motivation_meet_people',
      score: { optimizer: 0, diplomate: 3, mentor: 2, versatile: 0 }
    },
    {
      id: 'take_up_sport',
      icon: <Zap size={24} className="text-blue-400" />,
      name: 'motivation_take_up_sport',
      score: { optimizer: 1, diplomate: 2, mentor: 0, versatile: 2 }
    },
    {
      id: 'physical_transformation',
      icon: <Dumbbell size={24} className="text-purple-400" />,
      name: 'motivation_physical_transformation',
      score: { optimizer: 3, diplomate: 0, mentor: 0, versatile: 1 }
    },
    {
      id: 'monitor_exercise',
      icon: <LineChart size={24} className="text-cyan-400" />,
      name: 'motivation_monitor_exercise',
      score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 0 }
    },
    {
      id: 'flex_performance',
      icon: <FlexGrow size={24} className="text-red-400" />,
      name: 'motivation_flex_performance',
      score: { optimizer: 2, diplomate: 1, mentor: 1, versatile: 1 }
    }
  ];
  
  const toggleMotivation = (id) => {
    setSelectedMotivations(prev => {
      if (prev.includes(id)) {
        return prev.filter(m => m !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const handleContinue = () => {
    // Calculate scores based on selections
    const calculatedScores = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    // If user didn't select anything, provide a balanced score
    if (selectedMotivations.length === 0) {
      Object.keys(calculatedScores).forEach(key => {
        calculatedScores[key] = 1; // Balanced default
      });
    } else {
      selectedMotivations.forEach(id => {
        const motivation = motivations.find(m => m.id === id);
        Object.keys(calculatedScores).forEach(key => {
          calculatedScores[key] += motivation.score[key];
        });
      });
    }
    
    onComplete(calculatedScores);
  };
  
  return (
    <div className={`flex flex-col h-full transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-xl font-bold text-center text-white mb-2">
        {t('motivation_title')}
      </h2>
      <p className="text-center text-gray-400 mb-6">
        {t('motivation_subtitle')}
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {motivations.map((motivation) => {
          const isSelected = selectedMotivations.includes(motivation.id);
          
          return (
            <div
              key={motivation.id}
              onClick={() => toggleMotivation(motivation.id)}
              className={`rounded-lg p-4 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'bg-blue-900/30 border-2 border-blue-500/70 transform scale-105' 
                  : 'bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800/60'
                }
              `}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full mb-3 ${isSelected ? 'bg-blue-500/20' : 'bg-gray-700/50'}`}>
                  {motivation.icon}
                </div>
                <p className="text-sm text-white">
                  {t(motivation.name)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center mb-6">
        <div className="bg-gray-800/60 rounded-full px-4 py-2 text-sm text-gray-400">
          {selectedMotivations.length > 0 
            ? t('motivation_selected', { count: selectedMotivations.length })
            : t('motivation_none_required')}
        </div>
      </div>
      
      <div className="mt-auto">
        <button
          onClick={handleContinue}
          className="w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2
            bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-700/90 hover:to-indigo-700/90
            transition-all duration-300"
        >
          <span>{t('continue')}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Step3MotivationCheck;