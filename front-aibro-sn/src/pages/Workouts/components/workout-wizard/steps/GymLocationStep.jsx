import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Home, Check, Clock, Plus } from 'lucide-react';
import { AddGymModal } from '../../GymComponents';
import { useLanguage } from '../../../../../context/LanguageContext';

// Import React Query hooks
import { useGyms } from '../../../../../hooks/query/useGymQuery';

const GymLocationStep = ({ formData, updateFormData, colors }) => {
  const { t } = useLanguage();
  
  // React Query hook for gyms
  const { 
    data: gyms = [], 
    isLoading: loading, 
    error, 
    refetch: refreshGyms 
  } = useGyms();
  
  const [showAddGym, setShowAddGym] = useState(false);
  const [locationType, setLocationType] = useState(formData.gym ? 'gym' : 'gym'); // Default to gym
  const [isDragging, setIsDragging] = useState(false);
  const gaugeRef = useRef(null);
  
  // Set default gym if none selected
  useEffect(() => {
    if (locationType === 'gym' && !formData.gym && gyms && gyms.length > 0) {
      updateFormData({ gym: gyms[0].id });
    }
  }, [gyms, locationType]);
  
  // Handle gym selection
  const handleGymSelect = (gymId) => {
    updateFormData({ gym: gymId });
  };
  
  // Handle location type selection
  const handleLocationTypeSelect = (type) => {
    setLocationType(type);
    if (type === 'home') {
      updateFormData({ gym: null });
    } else if (type === 'gym' && gyms && gyms.length > 0 && !formData.gym) {
      updateFormData({ gym: gyms[0].id });
    }
  };

  // Handle success after adding a new gym
  const handleGymAdded = (newGym) => {
    refreshGyms();
    updateFormData({ gym: newGym.id });
    setShowAddGym(false);
  };
  
  // Vertical duration gauge handling
  const handleVerticalDurationChange = (e) => {
    if (!gaugeRef.current) return;
    
    const gaugeRect = gaugeRef.current.getBoundingClientRect();
    const clickPosition = gaugeRect.bottom - e.clientY; // Inverted for bottom-to-top
    const percentage = clickPosition / gaugeRect.height;
    const maxDuration = 120;
    const newDuration = Math.max(5, Math.min(maxDuration, Math.round(percentage * maxDuration / 5) * 5));
    updateFormData({ duration: newDuration });
  };

  const handleVerticalDragStart = () => {
    setIsDragging(true);
  };

  const handleVerticalDragEnd = () => {
    setIsDragging(false);
  };

  const handleVerticalDragMove = (e) => {
    if (!isDragging) return;
    handleVerticalDurationChange(e);
  };
  
  // Get color based on duration
  const getIntensityColor = () => {
    const duration = formData.duration;
    // Color gradient from light blue to deep purple based on duration
    if (duration < 45) return "bg-blue-500";
    if (duration < 75) return "bg-indigo-500";
    if (duration < 90) return "bg-purple-500";
    if (duration < 105) return "bg-fuchsia-500";
    return "bg-pink-500";
  };
  
  // Animation for duration change
  useEffect(() => {
    const handleElement = document.getElementById('duration-handle');
    if (handleElement) {
      handleElement.classList.add('scale-125');
      setTimeout(() => {
        handleElement.classList.remove('scale-125');
      }, 200);
    }
  }, [formData.duration]);

  // Render location type buttons
  const renderLocationTypeButtons = () => (
    <div className="flex space-x-3 mb-4">
      <button
        type="button"
        onClick={() => handleLocationTypeSelect('gym')}
        className={`
          px-4 py-2 rounded-lg flex items-center transition-all duration-200
          ${locationType === 'gym' 
            ? `${colors.bg} text-white` 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
        `}
      >
        <MapPin className="w-4 h-4 mr-2" />
        {t("at_gym")}
        {locationType === 'gym' && <Check className="w-4 h-4 ml-2" />}
      </button>
      
      <button
        type="button"
        onClick={() => handleLocationTypeSelect('home')}
        className={`
          px-4 py-2 rounded-lg flex items-center transition-all duration-200
          ${locationType === 'home' 
            ? `${colors.bg} text-white` 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
        `}
      >
        <Home className="w-4 h-4 mr-2" />
        {t("at_home")}
        {locationType === 'home' && <Check className="w-4 h-4 ml-2" />}
      </button>
    </div>
  );
  
  // Render gym selector
  const renderGymSelector = () => (
    <div className="mt-3 animate-fadeIn">
      <label className="text-gray-300 mb-2 block">
        {t("select_your_gym")}
      </label>
      
      {loading ? (
        <div className="text-gray-400 py-3 text-center animate-pulse">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-bounce mr-1"></div>
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-bounce-delay mr-1"></div>
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-bounce-delay-2"></div>
          </div>
          <div className="mt-1">{t("loading_gyms")}</div>
        </div>
      ) : error ? (
        <div className="text-red-400 py-2 text-center animate-shake">
          {t("couldnt_load_gyms")}
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto pr-1 gym-scroll">
          {gyms.length === 0 ? (
            <div 
              onClick={() => setShowAddGym(true)}
              className="text-gray-400 p-3 text-center border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-800/70 transition-all"
            >
              <Plus className="inline-block w-5 h-5 mr-1 mb-1" />
              {t("no_gyms_add_first")}
            </div>
          ) : (
            <div className="space-y-2">
              {gyms.map(gym => (
                <div
                  key={gym.id}
                  onClick={() => handleGymSelect(gym.id)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all duration-300 group relative overflow-hidden
                    ${formData.gym === gym.id 
                      ? `${colors.borderLight} ${colors.bg}/10` 
                      : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
                  `}
                >
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center">
                      <div className={`
                        p-1 rounded-lg transition-all duration-300
                        ${formData.gym === gym.id ? colors.bg : 'bg-gray-700 group-hover:bg-gray-600'}
                      `}>
                        <MapPin className={`w-4 h-4 ${formData.gym === gym.id ? 'text-white' : 'text-gray-300'}`} />
                      </div>
                      <span className="text-white ml-2 transition-transform duration-300 group-hover:translate-x-1">
                        {gym.name} - {gym.location}
                      </span>
                    </div>
                    {formData.gym === gym.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Check className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <button
        type="button"
        onClick={() => setShowAddGym(true)}
        className={`
          mt-3 px-3 py-2 border rounded-lg text-sm relative overflow-hidden group
          border-gray-700 hover:border-gray-500 transition-all duration-300
          ${colors.text} hover:bg-gray-800/70 w-full
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative z-10 flex items-center justify-center">
          <Plus className="w-4 h-4 mr-1" />
          <span className="group-hover:translate-x-1 transition-transform duration-300">{t("add_new_gym")}</span>
        </div>
      </button>
    </div>
  );
  
  // Improved vertical gauge for duration
  const renderVerticalDurationGauge = () => {
    const maxDuration = 120;
    const percentage = (formData.duration / maxDuration) * 100;
    const intensityColor = getIntensityColor();
    
    return (
      <div className="flex flex-col items-center h-full">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-400" />
            <label className="text-gray-300 font-medium">{t("duration")}</label>
          </div>
          <div className="flex items-center">
            <span className="text-white font-medium text-xl">
              {formData.duration}
            </span>
            <span className="text-gray-400 ml-1">{t("mins")}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-full">
          {/* Quick duration buttons - vertical */}
          <div className="flex flex-col justify-between h-64 mr-4">
            {[120, 90, 60, 45, 30].map(duration => (
              <button
                key={duration}
                type="button"
                onClick={() => updateFormData({ duration })}
                className={`
                  relative group px-2 py-1 rounded-md text-center text-xs font-medium transition-all duration-300
                  ${formData.duration === duration 
                    ? `${intensityColor} text-white` 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}
                `}
              >
                {duration}
                <div className={`absolute -right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full 
                  ${formData.duration === duration ? intensityColor : 'bg-transparent'}`}
                ></div>
              </button>
            ))}
          </div>
          
          {/* Improved vertical gauge */}
          <div 
            ref={gaugeRef}
            className="w-12 h-64 bg-gray-800 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleVerticalDurationChange}
            onMouseDown={handleVerticalDragStart}
            onMouseUp={handleVerticalDragEnd}
            onMouseLeave={handleVerticalDragEnd}
            onMouseMove={handleVerticalDragMove}
            onTouchStart={handleVerticalDragStart}
            onTouchEnd={handleVerticalDragEnd}
            onTouchMove={handleVerticalDragMove}
          >
            {/* Duration indicator lines */}
            {[120, 105, 90, 75, 60, 45, 30].map((duration) => {
              const linePosition = (duration / maxDuration) * 100;
              return (
                <div 
                  key={duration}
                  className="absolute w-full h-px bg-gray-600 z-10 flex items-center"
                  style={{ bottom: `${linePosition}%` }}
                >
                  <span className="absolute -left-6 text-xs text-gray-500">{duration}</span>
                  <div className="absolute left-0 w-3 h-1 bg-gray-500"></div>
                </div>
              );
            })}
            
            {/* Filled area with gradient overlay */}
            <div 
              className={`absolute bottom-0 w-full transition-all duration-300 ${intensityColor}`}
              style={{ height: `${percentage}%` }}
            >
              {/* Subtle gradient overlay for better visual effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10"></div>
              
              {/* Pulse effect */}
              <div className="absolute inset-0 animate-pulse-subtle opacity-30"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-gray-300 font-medium mr-4">
          {t("where_did_you_workout")}
        </label>
        {/* Location type buttons next to the question */}
        {renderLocationTypeButtons()}
      </div>
      
      <div className="flex gap-6">
        {/* Left side - Gym list with 65% of space */}
        <div className="w-[65%]">
          {/* Show gym selector if "gym" is selected */}
          {locationType === 'gym' && renderGymSelector()}
        </div>
        
        {/* Right side - Vertical duration gauge with 35% of space */}
        <div className="w-[35%] border-l border-gray-700 pl-6">
          {renderVerticalDurationGauge()}
        </div>
      </div>
      
      {/* Add gym modal */}
      {showAddGym && (
        <AddGymModal
          onClose={() => setShowAddGym(false)}
          onSuccess={handleGymAdded}
        />
      )}
      
      {/* Animated style for the component */}
      <style jsx>{`
        @keyframes pulse-subtle {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes bounce-delay {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-shake {
          animation: shake 0.8s ease-in-out;
        }
        .animate-bounce-delay {
          animation: bounce 1s infinite 0.2s;
        }
        .animate-bounce-delay-2 {
          animation: bounce 1s infinite 0.4s;
        }
        .gym-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .gym-scroll::-webkit-scrollbar-track {
          background: #2d3748;
          border-radius: 4px;
        }
        .gym-scroll::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 4px;
        }
        .gym-scroll::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      `}</style>
    </div>
  );
};

export default GymLocationStep;