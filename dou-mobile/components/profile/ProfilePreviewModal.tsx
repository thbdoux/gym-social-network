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
  posts?: any[];
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
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : userError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="#EF4444" />
              <Text style={styles.errorText}>Error loading profile</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                <Text style={styles.retryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {/* Profile Header with Centered Profile Picture */}
              <View style={styles.profileHeader}>
                <View style={styles.profileHeaderContent}>
                  {/* Centered Profile picture */}
                  <View style={styles.profileImageContainer}>
                    <Image
                      source={{ uri: getAvatarUrl(userData?.avatar, 96) }}
                      style={styles.profileImage}
                    />
                    <View style={styles.onlineIndicator}></View>
                  </View>
                  
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileUsername}>{userData?.username || 'User'}</Text>
                    <View style={styles.personalityBadge}>
                      <Text style={styles.personalityText}>
                        {userData?.personality_type ? formatText(userData.personality_type) : 'Fitness Enthusiast'}
                      </Text>
                    </View>
                    
                    {userData?.preferred_gym && (
                      <View style={styles.gymBadge}>
                        <Text style={styles.gymText}>
                          {gymDisplayText}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{userData?.friend_count || 0}</Text>
                    <Text style={styles.statLabel}>Friends</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{userData?.posts?.length || 0}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{userData?.workout_count || 0}</Text>
                    <Text style={styles.statLabel}>Workouts</Text>
                  </View>
                </View>
              </View>
              
              {/* Training Consistency Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Training Consistency</Text>
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
                    width={screenWidth - 84}
                    height={220}
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
                      backgroundColor: '#1f2937',
                      backgroundGradientFrom: '#1f2937',
                      backgroundGradientTo: '#1f2937',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '5',
                        strokeWidth: '2',
                        stroke: '#d946ef'
                      },
                      propsForHorizontalLabels: {
                        fontSize: 10
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
                <Text style={styles.cardTitle}>Current Program</Text>
                
                {userData?.current_program ? (
                  <ProgramCard
                    programId={userData.current_program.id}
                    program={userData.current_program}
                    currentUser={userData.username}
                  />
                ) : (
                  <View style={styles.emptyProgram}>
                    <Ionicons name="barbell-outline" size={48} color="#6b7280" />
                    <Text style={styles.emptyProgramText}>No active program</Text>
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
    backgroundColor: '#111827',
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
    paddingHorizontal: 16,
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
  profileHeader: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeaderContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  profileImagePlaceholderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ade80', // Green for online status
    borderWidth: 2,
    borderColor: '#1f2937',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileUsername: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  personalityBadge: {
    backgroundColor: '#4b286b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 4,
  },
  personalityText: {
    color: '#d9bfff',
    fontSize: 12,
    fontWeight: '600',
  },
  gymBadge: {
    backgroundColor: '#344154',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
  },
  gymText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d9bfff', // Purple color similar to the design
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  chartCard: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  programContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyProgram: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyProgramText: {
    fontSize: 16,
    color: '#9ca3af',
    marginVertical: 16,
  },
});

export default ProfilePreviewModal;