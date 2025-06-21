// components/settings/BiometricSettings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BiometricAuthService, BiometricCapabilities } from '../../services/biometricAuth';
import { useLanguage } from '../../context/LanguageContext';

interface BiometricSettingsProps {
  onSettingsChange?: (settings: {
    biometricEnabled: boolean;
    rememberMeEnabled: boolean;
  }) => void;
}

export default function BiometricSettings({ onSettingsChange }: BiometricSettingsProps) {
  const { t } = useLanguage();
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [rememberMeEnabled, setRememberMeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    initializeSettings();
  }, []);

  const initializeSettings = async () => {
    try {
      setLoading(true);
      
      // Get biometric capabilities
      const capabilities = await BiometricAuthService.getBiometricCapabilities();
      setBiometricCapabilities(capabilities);
      
      // Get current settings
      const biometricEnabled = await BiometricAuthService.isBiometricEnabled();
      const rememberEnabled = await BiometricAuthService.isRememberMeEnabled();
      
      setBiometricEnabled(biometricEnabled);
      setRememberMeEnabled(rememberEnabled);
      
      // Notify parent component
      onSettingsChange?.({
        biometricEnabled,
        rememberMeEnabled: rememberEnabled,
      });
    } catch (error) {
      console.error('Error initializing biometric settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRememberMeToggle = async (value: boolean) => {
    if (updating) return;
    
    setUpdating(true);
    
    try {
      if (!value) {
        // If disabling remember me, show confirmation
        Alert.alert(
          t('disable_remember_me') || 'Disable Remember Me',
          t('disable_remember_me_warning') || 'This will delete your saved credentials and disable biometric authentication. Continue?',
          [
            {
              text: t('cancel') || 'Cancel',
              style: 'cancel',
            },
            {
              text: t('disable') || 'Disable',
              style: 'destructive',
              onPress: async () => {
                try {
                  await BiometricAuthService.setRememberMeEnabled(false);
                  await BiometricAuthService.setBiometricEnabled(false);
                  
                  setRememberMeEnabled(false);
                  setBiometricEnabled(false);
                  
                  onSettingsChange?.({
                    biometricEnabled: false,
                    rememberMeEnabled: false,
                  });
                  
                  Alert.alert(
                    t('success') || 'Success',
                    t('credentials_cleared') || 'Saved credentials have been cleared.'
                  );
                } catch (error) {
                  console.error('Error disabling remember me:', error);
                  Alert.alert(
                    t('error') || 'Error',
                    t('setting_update_failed') || 'Failed to update setting'
                  );
                }
              },
            },
          ]
        );
      } else {
        // Enable remember me
        await BiometricAuthService.setRememberMeEnabled(true);
        setRememberMeEnabled(true);
        
        onSettingsChange?.({
          biometricEnabled,
          rememberMeEnabled: true,
        });
      }
    } catch (error) {
      console.error('Error toggling remember me:', error);
      Alert.alert(
        t('error') || 'Error',
        t('setting_update_failed') || 'Failed to update setting'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (updating) return;
    
    if (value && !rememberMeEnabled) {
      Alert.alert(
        t('enable_remember_me') || 'Enable Remember Me',
        t('biometric_requires_remember') || 'Biometric authentication requires "Remember Me" to be enabled first.',
        [{ text: t('ok') || 'OK' }]
      );
      return;
    }
    
    setUpdating(true);
    
    try {
      if (value) {
        // Test biometric authentication before enabling
        const authResult = await BiometricAuthService.authenticateWithBiometrics({
          promptMessage: t('setup_biometric_prompt') || 'Authenticate to enable biometric login',
          cancelLabel: t('cancel') || 'Cancel',
        });
        
        if (authResult.success) {
          await BiometricAuthService.setBiometricEnabled(true);
          setBiometricEnabled(true);
          
          onSettingsChange?.({
            biometricEnabled: true,
            rememberMeEnabled,
          });
          
          Alert.alert(
            t('success') || 'Success',
            t('biometric_enabled') || 'Biometric authentication has been enabled.'
          );
        } else {
          Alert.alert(
            t('authentication_failed') || 'Authentication Failed',
            authResult.warning || authResult.error || t('biometric_setup_failed') || 'Failed to set up biometric authentication.'
          );
        }
      } else {
        // Disable biometric authentication
        await BiometricAuthService.setBiometricEnabled(false);
        setBiometricEnabled(false);
        
        onSettingsChange?.({
          biometricEnabled: false,
          rememberMeEnabled,
        });
      }
    } catch (error) {
      console.error('Error toggling biometric authentication:', error);
      Alert.alert(
        t('error') || 'Error',
        t('setting_update_failed') || 'Failed to update setting'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleTestBiometric = async () => {
    if (!biometricCapabilities?.isAvailable || updating) return;
    
    setUpdating(true);
    
    try {
      const authResult = await BiometricAuthService.authenticateWithBiometrics({
        promptMessage: t('test_biometric_prompt') || 'Test your biometric authentication',
        cancelLabel: t('cancel') || 'Cancel',
      });
      
      if (authResult.success) {
        Alert.alert(
          t('success') || 'Success',
          t('biometric_test_success') || 'Biometric authentication test successful!'
        );
      } else {
        Alert.alert(
          t('test_failed') || 'Test Failed',
          authResult.warning || authResult.error || t('biometric_test_failed') || 'Biometric authentication test failed.'
        );
      }
    } catch (error) {
      console.error('Error testing biometric authentication:', error);
      Alert.alert(
        t('error') || 'Error',
        t('biometric_test_error') || 'Error testing biometric authentication'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCredentials = () => {
    Alert.alert(
      t('clear_credentials') || 'Clear Saved Credentials',
      t('clear_credentials_warning') || 'This will delete your saved login credentials. You will need to enter them manually next time. Continue?',
      [
        {
          text: t('cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('clear') || 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await BiometricAuthService.deleteSavedCredentials();
              Alert.alert(
                t('success') || 'Success',
                t('credentials_cleared') || 'Saved credentials have been cleared.'
              );
            } catch (error) {
              console.error('Error clearing credentials:', error);
              Alert.alert(
                t('error') || 'Error',
                t('clear_credentials_failed') || 'Failed to clear credentials'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#3B82F6" />
        <Text style={styles.loadingText}>
          {t('loading_settings') || 'Loading settings...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('security_settings') || 'Security Settings'}
      </Text>
      
      {/* Remember Me Setting */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>
            {t('remember_me') || 'Remember Me'}
          </Text>
          <Text style={styles.settingDescription}>
            {t('remember_me_description') || 'Save your login credentials securely on this device'}
          </Text>
        </View>
        <Switch
          value={rememberMeEnabled}
          onValueChange={handleRememberMeToggle}
          disabled={updating}
          trackColor={{ false: '#374151', true: '#3B82F6' }}
          thumbColor={rememberMeEnabled ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>

      {/* Biometric Authentication Setting */}
      {biometricCapabilities?.isAvailable ? (
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.labelWithIcon}>
              <Ionicons 
                name={biometricCapabilities.supportedTypes.includes(1) ? "finger-print" : "scan"} 
                size={20} 
                color="#3B82F6" 
              />
              <Text style={styles.settingLabel}>
                {BiometricAuthService.getAuthenticationTypeName(biometricCapabilities.supportedTypes)}
              </Text>
            </View>
            <Text style={styles.settingDescription}>
              {t('biometric_description') || 'Use biometric authentication for quick and secure login'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            disabled={updating || !rememberMeEnabled}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={biometricEnabled ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      ) : (
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <View style={styles.labelWithIcon}>
              <Ionicons name="warning-outline" size={20} color="#F59E0B" />
              <Text style={styles.settingLabel}>
                {t('biometric_unavailable') || 'Biometric Authentication'}
              </Text>
            </View>
            <Text style={[styles.settingDescription, { color: '#F59E0B' }]}>
              {!biometricCapabilities?.hasHardware && (t('no_biometric_hardware') || 'No biometric hardware detected')}
              {biometricCapabilities?.hasHardware && !biometricCapabilities?.isEnrolled && 
                (t('no_biometric_enrolled') || 'No biometric authentication is set up on this device')
              }
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {biometricCapabilities?.isAvailable && biometricEnabled && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTestBiometric}
            disabled={updating}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>
              {t('test_biometric') || 'Test Biometric'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rememberMeEnabled && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearCredentials}
            disabled={updating}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              {t('clear_credentials') || 'Clear Credentials'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {updating && (
        <View style={styles.updatingOverlay}>
          <ActivityIndicator color="#3B82F6" />
          <Text style={styles.updatingText}>
            {t('updating_settings') || 'Updating settings...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    padding: 12,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  dangerButtonText: {
    color: '#EF4444',
  },
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  updatingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
});