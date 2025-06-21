// services/biometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface SavedCredentials {
  username: string;
  password: string;
}

export class BiometricAuthService {
  private static readonly CREDENTIALS_KEY = 'saved_credentials';
  private static readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private static readonly REMEMBER_ME_KEY = 'remember_me_enabled';

  // Check device biometric capabilities
  static async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      return {
        isAvailable: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        supportedTypes,
      };
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  // Perform biometric authentication
  static async authenticateWithBiometrics(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
  }): Promise<LocalAuthentication.LocalAuthenticationResult> {
    try {
      const capabilities = await this.getBiometricCapabilities();
      
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: 'not_available',
          warning: 'Biometric authentication is not available on this device'
        };
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || 'Authenticate to access your account',
        cancelLabel: options?.cancelLabel || 'Cancel',
        fallbackLabel: options?.fallbackLabel || 'Use Passcode',
        disableDeviceFallback: false, // Allow fallback to device passcode
      });

      return authResult;
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'system_cancel',
        warning: error.message || 'Authentication failed'
      };
    }
  }

  // Save credentials securely
  static async saveCredentials(username: string, password: string): Promise<boolean> {
    try {
      const credentials = JSON.stringify({ username, password });
      await SecureStore.setItemAsync(this.CREDENTIALS_KEY, credentials, {
        requireAuthentication: false, // Set to true if you want biometric verification to access stored credentials
      });
      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }

  // Get saved credentials
  static async getSavedCredentials(): Promise<SavedCredentials | null> {
    try {
      const credentials = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
      if (credentials) {
        return JSON.parse(credentials);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }

  // Delete saved credentials
  static async deleteSavedCredentials(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(this.CREDENTIALS_KEY);
      return true;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }

  // Check if biometric authentication is enabled
  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  // Enable/disable biometric authentication
  static async setBiometricEnabled(enabled: boolean): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(this.BIOMETRIC_ENABLED_KEY, enabled.toString());
      return true;
    } catch (error) {
      console.error('Error setting biometric enabled status:', error);
      return false;
    }
  }

  // Check if "Remember Me" is enabled
  static async isRememberMeEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.REMEMBER_ME_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking remember me status:', error);
      return false;
    }
  }

  // Enable/disable "Remember Me"
  static async setRememberMeEnabled(enabled: boolean): Promise<boolean> {
    try {
      await SecureStore.setItemAsync(this.REMEMBER_ME_KEY, enabled.toString());
      if (!enabled) {
        // If disabling remember me, also delete saved credentials
        await this.deleteSavedCredentials();
      }
      return true;
    } catch (error) {
      console.error('Error setting remember me status:', error);
      return false;
    }
  }

  // Authenticate with biometrics and get saved credentials
  static async authenticateAndGetCredentials(): Promise<{
    success: boolean;
    credentials?: SavedCredentials;
    error?: string;
  }> {
    try {
      // First check if biometric auth is enabled
      const biometricEnabled = await this.isBiometricEnabled();
      if (!biometricEnabled) {
        return { success: false, error: 'Biometric authentication is not enabled' };
      }

      // Check if we have saved credentials
      const savedCredentials = await this.getSavedCredentials();
      if (!savedCredentials) {
        return { success: false, error: 'No saved credentials found' };
      }

      // Perform biometric authentication
      const authResult = await this.authenticateWithBiometrics({
        promptMessage: 'Use biometrics to sign in quickly',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Enter Password',
      });

      if (authResult.success) {
        return { success: true, credentials: savedCredentials };
      } else {
        return { 
          success: false, 
          error: authResult.warning || authResult.error || 'Authentication failed' 
        };
      }
    } catch (error: any) {
      console.error('Error in authenticateAndGetCredentials:', error);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  // Get friendly name for authentication types
  static getAuthenticationTypeName(types: LocalAuthentication.AuthenticationType[]): string {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scan';
    } else {
      return 'Biometric Authentication';
    }
  }
}