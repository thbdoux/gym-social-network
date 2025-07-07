// components/profile/ProfessionalCalendar.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ColorPalette } from '../../utils/colorConfig';
import WorkoutLogCard from '../workouts/WorkoutLogCard';
import GroupWorkoutCard from '../workouts/GroupWorkoutCard';
// Import the dateUtils
import {
  safeParseDate,
  formatForCalendar,
  debugDateParsing
} from '../../utils/dateUtils';

const screenWidth = Dimensions.get('window').width;

interface Exercise {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  sets: Array<{
    id?: number;
    reps?: number | null;
    weight?: number | null;
    weight_unit?: 'kg' | 'lbs';
    duration?: number | null;
    distance?: number | null;
    rest_time: number;
  }>;
}

interface WorkoutLog {
  id?: number;
  date: string;
  name: string;
  notes?: string;
  duration?: number;
  gym_name?: string;
  mood_rating?: number;
  perceived_difficulty?: string;
  completed?: boolean;
  exercises: Exercise[];
  workout_partners_usernames?: string[];
  username?: string; // Add username to know the owner
  program?: number;
  program_name?: string;
  gym?: number;
  type: 'log';
}

interface GroupWorkout {
  id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  location?: string;
  status: 'active' | 'completed' | 'cancelled';
  participants_count?: number;
  creator_username?: string;
  scheduled_time: string;
  privacy: 'public' | 'upon-request' | 'private';
  creator_details: {
    id: number;
    username: string;
    avatar?: string;
  };
  gym_details?: {
    id: number;
    name: string;
    location: string;
  };
  participants?: Array<{
    user_details: {
      id: number;
      username: string;
      avatar?: string;
    };
    status?: 'declined' | 'joined' | 'pending' | 'invited';
  }>;
  max_participants: number;
  is_creator: boolean;
  current_user_status: string;
  is_full: boolean;
  is_active: boolean;
  type: 'group';
}

