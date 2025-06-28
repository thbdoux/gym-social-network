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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { safeParseDate } from '../../utils/dateUtils';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrentUser, useLogout } from '../../hooks/query/useUserQuery';
import { useGymDisplay } from '../../hooks/query/useGymQuery';
import { useProgram } from '../../hooks/query/useProgramQuery';
import { useUserLogs, useWorkoutStats } from '../../hooks/query/useLogQuery';
import { useUserJoinedGroupWorkouts, useUserGroupWorkouts } from '../../hooks/query/useGroupWorkoutQuery';
// Import ThemeContext
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';
// Add this import at the top with other imports
import { useFriendsCount, usePostsCount, useWorkoutsCount, useAllCounts } from '../../hooks/query/useUserCountQuery';
import ProgramCard from '../../components/workouts/ProgramCard';
import { getAvatarUrl } from '../../utils/imageUtils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parse, subMonths, addMonths } from 'date-fns';
// Import the TrainingConsistencyChart component
import TrainingConsistencyChart from '../../components/profile/TrainingConsistencyChart';
// Import the new ProfessionalCalendar component instead
import ProfessionalCalendar from '../../components/profile/ProfessionalCalendar';

import CustomLoadingScreen from '../../components/shared/CustomLoadingScreen';

const screenWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const logout = useLogout();
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  
  // Use the theme context
  const { palette, personality } = useTheme();
  const styles = themedStyles(palette);
  
  // Use React Query hooks
  const { 
    data: profile, 
    isLoading: profileLoading, 
    refetch: refetchProfile,
    error: profileError
  } = useCurrentUser();
  
  // Get logs for workout data
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useUserLogs(user?.username);

  // Get group workouts for calendar
  const { data: groupWorkouts, isLoading: groupWorkoutsLoading, refetch: refetchGroupWorkouts } = useUserGroupWorkouts(user?.id, { participation: 'joined' });
  // Get workout stats for chart data
  const { data: workoutStats, isLoading: statsLoading } = useWorkoutStats();
  
  const { data: friendsCount = 0, isLoading: friendsCountLoading } = useFriendsCount();
  const { data: postsCount = 0, isLoading: postsCountLoading } = usePostsCount();
  const { data: workoutsCount = 0, isLoading: workoutsCountLoading } = useWorkoutsCount();

  useFocusEffect(
    useCallback(() => {
      // Force refetch profile data when screen is focused
      refetchProfile();
      refetchLogs();
      refetchGroupWorkouts();
      
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
      logs.forEach((log, index) => {
        try {
          if (!log.date) return;
          
          // Use safeParseDate to handle various date formats (ISO, dd/MM/yyyy, etc.)
          const logDate = safeParseDate(log.date);
          
          if (!logDate) {
            console.warn(`Failed to parse log date: ${log.date} at index ${index}`);
            return;
          }
          
          const monthIndex = last6Months.findIndex(item => 
            format(item.date, 'MMM yyyy') === format(logDate, 'MMM yyyy')
          );
          
          if (monthIndex !== -1) {
            last6Months[monthIndex].sessions += 1;
          }
        } catch (error) {
          console.error("Error processing log date:", error, {
            logDate: log.date,
            logIndex: index,
            logName: log.name || 'Unknown'
          });
        }
      });
    }
    
    return last6Months;
  }, [logs]);

  // Transform logs for calendar component
  const calendarLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.map((log, index) => {
      try {
        // Validate that the date can be parsed before adding to calendar
        const parsedDate = safeParseDate(log.date);
        if (!parsedDate) {
          console.warn(`Skipping log with invalid date: ${log.date} at index ${index}`);
          return null;
        }
        
        return {
          ...log,
          type: 'log' as const
        };
      } catch (error) {
        console.error('Error processing calendar log:', error, log);
        return null;
      }
    }).filter(Boolean); // Remove null entries
  }, [logs]);

  // Transform group workouts for calendar component
  const calendarGroupWorkouts = useMemo(() => {
    if (!groupWorkouts) return [];
    
    return groupWorkouts.map((workout, index) => {
      try {
        // Validate that the date can be parsed before adding to calendar
        const dateSource = workout.scheduled_date || workout.scheduled_time;
        const parsedDate = safeParseDate(dateSource);
        if (!parsedDate) {
          console.warn(`Skipping group workout with invalid date: ${dateSource} at index ${index}`);
          return null;
        }
        
        return {
          ...workout,
          type: 'group' as const
        };
      } catch (error) {
        console.error('Error processing calendar group workout:', error, workout);
        return null;
      }
    }).filter(Boolean); // Remove null entries
  }, [groupWorkouts]);

  // Calendar day click handler for current user
  const handleCalendarDayClick = (item: any) => {
    if (!item) return;
    
    if (item.type === 'log') {
      // Navigate to current user's specific workout log
      router.push(`/workout-log/${item.id}`);
    } else if (item.type === 'group') {
      // Navigate to group workout
      router.push(`/group-workout/${item.id}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProfile(),
        refetchLogs(),
        refetchGroupWorkouts()
      ]);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCalendarRefresh = () => {
    refetchLogs();
    refetchGroupWorkouts();
  };

  // Navigation functions
  const navigateToFriends = () => {
    router.push('/friends');
  };
  
  const navigateToPosts = () => {
    // router.push('/posts');
  };
  const navigateToLanguageSettings = () => {
    setOptionsModalVisible(false);
    router.push('/language-settings');
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
                 logsLoading || statsLoading || groupWorkoutsLoading ||
                 friendsCountLoading || postsCountLoading || workoutsCountLoading;
  
  if (isLoading && !refreshing) {
    return (
      <CustomLoadingScreen 
        text={t('loading_profile')}
        animationType='pulse'
        size="large"
        preloadImages={true}
      />
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
            {/* New Language Option */}
            <View style={[styles.optionDivider, { backgroundColor: palette.border }]} />
            <TouchableOpacity style={styles.optionItem} onPress={navigateToLanguageSettings}>
              <Ionicons name="language-outline" size={24} color={palette.text} />
              <Text style={[styles.optionText, { color: palette.text }]}>{t('edit_language')}</Text>
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
          
          {/* Bio Section */}
          {profile?.bio && (
            <View style={styles.bioContainer}>
              <Text style={[styles.bioText, { color: `${palette.text}CC` }]}>
                {profile.bio}
              </Text>
            </View>
          )}
          
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
        
        {/* Monthly Workout Calendar - Now using ProfessionalCalendar */}
        <ProfessionalCalendar
          workoutLogs={calendarLogs}
          groupWorkouts={calendarGroupWorkouts}
          isLoading={logsLoading || groupWorkoutsLoading}
          onRefresh={handleCalendarRefresh}
          onDayClick={handleCalendarDayClick}
          palette={palette}
        />
        
        {/* Training Consistency Chart - Using Victory-Native component */}
        <TrainingConsistencyChart sessionData={sessionData} palette={palette} />
        
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
              <TouchableOpacity onPress={() => router.push('/workouts')}>
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

const themedStyles = createThemedStyles((palette) => ({
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
  // Bio styles
  bioContainer: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'left',
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
  
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 8,
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
}));