import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Step1GenderSelection = ({ onComplete }) => {
  const { t } = useLanguage();
  const [selectedGender, setSelectedGender] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 300);
  }, []);
  
  const handleSelect = (gender) => {
    setSelectedGender(gender);
  };
  
  const handleContinue = () => {
    if (selectedGender) {
      // Gender doesn't affect personality score directly, but we pass it along
      onComplete({ 
        gender: selectedGender,
        optimizer: 0,
        diplomate: 0,
        mentor: 0,
        versatile: 0 
      });
    }
  };
  
  return (
    <div className={`flex flex-col h-full transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <h2 className="text-xl font-bold text-center text-white mb-2">
        {t('gender_title')}
      </h2>
      <p className="text-center text-gray-400 mb-8">
        {t('gender_subtitle')}
      </p>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Male option */}
        <div
          className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer 
            transition-all duration-300 transform hover:scale-105
            ${selectedGender === 'male' ? 'ring-4 ring-blue-500 scale-105' : 'ring-1 ring-gray-700 hover:ring-gray-500'}
          `}
          onClick={() => handleSelect('male')}
        >
          {/* Image background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-gray-900/90"></div>
          
          {/* SVG silhouette or placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-24 h-24 text-blue-100/70" fill="currentColor">
              <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM5 12a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1z" />
            </svg>
          </div>
          
          {/* Label */}
          <div className="absolute bottom-0 inset-x-0 p-4 text-center">
            <span className="text-lg font-bold text-white">{t('gender_male')}</span>
          </div>
          
          {/* Selection indicator */}
          {selectedGender === 'male' && (
            <div className="absolute top-3 right-3 bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Female option */}
        <div
          className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer 
            transition-all duration-300 transform hover:scale-105
            ${selectedGender === 'female' ? 'ring-4 ring-pink-500 scale-105' : 'ring-1 ring-gray-700 hover:ring-gray-500'}
          `}
          onClick={() => handleSelect('female')}
        >
          {/* Image background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-900/40 to-gray-900/90"></div>
          
          {/* SVG silhouette or placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-24 h-24 text-pink-100/70" fill="currentColor">
              <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM5 12a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1z" />
            </svg>
          </div>
          
          {/* Label */}
          <div className="absolute bottom-0 inset-x-0 p-4 text-center">
            <span className="text-lg font-bold text-white">{t('gender_female')}</span>
          </div>
          
          {/* Selection indicator */}
          {selectedGender === 'female' && (
            <div className="absolute top-3 right-3 bg-pink-500 rounded-full w-6 h-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-auto">
        <button
          disabled={!selectedGender}
          onClick={handleContinue}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2
            ${selectedGender
              ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-700/90 hover:to-indigo-700/90'
              : 'bg-gray-700/50 cursor-not-allowed'
            } transition-all duration-300`}
        >
          <span>{t('continue')}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Step1GenderSelection;