interface ProfessionalCalendarProps {
  workoutLogs?: WorkoutLog[];
  groupWorkouts?: GroupWorkout[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onDayClick?: (item: WorkoutLog | GroupWorkout) => void;
  palette?: ColorPalette;
  currentUsername?: string; // Add current user's username
}

interface DayWorkout {
  date: Date;
  logs: WorkoutLog[];
  groupWorkouts: GroupWorkout[];
}

const ProfessionalCalendar: React.FC<ProfessionalCalendarProps> = ({
  workoutLogs = [],
  groupWorkouts = [],
  isLoading = false,
  onRefresh,
  onDayClick,
  palette: propPalette,
  currentUsername
}) => {
  const { palette: themePalette, workoutLogPalette, groupWorkoutPalette } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  
  // Use provided palette or fall back to theme palette
  const palette = propPalette || themePalette;
  
  const [selectedDay, setSelectedDay] = useState<DayWorkout | null>(null);
  const [dayModalVisible, setDayModalVisible] = useState(false);

  // Process workout data and create marked dates for react-native-calendars
  const { markedDates, workoutsByDay } = useMemo(() => {
    const dayMap = new Map<string, DayWorkout>();
    const marked: Record<string, any> = {};
    
    // Process workout logs with improved date parsing
    workoutLogs.forEach((log, index) => {
      if (log.date) {
        try {
          // Use safeParseDate to handle various date formats
          const logDate = safeParseDate(log.date);
          
          if (!logDate) {
            console.warn(`Failed to parse workout log date: ${log.date} at index ${index}`);
            return;
          }
          
          const dateKey = formatForCalendar(logDate);
          if (!dateKey) {
            console.warn(`Failed to format date for calendar: ${log.date}`);
            return;
          }
          
          if (!dayMap.has(dateKey)) {
            dayMap.set(dateKey, {
              date: logDate,
              logs: [],
              groupWorkouts: []
            });
          }
          
          dayMap.get(dateKey)!.logs.push(log);
        } catch (error) {
          console.error("Error processing workout log date:", error, {
            logDate: log.date,
            logIndex: index,
            logName: log.name
          });
          // Optional: Debug the problematic date
          // debugDateParsing(log.date, `Workout Log ${index}`);
        }
      }
    });
    
    // Process group workouts with improved date parsing
    groupWorkouts.forEach((workout, index) => {
      const dateSource = workout.scheduled_date || workout.scheduled_time;
      if (dateSource) {
        try {
          // Use safeParseDate to handle various date formats
          const workoutDate = safeParseDate(dateSource);
          
          if (!workoutDate) {
            console.warn(`Failed to parse group workout date: ${dateSource} at index ${index}`);
            return;
          }
          
          const dateKey = formatForCalendar(workoutDate);
          if (!dateKey) {
            console.warn(`Failed to format group workout date for calendar: ${dateSource}`);
            return;
          }
          
          if (!dayMap.has(dateKey)) {
            dayMap.set(dateKey, {
              date: workoutDate,
              logs: [],
              groupWorkouts: []
            });
          }
          
          dayMap.get(dateKey)!.groupWorkouts.push(workout);
        } catch (error) {
          console.error("Error processing group workout date:", error, {
            scheduledDate: workout.scheduled_date,
            scheduledTime: workout.scheduled_time,
            workoutIndex: index,
            workoutTitle: workout.title
          });
          // Optional: Debug the problematic date
          // debugDateParsing(dateSource, `Group Workout ${index}`);
        }
      }
    });
    
    // Create marked dates object for react-native-calendars using proper palette colors
    dayMap.forEach((dayData, dateKey) => {
      const hasLogs = dayData.logs.length > 0;
      const hasGroups = dayData.groupWorkouts.length > 0;
      
      if (hasLogs || hasGroups) {
        marked[dateKey] = {
          marked: true,
          dots: [
            ...(hasLogs ? [{
              key: 'log',
              color: workoutLogPalette.background, // Use workout log palette color
              selectedDotColor: workoutLogPalette.background,
            }] : []),
            ...(hasGroups ? [{
              key: 'group',
              color: groupWorkoutPalette.background, // Use group workout palette color
              selectedDotColor: groupWorkoutPalette.background,
            }] : [])
          ]
        };
      }
    });
    
    return { markedDates: marked, workoutsByDay: dayMap };
  }, [workoutLogs, groupWorkouts, workoutLogPalette.background, groupWorkoutPalette.background]);

  const handleDayPress = (day: DateData) => {
    const dayData = workoutsByDay.get(day.dateString);
    
    if (dayData && (dayData.logs.length > 0 || dayData.groupWorkouts.length > 0)) {
      setSelectedDay(dayData);
      setDayModalVisible(true);
    }
  };

  // Handle workout log card click
  const handleWorkoutLogClick = (logId: number) => {
    const log = selectedDay?.logs.find(l => l.id === logId);
    if (!log) return;
    setDayModalVisible(false);
    router.push(`/workout-log/${logId}`);
  };

  // Handle group workout card click (this will be handled by the card itself)
  const handleGroupWorkoutCardPress = () => {
    setDayModalVisible(false);
    // The GroupWorkoutCard will handle its own navigation
  };

  // Calendar theme configuration
  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: palette.text,
    selectedDayBackgroundColor: palette.highlight,
    selectedDayTextColor: '#ffffff',
    todayTextColor: palette.highlight,
    dayTextColor: palette.text,
    textDisabledColor: `${palette.text}40`,
    dotColor: palette.highlight,
    selectedDotColor: '#ffffff',
    arrowColor: palette.text,
    disabledArrowColor: `${palette.text}40`,
    monthTextColor: palette.text,
    indicatorColor: palette.highlight,
    textDayFontFamily: 'System',
    textMonthFontFamily: 'System',
    textDayHeaderFontFamily: 'System',
    textDayFontWeight: '400',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '500',
    textDayFontSize: 16,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 14
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      padding: 16,
      marginVertical: 0,
      overflow: 'hidden',
      position: 'relative',
    },
    blurBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 0,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: palette.text,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    calendarContainer: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      overflow: 'hidden',
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
      gap: 20,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    legendText: {
      fontSize: 12,
      color: `${palette.text}B3`,
    },
    
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: palette.page_background,
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
      width: '90%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: palette.text,
    },
    closeButton: {
      padding: 4,
    },
    modalScrollContent: {
      maxHeight: 400,
    },
    cardContainer: {
      marginBottom: 12,
    },
    emptyDay: {
      textAlign: 'center',
      color: `${palette.text}80`,
      fontSize: 14,
      fontStyle: 'italic',
      marginTop: 20,
    }
  });

  return (
    <View style={styles.container}>
      <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
      
      <Text style={styles.title}>{t('workout_calendar')}</Text>
      
      <View style={styles.calendarContainer}>
        <Calendar
          // Calendar configuration
          theme={calendarTheme}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={handleDayPress}
          
          // Month navigation
          enableSwipeMonths={true}
          hideArrows={false}
          
          // Customization
          firstDay={0} // Sunday = 0, Monday = 1
          showWeekNumbers={false}
          
          // Styling
          style={{
            backgroundColor: 'transparent',
          }}
          
          // Additional props
          allowSelectionOutOfRange={false}
        />
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: workoutLogPalette.background }]} />
          <Text style={styles.legendText}>{t('workout_log')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: groupWorkoutPalette.background }]} />
          <Text style={styles.legendText}>{t('group_workouts')}</Text>
        </View>
      </View>

      {/* Day Details Modal */}
      <Modal
        visible={dayModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay && format(selectedDay.date, 'EEEE, MMMM d')}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDayModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {selectedDay ? (
                <>
                  {/* Workout Logs using WorkoutLogCard */}
                  {selectedDay.logs.map((log, index) => (
                    <View key={`log-${index}`} style={styles.cardContainer}>
                      <WorkoutLogCard
                        logId={log.id || 0}
                        log={{
                          id: log.id || 0,
                          name: log.name,
                          date: log.date,
                          username: log.username,
                          program: log.program,
                          program_name: log.program_name,
                          gym: log.gym,
                          gym_name: log.gym_name,
                          completed: log.completed || false,
                          mood_rating: log.mood_rating,
                          perceived_difficulty: log.perceived_difficulty,
                          exercises: log.exercises,
                          duration: log.duration,
                          notes: log.notes,
                          workout_partners: log.workout_partners_usernames?.map(username => ({ username }))
                        }}
                        user={currentUsername || ''}
                        inFeedMode={false}
                        onWorkoutLogClick={handleWorkoutLogClick}
                        disableNavigation={false}
                      />
                    </View>
                  ))}
                  
                  {/* Group Workouts using GroupWorkoutCard */}
                  {selectedDay.groupWorkouts.map((workout, index) => (
                    <View key={`group-${index}`} style={styles.cardContainer}>
                      <GroupWorkoutCard
                        groupWorkoutId={workout.id}
                        groupWorkout={{
                          id: workout.id,
                          title: workout.title,
                          description: workout.description,
                          creator_details: workout.creator_details,
                          gym_details: workout.gym_details,
                          scheduled_time: workout.scheduled_time || workout.scheduled_date,
                          privacy: workout.privacy,
                          status: workout.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
                          participants: workout.participants,
                          participants_count: workout.participants_count || 0,
                          max_participants: workout.max_participants,
                          is_creator: workout.is_creator,
                          current_user_status: workout.current_user_status,
                          is_full: workout.is_full,
                          is_active: workout.is_active
                        }}
                      />
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.emptyDay}>{t('no_workouts_this_day')}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfessionalCalendar;