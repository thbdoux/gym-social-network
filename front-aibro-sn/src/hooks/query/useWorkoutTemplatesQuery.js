import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from '@tanstack/react-query';
  import { workoutService } from '../../api/services';
  
  // Query keys
  export const templateKeys = {
    all: ['templates'],
    lists: () => [...templateKeys.all, 'list'],
    list: (filters) => [...templateKeys.lists(), { ...filters }],
    details: () => [...templateKeys.all, 'detail'],
    detail: (id) => [...templateKeys.details(), id],
  };
  
  /**
   * Hook for fetching all workout templates
   */
  export const useWorkoutTemplates = (options = {}) => {
    return useQuery({
      queryKey: templateKeys.lists(),
      queryFn: workoutService.getTemplates,
      ...options
    });
  };
  
  /**
   * Hook for fetching a single template by ID
   */
  export const useWorkoutTemplate = (templateId, options = {}) => {
    return useQuery({
      queryKey: templateKeys.detail(templateId),
      queryFn: () => workoutService.getTemplateById(templateId),
      enabled: !!templateId,
      ...options
    });
  };
  
  /**
   * Hook for creating a new workout template
   */
  export const useCreateWorkoutTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: workoutService.createTemplate,
      onSuccess: (newTemplate) => {
        // Update templates list
        queryClient.setQueryData(templateKeys.lists(), (old = []) => [...old, newTemplate]);
        
        // Set the new template data in the cache
        queryClient.setQueryData(templateKeys.detail(newTemplate.id), newTemplate);
        
        // Invalidate the templates list to make sure it's updated
        queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      }
    });
  };
  
  /**
   * Hook for updating an existing workout template
   */
  export const useUpdateWorkoutTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ templateId, updates }) => 
        workoutService.updateTemplate(templateId, updates),
      onSuccess: (updatedTemplate) => {
        // Update template in the list
        queryClient.setQueryData(templateKeys.lists(), (old = []) => 
          old.map(template => 
            template.id === updatedTemplate.id ? updatedTemplate : template
          )
        );
        
        // Update the individual template cache
        queryClient.setQueryData(
          templateKeys.detail(updatedTemplate.id), 
          updatedTemplate
        );
      }
    });
  };
  
  /**
   * Hook for deleting a workout template
   */
  export const useDeleteWorkoutTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: workoutService.deleteTemplate,
      onSuccess: (_, templateId) => {
        // Remove from templates list
        queryClient.setQueryData(templateKeys.lists(), (old = []) => 
          old.filter(template => template.id !== templateId)
        );
        
        // Remove the individual template cache
        queryClient.removeQueries({ queryKey: templateKeys.detail(templateId) });
      }
    });
  };
  
  /**
   * Compatibility wrapper for the old useWorkoutTemplates hook pattern
   * @returns {Object} Legacy API for templates management
   */
  export const useWorkoutTemplatesLegacy = () => {
    const { 
      data: templates = [], 
      isLoading: loading, 
      error,
      refetch
    } = useWorkoutTemplates();
    
    const createTemplateMutation = useCreateWorkoutTemplate();
    const updateTemplateMutation = useUpdateWorkoutTemplate();
    const deleteTemplateMutation = useDeleteWorkoutTemplate();
    
    return {
      templates,
      loading,
      error: error?.message || null,
      createTemplate: createTemplateMutation.mutateAsync,
      updateTemplate: (templateId, updates) => 
        updateTemplateMutation.mutateAsync({ templateId, updates }),
      deleteTemplate: deleteTemplateMutation.mutateAsync,
      refreshTemplates: refetch
    };
  };