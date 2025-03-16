import React from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';

const AdvancedOptionsStep = ({ formData, updateFormData }) => {
  return (
    <div className="max-w-md mx-auto py-8">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        Quick Settings
      </h2>
      
      <div className="space-y-6">
        {/* Minimalist toggle switches */}
        <label className="relative inline-flex items-center cursor-pointer bg-gray-900 p-4 rounded-lg border border-gray-700 w-full">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => updateFormData({ is_active: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5rem] after:left-[1.5rem] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <div className="ml-4">
            <span className="text-white font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2 text-blue-400" />
              Active Program
            </span>
          </div>
        </label>

        <label className="relative inline-flex items-center cursor-pointer bg-gray-900 p-4 rounded-lg border border-gray-700 w-full">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => updateFormData({ is_public: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1.5rem] after:left-[1.5rem] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <div className="ml-4">
            <span className="text-white font-medium flex items-center">
              {formData.is_public ? (
                <Eye className="w-4 h-4 mr-2 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 mr-2 text-red-400" />
              )}
              Public
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default AdvancedOptionsStep;