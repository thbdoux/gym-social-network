import React, { useState, useEffect } from 'react';
import { ArrowRight, Trophy, TrendingUp, Users, Heart, Sparkles, Dumbbell, Medal, Zap, Clock, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Step6IdentityReveal = ({ personalityType, userProfile, onComplete, isSubmitting }) => {
  const { t } = useLanguage();
  const [stage, setStage] = useState('initializing'); // initializing, countdown, revealing, complete
  const [revealCounter, setRevealCounter] = useState(3);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [showFinalContent, setShowFinalContent] = useState(false);
  const [animatedSection, setAnimatedSection] = useState('hero');
  
  // Personality profiles with enhanced details
  const personalityProfiles = {
    optimizer: {
      icon: <TrendingUp size={36} className="text-blue-500" />,
      secondaryIcon: <Medal size={30} className="text-amber-500" />,
      title: 'the_metric_master',
      subtitle: 'optimizer_subtitle',
      description: 'optimizer_description',
      heroGradient: 'from-blue-600/20 via-cyan-500/10 to-blue-900/20',
      iconBg: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-500',
      pillBg: 'bg-blue-500/20',
      pillText: 'text-blue-300',
      borderColor: 'border-blue-500/30',
      traits: [
        'optimizer_trait_1',
        'optimizer_trait_2',
        'optimizer_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'HIIT', icon: <Zap size={16} />, level: 3 },
        { name: 'Strength Training', icon: <Dumbbell size={16} />, level: 3 },
        { name: 'Running', icon: <TrendingUp size={16} />, level: 2 },
      ],
      celebMatches: [
        'David Goggins',
        'Chris Bumstead',
        'Tia-Clair Toomey'
      ]
    },
    diplomate: {
      icon: <Heart size={36} className="text-pink-500" />,
      secondaryIcon: <Users size={30} className="text-green-500" />,
      title: 'the_social_butterfly',
      subtitle: 'diplomate_subtitle',
      description: 'diplomate_description',
      heroGradient: 'from-pink-600/20 via-purple-500/10 to-pink-900/20',
      iconBg: 'from-pink-500 to-purple-600',
      textColor: 'text-pink-500',
      pillBg: 'bg-pink-500/20',
      pillText: 'text-pink-300',
      borderColor: 'border-pink-500/30',
      traits: [
        'diplomate_trait_1',
        'diplomate_trait_2',
        'diplomate_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'Group Fitness', icon: <Users size={16} />, level: 3 },
        { name: 'Dance', icon: <Zap size={16} />, level: 3 },
        { name: 'Team Sports', icon: <Trophy size={16} />, level: 3 },
      ],
      celebMatches: [
        'Richard Simmons',
        'Peloton Instructors',
        'Zumba Enthusiasts'
      ]
    },
    mentor: {
      icon: <Users size={36} className="text-green-500" />,
      secondaryIcon: <Trophy size={30} className="text-blue-500" />,
      title: 'the_mentor',
      subtitle: 'mentor_subtitle',
      description: 'mentor_description',
      heroGradient: 'from-green-600/20 via-emerald-500/10 to-green-900/20',
      iconBg: 'from-green-500 to-emerald-600',
      textColor: 'text-green-500',
      pillBg: 'bg-green-500/20',
      pillText: 'text-green-300',
      borderColor: 'border-green-500/30',
      traits: [
        'mentor_trait_1',
        'mentor_trait_2',
        'mentor_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'Personal Training', icon: <Users size={16} />, level: 3 },
        { name: 'Group Coaching', icon: <Trophy size={16} />, level: 3 },
        { name: 'Partner Workouts', icon: <Heart size={16} />, level: 2 },
      ],
      celebMatches: [
        'Jillian Michaels',
        'Tony Horton',
        'Kayla Itsines'
      ]
    },
    versatile: {
      icon: <Sparkles size={36} className="text-amber-500" />,
      secondaryIcon: <Zap size={30} className="text-indigo-500" />,
      title: 'the_explorer',
      subtitle: 'versatile_subtitle',
      description: 'versatile_description',
      heroGradient: 'from-amber-600/20 via-orange-500/10 to-amber-900/20',
      iconBg: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-500',
      pillBg: 'bg-amber-500/20',
      pillText: 'text-amber-300',
      borderColor: 'border-amber-500/30',
      traits: [
        'versatile_trait_1',
        'versatile_trait_2',
        'versatile_trait_3'
      ],
      compatibleWorkouts: [
        { name: 'CrossFit', icon: <Sparkles size={16} />, level: 3 },
        { name: 'Adventure Sports', icon: <Zap size={16} />, level: 3 },
        { name: 'Obstacle Courses', icon: <Trophy size={16} />, level: 3 },
      ],
      celebMatches: [
        'Zac Efron',
        'Bear Grylls',
        'Alex Honnold'
      ]
    }
  };
  
  // Configure animation sequence
  useEffect(() => {
    if (personalityType) {
      const initTimer = setTimeout(() => {
        setStage('countdown');
      }, 1000);
      
      return () => clearTimeout(initTimer);
    }
  }, [personalityType]);
  
  // Handle countdown animation
  useEffect(() => {
    if (stage === 'countdown' && revealCounter > 0) {
      const countdownTimer = setTimeout(() => {
        setRevealCounter(prevCount => prevCount - 1);
      }, 800);
      
      return () => clearTimeout(countdownTimer);
    } else if (stage === 'countdown' && revealCounter === 0) {
      const revealTimer = setTimeout(() => {
        setStage('revealing');
      }, 500);
      
      return () => clearTimeout(revealTimer);
    }
  }, [stage, revealCounter]);
  
  // Handle reveal animations
  useEffect(() => {
    if (stage === 'revealing') {
      const sequence = [
        { section: 'hero', delay: 0 },
        { section: 'traits', delay: 1200 },
        { section: 'workouts', delay: 2200 },
        { section: 'celebs', delay: 3200 },
      ];
      
      // Sequential animation of sections
      sequence.forEach(item => {
        setTimeout(() => {
          setAnimatedSection(item.section);
        }, item.delay);
      });
      
      // Mark animation as complete
      setTimeout(() => {
        setAnimationFinished(true);
        setStage('complete');
        setShowFinalContent(true);
      }, 4000);
    }
  }, [stage]);
  
  // Get the current personality profile
  const profile = personalityProfiles[personalityType] || personalityProfiles.versatile;
  
  // Helper function to render workout compatibility
  const renderCompat = (level) => {
    return (
      <div className="flex">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full mr-0.5 ${
              i < level 
                ? `bg-gradient-to-r ${profile.iconBg}` 
                : 'bg-gray-700'
            }`}
          ></div>
        ))}
      </div>
    );
  };
  
  // Render loading and countdown animations
  if (stage === 'initializing' || stage === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        {stage === 'initializing' ? (
          <div className="text-center">
            <div className="mb-4 w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
            <h3 className="text-white text-xl mb-2">{t('analyzing_profile')}</h3>
            <p className="text-gray-400">{t('fitness_identity')}</p>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-white text-2xl mb-4">{t('fitness_identity')}</h3>
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">{revealCounter}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Main content with animated reveal
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h2 className="text-xl font-bold text-center text-white mb-2">
        {t('fitness_identity')}
      </h2>
      
      {/* Hero section */}
      <div 
        className={`transition-all duration-700 transform
          ${animatedSection === 'hero' || showFinalContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <div className={`rounded-lg p-5 overflow-hidden relative mb-4 bg-gradient-to-br ${profile.heroGradient}`}>
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl transform -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl transform translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="flex items-center">
            <div className="relative">
              <div className={`p-3 rounded-full bg-gradient-to-br ${profile.iconBg} mr-4 shadow-lg`}>
                {profile.icon}
              </div>
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-gray-900/80 border border-gray-700">
                {profile.secondaryIcon}
              </div>
            </div>
            <div>
              <h3 className={`text-xl font-bold ${profile.textColor}`}>
                {t(profile.title)}
              </h3>
              <p className="text-white text-sm">
                {t(profile.subtitle)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-gray-300 text-sm">
            {t(profile.description)}
          </p>
        </div>
      </div>
      
      {/* Traits section */}
      <div 
        className={`transition-all duration-700 delay-100 transform
          ${animatedSection === 'traits' || showFinalContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <div className={`rounded-lg p-4 mb-4 bg-gray-800/40 border ${profile.borderColor}`}>
          <h4 className="text-white text-sm font-medium mb-3 flex items-center">
            <Check size={16} className={profile.textColor} />
            <span className="ml-2">{t('key_traits')}</span>
          </h4>
          <div className="space-y-2">
            {profile.traits.map((trait, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${profile.pillBg} flex-shrink-0 flex items-center justify-center mr-3`}>
                  <Check size={10} className={profile.pillText} />
                </div>
                <span className="text-gray-300 text-sm">
                  {t(trait)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Additional info in two columns */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Compatible workouts */}
        <div 
          className={`transition-all duration-700 delay-200 transform
            ${animatedSection === 'workouts' || showFinalContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className={`rounded-lg p-3 h-full bg-gray-800/40 border ${profile.borderColor}`}>
            <h4 className="text-white text-xs font-medium mb-2">
              {t('workout_compatibility')}
            </h4>
            <div className="space-y-2">
              {profile.compatibleWorkouts.map((workout, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full ${profile.pillBg} flex items-center justify-center mr-2`}>
                      {React.cloneElement(workout.icon, { className: profile.pillText })}
                    </div>
                    <span className="text-gray-300 text-xs">
                      {workout.name}
                    </span>
                  </div>
                  {renderCompat(workout.level)}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Celebrity matches */}
        <div 
          className={`transition-all duration-700 delay-300 transform
            ${animatedSection === 'celebs' || showFinalContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className={`rounded-lg p-3 h-full bg-gray-800/40 border ${profile.borderColor}`}>
            <h4 className="text-white text-xs font-medium mb-2">
              {t('celebrity_matches')}
            </h4>
            <div className="space-y-1.5">
              {profile.celebMatches.map((celeb, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${profile.iconBg} mr-2`}></div>
                  <span className="text-gray-300 text-xs">
                    {celeb}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Motivational message based on user's gender */}
      <div 
        className={`mb-4 transition-all duration-700 delay-400 transform
          ${showFinalContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
          <p className="text-sm text-center text-gray-300 italic">
            {userProfile.gender === 'female' 
              ? "Ready to shine! Let your fitness journey empower you to discover new strengths and connect with an amazing community." 
              : "Time to crush your goals! Your fitness journey is about to take off with a community that matches your energy."}
          </p>
        </div>
      </div>
      
      <div className="mt-auto">
        <button
          disabled={!animationFinished || isSubmitting}
          onClick={onComplete}
          className={`w-full py-3.5 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2
            ${!animationFinished || isSubmitting
              ? 'bg-gray-700/50 cursor-not-allowed'
              : `bg-gradient-to-r ${profile.iconBg} hover:shadow-lg hover:shadow-${profile.textColor.split('-')[1]}/20`
            } transition-all duration-300`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('saving_results')}</span>
            </>
          ) : (
            <>
              <span>{t('continue_to_feed')}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step6IdentityReveal;