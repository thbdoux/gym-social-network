import React from 'react';
import { 
  Dumbbell, Calendar, Clock, Tag, 
  ChevronRight, Shield, Award, Activity,
  Info, Users, Eye, EyeOff
} from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

const ReviewTemplateStep = ({ formData, colors, inProgram }) => {
  const { t } = useLanguage();
  
  // Count total sets
  const totalSets = formData.exercises.reduce(
    (total, exercise) => total + exercise.sets.length, 0
  );
  
  // Get difficulty icon
  const getDifficultyIcon = (level) => {
    switch(level) {
      case 'beginner': return <Shield className="w-4 h-4 text-green-400" />;
      case 'advanced': return <Award className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-yellow-400" />;
    }
  };
  
  // Get weekday name with translations
  const getWeekdayName = (index) => {
    const days = [
      t("monday"), t("tuesday"), t("wednesday"), 
      t("thursday"), t("friday"), t("saturday"), t("sunday")
    ];
    return days[index];
  };

  // Format exercise set details
  const formatSetDetails = (sets) => {
    if (!sets || sets.length === 0) return '';
    
    // Get the range of reps and weights
    const reps = sets.map(set => set.reps);
    const weights = sets.map(set => set.weight);
    
    const minReps = Math.min(...reps);
    const maxReps = Math.max(...reps);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    
    // If all sets have the same values
    if (minReps === maxReps && minWeight === maxWeight) {
      return `${minReps} ${t("reps")} × ${minWeight}${t("kg")}`;
    }
    
    // If only reps vary
    if (minWeight === maxWeight) {
      return `${minReps}-${maxReps} ${t("reps")} × ${minWeight}${t("kg")}`;
    }
    
    // If only weights vary
    if (minReps === maxReps) {
      return `${minReps} ${t("reps")} × ${minWeight}-${maxWeight}${t("kg")}`;
    }
    
    // Both vary
    return `${minReps}-${maxReps} ${t("reps")} × ${minWeight}-${maxWeight}${t("kg")}`;
  };

  // Get split method name with proper translation
  const getSplitMethodName = (splitMethod) => {
    if (!splitMethod) return '';
    
    // Convert snake_case to translation key and get translated text
    switch(splitMethod) {
      case 'full_body': return t("full_body");
      case 'upper_lower': return t("upper_lower");
      case 'push_pull_legs': return t("push_pull_legs");
      case 'custom': return t("custom");
      default: return splitMethod.replace(/_/g, ' ');
    }
  };
  
  // Get difficulty level name with translation
  const getDifficultyLevelName = (level) => {
    if (!level) return '';
    
    switch(level) {
      case 'beginner': return t("beginner");
      case 'intermediate': return t("intermediate");
      case 'advanced': return t("advanced");
      case 'expert': return t("expert");
      default: return level;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-blue-500/20 p-3 rounded-xl">
          <Dumbbell className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("review_workout")}
          </h2>
          <p className="text-gray-400">{t("check_details_before_saving")}</p>
        </div>
      </div>

      {/* Summary alert */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-400 flex items-start">
        <Info className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">{t("workout_summary")}</p>
          <p className="text-sm mt-1 text-blue-300">
            {t("template_summary", {
              level: getDifficultyLevelName(formData.difficulty_level),
              exercises: formData.exercises.length,
              sets: totalSets,
              duration: formData.estimated_duration
            })}
          </p>
        </div>
      </div>

      {/* Workout summary card */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg">
        <h3 className="font-semibold text-white text-lg mb-4 flex items-center">
          <Dumbbell className={`w-5 h-5 mr-2 ${colors.text}`} />
          {formData.name || t("unnamed_workout")}
        </h3>
        
        <div className="grid grid-cols-2 gap-y-4 text-sm mb-4">
          {/* Split Method */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-gray-400 text-xs">{t("split_type")}</div>
              <div className="text-white capitalize">
                {getSplitMethodName(formData.split_method)}
              </div>
            </div>
          </div>
          
          {/* Difficulty */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
              {getDifficultyIcon(formData.difficulty_level)}
            </div>
            <div>
              <div className="text-gray-400 text-xs">{t("difficulty")}</div>
              <div className="text-white capitalize">
                {getDifficultyLevelName(formData.difficulty_level)}
              </div>
            </div>
          </div>
          
          {/* Duration */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-gray-400 text-xs">{t("duration")}</div>
              <div className="text-white">
                {formData.estimated_duration} {t("minutes")}
              </div>
            </div>
          </div>
          
          {/* Visibility */}
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
              {formData.is_public ? 
                <Eye className="w-4 h-4 text-green-400" /> : 
                <EyeOff className="w-4 h-4 text-red-400" />
              }
            </div>
            <div>
              <div className="text-gray-400 text-xs">{t("visibility")}</div>
              <div className="text-white">
                {formData.is_public ? t("public_template") : t("private_template")}
              </div>
            </div>
          </div>
          
          {/* Weekday - only show for program workouts */}
          {inProgram && (
            <div className="flex items-center col-span-2">
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center mr-3">
                <Calendar className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="text-gray-400 text-xs">{t("program_day")}</div>
                <div className="text-white">
                  {getWeekdayName(formData.preferred_weekday)}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Description if available */}
        {formData.description && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="text-gray-400 text-xs mb-1">{t("description")}</div>
            <p className="text-gray-300 text-sm">{formData.description}</p>
          </div>
        )}
        
        {/* Tags if available */}
        {formData.tags && formData.tags.length > 0 && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="text-gray-400 text-xs mb-2">{t("tags")}</div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Exercise summary */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white text-base flex items-center">
            <Dumbbell className="w-4 h-4 mr-2 text-blue-400" />
            {t("exercises")} ({formData.exercises.length})
          </h3>
          <span className="bg-gray-800 px-2 py-1 rounded-full text-xs text-gray-400 flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {totalSets} {t("total_sets")}
          </span>
        </div>
        
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden divide-y divide-gray-700 shadow-lg">
          {formData.exercises.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {t("no_exercises_added_yet")}
            </div>
          ) : (
            formData.exercises.map((exercise, index) => (
              <div 
                key={exercise.id || index}
                className="p-4 hover:bg-gray-800/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`${colors.bg} p-1.5 rounded-lg mr-3`}>
                      <Dumbbell className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-white font-medium">{exercise.name}</div>
                  </div>
                  
                  <div className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300">
                    {exercise.equipment || t("no_equipment")}
                  </div>
                </div>
                
                {/* Set details */}
                <div className="mt-2 pl-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div 
                        key={set.id || setIndex} 
                        className="text-xs bg-gray-700/50 rounded py-1 px-2 flex items-center justify-between"
                      >
                        <span className="text-gray-400">{t("set")} {setIndex + 1}</span>
                        <span className="text-white">{set.reps} × {set.weight}{t("kg")}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Notes if available */}
                  {exercise.notes && (
                    <div className="mt-2 text-xs text-gray-400 bg-gray-700/30 p-2 rounded border-l-2 border-gray-600">
                      <span className="font-medium text-gray-300">{t("notes")}: </span>
                      {exercise.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Ready to save message */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex justify-center items-center">
        <div className="text-green-500 font-medium text-center">
          {t("ready_to_save_template")}
        </div>
      </div>
    </div>
  );
};

export default ReviewTemplateStep;