// components/navigation/Sidebar.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import { useUpdateLanguage } from '../../hooks/query/useUserQuery';
import { useCurrentUser } from '../../hooks/query/useUserQuery';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface EnhancedSidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<EnhancedSidebarProps> = ({
  isVisible,
  onClose,
}) => {
  const { mutateAsync: updateLanguage, isLoading } = useUpdateLanguage();
  const { data: user } = useCurrentUser();
  const { t, language, setLanguage } = useLanguage();
  
  const slideAnim = useSharedValue(width);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      slideAnim.value = withSpring(0, { 
        damping: 20,
        stiffness: 90,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 300 });
      slideAnim.value = withTiming(width, { 
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideAnim.value }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const handleChangeLanguage = async (newLanguage: string) => {
    if (language === newLanguage) return;
    
    try {
      setLanguage(newLanguage);
      await updateLanguage(newLanguage);
    } catch (error) {
      Alert.alert(t('error'), t('language_update_failed'));
    }
  };

  const handleLogout = async () => {
    try {
      slideAnim.value = withTiming(width, { 
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }, () => {
        runOnJS(onClose)();
        runOnJS(router.replace)('/(auth)/login');
      });
    } catch (error) {
      Alert.alert(t('error'), t('logout_failed'));
    }
  };

  const closeWithAnimation = () => {
    slideAnim.value = withTiming(width, { 
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }, () => {
      runOnJS(onClose)();
    });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={true}
      onRequestClose={closeWithAnimation}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity 
            style={styles.backdropTouchable} 
            onPress={closeWithAnimation} 
            activeOpacity={1}
          />
        </Animated.View>
        
        <Animated.View style={[styles.sidebar, animatedStyle]}>
          <LinearGradient
            colors={['#111827', '#1F2937']}
            style={styles.gradient}
          >
            <SafeAreaView style={styles.content}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Image 
                    source={{ uri: user?.profile_image || 'https://via.placeholder.com/80' }} 
                    style={styles.profileImage} 
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{user?.username || t('guest')}</Text>
                    <Text style={styles.email}>{user?.email || ''}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={closeWithAnimation}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />
              
              <Text style={styles.sectionTitle}>{t('preferences')}</Text>
              
              <View style={styles.languageContainer}>
                <View style={styles.languageHeader}>
                  <Ionicons name="language" size={22} color="#9CA3AF" />
                  <Text style={styles.languageTitle}>{t('language')}</Text>
                </View>
                
                <View style={styles.languageOptions}>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      language === 'en' && styles.selectedLanguage,
                    ]}
                    onPress={() => handleChangeLanguage('en')}
                    disabled={isLoading}
                  >
                    <MaterialCommunityIcons
                      name="flag-variant"
                      size={16}
                      color={language === 'en' ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.languageText,
                        language === 'en' && styles.selectedLanguageText,
                      ]}
                    >
                      English
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      language === 'fr' && styles.selectedLanguage,
                    ]}
                    onPress={() => handleChangeLanguage('fr')}
                    disabled={isLoading}
                  >
                    <MaterialCommunityIcons
                      name="flag-variant"
                      size={16}
                      color={language === 'fr' ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.languageText,
                        language === 'fr' && styles.selectedLanguageText,
                      ]}
                    >
                      Français
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />
              
              <View style={styles.bottomSection}>
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.logoutText}>{t('logout')}</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdropTouchable: {
    flex: 1,
  },
  sidebar: {
    width: width * 0.85,
    height: '100%',
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  gradient: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingVertical: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  userInfo: {
    marginLeft: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(75, 85, 99, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 15,
    marginHorizontal: 20,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  languageContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  languageOptions: {
    flexDirection: 'row',
    marginLeft: 32,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(75, 85, 99, 0.2)',
  },
  selectedLanguage: {
    backgroundColor: '#3B82F6',
  },
  languageText: {
    marginLeft: 6,
    color: '#9CA3AF',
    fontSize: 14,
  },
  selectedLanguageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bottomSection: {
    marginTop: 'auto',
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default Sidebar;