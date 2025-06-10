// app/(app)/post/[id]/reactions.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePostReactions } from '../../../../hooks/query/usePostQuery';
import { useLanguage } from '../../../../context/LanguageContext';
import { useTheme } from '../../../../context/ThemeContext';
import { createThemedStyles } from '../../../../utils/createThemedStyles';
import { getAvatarUrl } from '../../../../utils/imageUtils';
import ProfilePreviewModal from '../../../../components/profile/ProfilePreviewModal';

export default function PostReactionsScreen() {
  const { id } = useLocalSearchParams();
  const postId = typeof id === 'string' ? parseInt(id, 10) : 0;
  const router = useRouter();
  const { t } = useLanguage();
  const { palette } = useTheme();
  
  // State management
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedReactionType, setSelectedReactionType] = useState<string | null>(null);

  // Fetch reactions data
  const { 
    data: reactions = [], 
    isLoading, 
    error 
  } = usePostReactions(postId);

  // Create themed styles
  const styles = themedStyles(palette);

  const handleGoBack = () => {
    router.back();
  };

  const handleProfileClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };
  
  const handleNavigateToProfile = (userId: number) => {
    router.push(`/user/${userId}`);
  };

  // Get emoji for reaction type
  const getReactionEmoji = (type: string) => {
    switch(type) {
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'laugh': return '😂';
      case 'wow': return '😮';
      case 'sad': return '😢';
      case 'angry': return '😡';
      default: return '👍';
    }
  };

  // Get reaction type display name
  const getReactionDisplayName = (type: string) => {
    switch(type) {
      case 'like': return t('like') || 'Like';
      case 'love': return t('love') || 'Love';
      case 'laugh': return t('laugh') || 'Laugh';
      case 'wow': return t('wow') || 'Wow';
      case 'sad': return t('sad') || 'Sad';
      case 'angry': return t('angry') || 'Angry';
      default: return t('reaction') || 'Reaction';
    }
  };

  // Get unique reaction types for filtering
  const getReactionTypes = () => {
    const types = [...new Set(reactions.map(r => r.reaction_type))];
    return types.sort();
  };

  // Filter reactions by selected type
  const getFilteredReactions = () => {
    if (!selectedReactionType) return reactions;
    return reactions.filter(r => r.reaction_type === selectedReactionType);
  };

  // Group reactions by type for summary
  const getReactionSummary = () => {
    const summary = {};
    reactions.forEach(reaction => {
      const type = reaction.reaction_type;
      summary[type] = (summary[type] || 0) + 1;
    });
    return Object.entries(summary)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([type, count]) => ({ type, count }));
  };

  const renderReactionItem = ({ item: reaction }) => (
    <TouchableOpacity 
      style={styles.reactionItem}
      onPress={() => handleNavigateToProfile(reaction.user_id)}
      activeOpacity={0.7}
    >
      <View style={styles.reactionItemContent}>
        {/* User Avatar */}
        <TouchableOpacity 
          onPress={() => handleProfileClick(reaction.user_id)}
          style={styles.avatarContainer}
        >
          <Image
            source={{ uri: getAvatarUrl(reaction.user_profile_picture) }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        
        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: palette.text }]}>
            {reaction.user_username}
          </Text>
          <Text style={[styles.reactionTime, { color: palette.text_secondary }]}>
            {new Date(reaction.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        {/* Reaction */}
        <View style={styles.reactionContainer}>
          <Text style={styles.reactionEmoji}>
            {getReactionEmoji(reaction.reaction_type)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderReactionFilter = ({ item: { type, count } }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        {
          backgroundColor: selectedReactionType === type 
            ? palette.accent 
            : palette.card_background,
          borderColor: selectedReactionType === type 
            ? palette.accent 
            : palette.border
        }
      ]}
      onPress={() => setSelectedReactionType(
        selectedReactionType === type ? null : type
      )}
      activeOpacity={0.7}
    >
      <Text style={styles.filterEmoji}>
        {getReactionEmoji(type)}
      </Text>
      <Text style={[
        styles.filterCount,
        {
          color: selectedReactionType === type 
            ? palette.page_background 
            : palette.text
        }
      ]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="heart-outline" 
        size={64} 
        color={palette.text_tertiary} 
      />
      <Text style={[styles.emptyTitle, { color: palette.text }]}>
        {t('no_reactions') || 'No reactions yet'}
      </Text>
      <Text style={[styles.emptyText, { color: palette.text_secondary }]}>
        {t('be_first_to_react') || 'Be the first to react to this post'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
        <StatusBar 
          barStyle={palette.layout === '#1e293b' ? 'light-content' : 'dark-content'} 
          backgroundColor={palette.layout}
        />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.layout, borderBottomColor: palette.border }]}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {t('reactions') || 'Reactions'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>
            {t('loading_reactions') || 'Loading reactions...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
        <StatusBar 
          barStyle={palette.layout === '#1e293b' ? 'light-content' : 'dark-content'} 
          backgroundColor={palette.layout}
        />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.layout, borderBottomColor: palette.border }]}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>
            {t('reactions') || 'Reactions'}
          </Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.error }]}>
            {t('error_loading_reactions') || 'Error loading reactions'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: palette.accent }]}
            onPress={() => window.location.reload()}
          >
            <Text style={[styles.retryButtonText, { color: palette.page_background }]}>
              {t('retry') || 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const reactionSummary = getReactionSummary();
  const filteredReactions = getFilteredReactions();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.page_background }]}>
      <StatusBar 
        barStyle={palette.layout === '#1e293b' ? 'light-content' : 'dark-content'} 
        backgroundColor={palette.layout}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.layout, borderBottomColor: palette.border }]}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          {t('reactions') || 'Reactions'} ({reactions.length})
        </Text>
        <View style={styles.headerRight} />
      </View>

      {reactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.content}>
          {/* Reaction Type Filters */}
          {reactionSummary.length > 1 && (
            <View style={styles.filtersContainer}>
              <FlatList
                data={reactionSummary}
                renderItem={renderReactionFilter}
                keyExtractor={(item) => item.type}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
              />
            </View>
          )}

          {/* Reactions List */}
          <FlatList
            data={filteredReactions}
            renderItem={renderReactionItem}
            keyExtractor={(item) => `${item.id}-${item.user_id}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyFilterContainer}>
                <Text style={[styles.emptyFilterText, { color: palette.text_secondary }]}>
                  {t('no_reactions_of_type') || `No ${getReactionDisplayName(selectedReactionType)} reactions`}
                </Text>
              </View>
            )}
          />
        </View>
      )}
      
      {/* Profile Preview Modal */}
      {selectedUserId && (
        <ProfilePreviewModal
          isVisible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={selectedUserId}
        />
      )}
    </SafeAreaView>
  );
}

// Themed styles
const themedStyles = createThemedStyles((palette) => ({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 24,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  filterCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 8,
  },
  reactionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reactionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reactionTime: {
    fontSize: 12,
  },
  reactionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.card_background,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyFilterContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontSize: 14,
    textAlign: 'center',
  },
}));