# notifications/translation_service.py
from typing import Dict, Any

class NotificationTranslationService:
    """Service to translate notification content based on user language preference"""
    
    # Translation dictionary - you can load this from a file or database
    TRANSLATIONS = {
        'en': {
            # Comment notifications
            'notifications.comment.push_title': '{sender_display_name} commented',
            'notifications.comment.push_body': '"{comment_content}" on "{post_content}"',
            'notifications.comment.title': 'New Comment',
            'notifications.comment.body': '{sender_display_name} commented on your post',
            
            # Like notifications
            'notifications.like.push_title': '{sender_display_name} liked your post',
            'notifications.like.push_body': '"{post_content}"',
            'notifications.like.title': 'New Like',
            'notifications.like.body': '{sender_display_name} liked your post',
            
            # Share notifications
            'notifications.share.push_title': '{sender_display_name} shared your post',
            'notifications.share.push_body': '"{post_content}"',
            'notifications.share.title': 'Post Shared',
            'notifications.share.body': '{sender_display_name} shared your post',
            
            # Friend requests
            'notifications.friend_request.push_title': 'New friend request',
            'notifications.friend_request.push_body': '{sender_display_name} wants to be your friend',
            'notifications.friend_request.title': 'Friend Request',
            'notifications.friend_request.body': '{sender_display_name} sent you a friend request',
            
            'notifications.friend_accept.push_title': 'Friend request accepted',
            'notifications.friend_accept.push_body': '{sender_display_name} accepted your friend request',
            'notifications.friend_accept.title': 'Friend Request Accepted',
            'notifications.friend_accept.body': '{sender_display_name} is now your friend',
            
            # Workout notifications
            'notifications.workout_milestone.push_title': 'Workout milestone achieved!',
            'notifications.workout_milestone.push_body': 'You\'ve completed {workout_count} workouts!',
            'notifications.workout_milestone.title': 'Milestone Achieved',
            'notifications.workout_milestone.body': 'Congratulations on reaching {workout_count} workouts!',
            
            'notifications.workout_invitation.push_title': 'Workout invitation',
            'notifications.workout_invitation.push_body': '{sender_display_name} invited you to "{workout_title}"',
            'notifications.workout_invitation.title': 'Workout Invitation',
            'notifications.workout_invitation.body': 'You have been invited to join a workout',
            
            'notifications.workout_join.push_title': 'Someone joined your workout',
            'notifications.workout_join.push_body': '{sender_display_name} joined "{workout_title}"',
            'notifications.workout_join.title': 'Workout Joined',
            'notifications.workout_join.body': '{sender_display_name} joined your workout',
            
            # Program notifications
            'notifications.program_fork.push_title': 'Program forked',
            'notifications.program_fork.push_body': '{sender_display_name} forked "{original_program_name}"',
            'notifications.program_fork.title': 'Program Forked',
            'notifications.program_fork.body': '{sender_display_name} forked your program',
            
            'notifications.program_used.push_title': 'Program used',
            'notifications.program_used.push_body': '{sender_display_name} used your program "{program_name}"',
            'notifications.program_used.title': 'Program Used',
            'notifications.program_used.body': 'Someone used your program',
            
            # Test notification
            'notifications.test.push_title': 'Test Notification',
            'notifications.test.push_body': 'This is a test push notification!',
            'notifications.test.title': 'Test',
            'notifications.test.body': 'Test notification from your app',
        },
        'fr': {
            # Comment notifications in French
            'notifications.comment.push_title': '{sender_display_name} a commenté',
            'notifications.comment.push_body': '"{comment_content}" sur "{post_content}"',
            'notifications.comment.title': 'Nouveau commentaire',
            'notifications.comment.body': '{sender_display_name} a commenté votre publication',
            
            # Like notifications in French
            'notifications.like.push_title': '{sender_display_name} a aimé votre publication',
            'notifications.like.push_body': '"{post_content}"',
            'notifications.like.title': 'Nouveau like',
            'notifications.like.body': '{sender_display_name} a aimé votre publication',
            
            # Share notifications in French
            'notifications.share.push_title': '{sender_display_name} a partagé votre publication',
            'notifications.share.push_body': '"{post_content}"',
            'notifications.share.title': 'Publication partagée',
            'notifications.share.body': '{sender_display_name} a partagé votre publication',
            
            # Friend requests in French
            'notifications.friend_request.push_title': 'Nouvelle demande d\'ami',
            'notifications.friend_request.push_body': '{sender_display_name} veut être votre ami',
            'notifications.friend_request.title': 'Demande d\'ami',
            'notifications.friend_request.body': '{sender_display_name} vous a envoyé une demande d\'ami',
            
            'notifications.friend_accept.push_title': 'Demande d\'ami acceptée',
            'notifications.friend_accept.push_body': '{sender_display_name} a accepté votre demande',
            'notifications.friend_accept.title': 'Demande acceptée',
            'notifications.friend_accept.body': '{sender_display_name} est maintenant votre ami',
            
            # Workout notifications in French
            'notifications.workout_milestone.push_title': 'Objectif d\'entraînement atteint !',
            'notifications.workout_milestone.push_body': 'Vous avez terminé {workout_count} entraînements !',
            'notifications.workout_milestone.title': 'Objectif atteint',
            'notifications.workout_milestone.body': 'Félicitations pour avoir atteint {workout_count} entraînements !',
            
            'notifications.workout_invitation.push_title': 'Invitation d\'entraînement',
            'notifications.workout_invitation.push_body': '{sender_display_name} vous a invité à "{workout_title}"',
            'notifications.workout_invitation.title': 'Invitation d\'entraînement',
            'notifications.workout_invitation.body': 'Vous avez été invité à rejoindre un entraînement',
            
            'notifications.workout_join.push_title': 'Quelqu\'un a rejoint votre entraînement',
            'notifications.workout_join.push_body': '{sender_display_name} a rejoint "{workout_title}"',
            'notifications.workout_join.title': 'Entraînement rejoint',
            'notifications.workout_join.body': '{sender_display_name} a rejoint votre entraînement',
            
            # Program notifications in French
            'notifications.program_fork.push_title': 'Programme bifurqué',
            'notifications.program_fork.push_body': '{sender_display_name} a bifurqué "{original_program_name}"',
            'notifications.program_fork.title': 'Programme bifurqué',
            'notifications.program_fork.body': '{sender_display_name} a bifurqué votre programme',
            
            'notifications.program_used.push_title': 'Programme utilisé',
            'notifications.program_used.push_body': '{sender_display_name} a utilisé votre programme "{program_name}"',
            'notifications.program_used.title': 'Programme utilisé',
            'notifications.program_used.body': 'Quelqu\'un a utilisé votre programme',
            
            # Test notification in French
            'notifications.test.push_title': 'Notification de test',
            'notifications.test.push_body': 'Ceci est une notification push de test !',
            'notifications.test.title': 'Test',
            'notifications.test.body': 'Notification de test de votre application',
        },
    }
    
    @classmethod
    def translate(cls, key: str, language: str = 'en', params: Dict[str, Any] = None) -> str:
        """
        Translate a notification key to the specified language
        
        Args:
            key: Translation key (e.g., 'notifications.comment.push_title')
            language: Language code (e.g., 'en', 'fr', 'es')
            params: Parameters for string interpolation
            
        Returns:
            Translated and interpolated string
        """
        if params is None:
            params = {}
        
        # Get language translations, fallback to English
        lang_translations = cls.TRANSLATIONS.get(language, cls.TRANSLATIONS['en'])
        
        # Get the translation, fallback to English if not found
        translation = lang_translations.get(key)
        if translation is None:
            translation = cls.TRANSLATIONS['en'].get(key, key)
        
        # Format the string with parameters
        try:
            return translation.format(**params)
        except (KeyError, ValueError) as e:
            # If formatting fails, return the unformatted string
            print(f"Translation formatting error for key '{key}': {e}")
            return translation
    
    @classmethod
    def get_user_language(cls, user) -> str:
        """Get user's preferred language, with fallback to English"""
        return getattr(user, 'language_preference', 'en') or 'en'
    
    @classmethod
    def translate_notification(cls, user, title_key: str, body_key: str, params: Dict[str, Any] = None) -> Dict[str, str]:
        """
        Translate notification title and body for a specific user
        
        Args:
            user: User object with language_preference
            title_key: Translation key for title
            body_key: Translation key for body  
            params: Parameters for translation
            
        Returns:
            Dictionary with translated 'title' and 'body'
        """
        language = cls.get_user_language(user)
        
        return {
            'title': cls.translate(title_key, language, params),
            'body': cls.translate(body_key, language, params)
        }

# Create a singleton instance
translation_service = NotificationTranslationService()