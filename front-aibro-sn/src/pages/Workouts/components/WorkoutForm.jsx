// // src/pages/Workouts/components/WorkoutForm.jsx
// import React, { useState } from 'react';
// import { Plus, Copy, Trash2 } from 'lucide-react';

// const WorkoutForm = ({ onSubmit, initialData = null, onCancel }) => {
//   const [workoutData, setWorkoutData] = useState(
//     initialData || {
//       name: '',
//       description: '',
//       split_method: 'full_body',
//       exercises: []
//     }
//   );

//   const [errors, setErrors] = useState({});

//   const validate = () => {
//     const newErrors = {};
//     if (!workoutData.name?.trim()) {
//       newErrors.name = 'Name is required';
//     }
//     if (!workoutData.split_method) {
//       newErrors.split_method = 'Split method is required';
//     }
//     if (!workoutData.exercises?.length) {
//       newErrors.exercises = 'At least one exercise is required';
//     } else {
//       workoutData.exercises.forEach((exercise, idx) => {
//         if (!exercise.name?.trim()) {
//           newErrors[`exercise_${idx}_name`] = 'Exercise name is required';
//         }
//         if (!exercise.sets?.length) {
//           newErrors[`exercise_${idx}_sets`] = 'At least one set is required';
//         } else {
//           exercise.sets.forEach((set, setIdx) => {
//             if (!set.reps || set.reps <= 0) {
//               newErrors[`exercise_${idx}_set_${setIdx}_reps`] = 'Valid reps required';
//             }
//           });
//         }
//       });
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const addExercise = () => {
//     setWorkoutData(prev => ({
//       ...prev,
//       exercises: [...(prev.exercises || []), {
//         name: '',
//         equipment: '',
//         notes: '',
//         order: prev.exercises?.length || 0,
//         sets: [{
//           reps: 0,
//           weight: 0,
//           rest_time: 60,
//           order: 0
//         }]
//       }]
//     }));
//   };

//   const addSet = (exerciseIndex, copyPrevious = false) => {
//     const newExercises = [...(workoutData.exercises || [])];
//     const exercise = newExercises[exerciseIndex];
//     const previousSet = exercise.sets[exercise.sets.length - 1];
    
//     const newSet = copyPrevious && previousSet ? {
//       ...previousSet,
//       order: exercise.sets.length
//     } : {
//       reps: 0,
//       weight: 0,
//       rest_time: 60,
//       order: exercise.sets.length
//     };

//     exercise.sets.push(newSet);
//     setWorkoutData({ ...workoutData, exercises: newExercises });
//   };

//   const deleteExercise = (exerciseIndex) => {
//     const newExercises = workoutData.exercises.filter((_, idx) => idx !== exerciseIndex);
//     setWorkoutData({ ...workoutData, exercises: newExercises });
//   };

//   const deleteSet = (exerciseIndex, setIndex) => {
//     const newExercises = [...workoutData.exercises];
//     newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, idx) => idx !== setIndex);
//     setWorkoutData({ ...workoutData, exercises: newExercises });
//   };

//   const updateExercise = (index, field, value) => {
//     const newExercises = [...(workoutData.exercises || [])];
//     newExercises[index] = { ...newExercises[index], [field]: value };
//     setWorkoutData({ ...workoutData, exercises: newExercises });
//   };

//   const updateSet = (exerciseIndex, setIndex, field, value) => {
//     const newExercises = [...(workoutData.exercises || [])];
//     newExercises[exerciseIndex].sets[setIndex] = {
//       ...newExercises[exerciseIndex].sets[setIndex],
//       [field]: Number(value)
//     };
//     setWorkoutData({ ...workoutData, exercises: newExercises });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (validate()) {
//       onSubmit(workoutData);
//     }
//   };

//   return (
//     <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
//       <h3 className="text-xl font-bold mb-4 text-white">
//         {initialData ? 'Edit Workout' : 'Create New Workout'}
//       </h3>
//       <form onSubmit={handleSubmit} className="space-y-6">
//         <div>
//           <label className="block mb-2 text-gray-200">Name *</label>
//           <input
//             type="text"
//             value={workoutData.name || ''}
//             onChange={(e) => setWorkoutData({ ...workoutData, name: e.target.value })}
//             className={`w-full p-2 rounded bg-gray-700 text-white border ${
//               errors.name ? 'border-red-500' : 'border-gray-600'
//             } focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
//             required
//           />
//           {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
//         </div>
        
//         <div>
//           <label className="block mb-2 text-gray-200">Split Method *</label>
//           <select
//             value={workoutData.split_method || 'full_body'}
//             onChange={(e) => setWorkoutData({ ...workoutData, split_method: e.target.value })}
//             className={`w-full p-2 rounded bg-gray-700 text-white border ${
//               errors.split_method ? 'border-red-500' : 'border-gray-600'
//             } focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
//             required
//           >
//             <option value="full_body">Full Body</option>
//             <option value="push_pull_legs">Push/Pull/Legs</option>
//             <option value="upper_lower">Upper/Lower</option>
//             <option value="custom">Custom</option>
//           </select>
//           {errors.split_method && <p className="text-red-500 text-sm mt-1">{errors.split_method}</p>}
//         </div>

//         <div>
//           <label className="block mb-2 text-gray-200">Description</label>
//           <textarea
//             value={workoutData.description || ''}
//             onChange={(e) => setWorkoutData({ ...workoutData, description: e.target.value })}
//             className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
//             rows="3"
//           />
//         </div>

//         <div>
//           <div className="flex justify-between items-center mb-4">
//             <h4 className="text-lg font-bold text-gray-200">Exercises *</h4>
//             <button
//               type="button"
//               onClick={addExercise}
//               className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
//             >
//               <Plus className="w-5 h-5" />
//               <span>Add Exercise</span>
//             </button>
//           </div>

//           {errors.exercises && <p className="text-red-500 text-sm mb-4">{errors.exercises}</p>}

//           {workoutData.exercises?.map((exercise, exerciseIndex) => (
//             <div key={exerciseIndex} className="mb-6 p-4 bg-gray-700 rounded-lg">
//               <div className="space-y-4">
//                 <div className="flex justify-between">
//                   <input
//                     type="text"
//                     value={exercise.name || ''}
//                     onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
//                     placeholder="Exercise name *"
//                     className={`flex-1 p-2 rounded bg-gray-600 text-white border ${
//                       errors[`exercise_${exerciseIndex}_name`] ? 'border-red-500' : 'border-gray-600'
//                     }`}
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => deleteExercise(exerciseIndex)}
//                     className="ml-2 p-2 hover:bg-gray-500 rounded-lg transition-colors text-red-400"
//                     title="Delete exercise"
//                   >
//                     <Trash2 className="w-5 h-5" />
//                   </button>
//                 </div>
                
