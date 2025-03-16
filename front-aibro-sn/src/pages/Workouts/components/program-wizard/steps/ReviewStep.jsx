import React from 'react';
import { 
  Dumbbell, Calendar, FlameIcon, ChevronRight,
  ArrowRight, Zap, Trophy
} from 'lucide-react';

const ReviewStep = ({ formData }) => {
  // Get focus icon and color
  const getFocusData = () => {
    switch(formData.focus) {
      case 'strength':
        return { icon: '💪', color: 'from-blue-500 to-cyan-400' };
      case 'hypertrophy':
        return { icon: '🏋️', color: 'from-purple-500 to-pink-400' };
      case 'endurance':
        return { icon: '🏃', color: 'from-green-500 to-emerald-400' };
      case 'weight_loss':
        return { icon: '⚖️', color: 'from-red-500 to-orange-400' };
      case 'strength_hypertrophy':
        return { icon: '💯', color: 'from-indigo-500 to-blue-400' };
      case 'general_fitness':
        return { icon: '🔄', color: 'from-amber-500 to-yellow-400' };
      default:
        return { icon: '💪', color: 'from-blue-500 to-cyan-400' };
    }
  };
  
  const focusData = getFocusData();
  
  // Motivational phrases based on program focus
  const getMotivationalPhrase = () => {
    switch(formData.focus) {
      case 'strength':
        return "Time to build strength that lasts a lifetime!";
      case 'hypertrophy':
        return "Let's sculpt your dream physique!";
      case 'endurance':
        return "Ready to push your limits and go the distance!";
      case 'weight_loss':
        return "Your transformation journey starts now!";
      case 'strength_hypertrophy':
        return "Stronger, bigger, better - let's make it happen!";
      case 'general_fitness':
        return "Building a better you, one workout at a time!";
      default:
        return "Let's crush this program and transform your fitness!";
    }
  };

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center py-4">
      {/* Program name with gradient */}
      <div className="text-center mb-8">
        <h2 className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${focusData.color} mb-2`}>
          {formData.name}
        </h2>
        <div className="text-gray-400">Your fitness journey awaits</div>
      </div>
      
      {/* Large icon */}
      <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${focusData.color} flex items-center justify-center text-6xl mb-8 shadow-lg shadow-gray-900/50`}>
        {focusData.icon}
      </div>
      
      {/* Motivational message */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-3">
          It's Go Time!
        </h3>
        <p className="text-xl text-gray-300">
          {getMotivationalPhrase()}
        </p>
      </div>
      
      {/* Program stats in gradient cards */}
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        {/* Sessions per week */}
        <div className={`bg-gradient-to-br ${focusData.color} bg-opacity-10 p-4 rounded-xl border border-gray-700`}>
          <div className="text-white text-xl font-bold mb-1">{formData.sessions_per_week}x</div>
          <div className="text-gray-300 text-sm">Workouts per week</div>
        </div>
        
        {/* Duration */}
        <div className={`bg-gradient-to-br ${focusData.color} bg-opacity-10 p-4 rounded-xl border border-gray-700`}>
          <div className="text-white text-xl font-bold mb-1">{formData.estimated_completion_weeks} weeks</div>
          <div className="text-gray-300 text-sm">Program duration</div>
        </div>
        
        {/* Difficulty */}
        <div className={`bg-gradient-to-br ${focusData.color} bg-opacity-10 p-4 rounded-xl border border-gray-700 col-span-2`}>
          <div className="text-white text-xl font-bold mb-1 capitalize">{formData.difficulty_level}</div>
          <div className="text-gray-300 text-sm">Difficulty level</div>
        </div>
      </div>
      
      {/* Pulse animation */}
      <div className="relative mb-6">
        <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-r ${focusData.color} opacity-75 blur animate-pulse`}></div>
        <button className={`relative bg-gradient-to-r ${focusData.color} text-white px-6 py-3 rounded-full font-bold text-lg`}>
          Ready to Begin
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;