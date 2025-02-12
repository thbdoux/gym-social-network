import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  LineChart,
  ChevronRight,
  ChevronLeft,
  Edit,
  Check,
  Save,
} from 'lucide-react';

const ProgressCharts = ({ stats }) => (
    <div className="bg-gray-800/40 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-blue-400" />
            <span>Workouts/Week</span>
          </div>
          <div className="h-40 flex items-end justify-between">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="w-8 bg-blue-500/20 rounded-t">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-5 h-5 text-purple-400" />
            <span>Total Weight/Week</span>
          </div>
          <div className="h-40 flex items-end justify-between">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="w-8 bg-purple-500/20 rounded-t">
                <div 
                  className="w-full bg-purple-500 rounded-t"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  
export default ProgressCharts;