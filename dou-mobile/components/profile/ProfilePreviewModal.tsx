// components/profile/ProfilePreviewModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../hooks/query/useUserQuery';
import { useGymDisplay } from '../../hooks/query/useGymQuery';
import { useProgram } from '../../hooks/query/useProgramQuery';
import ProgramCard from '../../components/workouts/ProgramCard';
import { getAvatarUrl } from '../../utils/imageUtils';

// Types
interface UserData {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  bio?: string;
  training_level?: string;
  personality_type?: string;
  workout_count?: number;
  current_streak?: number;
  friend_count?: number;
  posts_count?: number;
  posts?: any[];
  workouts_count?: number;
  friends_count?: number;
  preferred_gym?: number;
  preferred_gym_details?: {
    name: string;
    location: string;
  };
  current_program?: any;
}

interface ProfilePreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  userId: number;
  initialUserData?: UserData;
}

const screenWidth = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  isVisible,
  onClose,
  userId,
  initialUserData,
}) => {
  // Get translation function
  const { t } = useLanguage();
  
  // Fetch user data
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useUser(userId, {
    enabled: isVisible && !!userId,
    initialData: initialUserData?.id === userId ? initialUserData : undefined,
    refetchOnMount: true,
    staleTime: 0,
  });
  
  // Get preferred gym info
  const {
    displayText: gymDisplayText,
    isLoading: gymLoading
  } = useGymDisplay(userId, userData?.preferred_gym);
  
  // Get program data if available
  const {
    data: programData,
    isLoading: programLoading
  } = useProgram(userData?.current_program?.id, {
    enabled: isVisible && !!userData?.current_program?.id
  });
  
  // Training consistency data - aggregated by month
  const sessionData = [
    { month: 'Jan', sessions: 4 },
    { month: 'Feb', sessions: 5 },
    { month: 'Mar', sessions: 6 },
    { month: 'Apr', sessions: 4 },
    { month: 'May', sessions: 5 },
    { month: 'Jun', sessions: 7 },
  ];

  // Format text utilities
  const formatText = (text?: string): string => {
    if (!text) return '';
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get initials for avatar fallback
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
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

  // Weekdays for program schedule visualization
  const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Combine loading states
  const isLoading = userLoading || 
                   (userData?.preferred_gym && gymLoading) || 
                   (userData?.current_program?.id && programLoading);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#a855f7" />
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          ) : userError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="#EF4444" />
              <Text style={styles.errorText}>{t('error')}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                <Text style={styles.retryButtonText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
                      <Text style={styles.profileUsername}>{userData?.username || t('user')}</Text>
                      
                      <View style={styles.badgesContainer}>
                        <LinearGradient
                          colors={['#9333EA', '#D946EF']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.personalityBadge}
                        >
                          <Text style={styles.personalityText}>
                            {userData?.personality_type ? t(userData.personality_type.toLowerCase()) : t('fitness_enthusiast')}
                          </Text>
                        </LinearGradient>
                        
                        {userData?.preferred_gym && (
                          <LinearGradient
                            colors={['#3B82F6', '#60A5FA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gymBadge}
                          >
                            <Text style={styles.gymText}>
                              {gymDisplayText}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>
                    </View>
                    
                    {/* Stats side by side */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {userData?.friends_count || userData?.friend_count || 0}
                        </Text>
                        <Text style={styles.statLabel}>{t('friends')}</Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {userData?.posts_count || (userData?.posts?.length) || 0}
                        </Text>
                        <Text style={styles.statLabel}>{t('posts')}</Text>
                      </View>
                      
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {userData?.workouts_count || userData?.workout_count || 0}
                        </Text>
                        <Text style={styles.statLabel}>{t('workouts')}</Text>
                      </View>
                    </View>
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
                    width={screenWidth - 50} // Using more horizontal space
                    height={180} // Reduced height for thinner y-axis
                    fromZero={true}
                    yAxisInterval={1} // Interval of 1
                    yAxisSuffix=""
                    yAxisLabel=""
                    withInnerLines={false} // No grid
                    withOuterLines={true} // Outer frame
                    withHorizontalLines={true} // Only horizontal lines
                    withVerticalLines={false} // No vertical lines
                    withDots={true}
                    withShadow={false}
                    segments={7} // 0-7 range with intervals of 1
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
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#080f19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: Platform.OS === 'ios' ? 50 : 10,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 16,
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
    borderRadius: 24,
  },
  profileHeader: {
    position: 'relative',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    overflow: 'hidden',
  },
  profileHeaderContent: {
    flexDirection: 'row', // Changed to row layout
    alignItems: 'center',
    marginVertical: 8, // Reduced margin
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16, // Add margin to the right
  },
  profileGradient: {
    width: 80, // Smaller profile picture
    height: 80,
    borderRadius: 40,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 37, 
    backgroundColor: '#3B82F6',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16, // Smaller indicator
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4ade80', // Green for online status
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  profileRightContent: {
    flex: 1, // Take up remaining space
  },
  profileInfo: {
    alignItems: 'flex-start', // Left align
    marginBottom: 1,
  },
  profileUsername: {
    fontSize: 24, // Smaller font size
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8, // Reduced margin
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  personalityBadge: {
    paddingHorizontal: 12, // Smaller padding
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginTop: 4,
  },
  personalityText: {
    color: '#ffffff',
    fontSize: 12, // Smaller text
    fontWeight: '600',
  },
  gymBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  gymText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8, // Reduced margin
  },
  statItem: {
    alignItems: 'center',
    marginRight: 16, // Space between stat items
  },
  statValue: {
    fontSize: 14, // Smaller font size for stats
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 11, // Smaller font size for labels
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  chartCard: {
    position: 'relative',
    borderRadius: 12,
    padding: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartContainer: {
    justifyContent: 'center',
  },
  programContainer: {
    position: 'relative',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
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

export default ProfilePreviewModal;