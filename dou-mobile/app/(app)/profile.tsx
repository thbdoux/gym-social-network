// app/(app)/profile.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrentUser, useLogout } from '../../hooks/query/useUserQuery';
import { useGymDisplay } from '../../hooks/query/useGymQuery';
import { useProgram } from '../../hooks/query/useProgramQuery';
import { useUserLogs, useWorkoutStats } from '../../hooks/query/useLogQuery';
// Import ThemeContext
import { useTheme } from '../../context/ThemeContext';
// Add this import at the top with other imports
import { useFriendsCount, usePostsCount, useWorkoutsCount, useAllCounts } from '../../hooks/query/useUserCountQuery';
import ProgramCard from '../../components/workouts/ProgramCard';
import { getAvatarUrl } from '../../utils/imageUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parse, subMonths, addMonths } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const logout = useLogout();
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Use the theme context
  const { palette, personality } = useTheme();
  
  // Use React Query hooks
  const { 
    data: profile, 
    isLoading: profileLoading, 
    refetch: refetchProfile,
    error: profileError
  } = useCurrentUser();

  console.log('current user profile', profile);
  
  // Get logs for workout data
  const { data: logs, isLoading: logsLoading } = useUserLogs(user?.username);

  // Get workout stats for chart data
  const { data: workoutStats, isLoading: statsLoading } = useWorkoutStats();
  
  const { data: friendsCount = 0, isLoading: friendsCountLoading } = useFriendsCount();
  const { data: postsCount = 0, isLoading: postsCountLoading } = usePostsCount();
  const { data: workoutsCount = 0, isLoading: workoutsCountLoading } = useWorkoutsCount();

  useFocusEffect(
    useCallback(() => {
      // Force refetch profile data when screen is focused
      refetchProfile();
      
      return () => {
        // Cleanup if needed
      };
    }, [])
  );
  
  // Get preferred gym info
  const {
    displayText: gymDisplayText,
    isLoading: gymLoading,
    gym
  } = useGymDisplay(user?.id, profile?.preferred_gym);
  
  // Get current program data
  const {
    data: programData,
    isLoading: programLoading
  } = useProgram(profile?.current_program?.id, {
    enabled: !!profile?.current_program?.id
  });

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchProfile();
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Navigation functions
  const navigateToFriends = () => {
    router.push('/friends');
  };
  
  const navigateToPosts = () => {
    router.push('/posts');
  };
  
  const navigateToWorkouts = () => {
    router.push('/workouts');
  };

  const navigateToEditProfile = () => {
    setOptionsModalVisible(false);
    router.push('/edit-profile');
  };

  const handleLogout = async () => {
    setOptionsModalVisible(false);
    Alert.alert(
      t('logout_confirmation_title'),
      t('logout_confirmation_message'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('logout'),
          onPress: logout,
          style: 'destructive'
        }
      ]
    );
  };

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

  // Format gym info
  const gymInfo = gym ? `${gym.name}${gym.location ? ` - ${gym.location}` : ''}` : '';

  // Get personality-based gradient for avatar
  const getPersonalityGradient = () => {
    // Use the personality from theme context
    const userPersonality = personality || 'versatile';
    
    // Create gradients using the palette colors
    switch(userPersonality) {
      case 'optimizer':
        return [palette.highlight, palette.accent];
      case 'diplomate':
        return [palette.layout, palette.highlight];
      case 'mentor':
        return [palette.layout, palette.highlight];
      case 'versatile':
        return [palette.layout, palette.highlight];
      default:
        return [palette.layout, palette.highlight];
    }
  };

  // Combine loading states
  const isLoading = profileLoading || (profile?.preferred_gym && gymLoading) || 
                 (profile?.current_program?.id && programLoading) ||
                 logsLoading || statsLoading || 
                 friendsCountLoading || postsCountLoading || workoutsCountLoading;
  
  if (isLoading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: palette.page_background }]}>
        <ActivityIndicator size="large" color={palette.highlight} />
        <Text style={[styles.loadingText, { color: palette.text }]}>{t('loading_profile')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Ionicons name="close-circle" size={30} color={palette.text} />
            </TouchableOpacity>
            <Image
              source={{ uri: getAvatarUrl(profile?.avatar, 300) }}
              style={[styles.modalImage, { borderColor: palette.highlight }]}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={0.9}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.optionsContainer}>
            <BlurView intensity={30} tint="dark" style={styles.blurBackground} />
            <TouchableOpacity style={styles.optionItem} onPress={navigateToEditProfile}>
              <Ionicons name="create-outline" size={24} color={palette.text} />
              <Text style={[styles.optionText, { color: palette.text }]}>{t('edit_profile')}</Text>
            </TouchableOpacity>
            <View style={[styles.optionDivider, { backgroundColor: palette.border }]} />
            <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              <Text style={[styles.optionText, { color: '#ef4444' }]}>{t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={palette.highlight}
            colors={[palette.highlight]}
          />
        }
      >
        {/* Profile Header with Left-aligned Profile Picture */}
        <View style={styles.profileHeader}>
          <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
          
          <View style={styles.profileHeaderContent}>
            {/* Left side - Profile picture */}
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={() => setImageModalVisible(true)}
            >
              <LinearGradient
                colors={getPersonalityGradient()}
                style={styles.profileGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.profileImageInner, { backgroundColor: palette.page_background }]}>
                  <Image
                    source={{ uri: getAvatarUrl(profile?.avatar, 80) }}
                    style={styles.profileImage}
                  />
                </View>
              </LinearGradient>
              <View style={styles.onlineIndicator}></View>
            </TouchableOpacity>
            
            {/* Right side - Profile info and stats */}
            <View style={styles.profileRightContent}>
              <View style={styles.profileInfo}>
                <View style={styles.usernameContainer}>
                  <Text style={[styles.profileUsername, { color: palette.text }]}>{profile?.username || t('user')}</Text>
                  <TouchableOpacity 
                    style={styles.optionsButton}
                    onPress={() => setOptionsModalVisible(true)}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={24} color={palette.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.badgesContainer}>
                  {profile?.personality_type && (
                    <LinearGradient
                      colors={[palette.layout, palette.highlight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.personalityBadge}
                    >
                      <Text style={styles.personalityText}>
                        {t(profile.personality_type.toLowerCase())}
                      </Text>
                    </LinearGradient>
                  )}
                  
                  {profile?.preferred_gym && (
                    <LinearGradient
                      colors={[palette.accent, palette.highlight]}
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
            <TouchableOpacity 
              style={[styles.statItem, { backgroundColor: `${palette.accent}80` }]} 
              onPress={navigateToFriends}
            >
              <Text style={[styles.statValue, { color: palette.text }]}>{friendsCount}</Text>
              <Text style={[styles.statLabel, { color: `${palette.text}B3` }]}>{t('friends')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statItem, { backgroundColor: `${palette.accent}80` }]} 
              onPress={navigateToPosts}
            >
              <Text style={[styles.statValue, { color: palette.text }]}>{postsCount}</Text>
              <Text style={[styles.statLabel, { color: `${palette.text}B3` }]}>{t('posts')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statItem, { backgroundColor: `${palette.accent}80` }]} 
              onPress={navigateToWorkouts}
            >
              <Text style={[styles.statValue, { color: palette.text }]}>{workoutsCount}</Text>
              <Text style={[styles.statLabel, { color: `${palette.text}B3` }]}>{t('workouts')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Monthly Workout Calendar */}
        <View style={styles.calendarCard}>
          <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
          
          <View style={styles.calendarHeader}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>{t('workout_calendar')}</Text>
            <View style={styles.monthSelectorContainer}>
              <TouchableOpacity 
                onPress={() => changeMonth('prev')} 
                style={[styles.monthButton, { backgroundColor: `${palette.accent}80` }]}
              >
                <Ionicons name="chevron-back" size={24} color={palette.text} />
              </TouchableOpacity>
              <Text style={[styles.monthDisplay, { color: palette.text }]}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity 
                onPress={() => changeMonth('next')} 
                style={[styles.monthButton, { backgroundColor: `${palette.accent}80` }]}
              >
                <Ionicons name="chevron-forward" size={24} color={palette.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.weekdaysHeader}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={index} style={[styles.weekdayLabel, { color: `${palette.text}B3` }]}>{day}</Text>
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
                    { backgroundColor: `${palette.accent}4D` },
                    isWorkout && [styles.workoutDay, { backgroundColor: `${palette.highlight}4D`, borderColor: `${palette.highlight}80` }],
                    isCurrent && [styles.currentDay, { backgroundColor: `${palette.highlight}4D`, borderColor: `${palette.highlight}B3` }]
                  ]}
                  onPress={() => {
                    if (isWorkout) {
                      // Navigate to workout details for this day
                      // router.push(`/workout-log/${format(day, 'yyyy-MM-dd')}`);
                      Alert.alert('Workout', `You worked out on ${format(day, 'MMMM d, yyyy')}`);
                    }
                  }}
                >
                  <Text 
                    style={[
                      styles.dayNumber,
                      { color: palette.text },
                      isWorkout && [styles.workoutDayNumber, { color: palette.text, fontWeight: 'bold' }],
                      isCurrent && [styles.currentDayNumber, { color: palette.text, fontWeight: 'bold' }]
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                  
                  {isWorkout && (
                    <View style={[styles.workoutIndicator, { backgroundColor: palette.highlight }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: palette.highlight }]} />
              <Text style={[styles.legendText, { color: `${palette.text}B3` }]}>{t('workout_day')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: palette.highlight }]} />
              <Text style={[styles.legendText, { color: `${palette.text}B3` }]}>{t('today')}</Text>
            </View>
          </View>
        </View>
        
        {/* Training Consistency Chart */}
        <View style={styles.chartCard}>
          <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
          
          <Text style={[styles.cardTitle, { color: palette.text }]}>{t('training_consistency')}</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: sessionData.map(item => item.month),
                datasets: [
                  {
                    data: sessionData.map(item => item.sessions),
                    color: (opacity = 1) => `${palette.highlight}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
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
                backgroundColor: palette.page_background,
                backgroundGradientFrom: palette.page_background,
                backgroundGradientTo: palette.page_background,
                decimalPlaces: 0,
                color: (opacity = 1) => `${palette.text}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                labelColor: (opacity = 1) => `${palette.text}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: palette.highlight
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
          
          <Text style={[styles.cardTitle, { color: palette.text }]}>{t('current_program')}</Text>
          
          {profile?.current_program ? (
            <ProgramCard
              programId={profile.current_program.id}
              program={profile.current_program}
              currentUser={profile.username}
              themePalette={palette}
            />
          ) : (
            <View style={styles.emptyProgram}>
              <Ionicons name="barbell-outline" size={48} color={palette.border} />
              <Text style={[styles.emptyProgramText, { color: palette.border }]}>{t('no_active_program')}</Text>
              <TouchableOpacity onPress={() => router.push('/programs')}>
                <LinearGradient
                  colors={[palette.layout, palette.highlight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyProgramButton}
                >
                  <Text style={[styles.emptyProgramButtonText, { color: palette.text }]}>{t('browse_programs')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 0, // Full width
    paddingBottom: 24,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0, // Remove border radius for full width
  },

  profileHeader: {
    position: 'relative',
    borderRadius: 0, // Remove border radius for full width
    padding: 16,
    marginBottom: 8,
    borderWidth: 0, // Remove border
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
    flex: 1,
  },
  optionsButton: {
    padding: 5,
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
    borderRadius: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
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
    marginHorizontal: 12,
    width: 150,
    textAlign: 'center',
  },
  monthButton: {
    padding: 5,
    borderRadius: 20,
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
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
  },
  workoutDay: {
    borderWidth: 1,
  },
  workoutDayNumber: {
    fontWeight: 'bold',
  },
  currentDay: {
    borderWidth: 1,
  },
  currentDayNumber: {
    fontWeight: 'bold',
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
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
  },
  
  // Options modal styles
  optionsContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  optionDivider: {
    height: 1,
  },
  
  chartCard: {
    position: 'relative',
    borderRadius: 0, // Remove border radius for full width
    padding: 16,
    marginVertical: 0, // Remove margins
    borderWidth: 0, // Remove border
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 0, // Remove border radius for chart
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  programContainer: {
    position: 'relative',
    borderRadius: 0, // Remove border radius for full width
    padding: 16,
    marginTop: 0, // Remove margins
    borderWidth: 0, // Remove border
    overflow: 'hidden',
  },
  emptyProgram: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyProgramText: {
    fontSize: 16,
    marginVertical: 16,
  },
  emptyProgramButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyProgramButtonText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: 300,
    height: 300,
    borderRadius: 20,
    borderWidth: 3,
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: 20,
    zIndex: 10,
  },
});