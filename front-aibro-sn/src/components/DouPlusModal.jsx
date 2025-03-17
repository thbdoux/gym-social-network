// src/components/DouPlusModal.jsx
import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DouPlusModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
      <div className="relative bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-700">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label={t('close')}
        >
          <X size={20} />
        </button>
        
        <div className="flex justify-center mb-4">
          <img src="/src/assets/dou-plus.svg" alt="dou+ logo" className="h-16" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-4">{t('upgrade_to_dou')}</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">{t('douplus_feature_analytics')}</p>
          </div>
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">{t('douplus_feature_programs')}</p>
          </div>
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">{t('douplus_feature_priority')}</p>
          </div>
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">{t('douplus_feature_adfree')}</p>
          </div>
        </div>
        
        <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
          {t('upgrade_now')}
        </button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          {t('douplus_price')}
        </p>
      </div>
    </div>
  );
};

export default DouPlusModal;