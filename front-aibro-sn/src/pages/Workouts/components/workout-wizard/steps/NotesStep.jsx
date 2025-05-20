import React from 'react';
import { Camera, Star, Info } from 'lucide-react';
import { useLanguage } from '../../../../../context/LanguageContext';

const NotesStep = ({ formData, updateFormData, colors }) => {
  const { t } = useLanguage();
  
  // Preset note templates with translations
  const getNoteTemplates = () => [
    t("template_strong"),
    t("template_focus"),
    t("template_low_energy"),
    t("template_new_record"),
    t("template_form")
  ];

  const noteTemplates = getNoteTemplates();

  // Add template text to notes
  const addTemplate = (template) => {
    const currentNotes = formData.performance_notes || '';
    const newNotes = currentNotes ? `${currentNotes}\n${template}` : template;
    updateFormData({ performance_notes: newNotes });
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    updateFormData({ 
      media: [...formData.media, ...files]
    });
  };

  // Remove an image
  const removeImage = (index) => {
    const newMedia = [...formData.media];
    newMedia.splice(index, 1);
    updateFormData({ media: newMedia });
  };

  return (
    <div className="space-y-6">
      {/* Notes textarea */}
      <div>
        <div className="flex items-center mb-2">
          <label className="block text-gray-300 font-medium">
            {t("how_did_workout_go")}
          </label>
          <div className="relative group ml-2">
            <Info className="w-4 h-4 text-gray-500 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-800 rounded-lg border border-gray-700 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              {t("performance_notes_help")}
            </div>
          </div>
        </div>
        <textarea
          value={formData.performance_notes || ''}
          onChange={(e) => updateFormData({ performance_notes: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          rows={4}
          placeholder={t("notes_placeholder")}
          aria-label={t("performance_notes")}
        />
        
        {/* Quick template chips */}
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-2 flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-500" />
            {t("quick_templates")}
          </div>
          <div className="flex flex-wrap gap-2">
            {noteTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addTemplate(template)}
                className={`px-3 py-1.5 bg-gray-800 rounded-full text-xs ${colors.text} hover:bg-gray-700 transition-colors flex items-center`}
                title={t("click_to_add")}
              >
                <Star className="w-3 h-3 mr-1" />
                {template.length > 20 ? template.slice(0, 20) + '...' : template}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Photo upload section */}
      <div>
        <label className="block text-gray-300 mb-2 font-medium">
          {t("add_photos")}
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {formData.media.map((file, index) => (
            <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-square">
              <img 
                src={file instanceof File ? URL.createObjectURL(file) : (file.url || file)}
                alt={`${t("upload")} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors"
                title={t("remove_photo")}
                aria-label={t("remove_photo")}
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          
          {/* Upload button */}
          <label className="flex flex-col items-center justify-center bg-gray-800 border border-dashed border-gray-700 rounded-lg aspect-square cursor-pointer hover:border-gray-600 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              aria-label={t("upload_photo")}
            />
            <Camera className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400">{t("add_photos")}</span>
          </label>
        </div>
        
        {/* Photo counter */}
        {formData.media.length > 0 && (
          <div className="mt-2 text-right text-xs text-gray-400">
            {formData.media.length} {formData.media.length === 1 ? t("photo") : t("photos")}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesStep;