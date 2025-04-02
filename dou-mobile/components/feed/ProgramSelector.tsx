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
import { useUserPrograms, useCurrentUser } from '../../hooks/query';
import ProgramCard from '../workouts/ProgramCard';

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
  } = useUserPrograms();
  
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
    
    const toggleSelection = () => {
      if (isSelected) {
        // Deselect if already selected
        setSelectedProgramId(null);
      } else {
        // Select this item
        handleProgramSelect(item.id);
      }
    };
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleSelection}
        style={[styles.cardWrapper, isSelected && styles.selectedCardWrapper]}
      >
        <ProgramCard
          programId={item.id}
          program={item}
          inFeedMode={false}
          currentUser={currentUser?.username}
        />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.selectedCheckmark}>
              <Ionicons name="checkmark-circle" size={40} color="#8B5CF6" />
            </View>
          </View>
        )}
        <View style={styles.selectButton}>
          <View style={[styles.selectIndicator, isSelected && styles.selectedIndicator]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
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
  cardWrapper: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedCardWrapper: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  selectIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    backgroundColor: '#8B5CF6',
    borderColor: '#FFFFFF',
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