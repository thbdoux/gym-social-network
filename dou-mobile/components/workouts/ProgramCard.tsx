// components/workouts/ProgramCard.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Pressable,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext'; // Import useModal hook

interface Program {
  id: number;
  name: string;
  description?: string;
  focus: string;
  difficulty_level: string;
  creator_username: string;
  is_active: boolean;
  sessions_per_week: number;
  estimated_completion_weeks: number;
  created_at: string;
  workouts?: any[];
  tags?: string[];
  forked_from?: number;
  is_public?: boolean;
  is_shared_with_me?: boolean;
  activeWeekday?: number;
  activeWorkoutId?: number;
}

interface ProgramCardProps {
  program: Program;
  programId: number;
  currentUser?: string;
  onEdit?: (program: Program) => void;
  onDelete?: (programId: number) => void;
  onToggleActive?: (programId: number) => Promise<void>;
  onShare?: (program: Program) => void;
  onFork?: (programId: number) => Promise<any>;
  onProgramSelect?: (program: Program) => void;
  inFeedMode?: boolean;
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  programId,
  currentUser,
  onEdit,
  onDelete,
  onToggleActive,
  onShare,
  onFork,
  onProgramSelect,
  inFeedMode = false,
}) => {
  const { t } = useLanguage();
  const { openProgramDetail } = useModal(); // Get openProgramDetail from modal context
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  
  if (!program) {
    return null;
  }
  
  // Permission checks
  const isCreator = program.creator_username === currentUser;
  const canEditProgram = isCreator && !inFeedMode;
  const canShareProgram = isCreator;
  const canDeleteProgram = isCreator && !inFeedMode;
  const canToggleActive = isCreator && !inFeedMode;
  const canForkProgram = !isCreator && (program.is_public || program.is_shared_with_me);
  
  const getFocusIcon = (focus: string) => {
    switch(focus) {
      case 'strength': return 'trophy';
      case 'hypertrophy': return 'layers';
      case 'endurance': return 'pulse';
      case 'weight_loss': return 'ribbon';
      case 'strength_hypertrophy': return 'star';
      default: return 'trending-up';
    }
  };
  
  const getDifficultyIcon = (level?: string) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return '🔰';
      case 'intermediate': return '⚡';
      case 'advanced': return '💪';
      case 'expert': return '🏆';
      default: return '✓';
    }
  };

  // Map weekdays
  const WEEKDAYS = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];
  
  const handleOpenDetailModal = () => {
    // Use the global modal instead of local state
    openProgramDetail(program);
  };

  return (
    <View style={[
      styles.container, 
      program.is_active ? styles.containerActive : styles.containerRegular
    ]}>
      {/* Active Program Indicator */}
      {program.is_active && <View style={styles.activeIndicator} />}
      
      {/* Main Card Content */}
      <TouchableOpacity 
        style={styles.contentContainer}
        onPress={handleOpenDetailModal}
        activeOpacity={0.7}
      >
        {/* Main Content Area */}
        <View style={styles.mainContentArea}>
          {/* Title and Basic Info */}
          <View style={styles.titleAndInfoContainer}>
            <View style={styles.titleWrapper}>
              <Text style={styles.title} numberOfLines={1}>
                {program.name}
              </Text>
              
              {/* Active/Inactive Badge */}
              {program.is_active ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{t('active')}</Text>
                </View>
              ) : (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>{t('inactive')}</Text>
                </View>
              )}
            </View>
            
            {/* Stats Row - moved below title */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={14} style={styles.calendarIcon} />
                <Text style={styles.statValue}>{program.sessions_per_week}x</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Ionicons name="barbell-outline" size={14} style={styles.barbellIcon} />
                <Text style={styles.statValue}>{program.workouts?.length || 0}</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.levelIcon}>
                  {getDifficultyIcon(program.difficulty_level)}
                </Text>
                <Text style={styles.statValue}>{t(program.difficulty_level)}</Text>
              </View>
              
              {program.focus && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name={getFocusIcon(program.focus)} size={14} style={styles.focusIcon} />
                    <Text style={styles.statValue}>{t(program.focus.replace(/_/g, ' '))}</Text>
                  </View>
                </>
              )}
            </View>
            
            {/* Creator Info */}
            <View style={styles.creatorRow}>
              <Ionicons name="person-outline" size={12} color="#9ca3af" />
              <Text style={styles.creatorText} numberOfLines={1}>
                {program.creator_username}
              </Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Options Menu - Always first/top */}
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowOptionsMenu(true)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
            </TouchableOpacity>
            
            {/* Fork button for non-creators - Using download icon now */}
            {canForkProgram && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => onFork && onFork(program.id)}
              >
                <Ionicons name="download-outline" size={18} color="#60a5fa" />
              </TouchableOpacity>
            )}
            
            {/* Detail View button */}
            <TouchableOpacity 
              onPress={handleOpenDetailModal}
              style={styles.actionButton}
            >
              <Ionicons name="eye-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Calendar section - Always visible */}
      <View style={styles.calendarSection}>
        <Text style={styles.sectionLabel}>{t('weekly_schedule')}</Text>
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day, index) => {
            const hasWorkouts = program.workouts?.some(w => w.preferred_weekday === index);
            const workoutsForDay = program.workouts?.filter(w => w.preferred_weekday === index) || [];
            
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.weekdayItem}
                onPress={() => {
                  if (workoutsForDay.length > 0) {
                    // Set activeWeekday before opening the modal
                    program.activeWeekday = index;
                    openProgramDetail(program);
                  }
                }}
                disabled={!workoutsForDay.length}
              >
                <Text style={styles.weekdayLabel}>{day}</Text>
                <View 
                  style={[
                    styles.weekdayIndicator,
                    hasWorkouts ? styles.weekdayActive : styles.weekdayInactive
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={styles.optionsMenu}>
            <Text style={styles.optionsTitle}>{program.name}</Text>
            
            {/* View Details */}
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptionsMenu(false);
                // handleOpenDetailModal();
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#60a5fa" />
              <Text style={styles.optionText}>{t('view_details')}</Text>
            </TouchableOpacity>
            
            {/* Edit option - only for creator and not in feed mode */}
            {canEditProgram && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onEdit && onEdit(program);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('edit_program')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Share option */}
            {canShareProgram && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onShare && onShare(program);
                }}
              >
                <Ionicons name="share-social-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('share_program')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Toggle active - only for creator and not in feed mode */}
            {canToggleActive && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onToggleActive && onToggleActive(program.id);
                }}
              >
                <Ionicons 
                  name={program.is_active ? "toggle" : "toggle-outline"} 
                  size={20} 
                  color={program.is_active ? "#22c55e" : "#60a5fa"} 
                />
                <Text style={styles.optionText}>
                  {program.is_active ? t('deactivate_program') : t('activate_program')}
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Fork option for non-creators */}
            {canForkProgram && (
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onFork && onFork(program.id);
                }}
              >
                <Ionicons name="download-outline" size={20} color="#60a5fa" />
                <Text style={styles.optionText}>{t('fork_program')}</Text>
              </TouchableOpacity>
            )}
            
            {/* Delete option - only for creator and not in feed mode */}
            {canDeleteProgram && (
              <TouchableOpacity 
                style={[styles.optionItem, styles.deleteOption]}
                onPress={() => {
                  setShowOptionsMenu(false);
                  onDelete && onDelete(program.id);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.deleteOptionText}>{t('delete_program')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.cancelOption}
              onPress={() => setShowOptionsMenu(false)}
            >
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(192, 132, 252, 0.1)', // Light purple background for all cards
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.5)', // Purple border for all cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  containerRegular: {
    // Styles shared by all cards now
  },
  containerActive: {
    // Styles shared by all cards now
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#c084fc',
    zIndex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  mainContentArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleAndInfoContainer: {
    flex: 1,
    paddingRight: 16,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  inactiveBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
    marginLeft: 4,
  },
  levelIcon: {
    fontSize: 14,
  },
  // Colorized stat icons
  calendarIcon: {
    color: '#f97316', // Orange
  },
  barbellIcon: {
    color: '#c084fc', // Purple
  },
  focusIcon: {
    color: '#60a5fa', // Blue
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  actionButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  calendarSection: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.3)',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayItem: {
    alignItems: 'center',
  },
  weekdayLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  weekdayIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  weekdayActive: {
    backgroundColor: '#c084fc',
  },
  weekdayInactive: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  optionsMenu: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.3)',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.2)',
  },
  optionText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#e5e7eb',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    fontSize: 15,
    marginLeft: 12,
    color: '#ef4444',
  },
  cancelOption: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#60a5fa',
  },
});

export default ProgramCard;