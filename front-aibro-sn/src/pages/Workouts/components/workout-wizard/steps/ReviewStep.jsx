import React, { useState } from 'react';
import { 
  Dumbbell, Calendar, MapPin, Clock, Flame, 
  CheckCircle, XCircle, ChevronRight, Smile,
  CheckSquare, Info
} from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

const ReviewStep = ({ formData, colors }) => {
  const { t, language } = useLanguage();
  const [showMissingWarning, setShowMissingWarning] = useState(true);
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      
      // Use appropriate date format based on language
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      };
      
      return date.toLocaleDateString(
        language === 'fr' ? 'fr-FR' : 'en-US', 
        options
      );
    } catch (e) {
      return dateString;
    }
  };
  
  // Get mood label with translations
  const getMoodLabel = (value) => {
    if (value >= 8) return { emoji: "😀", label: t("great") };
    if (value >= 6) return { emoji: "🙂", label: t("good") };
    if (value >= 4) return { emoji: "😐", label: t("okay") };
    if (value >= 2) return { emoji: "☹️", label: t("poor") };
    return { emoji: "😫", label: t("terrible") };
  };
  
  // Get difficulty label with translations
  const getDifficultyLabel = (value) => {
    if (value >= 8) return { label: t("hard"), color: "text-red-400" };
    if (value >= 6) return { label: t("challenging"), color: "text-orange-400" };
    if (value >= 4) return { label: t("moderate"), color: "text-yellow-400" };
    return { label: t("easy"), color: "text-green-400" };
  };
  
  const mood = getMoodLabel(formData.mood_rating);
  const difficulty = getDifficultyLabel(formData.perceived_difficulty);
  
  // Count total sets
  const totalSets = formData.exercises.reduce(
    (total, exercise) => total + exercise.sets.length, 0
  );
  
  // Count reps
  const totalReps = formData.exercises.reduce(
    (total, exercise) => total + exercise.sets.reduce(
      (setTotal, set) => setTotal + set.reps, 0
    ), 0
  );
  
  // Check for missing items
  const hasMissingItems = formData.exercises.length === 0 || !formData.performance_notes;
  
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center">
          <CheckSquare className="w-5 h-5 mr-2 text-green-400" />
          {t("review_workout")}
        </h2>
        <div className="text-sm text-gray-400">
          {t("check_details_before_saving")}
        </div>
      </div>
      
      {/* Missing items warning */}
      {hasMissingItems && showMissingWarning && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 animate-fadeIn flex items-start">
          <Info className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">{t("workout_incomplete")}</p>
            <ul className="text-sm mt-1 text-yellow-300/90 space-y-1">
              {formData.exercises.length === 0 && (
                <li className="flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0" />
                  {t("missing_exercise_warning")}
                </li>
              )}
              {!formData.performance_notes && (
                <li className="flex items-center">
                  <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0" />
                  {t("missing_notes_warning")}
                </li>
              )}
            </ul>
          </div>
          <button 
            className="ml-auto text-yellow-400 hover:text-yellow-300 p-1"
            onClick={() => setShowMissingWarning(false)}
            aria-label={t("dismiss")}
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Workout summary card */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-md">
        <h3 className="font-semibold text-white text-base mb-3 flex items-center">
          <Dumbbell className={`w-4 h-4 mr-2 ${colors.text}`} />
          {formData.name || t("unnamed_workout")}
        </h3>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {/* Date */}
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-gray-300 truncate">{formatDate(formData.date)}</span>
          </div>
          
          {/* Location */}
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-gray-300">
              {formData.gym ? t("gym") : t("home_workout")}
            </span>
          </div>
          
          {/* Duration */}
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            <span className="text-gray-300">{formData.duration} {t("mins")}</span>
          </div>
          
          {/* Status */}
          <div className="flex items-center">
            {formData.completed ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-300">{t("completed")}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                <span className="text-gray-300">{t("partially_done")}</span>
              </>
            )}
          </div>
          
          {/* Difficulty */}
          <div className="flex items-center">
            <Flame className={`w-4 h-4 mr-2 flex-shrink-0 ${difficulty.color}`} />
            <span className="text-gray-300">
              {difficulty.label} ({formData.perceived_difficulty}/10)
            </span>
          </div>
          
          {/* Mood */}
          <div className="flex items-center">
            <Smile className="w-4 h-4 mr-1 text-blue-400 flex-shrink-0" />
            <span className="text-xl mr-1 leading-none">{mood.emoji}</span>
            <span className="text-gray-300">
              {mood.label} ({formData.mood_rating}/10)
            </span>
          </div>
        </div>
        
        {/* Stats summary */}
        {formData.exercises.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800/70 rounded-lg p-2">
              <div className="text-xs text-gray-400">{t("exercises")}</div>
              <div className="text-white font-medium">{formData.exercises.length}</div>
            </div>
            <div className="bg-gray-800/70 rounded-lg p-2">
              <div className="text-xs text-gray-400">{t("sets")}</div>
              <div className="text-white font-medium">{totalSets}</div>
            </div>
            <div className="bg-gray-800/70 rounded-lg p-2">
              <div className="text-xs text-gray-400">{t("total_reps")}</div>
              <div className="text-white font-medium">{totalReps}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Exercise summary */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-white text-sm">
            {t("exercises")} ({formData.exercises.length})
          </h3>
          {formData.exercises.length > 0 && (
            <span className="text-xs text-gray-400">
              {totalSets} {t("total_sets")}
            </span>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-md">
          {formData.exercises.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-sm">
              {t("no_exercises_added_yet")}
            </div>
          ) : (
            formData.exercises.map((exercise, index) => (
              <div 
                key={exercise.id}
                className={`p-2 flex items-center justify-between ${
                  index < formData.exercises.length - 1 ? 'border-b border-gray-700' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`${colors.bg} p-1 rounded mr-2 flex-shrink-0`}>
                    <Dumbbell className="w-3 h-3 text-white" />
                  </div>
                  <div className="min-w-0"> {/* Prevent overflow */}
                    <div className="text-white text-sm truncate">{exercise.name}</div>
                    <div className="text-xs text-gray-400">
                      {exercise.sets.length} {t("sets")} • {exercise.equipment || t("no_equipment")}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Notes summary (if any) */}
      {formData.performance_notes ? (
        <div>
          <h3 className="font-semibold text-white text-sm mb-1">{t("notes")}</h3>
          <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 shadow-md">
            <p className="text-gray-300 text-xs whitespace-pre-line">
              {formData.performance_notes}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-xl p-3 border border-dashed border-gray-700 text-center">
          <p className="text-gray-500 text-xs">{t("no_notes_added")}</p>
        </div>
      )}
      
      {/* Media gallery preview (if any) */}
      {formData.media.length > 0 && (
        <div>
          <h3 className="font-semibold text-white text-sm mb-1">
            {t("photos")} ({formData.media.length})
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {formData.media.slice(0, 4).map((file, index) => (
              <div key={index} className="bg-gray-800 rounded-lg overflow-hidden aspect-square shadow-md">
                <img 
                  src={file instanceof File ? URL.createObjectURL(file) : (file.url || file)}
                  alt={`${t("workout_photo")} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {formData.media.length > 4 && (
              <div className="col-span-4 text-right text-xs text-gray-400 mt-1">
                +{formData.media.length - 4} {t("more")}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Ready to save banner */}
      <div className={`
        mt-6 p-3 rounded-lg border text-center transition-all
        ${hasMissingItems
          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          : 'bg-green-500/10 border-green-500/30 text-green-400'
        }
      `}>
        {hasMissingItems 
          ? t("workout_incomplete_save_anyway")
          : t("ready_to_save")
        }
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ReviewStep;