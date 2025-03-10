import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, Zap, Heart, Edit, Check, ChevronRight, Bookmark, Star } from 'lucide-react';

// Pre-defined workout types to choose from with enhanced visuals
const WORKOUT_TYPES = [
  { 
    name: "Upper Body", 
    icon: <Dumbbell className="w-5 h-5" />,
    color: "from-blue-500 to-cyan-400",
    hoverEffect: "scale-105", // Removed rotate effect
  },
  { 
    name: "Lower Body", 
    icon: <Dumbbell className="w-5 h-5" />,
    color: "from-purple-500 to-pink-400",
    hoverEffect: "scale-105", // Removed rotate effect
  },
  { 
    name: "Full Body", 
    icon: <Zap className="w-5 h-5" />,
    color: "from-amber-500 to-orange-400",
    hoverEffect: "scale-105 translate-y-1",
  },
  { 
    name: "Cardio", 
    icon: <Heart className="w-5 h-5" />,
    color: "from-red-500 to-rose-400",
    hoverEffect: "scale-105 translate-y-1",
  },
  { 
    name: "Custom", 
    icon: <Edit className="w-5 h-5" />,
    color: "from-emerald-500 to-teal-400",
    hoverEffect: "scale-105 skew-x-3",
  }
];

const WorkoutTypeStep = ({ formData, updateFormData, errors, colors, programs, programsLoading, programsError }) => {
  const [selectedType, setSelectedType] = useState(
    formData.name ? (WORKOUT_TYPES.find(t => t.name === formData.name) ? formData.name : 'Custom') : ''
  );
  const [customName, setCustomName] = useState(
    WORKOUT_TYPES.find(t => t.name === formData.name) ? '' : formData.name
  );

  // Handle workout type selection
  const handleTypeSelect = (typeName) => {
    setSelectedType(typeName);
    if (typeName !== 'Custom') {
      updateFormData({ name: typeName });
    }
  };

  // Handle custom name input
  const handleCustomNameChange = (e) => {
    const name = e.target.value;
    setCustomName(name);
    updateFormData({ name });
  };

  // Animation for selected type
  useEffect(() => {
    const timeout = setTimeout(() => {
      const selectedElement = document.getElementById(`workout-type-${selectedType}`);
      if (selectedElement) {
        selectedElement.classList.add('animate-pulse');
        setTimeout(() => {
          selectedElement.classList.remove('animate-pulse');
        }, 500);
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [selectedType]);

  return (
    <div className="space-y-6">
      {/* Workout type selection */}
      <div>
        <label className="block text-gray-300 mb-3 font-medium">
          What did you train today?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {WORKOUT_TYPES.map((type) => (
            <div
              id={`workout-type-${type.name}`}
              key={type.name}
              onClick={() => handleTypeSelect(type.name)}
              className={`
                p-3 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                hover:shadow-lg group
                ${selectedType === type.name 
                  ? `${colors.borderLight} bg-gray-800` 
                  : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
                ${selectedType === type.name ? '' : `hover:${type.hoverEffect}`}
              `}
            >
              {/* Animated background for selected items */}
              {selectedType === type.name && (
                <div className="absolute inset-0 bg-gradient-to-r opacity-20 blur-sm" />
              )}
              
              {/* Hover effect gradient */}
              <div className={`
                absolute inset-0 bg-gradient-to-r ${type.color} opacity-0 
                group-hover:opacity-10 transition-opacity duration-300
              `}></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className={`
                  p-2 rounded-lg transition-all duration-300 transform group-hover:scale-110
                  ${selectedType === type.name 
                    ? `bg-gradient-to-r ${type.color} shadow-lg` 
                    : 'bg-gray-700'}
                `}>
                  {type.icon}
                </div>
                <div className="text-white font-medium transition-all duration-300 transform group-hover:translate-x-1">
                  {type.name}
                </div>
                {selectedType === type.name ? (
                  <div className="flex items-center text-green-400">
                    <Check className="w-4 h-4 animate-bounce" />
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Show custom name input if "Custom" is selected */}
      {selectedType === 'Custom' && (
        <div className="animate-fadeIn">
          <div className="relative">
            <input
              type="text"
              value={customName}
              onChange={handleCustomNameChange}
              className={`
                w-full bg-gray-800 border rounded-lg px-4 py-3 text-white transition-all
                focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-900 focus:ring-emerald-500 
                focus:border-transparent outline-none
                ${errors.name ? 'border-red-500' : 'border-gray-700 hover:border-gray-500'}
              `}
              placeholder="e.g., Push Day, HIIT Workout, etc."
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Edit className="h-4 w-4 text-gray-400 animate-pulse" />
            </div>
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1 animate-headShake">{errors.name}</p>
          )}
        </div>
      )}

      {/* Date and Program Selection - 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Date selection - Left Column */}
        <div>
          <label className="block text-gray-300 mb-3 font-medium">
            When did you work out?
          </label>
          <div className="relative overflow-hidden group rounded-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Calendar className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData({ date: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 group-hover:border-gray-500 rounded-lg pl-10 pr-4 py-3 text-white relative z-0 
              transition-all duration-300 focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-900 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        
        {/* Enhanced Program selection - Right Column */}
        {(programs?.length > 0) && (
          <div>
            <label className="block text-gray-300 mb-3 font-medium">
              Part of a program?
            </label>
            
            {programsLoading ? (
              <div className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-gray-400 relative">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-600 animate-pulse mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-600 animate-pulse mr-2 animation-delay-200"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-600 animate-pulse animation-delay-400"></div>
                </div>
              </div>
            ) : programsError ? (
              <div className="w-full bg-gray-800 border border-red-700 rounded-lg p-3 text-red-400 relative">
                Error loading programs
              </div>
            ) : (
              <div className="relative">
                {/* Fancy Program Selector with preview of selected program */}
                <div className="relative overflow-hidden group rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-500 transition-all">
                  {/* Background gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Selected program display or placeholder */}
                  <div className="relative z-10 p-3 flex items-center justify-between cursor-pointer" 
                       onClick={() => document.getElementById("program-select").focus()}>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${formData.program ? colors.bg : 'bg-gray-700'} mr-3`}>
                        <Bookmark className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-white font-medium">
                          {formData.program ? 
                            programs.find(p => p.id === (typeof formData.program === 'string' ? parseInt(formData.program) : formData.program))?.name : 
                            "Select a program"}
                        </span>
                        {formData.program && (
                          <div className="flex items-center mt-1">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            <span className="text-xs text-gray-400">Active Program</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 transform rotate-90 group-hover:text-white transition-colors duration-300" />
                  </div>
                  
                  {/* Actual select element (visually hidden but accessible) */}
                  <select
                    id="program-select"
                    value={formData.program || ''}
                    onChange={(e) => updateFormData({ program: e.target.value ? parseInt(e.target.value) : null })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  >
                    <option value="">No Program</option>
                    {programs && programs.map(program => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Optional: Program quick preview if selected */}
                {formData.program && (
                  <div className="mt-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700 animate-fadeIn">
                    <div className="text-xs text-gray-400 flex items-center">
                      <div className="w-1 h-1 bg-green-400 rounded-full mr-1"></div>
                      <span>Program selected</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Animated style for the component */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes headShake {
          0% { transform: translateX(0); }
          6.5% { transform: translateX(-6px) rotateY(-9deg); }
          18.5% { transform: translateX(5px) rotateY(7deg); }
          31.5% { transform: translateX(-3px) rotateY(-5deg); }
          43.5% { transform: translateX(2px) rotateY(3deg); }
          50% { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-headShake {
          animation: headShake 1s ease-in-out infinite;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
};

export default WorkoutTypeStep;