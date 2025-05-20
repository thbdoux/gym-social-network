import React, { useState } from 'react';
import { X, Save, MapPin, Clock, AlignLeft, Building, Check } from 'lucide-react';
import { useCreateGym } from '../../../hooks/query';
import { useLanguage } from '../../../context/LanguageContext';

const GymCreationModal = ({ isOpen, onClose, onGymCreated }) => {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    opening_hours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' }
    }
  });
  const [selectedDay, setSelectedDay] = useState('monday');
  const [showHours, setShowHours] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  
  // Use React Query mutation hook for creating a gym
  const createGymMutation = useCreateGym();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (step < 2) {
      setStep(step + 1);
      return;
    }

    try {
      const newGym = await createGymMutation.mutateAsync(formData);
      if (newGym) {
        onGymCreated(newGym);
        onClose();
      }
    } catch (error) {
      console.error('Gym creation error:', error);
      setError(error.response?.data?.detail || t('failed_to_create_gym'));
    }
  };

  const updateHours = (day, field, value) => {
    setFormData({
      ...formData,
      opening_hours: {
        ...formData.opening_hours,
        [day]: {
          ...formData.opening_hours[day],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-xl font-bold">{t('add_new_gym')}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : 1}
              </div>
              <div className={`text-sm ${step >= 1 ? 'text-white' : 'text-gray-400'}`}>{t('basic_info')}</div>
            </div>
            <div className="w-16 h-0.5 bg-gray-700">
              <div className={`h-full bg-blue-600 transition-all ${step > 1 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {step > 2 ? <Check className="w-4 h-4" /> : 2}
              </div>
              <div className={`text-sm ${step >= 2 ? 'text-white' : 'text-gray-400'}`}>{t('details')}</div>
            </div>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-medium">{t('gym_name')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder={t('enter_gym_name')}
                    required
                  />
                  <Building className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1 font-medium">{t('location')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder={t('enter_gym_location')}
                    required
                  />
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm text-gray-300 mb-1 font-medium">{t('description')}</label>
                <div className="relative">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 h-24 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder={t('describe_gym')}
                  />
                  <AlignLeft className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-300 font-medium">{t('opening_hours')}</label>
                  <button
                    type="button"
                    onClick={() => setShowHours(!showHours)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    {showHours ? t('hide_hours') : t('set_hours')}
                  </button>
                </div>
                
                {showHours && (
                  <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4 animate-fadeIn">
                    <div className="grid grid-cols-7 gap-1 mb-3">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`text-xs p-1 rounded ${
                            selectedDay === day 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {t(day.substring(0, 3))}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">{t('open')}</label>
                        <input
                          type="time"
                          value={formData.opening_hours[selectedDay].open}
                          onChange={(e) => updateHours(selectedDay, 'open', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-400 mb-1">{t('close')}</label>
                        <input
                          type="time"
                          value={formData.opening_hours[selectedDay].close}
                          onChange={(e) => updateHours(selectedDay, 'close', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {!showHours && (
                  <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{t('default_hours_set')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2 animate-fadeIn">
              <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                {t('back')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
              >
                {t('cancel')}
              </button>
            )}
            
            <button
              type="submit"
              disabled={createGymMutation.isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {step < 2 ? (
                t('next')
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {createGymMutation.isLoading ? t('creating') : t('create_gym')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GymCreationModal;