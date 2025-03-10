import React from 'react';
import { Camera, Star } from 'lucide-react';

const NotesStep = ({ formData, updateFormData, colors }) => {
  // Preset note templates
  const noteTemplates = [
    "Felt strong today, increased weights on all exercises.",
    "Great workout session, focused on form and technique.",
    "Energy was low, but pushed through. Will rest better next time.",
    "Hit a new personal record on my main lift!",
    "Adjusted my form and felt much better movement pattern."
  ];

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
        <label className="block text-gray-300 mb-2 font-medium">
          How did your workout go?
        </label>
        <textarea
          value={formData.performance_notes || ''}
          onChange={(e) => updateFormData({ performance_notes: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          rows={4}
          placeholder="Share how your workout felt, any achievements, or things to remember for next time..."
        />
        
        {/* Quick template chips */}
        <div className="flex flex-wrap gap-2 mt-2">
          {noteTemplates.map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTemplate(template)}
              className={`px-3 py-1.5 bg-gray-800 rounded-full text-xs ${colors.text} hover:bg-gray-700 transition-colors flex items-center`}
            >
              <Star className="w-3 h-3 mr-1" />
              {template.length > 20 ? template.slice(0, 20) + '...' : template}
            </button>
          ))}
        </div>
      </div>
      
      {/* Photo upload section */}
      <div>
        <label className="block text-gray-300 mb-2 font-medium">
          Add photos
        </label>
        
        <div className="grid grid-cols-4 gap-2">
          {formData.media.map((file, index) => (
            <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-square">
              <img 
                src={file instanceof File ? URL.createObjectURL(file) : (file.url || file)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors"
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
            />
            <Camera className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400">Add Photos</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default NotesStep;