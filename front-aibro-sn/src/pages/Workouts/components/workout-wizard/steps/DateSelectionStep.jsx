import React from 'react';
import { Calendar } from 'lucide-react';

const DateSelectionStep = ({ formData, updateFormData, colors }) => {
  // Helper to format dates in YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Get today and yesterday dates
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Get day before yesterday
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-xl font-bold text-center text-white mb-8">
        When did you work out?
      </h3>
      
      {/* Quick selection buttons */}
      <div className="flex justify-center space-x-3 mb-6">
        <button
          type="button"
          onClick={() => updateFormData({ date: formatDate(today) })}
          className={`
            px-4 py-3 rounded-lg transition-colors flex items-center
            ${formData.date === formatDate(today) 
              ? colors.bg
              : 'bg-gray-800 hover:bg-gray-700'}
          `}
        >
          <span>Today</span>
        </button>
        
        <button
          type="button"
          onClick={() => updateFormData({ date: formatDate(yesterday) })}
          className={`
            px-4 py-3 rounded-lg transition-colors flex items-center
            ${formData.date === formatDate(yesterday) 
              ? colors.bg
              : 'bg-gray-800 hover:bg-gray-700'}
          `}
        >
          <span>Yesterday</span>
        </button>
        
        <button
          type="button"
          onClick={() => updateFormData({ date: formatDate(twoDaysAgo) })}
          className={`
            px-4 py-3 rounded-lg transition-colors flex items-center
            ${formData.date === formatDate(twoDaysAgo) 
              ? colors.bg
              : 'bg-gray-800 hover:bg-gray-700'}
          `}
        >
          <span>2 Days Ago</span>
        </button>
      </div>
      
      {/* Date input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="date"
          value={formData.date}
          onChange={(e) => updateFormData({ date: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white
            focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none"
        />
      </div>
      
      {/* Current selected date display */}
      <div className="mt-6 text-center text-gray-400 text-sm">
        Selected: <span className="text-white font-medium">{new Date(formData.date).toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</span>
      </div>
    </div>
  );
};

export default DateSelectionStep;