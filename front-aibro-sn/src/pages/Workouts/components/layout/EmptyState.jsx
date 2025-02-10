import React from 'react';
import { Plus } from 'lucide-react';

const EmptyState = ({ 
  title, 
  description, 
  action,
  icon: Icon = Plus // Default icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-800/40 rounded-full flex items-center 
                    justify-center mb-6">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 
                   transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;