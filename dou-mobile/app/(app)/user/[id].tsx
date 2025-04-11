// app/(app)/user/[id].tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../../../context/LanguageContext';
import { useUser } from '../../../hooks/query/useUserQuery';
import { useGymDisplay } from '../../../hooks/query/useGymQuery';
import { useProgram } from '../../../hooks/query/useProgramQuery';
import { useLogs, useWorkoutStats } from '../../../hooks/query/useLogQuery';
import { useFriendsCount, usePostsCount, useWorkoutsCount } from '../../../hooks/query/useUserCountQuery';
import ProgramCard from '../../../components/workouts/ProgramCard';
import { getAvatarUrl } from '../../../utils/imageUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parse, subMonths, addMonths } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function ProfilePreviewPage() {
  // Get translation function
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = typeof id === 'string' ? parseInt(id) : 0;
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch user data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser
  } = useUser(userId, {
    enabled: !!userId,
    refetchOnMount: true,
    staleTime: 0,
  });
  
  // Get preferred gym info
  const {
    displayText: gymDisplayText,
    isLoading: gymLoading,
    gym
  } = useGymDisplay(userId, userData?.preferred_gym);
  
  // Get program data if available
  const {
    data: programData,
    isLoading: programLoading
  } = useProgram(userData?.current_program?.id, {
    enabled: !!userData?.current_program?.id
  });
  
  // Get logs for workout data
  const { data: logs, isLoading: logsLoading } = useLogs(userId);

  // Get workout stats for chart data
  const { data: workoutStats, isLoading: statsLoading } = useWorkoutStats(userId);
  
  const { data: friendsCount = 0, isLoading: friendsCountLoading } = useFriendsCount(userId);
  const { data: postsCount = 0, isLoading: postsCountLoading } = usePostsCount(userId);
  const { data: workoutsCount = 0, isLoading: workoutsCountLoading } = useWorkoutsCount(userId);

  // Process logs data for the calendar
  const workoutDays = useMemo(() => {
    if (!logs) return [];
    
    return logs.map(log => {
      if (log.date) {
        try {
          // Parse French format date (DD/MM/YYYY)
          return parse(log.date, 'dd/MM/yyyy', new Date());
        } catch (error) {
          console.error("Error parsing date:", error);
          return null;
        }
      }
      return null;
    }).filter(date => date !== null);
  }, [logs]);
  
  // Process logs data for the chart by month
  const sessionData = useMemo(() => {
    if (!logs) return [];
    
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        date,
        sessions: 0
      };
    });
    
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        try {
          if (!log.date) return;
          
          // Parse French format date (DD/MM/YYYY)
          const logDate = parse(log.date, 'dd/MM/yyyy', new Date());
          
          const monthIndex = last6Months.findIndex(item => 
            format(item.date, 'MMM yyyy') === format(logDate, 'MMM yyyy')
          );
          
          if (monthIndex !== -1) {
            last6Months[monthIndex].sessions += 1;
          }
        } catch (error) {
          console.error("Error processing log date:", error, log.date);
        }
      });
    }
    
    return last6Months;
  }, [logs]);

  // Calendar functions
  const getDaysInMonth = (date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const changeMonth = (direction) => {
    setCurrentMonth(prevMonth => {
      return direction === 'next' 
        ? addMonths(prevMonth, 1) 
        : subMonths(prevMonth, 1);
    });
  };

  const isWorkoutDay = (day) => {
    return workoutDays.some(date => date && isSameDay(day, date));
  };

  // Get personality-based gradient for avatar
  const getPersonalityGradient = () => {
    const personality = userData?.personality_type || 'default';
    
    switch(personality.toLowerCase()) {
      case 'optimizer':
        return ['#F59E0B', '#EF4444']; // Amber to Red
      case 'diplomat':
        return ['#10B981', '#3B82F6']; // Emerald to Blue
      case 'mentor':
        return ['#6366F1', '#4F46E5']; // Indigo to Dark Indigo
      case 'versatile':
        return ['#EC4899', '#8B5CF6']; // Pink to Purple
      default:
        return ['#9333EA', '#D946EF']; // Default Purple Gradient
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchUser();
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Combine loading states
  const isLoading = userLoading || 
                 (userData?.preferred_gym && gymLoading) || 
                 (userData?.current_program?.id && programLoading) ||
                 logsLoading || statsLoading || 
                 friendsCountLoading || postsCountLoading || workoutsCountLoading;

  // Formatted gym info
  const gymInfo = gym ? `${gym.name}${gym.location ? ` - ${gym.location}` : ''}` : '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userData?.username || t('profile')}</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>{t('loading_profile')}</Text>
        </View>
      ) : userError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{t('error')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>{t('go_back')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#a855f7"
              colors={['#a855f7']}
            />
          }
        >
          {/* Profile Header with Left-aligned Profile Picture */}
          <View style={styles.profileHeader}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            
            <View style={styles.profileHeaderContent}>
              {/* Left side - Profile picture */}
              <View style={styles.profileImageContainer}>
                <LinearGradient
                  colors={getPersonalityGradient()}
                  style={styles.profileGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.profileImageInner}>
                    <Image
                      source={{ uri: getAvatarUrl(userData?.avatar, 80) }}
                      style={styles.profileImage}
                    />
                  </View>
                </LinearGradient>
                <View style={styles.onlineIndicator}></View>
              </View>
              
              {/* Right side - Profile info and stats */}
              <View style={styles.profileRightContent}>
                <View style={styles.profileInfo}>
                  <View style={styles.usernameContainer}>
                    <Text style={styles.profileUsername}>{userData?.username || t('user')}</Text>
                  </View>
                  
                  <View style={styles.badgesContainer}>
                    {userData?.personality_type && (
                      <LinearGradient
                        colors={['#9333EA', '#D946EF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.personalityBadge}
                      >
                        <Text style={styles.personalityText}>
                          {t(userData.personality_type.toLowerCase())}
                        </Text>
                      </LinearGradient>
                    )}
                    
                    {userData?.preferred_gym && (
                      <LinearGradient
                        colors={['#3B82F6', '#60A5FA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gymBadge}
                      >
                        <Text style={styles.gymText}>
                          {gymInfo}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            {/* Stats row (below profile info) */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{friendsCount}</Text>
                <Text style={styles.statLabel}>{t('friends')}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{postsCount}</Text>
                <Text style={styles.statLabel}>{t('posts')}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{workoutsCount}</Text>
                <Text style={styles.statLabel}>{t('workouts')}</Text>
              </View>
            </View>
          </View>
          
          {/* Monthly Workout Calendar */}
          <View style={styles.calendarCard}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            
            <View style={styles.calendarHeader}>
              <Text style={styles.cardTitle}>{t('workout_calendar')}</Text>
              <View style={styles.monthSelectorContainer}>
                <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
                  <Ionicons name="chevron-back" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.monthDisplay}>
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
                <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
                  <Ionicons name="chevron-forward" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.weekdaysHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.weekdayLabel}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.calendarGrid}>
              {getDaysInMonth(currentMonth).map((day, index) => {
                const isWorkout = isWorkoutDay(day);
                const isCurrent = isToday(day);
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.calendarDay,
                      isWorkout && styles.workoutDay,
                      isCurrent && styles.currentDay
                    ]}
                    onPress={() => {
                      if (isWorkout) {
                        Alert.alert('Workout', `${userData?.username} worked out on ${format(day, 'MMMM d, yyyy')}`);
                      }
                    }}
                  >
                    <Text 
                      style={[
                        styles.dayNumber,
                        isWorkout && styles.workoutDayNumber,
                        isCurrent && styles.currentDayNumber
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                    
                    {isWorkout && (
                      <View style={styles.workoutIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#a855f7' }]} />
                <Text style={styles.legendText}>{t('workout_day')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>{t('today')}</Text>
              </View>
            </View>
          </View>
          
          {/* Training Consistency Chart */}
          <View style={styles.chartCard}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            
            <Text style={styles.cardTitle}>{t('training_consistency')}</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: sessionData.map(item => item.month),
                  datasets: [
                    {
                      data: sessionData.map(item => item.sessions),
                      color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`, // Purple color
                      strokeWidth: 3
                    }
                  ]
                }}
                width={screenWidth - 32} // Full width minus padding
                height={180}
                fromZero={true}
                yAxisInterval={1}
                yAxisSuffix=""
                yAxisLabel=""
                withInnerLines={false}
                withOuterLines={true}
                withHorizontalLines={true}
                withVerticalLines={false}
                withDots={true}
                withShadow={false}
                segments={7}
                chartConfig={{
                  backgroundColor: '#080f19',
                  backgroundGradientFrom: '#080f19',
                  backgroundGradientTo: '#080f19',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#d946ef'
                  },
                  propsForHorizontalLabels: {
                    fontSize: 12,
                    fontWeight: 'bold'
                  },
                  propsForVerticalLabels: {
                    fontSize: 10
                  }
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
          
          {/* Current Program */}
          <View style={styles.programContainer}>
            <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
            
            <Text style={styles.cardTitle}>{t('current_program')}</Text>
            
            {userData?.current_program ? (
              <ProgramCard
                programId={userData.current_program.id}
                program={userData.current_program}
                currentUser={userData.username}
              />
            ) : (
              <View style={styles.emptyProgram}>
                <Ionicons name="barbell-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyProgramText}>{t('no_active_program')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080f19',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.4)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    paddingHorizontal: 0,
    paddingBottom: 24,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080f19',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },
  
  profileHeader: {
    position: 'relative',
    borderRadius: 0,
    padding: 16,
    marginBottom: 8,
    borderWidth: 0,
    overflow: 'hidden',
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 42, 
    backgroundColor: '#080f19',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ade80', // Green for online status
    borderWidth: 2,
    borderColor: '#080f19',
  },
  profileRightContent: {
    flex: 1, // Take up remaining space
  },
  profileInfo: {
    alignItems: 'flex-start',
    marginBottom: 0,
    width: '100%',
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  profileUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  personalityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  personalityText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  gymBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gymText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Calendar styles
  calendarCard: {
    position: 'relative',
    borderRadius: 0,
    padding: 16,
    marginVertical: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  monthDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 12,
    width: 150,
    textAlign: 'center',
  },
  monthButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  weekdaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  weekdayLabel: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  calendarDay: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  workoutDay: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  workoutDayNumber: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  currentDay: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.7)',
  },
  currentDayNumber: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d946ef',
  },
  calendarLegend: {
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  chartCard: {
    position: 'relative',
    borderRadius: 0,
    padding: 16,
    marginVertical: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 0,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  programContainer: {
    position: 'relative',
    borderRadius: 0,
    padding: 16,
    marginTop: 0,
    borderWidth: 0,
    overflow: 'hidden',
  },
  emptyProgram: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyProgramText: {
    fontSize: 16,
    color: '#d1d5db',
    marginVertical: 16,
  },
});