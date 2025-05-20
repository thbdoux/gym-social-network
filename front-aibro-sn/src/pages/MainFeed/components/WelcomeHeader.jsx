import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

const WelcomeHeader = ({ username }) => {
  const { t } = useLanguage();
  
  return (
    <div className="mb-8">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
        {t('welcome_message')}, <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
          {username}
        </span> ?
      </h1>
    </div>
  );
};

export default WelcomeHeader;