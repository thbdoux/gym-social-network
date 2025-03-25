// components/feed/ProgramSelector.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList, 
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import { usePrograms, useCurrentUser } from '../../hooks/query';

interface ProgramSelectorProps {
  onSelect: (program: any) => void;
  onCancel: () => void;
  title?: string;
  cancelText?: string;
}

const ProgramSelector: React.FC<ProgramSelectorProps> = ({ 
  onSelect, 
  onCancel,
  title,
  cancelText
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const { t } = useLanguage();
  
  // Use React Query hooks
  const { 
    data: allPrograms = [], 
    isLoading: programsLoading, 
    error: programsError 
  } = usePrograms();
  
  const { 
    data: currentUser, 
    isLoading: userLoading 
  } = useCurrentUser();
  
  // Filter programs to show only those created by the current user (not forked)
  const programs = allPrograms.filter(program => 
    program.creator_username === currentUser?.username
  );
  
  // Further filter based on search query
  const filteredPrograms = programs.filter(program => 
    program.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleProgramSelect = (programId: number) => {
    setSelectedProgramId(programId);
  };

  const handleConfirm = () => {
    if (selectedProgramId) {
      const selectedProgram = programs.find(program => program.id === selectedProgramId);
      if (selectedProgram) {
        onSelect(selectedProgram);
      }
    }
  };
  
  const loading = programsLoading || userLoading;
  const error = programsError ? programsError.message : null;

  const renderProgramItem = ({ item }: { item: any }) => {
    const isSelected = selectedProgramId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.programItem,
          isSelected && styles.programItemSelected
        ]}
        onPress={() => handleProgramSelect(item.id)}
      >
        <View style={styles.programHeader}>
          <View style={[styles.programIcon, isSelected && styles.programIconSelected]}>
            <Ionicons 
              name="barbell" 
              size={16} 
              color={isSelected ? "#FFFFFF" : "#8B5CF6"} 
            />
          </View>
          
          <View style={styles.programTitleContainer}>
            <Text style={styles.programTitle} numberOfLines={1}>
              {item.name}
            </Text>
            
            <View style={styles.badgeContainer}>
              <View style={styles.focusBadge}>
                <Text style={styles.focusText}>
                  {item.focus?.replace(/_/g, ' ')}
                </Text>
              </View>
              
              {item.forked_from && (
                <View style={styles.forkedBadge}>
                  <Ionicons name="git-branch" size={10} color="#D1D5DB" />
                  <Text style={styles.forkedText}>{t('forked')}</Text>
                </View>
              )}
              
              {item.is_active && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>{t('active')}</Text>
                </View>
              )}
            </View>
          </View>
          
          {isSelected && (
            <View style={styles.selectedCheckmark}>
              <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
            </View>
          )}
        </View>
        
        <View style={styles.programDescription}>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description || t('no_description')}
          </Text>
        </View>
        
        <View style={styles.programStats}>
          <View style={styles.programStat}>
            <Ionicons name="calendar-outline" size={14} color="#8B5CF6" />
            <View>
              <Text style={styles.statLabel}>{t('frequency')}</Text>
              <Text style={styles.statValue}>
                {item.sessions_per_week}x {t('weekly')}
              </Text>
            </View>
          </View>
          
          <View style={styles.programStat}>
            <Ionicons name="people-outline" size={14} color="#8B5CF6" />
            <View>
              <Text style={styles.statLabel}>{t('workouts')}</Text>
              <Text style={styles.statValue}>
                {item.workouts?.length || 0}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="barbell-outline" size={48} color="#4B5563" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? t('no_matching_programs') : t('no_programs_created')}
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery ? t('adjust_search_terms') : t('create_program_first')}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title || t('select_program_to_share')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8B5CF6" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_programs')}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Program List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loaderBackground}>
                <ActivityIndicator size="large" color="#8B5CF6" />
              </View>
              <Text style={styles.loadingText}>{t('loading_programs')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconBackground}>
                <Ionicons name="close" size={32} color="#EF4444" />
              </View>
              <Text style={styles.errorTitle}>{t('something_went_wrong')}</Text>
              <Text style={styles.errorMessage}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPrograms}
              renderItem={renderProgramItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={EmptyList}
            />
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{cancelText || t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton,
                !selectedProgramId && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!selectedProgramId}
            >
              <Ionicons name="barbell" size={16} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>{t('share_program')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  programItem: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  programItemSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  programIconSelected: {
    backgroundColor: '#8B5CF6',
  },
  programTitleContainer: {
    flex: 1,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  focusBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  focusText: {
    fontSize: 10,
    color: '#A78BFA',
  },
  forkedBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  forkedText: {
    fontSize: 10,
    color: '#D1D5DB',
    marginLeft: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  activeText: {
    fontSize: 10,
    color: '#10B981',
  },
  selectedCheckmark: {
    marginLeft: 8,
  },
  programDescription: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  descriptionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  programStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    justifyContent: 'space-around',
  },
  programStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  cancelButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderStyle: 'dashed',
  },
  errorIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ProgramSelector;