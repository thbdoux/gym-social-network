// src/components/DouPlusModal.jsx
import React from 'react';
import { X } from 'lucide-react';

const DouPlusModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
      <div className="relative bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-700">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <div className="flex justify-center mb-4">
          <img src="/src/assets/dou-plus.svg" alt="dou+ logo" className="h-16" />
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-4">Upgrade to dou+</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">Advanced workout analytics and insights</p>
          </div>
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">Unlimited training programs and routines</p>
          </div>
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">Priority access to new features</p>
          </div>
          <div className="flex items-start">
            <span className="text-purple-400 mr-3">✓</span>
            <p className="text-gray-300">Ad-free experience</p>
          </div>
        </div>
        
        <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
          Upgrade Now
        </button>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          Only $9.99/month, cancel anytime
        </p>
      </div>
    </div>
  );
};

export default DouPlusModal;