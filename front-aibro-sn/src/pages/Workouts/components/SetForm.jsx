// SetForm.jsx
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const inputStyles = `
  /* Hide default number spinners for Chrome, Safari, Edge, Opera */
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Hide default number spinners for Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

const SetForm = ({ set, setIndex, onUpdate, onDelete, isEditing = true }) => {
  const [localValues, setLocalValues] = useState({
    reps: set.reps.toString(),
    weight: set.weight.toString(),
    rest_time: set.rest_time.toString()
  });

  const handleInputChange = (field, value) => {
    // Allow empty string or numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLocalValues(prev => ({
        ...prev,
        [field]: value
      }));

      // Convert empty string to 0 when sending to parent
      const numberValue = value === '' ? 0 : Number(value);
      onUpdate(field, numberValue);
    }
  };

  const handleStep = (field, step) => {
    const currentValue = Number(localValues[field]) || 0;
    const newValue = Math.max(0, currentValue + step);
    
    setLocalValues(prev => ({
      ...prev,
      [field]: newValue.toString()
    }));
    
    onUpdate(field, newValue);
  };

  if (!isEditing) {
    return (
      <div className="grid grid-cols-4 gap-4 p-3 bg-gray-700/50 rounded-lg">
        <div className="text-gray-400">Set {setIndex + 1}</div>
        <div className="text-white">{set.reps} reps</div>
        <div className="text-white">{set.weight} kg</div>
        <div className="text-white">{set.rest_time}s rest</div>
      </div>
    );
  }

  return (
    <>
      <style>{inputStyles}</style>
      <div className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg">
        <div className="text-gray-400 min-w-[60px]">Set {setIndex + 1}</div>
        
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <input
                type="number"
                value={localValues.reps}
                onChange={(e) => handleInputChange('reps', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.target.value = '';
                    handleInputChange('reps', '');
                  }
                }}
                className="w-full bg-gray-600 border-none rounded focus:ring-2 focus:ring-blue-500/50 text-white pr-6"
                min="0"
                step="1"
              />
              <div className="absolute right-0 top-0 bottom-0 w-5 flex flex-col">
                <button
                  type="button"
                  onClick={() => handleStep('reps', 1)}
                  className="flex-1 px-1 bg-gray-500 hover:bg-gray-400 rounded-tr focus:outline-none text-[10px] text-gray-200"
                >▲</button>
                <button
                  type="button"
                  onClick={() => handleStep('reps', -1)}
                  className="flex-1 px-1 bg-gray-500 hover:bg-gray-400 rounded-br focus:outline-none text-[10px] text-gray-200"
                >▼</button>
              </div>
            </div>
            <label className="text-xs text-gray-400 mt-1">Reps</label>
          </div>

          <div>
            <div className="relative">
              <input
                type="number"
                value={localValues.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.target.value = '';
                    handleInputChange('weight', '');
                  }
                }}
                className="w-full bg-gray-600 border-none rounded focus:ring-2 focus:ring-blue-500/50 text-white pr-6"
                min="0"
                step="2.5"
              />
              <div className="absolute right-0 top-0 bottom-0 w-5 flex flex-col">
                <button
                  type="button"
                  onClick={() => handleStep('weight', 2.5)}
                  className="flex-1 px-1 bg-gray-500 hover:bg-gray-400 rounded-tr focus:outline-none text-[10px] text-gray-200"
                >▲</button>
                <button
                  type="button"
                  onClick={() => handleStep('weight', -2.5)}
                  className="flex-1 px-1 bg-gray-500 hover:bg-gray-400 rounded-br focus:outline-none text-[10px] text-gray-200"
                >▼</button>
              </div>
            </div>
            <label className="text-xs text-gray-400 mt-1">Weight (kg)</label>
          </div>

          <div>
            <div className="relative">
              <input
                type="number"
                value={localValues.rest_time}
                onChange={(e) => handleInputChange('rest_time', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.target.value = '';
                    handleInputChange('rest_time', '');
                  }
                }}
                className="w-full bg-gray-600 border-none rounded focus:ring-2 focus:ring-blue-500/50 text-white pr-6"
                min="0"
                step="15"
              />
              <div className="absolute right-0 top-0 bottom-0 w-5 flex flex-col">
                <button
                  type="button"
                  onClick={() => handleStep('rest_time', 15)}
                  className="flex-1 px-1 bg-gray-500 hover:bg-gray-400 rounded-tr focus:outline-none text-[10px] text-gray-200"
                >▲</button>
                <button
                  type="button"
                  onClick={() => handleStep('rest_time', -15)}
                  className="flex-1 px-1 bg-gray-500 hover:bg-gray-400 rounded-br focus:outline-none text-[10px] text-gray-200"
                >▼</button>
              </div>
            </div>
            <label className="text-xs text-gray-400 mt-1">Rest (sec)</label>
          </div>
        </div>

        <button
          onClick={onDelete}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </>
  );
};

export default SetForm;