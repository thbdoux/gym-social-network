// hooks/query/useWorkoutQuery.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient 
  } from '@tanstack/react-query';
  import { workoutService } from '../../api/services';
  
  // Query keys
  export const workoutKeys = {
    all: ['workouts'],
    templates: () => [...workoutKeys.all, 'templates'],
    template: (id) => [...workoutKeys.templates(), id],
    exercises: (templateId) => [...workoutKeys.template(templateId), 'exercises'],
    exercise: (templateId, exerciseId) => [...workoutKeys.exercises(templateId), exerciseId],
  };
  
  // Get all workout templates
  export const useWorkoutTemplates = () => {
    return useQuery({
      queryKey: workoutKeys.templates(),
      queryFn: workoutService.getTemplates,
    });
  };
  
  // Get workout template by id
  export const useWorkoutTemplate = (templateId) => {
    return useQuery({
      queryKey: workoutKeys.template(templateId),
      queryFn: () => workoutService.getTemplateById(templateId),
      enabled: !!templateId,
    });
  };
  
  // Create workout template
  export const useCreateWorkoutTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: workoutService.createTemplate,
      onSuccess: (newTemplate) => {
        // Update templates list
        queryClient.setQueryData(workoutKeys.templates(), (oldData) => {
          if (!oldData) return [newTemplate];
          return [...oldData, newTemplate];
        });
        
        queryClient.invalidateQueries({ 
          queryKey: workoutKeys.template(newTemplate.id) 
        });
      },
    });
  };
  
  // Update workout template
  export const useUpdateWorkoutTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, updates }) => workoutService.updateTemplate(id, updates),
      onSuccess: (updatedTemplate) => {
        // Update template in list
        queryClient.setQueryData(workoutKeys.templates(), (oldData) => {
          if (!oldData) return [];
          return oldData.map(template => 
            template.id === updatedTemplate.id ? updatedTemplate : template
          );
        });
        
        // Update individual template cache
        queryClient.setQueryData(
          workoutKeys.template(updatedTemplate.id), 
          updatedTemplate
        );
      },
    });
  };
  
  // Delete workout template
  export const useDeleteWorkoutTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: workoutService.deleteTemplate,
      onSuccess: (_, templateId) => {
        // Remove from templates list
        queryClient.setQueryData(workoutKeys.templates(), (oldData) => {
          if (!oldData) return [];
          return oldData.filter(template => template.id !== templateId);
        });
        
        // Remove individual template cache
        queryClient.removeQueries({ queryKey: workoutKeys.template(templateId) });
      },
    });
  };
  
  // Add exercise to template
  export const useAddExerciseToTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ templateId, exercise }) => 
        workoutService.addExerciseToTemplate(templateId, exercise),
      onSuccess: (_, { templateId }) => {
        // Invalidate the template since exercise list has changed
        queryClient.invalidateQueries({ queryKey: workoutKeys.template(templateId) });
        queryClient.invalidateQueries({ queryKey: workoutKeys.exercises(templateId) });
      },
    });
  };
  
  // Update template exercise
  export const useUpdateTemplateExercise = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ templateId, exerciseId, exercise }) => 
        workoutService.updateTemplateExercise(templateId, exerciseId, exercise),
      onSuccess: (_, { templateId }) => {
        // Invalidate the template and exercises
        queryClient.invalidateQueries({ queryKey: workoutKeys.template(templateId) });
        queryClient.invalidateQueries({ queryKey: workoutKeys.exercises(templateId) });
      },
    });
  };
  
  // Delete template exercise
  export const useDeleteTemplateExercise = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ templateId, exerciseId }) => 
        workoutService.deleteTemplateExercise(templateId, exerciseId),
      onSuccess: (_, { templateId }) => {
        // Invalidate the template and exercises
        queryClient.invalidateQueries({ queryKey: workoutKeys.template(templateId) });
        queryClient.invalidateQueries({ queryKey: workoutKeys.exercises(templateId) });
      },
    });
  };
  
  // Get template exercises
  export const useTemplateExercises = (templateId) => {
    return useQuery({
      queryKey: workoutKeys.exercises(templateId),
      queryFn: () => workoutService.getTemplateExercises(templateId),
      enabled: !!templateId,
    });
  };