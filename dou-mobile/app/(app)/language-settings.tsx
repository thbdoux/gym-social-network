// app/(app)/language-settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../utils/createThemedStyles';

// Available languages
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { palette } = useTheme();
  const { language, setLanguage, t, isUpdating } = useLanguage();
  const styles = themedStyles(palette);
  
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  
  // Handle language selection
  const handleLanguageSelect = async (langCode) => {
    setSelectedLanguage(langCode);
    await setLanguage(langCode);
  };
  
  // Go back to profile
  const handleBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>{t('language_settings')}</Text>
        <View style={styles.rightPlaceholder} />
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        
        <View style={styles.languagesContainer}>
          <BlurView intensity={10} tint="dark" style={styles.blurBackground} />
          
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                selectedLanguage === lang.code && [
                  styles.selectedLanguage,
                  { borderColor: palette.highlight }
                ]
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              disabled={isUpdating}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: palette.text }]}>
                  {lang.name}
                </Text>
                <Text style={[styles.languageNative, { color: `${palette.text}B3` }]}>
                  {lang.nativeName}
                </Text>
              </View>
              
              {selectedLanguage === lang.code && (
                <View style={[styles.checkmark, { backgroundColor: palette.highlight }]}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        {isUpdating && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={palette.highlight} />
            <Text style={[styles.loadingText, { color: palette.text }]}>
              {t('updating_language')}
            </Text>
          </View>
        )}
    
      </ScrollView>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightPlaceholder: {
    width: 40,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  descriptionBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  descriptionIcon: {
    marginRight: 12,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  languagesContainer: {
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: `${palette.accent}1A`,
  },
  selectedLanguage: {
    borderWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 14,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: `${palette.accent}1A`,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  infoContainer: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
}));