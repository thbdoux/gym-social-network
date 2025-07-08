// app/(app)/group-workout/modals/SelectWorkoutModal.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../../context/LanguageContext';
import WorkoutCard from '../../../../components/workouts/WorkoutCard';

interface SelectWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  workoutTemplates: any[];
  colors: any;
  onSelect: (templateId: number) => void;
  forProposal?: boolean;
}

const SelectWorkoutModal: React.FC<SelectWorkoutModalProps> = ({
  visible,
  onClose,
  workoutTemplates,
  colors,
  onSelect,
  forProposal = false
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter templates based on search query
  const filteredTemplates = workoutTemplates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle submitting the selected template
  const handleSubmitTemplate = async () => {
    if (!selectedTemplateId) {
      Alert.alert(t('error'), t('select_template_first'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSelect(selectedTemplateId);
      setIsSubmitting(false);
      resetState();
    } catch (error) {
      console.error('Failed to submit template:', error);
      setIsSubmitting(false);
      Alert.alert(t('error'), forProposal ? t('failed_to_submit_proposal') : t('failed_to_submit_template'));
    }
  };
  
  // Reset state when modal closes
  const resetState = () => {
    setSelectedTemplateId(null);
    setSearchQuery('');
  };
  
  // Handle close with state reset
  const handleClose = () => {
    resetState();
    onClose();
  };
  
  // Render a workout template item
  const renderWorkoutItem = ({ item }) => {
    const isSelected = selectedTemplateId === item.id;
    
    return (
      <View
        style={[
          styles.templateItem,
          isSelected && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
        ]}
      >
        <TouchableOpacity 
          style={styles.selectionOverlay}
          activeOpacity={0.7}
          onPress={() => setSelectedTemplateId(item.id)}
        >
          {/* Transparent overlay to capture touches */}
        </TouchableOpacity>
        
        <View style={styles.workoutCardWrapper}>
          <WorkoutCard
            workoutId={item.id}
            workout={item}
            isTemplate={true}
            user=""
          />
        </View>
        
        <View style={[
          styles.selectionCircle,
          { borderColor: isSelected ? colors.success : colors.text.tertiary },
          isSelected && { backgroundColor: colors.success }
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {forProposal ? t('propose_workout') : t('select_workout_template')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.searchContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <Ionicons name="search" size={20} color={colors.text.tertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder={t('search_templates')}
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderWorkoutItem}
            contentContainerStyle={styles.templatesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="fitness" size={40} color={colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  {searchQuery 
                    ? t('no_templates_found') 
                    : t('no_workout_templates')}
                </Text>
                {!searchQuery && (
                  <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
                    {t('create_templates_first')}
                  </Text>
                )}
              </View>
            }
          />
          
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={{ color: colors.danger }}>{t('cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton, 
                selectedTemplateId ? 
                  { backgroundColor: colors.success } : 
                  { backgroundColor: 'rgba(107, 114, 128, 0.2)' }
              ]}
              onPress={handleSubmitTemplate}
              disabled={!selectedTemplateId || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ 
                  color: selectedTemplateId ? '#FFFFFF' : '#6B7280',
                  fontWeight: 'bold' 
                }}>
                  {forProposal ? t('propose') : t('submit')}
                </Text>
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  templatesList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  templateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  workoutCardWrapper: {
    flex: 1,
    marginRight: 16,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  }
});

export default SelectWorkoutModal;