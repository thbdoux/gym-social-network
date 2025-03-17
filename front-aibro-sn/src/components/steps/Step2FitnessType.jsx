import React, { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
// Import custom icons
import { 
  Trophy, Mountain, Sofa, Dumbbell, Football, Bike, Swimming,
  Yoga, Running, Boxing, Basketball, Dance, Hiking, Gaming,
  Chess, Cooking, Reading, Meditation, Music, Art, Photography
} from './ExtendedIcons'; // You'll need to create this with additional icons

const Step2FitnessType = ({ onComplete, initialScores }) => {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [availableCards, setAvailableCards] = useState([
    // Sports activities
    { 
      id: 'gym_rat', 
      icon: <Dumbbell size={24} className="text-purple-400" />,
      name: 'fitness_type_gym_rat',
      category: 'sports',
      score: { optimizer: 3, diplomate: 1, mentor: 1, versatile: 1 }
    },
    { 
      id: 'mountain_climber', 
      icon: <Mountain size={24} className="text-green-400" />,
      name: 'fitness_type_mountain_climber',
      category: 'sports',
      score: { optimizer: 1, diplomate: 1, mentor: 0, versatile: 3 }
    },
    { 
      id: 'footballer', 
      icon: <Football size={24} className="text-blue-400" />,
      name: 'fitness_type_footballer',
      category: 'sports',
      score: { optimizer: 1, diplomate: 3, mentor: 2, versatile: 1 }
    },
    { 
      id: 'cyclist', 
      icon: <Bike size={24} className="text-red-400" />,
      name: 'fitness_type_cyclist',
      category: 'sports',
      score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 1 }
    },
    { 
      id: 'swimmer', 
      icon: <Swimming size={24} className="text-cyan-400" />,
      name: 'fitness_type_swimmer',
      category: 'sports',
      score: { optimizer: 2, diplomate: 0, mentor: 1, versatile: 2 }
    },
    { 
      id: 'yoga_enthusiast', 
      icon: <Yoga size={24} className="text-indigo-400" />,
      name: 'fitness_type_yoga',
      category: 'sports',
      score: { optimizer: 1, diplomate: 2, mentor: 3, versatile: 1 }
    },
    { 
      id: 'runner', 
      icon: <Running size={24} className="text-orange-400" />,
      name: 'fitness_type_runner',
      category: 'sports',
      score: { optimizer: 3, diplomate: 0, mentor: 1, versatile: 1 }
    },
    { 
      id: 'boxer', 
      icon: <Boxing size={24} className="text-rose-400" />,
      name: 'fitness_type_boxer',
      category: 'sports',
      score: { optimizer: 3, diplomate: 1, mentor: 1, versatile: 1 }
    },
    { 
      id: 'basketball_player', 
      icon: <Basketball size={24} className="text-amber-400" />,
      name: 'fitness_type_basketball',
      category: 'sports',
      score: { optimizer: 1, diplomate: 3, mentor: 1, versatile: 1 }
    },
    { 
      id: 'dancer', 
      icon: <Dance size={24} className="text-pink-400" />,
      name: 'fitness_type_dancer',
      category: 'sports',
      score: { optimizer: 2, diplomate: 2, mentor: 1, versatile: 2 }
    },
    { 
      id: 'hiker', 
      icon: <Hiking size={24} className="text-emerald-400" />,
      name: 'fitness_type_hiker',
      category: 'sports',
      score: { optimizer: 1, diplomate: 1, mentor: 0, versatile: 3 }
    },
    
    // Non-sportive activities
    { 
      id: 'couch_potato', 
      icon: <Sofa size={24} className="text-amber-400" />,
      name: 'fitness_type_couch_potato',
      category: 'lifestyle',
      score: { optimizer: 0, diplomate: 2, mentor: 0, versatile: 1 }
    },
    { 
      id: 'gamer', 
      icon: <Gaming size={24} className="text-violet-400" />,
      name: 'fitness_type_gamer',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 1, mentor: 0, versatile: 1 }
    },
    { 
      id: 'chess_player', 
      icon: <Chess size={24} className="text-slate-400" />,
      name: 'fitness_type_chess',
      category: 'lifestyle',
      score: { optimizer: 2, diplomate: 0, mentor: 1, versatile: 0 }
    },
    { 
      id: 'cook', 
      icon: <Cooking size={24} className="text-yellow-400" />,
      name: 'fitness_type_cook',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 2, mentor: 2, versatile: 1 }
    },
    { 
      id: 'reader', 
      icon: <Reading size={24} className="text-teal-400" />,
      name: 'fitness_type_reader',
      category: 'lifestyle',
      score: { optimizer: 0, diplomate: 1, mentor: 3, versatile: 0 }
    },
    { 
      id: 'meditator', 
      icon: <Meditation size={24} className="text-blue-300" />,
      name: 'fitness_type_meditator',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 0, mentor: 2, versatile: 2 }
    },
    { 
      id: 'musician', 
      icon: <Music size={24} className="text-purple-300" />,
      name: 'fitness_type_musician',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 2, mentor: 1, versatile: 1 }
    },
    { 
      id: 'artist', 
      icon: <Art size={24} className="text-rose-300" />,
      name: 'fitness_type_artist',
      category: 'lifestyle',
      score: { optimizer: 0, diplomate: 2, mentor: 1, versatile: 2 }
    },
    { 
      id: 'photographer', 
      icon: <Photography size={24} className="text-blue-300" />,
      name: 'fitness_type_photographer',
      category: 'lifestyle',
      score: { optimizer: 1, diplomate: 1, mentor: 0, versatile: 3 }
    },
  ]);
  
  const [selectedCards, setSelectedCards] = useState([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'sports', or 'lifestyle'
  
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);
  
  // Select a card and add it to selected cards
  const handleSelectCard = (card) => {
    // Don't add if we already have 4 cards
    if (selectedCards.length >= 4) return;
    
    // Add the card to selected cards
    setSelectedCards(prev => [...prev, card]);
    
    // Remove the card from available cards
    setAvailableCards(prev => prev.filter(c => c.id !== card.id));
    
    setHasInteracted(true);
  };
  
  // Remove a card from selection and add it back to available cards
  const handleRemoveCard = (cardId) => {
    // Find the card
    const card = selectedCards.find(c => c.id === cardId);
    
    // Add it back to available cards
    setAvailableCards(prev => [...prev, card]);
    
    // Remove it from selected cards
    setSelectedCards(prev => prev.filter(c => c.id !== cardId));
  };
  
  // Move a card up in the ranking
  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    setSelectedCards(prev => {
      const newCards = [...prev];
      [newCards[index], newCards[index - 1]] = [newCards[index - 1], newCards[index]];
      return newCards;
    });
  };
  
  // Move a card down in the ranking
  const handleMoveDown = (index) => {
    if (index === selectedCards.length - 1) return;
    
    setSelectedCards(prev => {
      const newCards = [...prev];
      [newCards[index], newCards[index + 1]] = [newCards[index + 1], newCards[index]];
      return newCards;
    });
  };
  
  const handleContinue = () => {
    // Calculate scores based on ranking
    // First place (index 0) gets highest weight, last place gets lowest
    const calculatedScores = {
      optimizer: 0,
      diplomate: 0,
      mentor: 0,
      versatile: 0
    };
    
    // Weight by position (first choice worth more than last)
    const weights = [5, 3, 2, 1]; // Emphasize top choices more
    
    selectedCards.forEach((card, index) => {
      const weight = weights[index] || 1; // Fallback to weight 1 if we have more than 4 cards somehow
      Object.keys(card.score).forEach(key => {
        calculatedScores[key] += card.score[key] * weight;
      });
    });
    
    // If "versatile" is overpowered, reduce its score by 15-25%
    const averageScore = (calculatedScores.optimizer + calculatedScores.diplomate + calculatedScores.mentor) / 3;
    if (calculatedScores.versatile > (averageScore * 1.2)) {
      calculatedScores.versatile *= 0.8; // Reduce by 20%
    }
    
    onComplete(calculatedScores);
  };
  
  // Filter available cards by category
  const filteredAvailableCards = activeCategory === 'all' 
    ? availableCards
    : availableCards.filter(card => card.category === activeCategory);
  
  return (
    <div className={`flex flex-col h-full transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-xl font-bold text-center text-white mb-2">
        {t('fitness_type_title')}
      </h2>
      <p className="text-center text-gray-400 mb-4">
        {t('fitness_type_subtitle_new')}
      </p>
      
      {/* Category filter buttons */}
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 rounded-full text-sm transition-all
            ${activeCategory === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-800/70 text-gray-400 hover:bg-gray-700/80'
            }`}
        >
          {t('all_activities')}
        </button>
        <button
          onClick={() => setActiveCategory('sports')}
          className={`px-3 py-1 rounded-full text-sm transition-all
            ${activeCategory === 'sports' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-800/70 text-gray-400 hover:bg-gray-700/80'
            }`}
        >
          {t('sports_activities')}
        </button>
        <button
          onClick={() => setActiveCategory('lifestyle')}
          className={`px-3 py-1 rounded-full text-sm transition-all
            ${activeCategory === 'lifestyle' 
              ? 'bg-purple-500 text-white' 
              : 'bg-gray-800/70 text-gray-400 hover:bg-gray-700/80'
            }`}
        >
          {t('lifestyle_activities')}
        </button>
      </div>
      
      {/* Selected cards section - only show if we have selections */}
      {selectedCards.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-white font-medium mb-2">{t('your_selections')} ({selectedCards.length}/4):</div>
          <div className="space-y-2">
            {selectedCards.map((card, index) => (
              <div
                key={card.id}
                className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-3 transition-all"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 flex justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {card.icon}
                  </div>
                  <div className="ml-2 flex-grow text-white">
                    {t(card.name)}
                  </div>
                  <div className="flex-shrink-0 flex space-x-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      className={`p-1 rounded-md hover:bg-blue-800/50 ${
                        index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'
                      }`}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      className={`p-1 rounded-md hover:bg-blue-800/50 ${
                        index === selectedCards.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300'
                      }`}
                      disabled={index === selectedCards.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleRemoveCard(card.id)}
                      className="p-1 rounded-md text-red-400 hover:bg-red-900/30"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available cards */}
      <div className="text-sm text-white font-medium mb-2">
        {t('available_activities')}:
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-6 overflow-y-auto max-h-[280px] pr-1">
        {filteredAvailableCards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleSelectCard(card)}
            className={`rounded-lg border border-gray-700/30 bg-gray-800/40 p-3 cursor-pointer transition-all
              hover:bg-gray-700/50 hover:border-gray-600/50 ${selectedCards.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={selectedCards.length >= 4}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 flex justify-center">
                {card.icon}
              </div>
              <div className="ml-2 flex-grow text-white text-sm">
                {t(card.name)}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Info message */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-800/60 rounded-full px-4 py-2 text-sm text-gray-400">
          {selectedCards.length === 0 
            ? t('please_select_activities')
            : selectedCards.length < 4
              ? t('can_select_more', { remaining: 4 - selectedCards.length })
              : t('max_selections_reached')}
        </div>
      </div>
      
      <div className="mt-auto">
        <button
          disabled={selectedCards.length === 0}
          onClick={handleContinue}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2
            ${selectedCards.length > 0
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

export default Step2FitnessType;