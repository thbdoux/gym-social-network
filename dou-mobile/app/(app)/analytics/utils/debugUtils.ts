// utils/debugUtils.ts

/**
 * Helper function to inspect the structure of workout logs data
 * Can be called from any component to debug API data
 */
 export const inspectWorkoutLogs = (logs: any[]): void => {
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.error('No logs data available or invalid format');
      return;
    }
    
    try {
      // Log the first workout for structure inspection
      const sampleLog = logs[0];
      console.log('Sample workout log structure:', {
        id: sampleLog.id,
        name: sampleLog.name,
        date: sampleLog.date,
        dateType: typeof sampleLog.date,
        completed: sampleLog.completed,
        hasExercises: !!sampleLog.exercises && Array.isArray(sampleLog.exercises),
        exercisesCount: (sampleLog.exercises || []).length
      });
      
      // If exercises exist, inspect the first one
      if (sampleLog.exercises && sampleLog.exercises.length > 0) {
        const sampleExercise = sampleLog.exercises[0];
        console.log('Sample exercise structure:', {
          id: sampleExercise.id,
          name: sampleExercise.name,
          equipment: sampleExercise.equipment,
          muscle_group: sampleExercise.muscle_group,
          hasSets: !!sampleExercise.sets && Array.isArray(sampleExercise.sets),
          setsCount: (sampleExercise.sets || []).length
        });
        
        // If sets exist, inspect the first one
        if (sampleExercise.sets && sampleExercise.sets.length > 0) {
          const sampleSet = sampleExercise.sets[0];
          console.log('Sample set structure:', {
            id: sampleSet.id,
            reps: sampleSet.reps,
            weight: sampleSet.weight,
            weight_type: typeof sampleSet.weight,
            rest_time: sampleSet.rest_time
          });
        }
      }
      
      // Log summary stats
      const completedLogs = logs.filter(log => log.completed);
      console.log('Logs summary:', {
        totalLogs: logs.length,
        completedLogs: completedLogs.length,
      });
      
      // Specifically debug date formats
      console.log('Date format analysis:');
      const dateFormats = new Set();
      const validDates = [];
      const invalidDates = [];
      
      logs.forEach((log, index) => {
        try {
          if (log.date) {
            dateFormats.add(typeof log.date);
            const date = new Date(log.date);
            if (!isNaN(date.getTime())) {
              validDates.push({
                index,
                original: log.date,
                parsed: date.toISOString()
              });
            } else {
              invalidDates.push({
                index,
                value: log.date
              });
            }
          } else {
            invalidDates.push({
              index,
              value: 'undefined/null'
            });
          }
        } catch (err) {
          invalidDates.push({
            index,
            value: log.date,
            error: String(err)
          });
        }
      });
      
      console.log('Date format types found:', Array.from(dateFormats));
      console.log('Sample of valid dates:', validDates.slice(0, 5));
      console.log('Invalid dates found:', invalidDates);
      
      if (invalidDates.length === 0 && validDates.length > 0) {
        // Try to determine date range if all dates are valid
        const dates = validDates.map(v => new Date(v.original));
        const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        console.log('Date range:', {
          earliest: earliestDate.toISOString(),
          latest: latestDate.toISOString(),
          spanDays: Math.floor((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
      
      // Check for muscle groups in the data
      const muscleGroups = new Set<string>();
      logs.forEach(log => {
        if (log.exercises) {
          log.exercises.forEach((exercise: any) => {
            if (exercise.muscle_group) {
              muscleGroups.add(exercise.muscle_group);
            }
          });
        }
      });
      
      console.log('Detected muscle groups:', Array.from(muscleGroups));
      
    } catch (error) {
      console.error('Error inspecting workout logs:', error);
    }
  };
  
  /**
   * Helper function to test date parsing with our custom parser
   */
  export const testCustomDateParsing = (): void => {
    console.log('Testing custom date parsing:');
    
    const testDates = [
      '2023-05-15T14:30:00.000Z', // ISO format
      '2023-05-15',                // YYYY-MM-DD
      '05/15/2023',                // MM/DD/YYYY
      '15/05/2023',                // DD/MM/YYYY (European format)
      '15/04/2025',                // The problematic format in the error message
      '2023-05-15T14:30:00',       // ISO without timezone
      '2023-05-15 14:30:00',       // YYYY-MM-DD HH:MM:SS
      '1684161000000',             // Timestamp in milliseconds
      'May 15, 2023',              // Month DD, YYYY
      '15 May 2023',               // DD Month YYYY
      'invalid date'               // Invalid format
    ];
    
    testDates.forEach(dateStr => {
      try {
        // Test the standard Date constructor
        const standardDate = new Date(dateStr);
        const standardResult = isNaN(standardDate.getTime()) 
          ? 'INVALID' 
          : standardDate.toISOString();
        
        // Test our custom parser
        const customDate = parseDate(dateStr);
        const customResult = !customDate 
          ? 'INVALID' 
          : customDate.toISOString();
        
        console.log(`"${dateStr}":
    - Standard: ${standardResult}
    - Custom:   ${customResult}`);
      } catch (err) {
        console.log(`"${dateStr}" -> Error: ${err}`);
      }
    });
  };