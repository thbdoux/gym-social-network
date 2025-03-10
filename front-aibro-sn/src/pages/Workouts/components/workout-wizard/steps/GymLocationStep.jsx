import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Home, Check, Activity, ArrowUp, ArrowDown, Clock, Plus, Target } from 'lucide-react';
import { useGyms } from '../../../hooks/useGyms';
import { AddGymModal } from '../../GymComponents';

const GymLocationStep = ({ formData, updateFormData, colors }) => {
  const { gyms, loading, error, refreshGyms } = useGyms();
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

  // Render location options
  const renderLocationOptions = () => (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* Gym option */}
      <div
        onClick={() => handleLocationTypeSelect('gym')}
        className={`
          p-3 rounded-xl border cursor-pointer transition-all duration-300 group relative overflow-hidden
          ${locationType === 'gym' 
            ? `${colors.borderLight} ${colors.bg}/10 shadow-lg` 
            : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
        `}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className={`
            p-2 rounded-lg transition-transform duration-300 group-hover:scale-110
            ${locationType === 'gym' ? colors.bg : 'bg-gray-700'}
          `}>
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-white font-medium group-hover:translate-x-1 transition-transform duration-300">
            At the Gym
          </div>
          {locationType === 'gym' ? (
            <Check className="w-4 h-4 text-green-400 animate-pulse" />
          ) : (
            <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Check className="w-4 h-4 text-gray-500" />
            </div>
          )}
        </div>
      </div>
      
      {/* Home option */}
      <div
        onClick={() => handleLocationTypeSelect('home')}
        className={`
          p-3 rounded-xl border cursor-pointer transition-all duration-300 group relative overflow-hidden
          ${locationType === 'home' 
            ? `${colors.borderLight} ${colors.bg}/10 shadow-lg` 
            : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
        `}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className={`
            p-2 rounded-lg transition-transform duration-300 group-hover:scale-110
            ${locationType === 'home' ? colors.bg : 'bg-gray-700'}
          `}>
            <Home className="w-5 h-5" />
          </div>
          <div className="text-white font-medium group-hover:translate-x-1 transition-transform duration-300">
            Home Workout
          </div>
          {locationType === 'home' ? (
            <Check className="w-4 h-4 text-green-400 animate-pulse" />
          ) : (
            <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Check className="w-4 h-4 text-gray-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Render gym selector
  const renderGymSelector = () => (
    <div className="mt-3 animate-fadeIn">
      <label className="text-gray-300 mb-2 block">
        Select your gym
      </label>
      
      {loading ? (
        <div className="text-gray-400 py-3 text-center animate-pulse">
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-bounce mr-1"></div>
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-bounce-delay mr-1"></div>
            <div className="w-4 h-4 bg-gray-500 rounded-full animate-bounce-delay-2"></div>
          </div>
          <div className="mt-1">Loading gyms...</div>
        </div>
      ) : error ? (
        <div className="text-red-400 py-2 text-center animate-shake">
          Couldn't load gyms
        </div>
      ) : (
        <div className="max-h-40 overflow-y-auto pr-1 gym-scroll">
          {gyms.length === 0 ? (
            <div 
              onClick={() => setShowAddGym(true)}
              className="text-gray-400 p-3 text-center border border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-800/70 transition-all"
            >
              <Plus className="inline-block w-5 h-5 mr-1 mb-1" />
              No gyms yet. Add your first one!
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
          <span className="group-hover:translate-x-1 transition-transform duration-300">Add New Gym</span>
        </div>
      </button>
    </div>
  );
  
  // Vertical gauge for duration
  const renderVerticalDurationGauge = () => {
    const maxDuration = 120;
    const percentage = (formData.duration / maxDuration) * 100;
    const intensityColor = getIntensityColor();
    
    return (
      <div className="flex flex-col items-center h-full">
        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-400" />
            <label className="text-gray-300 font-medium">Duration</label>
          </div>
          <div className="flex items-center">
            <span className="text-white font-medium text-xl">
              {formData.duration}
            </span>
            <span className="text-gray-400 ml-1">min</span>
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
          
          {/* Vertical gauge */}
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
            {/* New indicator lines at 30/45/60/75/90/105/120 */}
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
            
            {/* Filled area */}
            <div 
              className={`absolute bottom-0 w-full transition-all duration-300 ${intensityColor}`}
              style={{ height: `${percentage}%` }}
            >
              {/* Pulse effect */}
              <div className="absolute inset-0 animate-pulse-subtle opacity-50"></div>
            </div>
            
            {/* Handle */}
            <div 
              id="duration-handle"
              className="absolute left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300"
              style={{ bottom: `${percentage}%` }}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white shadow-lg border-2 border-gray-800 transform transition-transform"></div>
              </div>
            </div>
          </div>
          
          <div className="ml-3 h-64 flex items-center">
            <div className="flex flex-col items-center space-y-1">
              <button 
                onClick={() => updateFormData({ duration: Math.min(180, formData.duration + 5) })}
                className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <ArrowUp size={16} />
              </button>
              <button 
                onClick={() => updateFormData({ duration: Math.max(5, formData.duration - 5) })}
                className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <label className="block text-gray-300 mb-2 font-medium">
        Where did you work out?
      </label>
      
      <div className="flex gap-6">
        {/* Left side - Location selection and gym list */}
        <div className="flex-1">
          {renderLocationOptions()}
          
          {/* Show gym selector if "gym" is selected */}
          {locationType === 'gym' && renderGymSelector()}
        </div>
        
        {/* Right side - Vertical duration gauge */}
        <div className="flex-1 border-l border-gray-700 pl-6">
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