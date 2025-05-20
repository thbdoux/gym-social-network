import React, { useState, useEffect } from 'react';
import { Dumbbell, Zap, Heart, Edit, Check } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

// Enhanced workout types with better visuals
const getWorkoutTypes = (t) => [
  { 
    name: t("upper_body"), 
    icon: <Dumbbell className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-400",
    bgClass: "bg-gradient-to-br from-blue-500/10 to-cyan-400/10",
    borderClass: "border-blue-500/30",
    description: t("upper_body_description"),
  },
  { 
    name: t("lower_body"), 
    icon: <Dumbbell className="w-6 h-6" />,
    color: "from-purple-500 to-pink-400",
    bgClass: "bg-gradient-to-br from-purple-500/10 to-pink-400/10",
    borderClass: "border-purple-500/30",
    description: t("lower_body_description"),
  },
  { 
    name: t("full_body"), 
    icon: <Zap className="w-6 h-6" />,
    color: "from-amber-500 to-orange-400",
    bgClass: "bg-gradient-to-br from-amber-500/10 to-orange-400/10",
    borderClass: "border-amber-500/30",
    description: t("full_body_description"),
  },
  { 
    name: t("cardio"), 
    icon: <Heart className="w-6 h-6" />,
    color: "from-red-500 to-rose-400",
    bgClass: "bg-gradient-to-br from-red-500/10 to-rose-400/10",
    borderClass: "border-red-500/30",
    description: t("cardio_description"),
  },
  { 
    name: t("custom"), 
    icon: <Edit className="w-6 h-6" />,
    color: "from-emerald-500 to-teal-400",
    bgClass: "bg-gradient-to-br from-emerald-500/10 to-teal-400/10",
    borderClass: "border-emerald-500/30",
    description: t("custom_description"),
  }
];

const WorkoutTypeStep = ({ formData, updateFormData, errors, colors }) => {
  const { t } = useLanguage();
  const WORKOUT_TYPES = getWorkoutTypes(t);
  
  const getInitialSelectedType = () => {
    if (!formData.name) return '';
    
    // First check if the name exactly matches one of our workout types
    const exactMatch = WORKOUT_TYPES.find(type => type.name === formData.name);
    if (exactMatch) return exactMatch.name;
    
    // If not, check if any of the English workout type names are contained in the formData.name
    // This helps when translating languages back and forth
    const englishTypes = ["Upper Body", "Lower Body", "Full Body", "Cardio", "Custom"];
    for (const englishType of englishTypes) {
      if (formData.name.includes(englishType)) {
        return WORKOUT_TYPES[englishTypes.indexOf(englishType)].name;
      }
    }
    
    // If still no match, assume it's a custom name
    return 'Custom';
  };

  const [selectedType, setSelectedType] = useState(getInitialSelectedType());
  const [customName, setCustomName] = useState(
    WORKOUT_TYPES.find(t => t.name === formData.name) ? '' : formData.name
  );

  // Handle workout type selection
  const handleTypeSelect = (typeName) => {
    setSelectedType(typeName);
    if (typeName !== t("custom")) {
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
        selectedElement.classList.add('scale-105');
        setTimeout(() => {
          selectedElement.classList.remove('scale-105');
        }, 300);
      }
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [selectedType]);

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-xl font-bold text-center text-white mb-8">
        {t("what_workout_type")}
      </h3>
      
      {/* Modern Card Layout */}
      <div className="grid grid-cols-1 gap-4">
        {WORKOUT_TYPES.map((type) => {
          const isSelected = selectedType === type.name;
          
          return (
            <div
              id={`workout-type-${type.name}`}
              key={type.name}
              onClick={() => handleTypeSelect(type.name)}
              className={`
                p-4 rounded-xl border overflow-hidden relative cursor-pointer transition-all duration-300
                ${isSelected ? `${type.borderClass} ${type.bgClass}` : 'border-gray-700 hover:border-gray-500'}
                transform hover:scale-[1.02]
              `}
            >
              <div className="flex items-center justify-between">
                {/* Icon with background */}
                <div className="flex items-center">
                  <div className={`
                    p-3 rounded-xl mr-4 transition-all duration-300
                    ${isSelected 
                      ? `bg-gradient-to-r ${type.color} shadow-lg` 
                      : 'bg-gray-800'}
                  `}>
                    {React.cloneElement(type.icon, { 
                      className: `transition-all duration-300 ${isSelected ? 'text-white' : 'text-gray-300'}` 
                    })}
                  </div>
                  
                  <div>
                    <div className="text-xl font-semibold text-white">{type.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{type.description}</div>
                  </div>
                </div>
                
                {/* Selection indicator */}
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                  ${isSelected ? `bg-gradient-to-r ${type.color}` : 'bg-gray-700'}
                `}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
              
              {/* Bottom gradient bar for selected item */}
              {isSelected && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${type.color}`}></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Show custom name input if "Custom" is selected */}
      {selectedType === t("custom") && (
        <div className="mt-6 animate-fadeIn">
          <input
            type="text"
            value={customName}
            onChange={handleCustomNameChange}
            placeholder={t("enter_custom_workout_name")}
            className={`
              w-full bg-gray-800/50 border rounded-lg px-4 py-3 text-white transition-all
              focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none
              ${errors.name ? 'border-red-500' : 'border-gray-700 hover:border-gray-500'}
            `}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-2 animate-pulse">{errors.name}</p>
          )}
        </div>
      )}
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WorkoutTypeStep;