//                 {errors[`exercise_${exerciseIndex}_name`] && (
//                   <p className="text-red-500 text-sm">{errors[`exercise_${exerciseIndex}_name`]}</p>
//                 )}

//                 <input
//                   type="text"
//                   value={exercise.equipment || ''}
//                   onChange={(e) => updateExercise(exerciseIndex, 'equipment', e.target.value)}
//                   placeholder="Equipment (optional)"
//                   className="w-full p-2 rounded bg-gray-600 text-white border border-gray-600"
//                 />

//                 <div>
//                   <h5 className="font-medium mb-2 text-gray-200">Sets *</h5>
//                   {errors[`exercise_${exerciseIndex}_sets`] && (
//                     <p className="text-red-500 text-sm mb-2">{errors[`exercise_${exerciseIndex}_sets`]}</p>
//                   )}
                  
//                   {exercise.sets?.map((set, setIndex) => (
//                     <div key={setIndex} className="flex items-center space-x-2 mb-2 bg-gray-600 p-2 rounded">
//                       <div className="flex-1 grid grid-cols-3 gap-4">
//                         <div>
//                           <label className="block text-xs text-gray-400 mb-1">Reps *</label>
//                           <input
//                             type="number"
//                             value={set.reps || ''}
//                             onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
//                             className={`w-full p-2 rounded bg-gray-700 text-white border ${
//                               errors[`exercise_${exerciseIndex}_set_${setIndex}_reps`] ? 'border-red-500' : 'border-gray-600'
//                             }`}
//                             required
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-xs text-gray-400 mb-1">Weight (kg)</label>
//                           <input
//                             type="number"
//                             value={set.weight || ''}
//                             onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
//                             className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-xs text-gray-400 mb-1">Rest (sec)</label>
//                           <input
//                             type="number"
//                             value={set.rest_time || ''}
//                             onChange={(e) => updateSet(exerciseIndex, setIndex, 'rest_time', e.target.value)}
//                             className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
//                           />
//                         </div>
//                       </div>
//                       <div className="flex space-x-1 pt-5">
//                         <button
//                           type="button"
//                           onClick={() => deleteSet(exerciseIndex, setIndex)}
//                           className="p-1 hover:bg-gray-500 rounded transition-colors text-red-400"
//                           title="Delete set"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                   <div className="flex space-x-2">
//                     <button
//                       type="button"
//                       onClick={() => addSet(exerciseIndex)}
//                       className="mt-2 px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
//                     >
//                       Add Empty Set
//                     </button>
//                     {exercise.sets?.length > 0 && (
//                       <button
//                         type="button"
//                         onClick={() => addSet(exerciseIndex, true)}
//                         className="mt-2 px-3 py-1 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
//                       >
//                         <Copy className="w-4 h-4" />
//                         <span>Copy Last Set</span>
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="flex justify-end space-x-4">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             {initialData ? 'Update Workout' : 'Create Workout'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default WorkoutForm;
import React, { useState } from 'react';
import { Plus, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const SPLIT_METHODS = [
  'full_body',
  'push_pull_legs',
  'upper_lower',
  'custom'
];

const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbells',
  'Machine',
  'Bodyweight',
  'Smith Machine',
  'Cables',
  'Kettlebell',
  'Resistance Bands',
  'Other'
];

const WEEKDAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const WorkoutForm = ({ 
  onSubmit, 
  initialData = null, 
  onCancel,
  inProgram = false
}) => {
  const [workoutData, setWorkoutData] = useState(() => ({
    name: '',
    description: '',
    split_method: 'full_body',
    preferred_weekday: 0,
    exercises: [],
    ...initialData
  }));

  const [expandedExercises, setExpandedExercises] = useState({});

  const toggleExercise = (index) => {
    setExpandedExercises(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const addExercise = () => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: '',
          equipment: '',
          notes: '',
          order: prev.exercises.length,
          sets: [{
            reps: 10,
            weight: 0,
            rest_time: 60,
            order: 0
          }]
        }
      ]
    }));
    setExpandedExercises(prev => ({
      ...prev,
      [workoutData.exercises.length]: true
    }));
  };

  const duplicateExercise = (index) => {
    const exercise = { 
      ...workoutData.exercises[index],
      order: workoutData.exercises.length
    };
    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));
  };

  const removeExercise = (index) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index, field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }));
  };

  const addSet = (exerciseIndex) => {
    const exercise = workoutData.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1] || {
      reps: 10,
      weight: 0,
      rest_time: 60
    };
    
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: [
            ...ex.sets,
            { ...lastSet, order: ex.sets.length }
          ]
        } : ex
      )
    }));
  };

  const removeSet = (exerciseIndex, setIndex) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: ex.sets.filter((_, si) => si !== setIndex)
        } : ex
      )
    }));
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex ? {
          ...ex,
          sets: ex.sets.map((set, si) => 
            si === setIndex ? { ...set, [field]: Number(value) } : set
          )
        } : ex
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...workoutData,
      exercises: workoutData.exercises.map((ex, i) => ({
        ...ex,
        order: i,
        sets: ex.sets.map((set, j) => ({
          ...set,
          order: j
        }))
      }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Workout Name *
          </label>
          <input
            value={workoutData.name}
            onChange={(e) => setWorkoutData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Description
          </label>
          <textarea
            value={workoutData.description || ''}
            onChange={(e) => setWorkoutData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Split Method *
          </label>
          <select
            value={workoutData.split_method}
            onChange={(e) => setWorkoutData(prev => ({ ...prev, split_method: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
            required
          >
            {SPLIT_METHODS.map(method => (
              <option key={method} value={method}>
                {method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {inProgram && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Preferred Day *
            </label>
            <select
              value={workoutData.preferred_weekday}
              onChange={(e) => setWorkoutData(prev => ({ 
                ...prev, 
                preferred_weekday: Number(e.target.value) 
              }))}
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600"
              required
            >
              {WEEKDAYS.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Exercises</h3>
          <button
            type="button"
            onClick={addExercise}
            className="px-3 py-1 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>

        <div className="space-y-4">
          {workoutData.exercises.map((exercise, exerciseIndex) => (
            <div key={exerciseIndex} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <input
                  value={exercise.name}
                  onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                  placeholder="Exercise name *"
                  className="flex-1 px-3 py-2 rounded bg-gray-600 text-white border border-gray-600"
                  required
                />
                <div className="flex space-x-2 ml-2">
                  <button
                    type="button"
                    onClick={() => duplicateExercise(exerciseIndex)}
                    className="p-2 hover:bg-gray-500 rounded transition-colors"
                    title="Duplicate exercise"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(exerciseIndex)}
                    className="p-2 hover:bg-gray-500 rounded transition-colors text-red-400"
                    title="Remove exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExercise(exerciseIndex)}
                    className="p-2 hover:bg-gray-500 rounded transition-colors"
                  >
                    {expandedExercises[exerciseIndex] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {expandedExercises[exerciseIndex] && (
                <div className="mt-4 space-y-4">
                  <select
                    value={exercise.equipment}
                    onChange={(e) => updateExercise(exerciseIndex, 'equipment', e.target.value)}
                    className="w-full px-3 py-2 rounded bg-gray-600 text-white border border-gray-600"
                  >
                    <option value="">Select Equipment</option>
                    {EQUIPMENT_OPTIONS.map(equipment => (
                      <option key={equipment} value={equipment}>
                        {equipment}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-200">Sets</label>
                      <button
                        type="button"
                        onClick={() => addSet(exerciseIndex)}
                        className="px-2 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      >
                        Add Set
                      </button>
                    </div>

                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div 
                          key={setIndex}
                          className="grid grid-cols-4 gap-2 items-center bg-gray-600 p-2 rounded"
                        >
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Reps *
                            </label>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                              min="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Weight (kg)
                            </label>
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                              min="0"
                              step="0.5"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Rest (sec)
                            </label>
                            <input
                              type="number"
                              value={set.rest_time}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'rest_time', e.target.value)}
                              className="w-full px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                              min="0"
                              step="5"
                            />
                          </div>
                          <div className="flex items-end justify-end h-full">
                            <button
                              type="button"
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              className="p-1 hover:bg-gray-500 rounded transition-colors text-red-400"
                              title="Remove set"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Update Workout' : 'Create Workout'}
        </button>
      </div>
    </form>
  );
};

export default WorkoutForm;