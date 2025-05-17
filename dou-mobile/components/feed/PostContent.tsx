// components/feed/PostContent.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity ,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import WorkoutLogCard from '../workouts/WorkoutLogCard';
import ProgramCard from '../workouts/ProgramCard';
import GroupWorkoutCard from '../workouts/GroupWorkoutCard';

interface PostContentProps {
  post: any;
  isEditing: boolean;
  editText: string;
  setEditText: (text: string) => void;
  handleSubmitEdit: () => void;
  cancelEdit: () => void;
  onProgramClick?: (program: any) => void;
  onWorkoutLogClick?: (logId: number) => void;
  onGroupWorkoutClick?: (groupWorkoutId: number) => void;
  onForkProgram?: (programId: number) => Promise<any>;
  currentUser: string;
  handleSharedProfileClick?: (event: any) => void;
  handleOriginalPostClick?: (originalPostId: number) => void;
}

const PostContent: React.FC<PostContentProps> = ({
  post,
  isEditing,
  editText,
  setEditText,
  handleSubmitEdit,
  cancelEdit,
  onProgramClick,
  onWorkoutLogClick,
  onGroupWorkoutClick,
  onForkProgram,
  currentUser,
  handleSharedProfileClick,
  handleOriginalPostClick
}) => {
  const { t } = useLanguage();
  const { palette } = useTheme();

  // Shared post component
  const SharedPostContent = ({ originalPost, onOriginalPostClick }) => {
    // Get post type details to determine styling
    const getPostTypeDetails = (type: string = 'regular') => {
      const defaultGradient = [palette.accent, palette.highlight];
      
      switch(type) {
        case 'program':
          return {
            icon: 'barbell',
            label: t('program'),
            colors: { 
              gradient: defaultGradient
            }
          };
        case 'workout_log':
          return {
            icon: 'fitness',
            label: t('workout_log'),
            colors: { 
              gradient: defaultGradient
            }
          };
        case 'group_workout':
          return {
            icon: 'people',
            label: t('group_workout'),
            colors: { 
              gradient: defaultGradient
            }
          };
        default:
          return {
            icon: 'create',
            label: t('regular'),
            colors: { 
              gradient: defaultGradient
            }
          };
      }
    };

    const formatDate = (dateString) => {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
      if (diffHours < 24) {
        return `${diffHours} ${t(diffHours === 1 ? 'hour_ago' : 'hours_ago')}`;
      } else if (diffDays < 7) {
        return `${diffDays} ${t(diffDays === 1 ? 'day_ago' : 'days_ago')}`;
      } else {
        return date.toLocaleDateString();
      }
    };

    const originalPostTypeDetails = getPostTypeDetails(originalPost.post_type);
    
    return (
      <TouchableOpacity 
        style={[styles.sharedPostContainer, { borderColor: palette.border }]}
        onPress={() => onOriginalPostClick && onOriginalPostClick(originalPost.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sharedPostHeader}>
          {/* Avatar image */}
          <TouchableOpacity 
            style={styles.sharedPostAvatar}
            onPress={handleSharedProfileClick}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: originalPost.user_profile_picture }}
              style={styles.sharedPostAvatarImage}
            />
          </TouchableOpacity>
          
          <View style={styles.sharedPostUserInfo}>
            <View style={styles.sharedPostAuthorRow}>
              <TouchableOpacity onPress={handleSharedProfileClick} activeOpacity={0.7}>
                <Text style={[styles.sharedPostUsername, { color: palette.text }]}>
                  {originalPost.user_username}
                </Text>
              </TouchableOpacity>
              
              {/* Post type badge for original post */}
              {originalPost.post_type && originalPost.post_type !== 'regular' && (
                <LinearGradient
                  colors={originalPostTypeDetails.colors.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.postTypeBadge}
                >
                  <Text style={styles.postTypeBadgeText}>{originalPostTypeDetails.label}</Text>
                </LinearGradient>
              )}
            </View>
            
            <Text style={[styles.sharedPostDate, { color: palette.border }]}>
              {formatDate(originalPost.created_at)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.sharedPostContent, { color: palette.text }]}>
          {originalPost.content}
        </Text>
        
        {/* Original post content - workout logs, programs, etc. */}
        {originalPost.post_type === 'workout_log' && originalPost.workout_log_details && (
          <WorkoutLogCard
            user={currentUser}
            logId={originalPost.workout_log_details?.id}
            log={originalPost.workout_log_details}
            inFeedMode={true}
            onWorkoutLogClick={onWorkoutLogClick}
          />
        )}
        
        {originalPost.post_type === 'program' && originalPost.program_details && (
          <ProgramCard 
            programId={originalPost.program_id || originalPost.program}
            program={originalPost.program_details}
            inFeedMode={true}
            currentUser={currentUser}
            onProgramSelect={onProgramClick}
            onFork={onForkProgram}
          />
        )}
        
        {originalPost.image && (
          <Image
            source={{ uri: originalPost.image }}
            style={styles.sharedPostImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
    );
  };

  if (isEditing) {
    // Edit Mode UI
    return (
      <View style={styles.editContainer}>
        <TextInput
          style={[styles.editInput, { 
            backgroundColor: 'rgba(31, 41, 55, 0.6)',
            borderColor: palette.accent,
            color: palette.text 
          }]}
          value={editText}
          onChangeText={setEditText}
          multiline
          placeholder={t('edit_your_post')}
          placeholderTextColor={palette.border}
        />
        <View style={styles.editButtons}>
          <TouchableOpacity 
            style={[styles.editButton, styles.cancelButton, { borderColor: palette.border }]}
            onPress={cancelEdit}
          >
            <Text style={[styles.editButtonText, { color: palette.text }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.editButton, styles.saveButton, { backgroundColor: palette.accent }]}
            onPress={handleSubmitEdit}
          >
            <Text style={styles.editButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Normal Content View
  return (
    <View style={styles.container}>
      {post.content && (
        <Text style={[styles.postText, { color: palette.text }]}>
          {post.content}
        </Text>
      )}
      
      {/* Program Card */}
      {post.post_type === 'program' && post.program_details && (
        <View style={styles.programCardContainer}>
          <ProgramCard
            programId={post.program_id}
            program={post.program_details}
            onProgramSelect={onProgramClick}
            currentUser={currentUser}
            inFeedMode={true}
            onFork={onForkProgram}
          />
        </View>
      )}
      
      {/* Workout Log */}
      {post.post_type === 'workout_log' && post.workout_log_details && (
        <View style={styles.workoutLogContainer}>
          <WorkoutLogCard 
            user={currentUser}
            logId={post.workout_log}
            log={post.workout_log_details}
            inFeedMode={true}
            onWorkoutLogClick={onWorkoutLogClick}
          />
        </View>
      )}

      {/* Group Workout */}
      {post.post_type === 'group_workout' && post.group_workout_details && (
        <View style={styles.groupWorkoutContainer}>
          <GroupWorkoutCard 
            groupWorkoutId={post.group_workout_details?.id}
            groupWorkout={post.group_workout_details}
            onParticipatePress={onGroupWorkoutClick}
          />
        </View>
      )}
      
      {/* Shared Post */}
      {post.is_share && post.original_post_details && (
        <SharedPostContent 
          originalPost={post.original_post_details}
          onOriginalPostClick={handleOriginalPostClick}
        />
      )}
      
      {/* Regular Image */}
      {!post.is_share && post.image && (
        <Image
          source={{ uri: post.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  programCardContainer: {
    marginTop: 8,
  },
  workoutLogContainer: {
    marginTop: 8,
  },
  groupWorkoutContainer: {
    marginTop: 8,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginTop: 8,
  },
  // Edit mode styles
  editContainer: {
    marginBottom: 16,
  },
  editInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    borderWidth: 1,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Shared post styles
  sharedPostContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sharedPostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  sharedPostAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  sharedPostUserInfo: {
    flex: 1,
  },
  sharedPostAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sharedPostUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  postTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  sharedPostDate: {
    fontSize: 12,
  },
  sharedPostContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  sharedPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
});

export default PostContent;