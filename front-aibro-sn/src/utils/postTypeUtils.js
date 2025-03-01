export const POST_TYPE_COLORS = {
    regular: {
      gradient: 'from-blue-500 to-blue-700',
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      hoverBg: 'hover:bg-blue-500/30',
      icon: 'text-blue-400',
      darkBg: 'bg-blue-600/20'
    },
    workout_log: {
      gradient: 'from-green-500 to-green-700',
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      hoverBg: 'hover:bg-green-500/30',
      icon: 'text-green-400',
      darkBg: 'bg-green-600/20'
    },
    program: {
      gradient: 'from-purple-500 to-purple-700',
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      hoverBg: 'hover:bg-purple-500/30',
      icon: 'text-purple-400',
      darkBg: 'bg-purple-600/20'
    },
    workout_invite: {
      gradient: 'from-orange-500 to-orange-700',
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      hoverBg: 'hover:bg-orange-500/30',
      icon: 'text-orange-400',
      darkBg: 'bg-orange-600/20'
    }
  };
  
  export const getPostTypeDetails = (type) => {
    switch(type) {
      case 'regular':
        return { 
          label: 'Regular Post', 
          Icon: 'Edit', 
          colors: POST_TYPE_COLORS.regular 
        };
      case 'workout_log':
        return { 
          label: 'Workout', 
          Icon: 'Activity', 
          colors: POST_TYPE_COLORS.workout_log 
        };
      case 'workout_invite':
        return { 
          label: 'Group Workout', 
          Icon: 'Users', 
          colors: POST_TYPE_COLORS.workout_invite 
        };
      case 'program':
        return { 
          label: 'Program', 
          Icon: 'Dumbbell', 
          colors: POST_TYPE_COLORS.program 
        };
      default:
        return { 
          label: 'Post', 
          Icon: 'Edit', 
          colors: POST_TYPE_COLORS.regular 
        };
    }
  };