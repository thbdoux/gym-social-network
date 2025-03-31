// app/(app)/profile.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrentUser, useLogout } from '../../hooks/query/useUserQuery';
import { useGymDisplay } from '../../hooks/query/useGymQuery';
import { useProgram } from '../../hooks/query/useProgramQuery';
import ProgramCard from '../../components/workouts/ProgramCard';
import { getAvatarUrl } from '../../utils/imageUtils';

const screenWidth = Dimensions.get('window').width;

export default function ProfileScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  // Use React Query hooks
  const { 
    data: profile, 
    isLoading: profileLoading, 
    refetch: refetchProfile,
    error: profileError
  } = useCurrentUser();
  
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
  
  console.log("user profile : ", profile);
  
  // Session data for chart - aggregated by month
  const sessionData = [
    { month: 'Jan', sessions: 4 },
    { month: 'Feb', sessions: 5 },
    { month: 'Mar', sessions: 6 },
    { month: 'Apr', sessions: 4 },
    { month: 'May', sessions: 5 },
    { month: 'Jun', sessions: 7 },
  ];

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

  // Format focus text (convert snake_case to Title Case)
  const formatFocus = (focus) => {
    if (!focus) return '';
    return focus
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Get personality-based gradient for avatar (similar to Post component)
  const getPersonalityGradient = () => {
    const personality = profile?.personality_type || 'default';
    
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
  const isLoading = profileLoading || (profile?.preferred_gym && gymLoading) || 
                   (profile?.current_program?.id && programLoading);
  
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>{t('loading_profile')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
              <Ionicons name="close-circle" size={30} color="#ffffff" />
            </TouchableOpacity>
            <Image
              source={{ uri: getAvatarUrl(profile?.avatar, 300) }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </Modal>



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
        {/* Profile Header with Centered Profile Picture */}
        <View style={styles.profileHeader}>
          <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
          
          <View style={styles.profileHeaderContent}>
            {/* Centered Profile picture */}
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
                <View style={styles.profileImageInner}>
                  <Image
                    source={{ uri: getAvatarUrl(profile?.avatar, 96) }}
                    style={styles.profileImage}
                  />
                </View>
              </LinearGradient>
              <View style={styles.onlineIndicator}></View>
            </TouchableOpacity>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileUsername}>{profile?.username || t('user')}</Text>
              <LinearGradient
                colors={['#9333EA', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.personalityBadge}
              >
                <Text style={styles.personalityText}>
                  {profile?.personality_type ? t(profile.personality_type.toLowerCase()) : t('fitness_enthusiast')}
                </Text>
              </LinearGradient>
              
              {profile?.preferred_gym && (
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
          
          {/* Stats row */}
          <View style={styles.statsRow}>
            <LinearGradient
              colors={['#6366F1', '#4F46E5']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{profile?.friends_count || 0}</Text>
              <Text style={styles.statLabel}>{t('friends')}</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#EC4899', '#8B5CF6']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{profile?.posts_count || 0}</Text>
              <Text style={styles.statLabel}>{t('posts')}</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#F59E0B', '#EF4444']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{profile?.workouts_count || 0}</Text>
              <Text style={styles.statLabel}>{t('workouts')}</Text>
            </LinearGradient>
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
                backgroundColor: '#111827',
                backgroundGradientFrom: '#111827',
                backgroundGradientTo: '#111827',
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
          
          {profile?.current_program ? (
            <ProgramCard
              programId={profile.current_program.id}
              program={profile.current_program}
              currentUser={profile.username}
            />
          ) : (
            <View style={styles.emptyProgram}>
              <Ionicons name="barbell-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyProgramText}>{t('no_active_program')}</Text>
              <LinearGradient
                colors={['#9333EA', '#D946EF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyProgramButton}
              >
                <Text style={styles.emptyProgramButtonText}>{t('browse_programs')}</Text>
              </LinearGradient>
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
    backgroundColor: '#111827', // Dark background like in the design
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
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
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    overflow: 'hidden',
  },
  profileHeaderContent: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
    backgroundColor: '#3B82F6',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 47,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  personalityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
  },
  personalityText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  gymBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  gymText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  chartCard: {
    position: 'relative',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
    paddingHorizontal: 8,
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
    position: 'relative',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
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
  emptyProgramButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyProgramButtonText: {
    color: '#fff',
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
    borderColor: '#a855f7',
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: 20,
    zIndex: 10,
  },
});