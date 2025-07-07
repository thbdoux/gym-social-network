# notifications/translation_service.py
from typing import Dict, Any

class NotificationTranslationService:
    """Enhanced service to translate notification content based on user language preference"""
    
    # Enhanced translation dictionary with more explicit and engaging content
    TRANSLATIONS = {
        'en': {
            # === POST INTERACTIONS ===
            # Likes
            'notifications.like.push_title': '👍 Like',
            'notifications.like.push_body': '{sender_display_name} liked your post: "{post_content}"',
            'notifications.like.title': 'Someone liked your post!',
            'notifications.like.body': '{sender_display_name} liked your post: "{post_content}"',
            'notifications.like.email_subject': '{sender_display_name} liked your post',
            'notifications.like.email_body': 'Hi! {sender_display_name} liked your post: "{post_content}". Check it out on the app!',
            
            # Comments
            'notifications.comment.push_title': '💬 Comment',
            'notifications.comment.push_body': '{sender_display_name} commented on your post: "{comment_content}"',
            'notifications.comment.title': 'New comment on your post',
            'notifications.comment.body': '{sender_display_name} commented: "{comment_content}"',
            'notifications.comment.email_subject': 'New comment from {sender_display_name}',
            'notifications.comment.email_body': '{sender_display_name} commented on your post: "{comment_content}"',
            
            # Comment replies
            'notifications.comment_reply.push_title': '↪️ Reply',
            'notifications.comment_reply.push_body': '{sender_display_name} replied to your comment: "{reply_content}"',
            'notifications.comment_reply.title': 'New reply to your comment',
            'notifications.comment_reply.body': '{sender_display_name} replied to your comment: "{reply_content}"',
            'notifications.comment_reply.email_subject': '{sender_display_name} replied to your comment',
            'notifications.comment_reply.email_body': '{sender_display_name} replied to your comment: "{reply_content}"',
            
            # Mentions
            'notifications.mention.push_title': '📣 Mention',
            'notifications.mention.push_body': '{sender_display_name} mentioned you in a comment: "{comment_content}"',
            'notifications.mention.title': 'You were mentioned!',
            'notifications.mention.body': '{sender_display_name} mentioned you in a comment: "{comment_content}"',
            'notifications.mention.email_subject': '{sender_display_name} mentioned you',
            'notifications.mention.email_body': '{sender_display_name} mentioned you in a comment: "{comment_content}"',
            
            # Post reactions
            'notifications.post_reaction.push_title': '😍 Reaction',
            'notifications.post_reaction.push_body': '{sender_display_name} reacted {reaction_emoji} to your post: "{post_content}"',
            'notifications.post_reaction.title': 'New reaction on your post',
            'notifications.post_reaction.body': '{sender_display_name} reacted {reaction_emoji} to your post',
            'notifications.post_reaction.email_subject': '{sender_display_name} reacted to your post',
            'notifications.post_reaction.email_body': '{sender_display_name} reacted {reaction_emoji} to your post: "{post_content}"',
            
            # Comment reactions
            'notifications.comment_reaction.push_title': '😊 Reaction',
            'notifications.comment_reaction.push_body': '{sender_display_name} reacted {reaction_emoji} to your comment: "{comment_content}"',
            'notifications.comment_reaction.title': 'Someone reacted to your comment',
            'notifications.comment_reaction.body': '{sender_display_name} reacted {reaction_emoji} to your comment',
            'notifications.comment_reaction.email_subject': '{sender_display_name} reacted to your comment',
            'notifications.comment_reaction.email_body': '{sender_display_name} reacted {reaction_emoji} to your comment: "{comment_content}"',
            
            # Shares
            'notifications.share.push_title': '🔄 Share',
            'notifications.share.push_body': '{sender_display_name} shared your post: "{post_content}"',
            'notifications.share.title': 'Your post was shared!',
            'notifications.share.body': '{sender_display_name} shared your post with their followers',
            'notifications.share.email_subject': '{sender_display_name} shared your post',
            'notifications.share.email_body': '{sender_display_name} shared your post: "{post_content}". This helps spread your content!',
            
            # === SOCIAL INTERACTIONS ===
            # Friend requests
            'notifications.friend_request.push_title': '👥 Friend Request',
            'notifications.friend_request.push_body': '{sender_display_name} wants to connect with you',
            'notifications.friend_request.title': 'Friend Request',
            'notifications.friend_request.body': '{sender_display_name} sent you a friend request',
            'notifications.friend_request.email_subject': 'Friend request from {sender_display_name}',
            'notifications.friend_request.email_body': '{sender_display_name} wants to be your friend on the app. Accept their request to connect!',
            
            # Friend request accepted
            'notifications.friend_accept.push_title': '🎉 Friends',
            'notifications.friend_accept.push_body': '{sender_display_name} accepted your friend request',
            'notifications.friend_accept.title': 'You\'re now friends!',
            'notifications.friend_accept.body': '{sender_display_name} is now your friend',
            'notifications.friend_accept.email_subject': '{sender_display_name} accepted your friend request',
            'notifications.friend_accept.email_body': 'Great news! {sender_display_name} accepted your friend request. You can now see each other\'s activities.',
            
            # === PROGRAM INTERACTIONS ===
            # Program forked
            'notifications.program_fork.push_title': '🍴 Program',
            'notifications.program_fork.push_body': '{sender_display_name} forked your program "{original_program_name}"',
            'notifications.program_fork.title': 'Program Forked',
            'notifications.program_fork.body': '{sender_display_name} forked your program "{original_program_name}"',
            'notifications.program_fork.email_subject': '{sender_display_name} forked your program',
            'notifications.program_fork.email_body': '{sender_display_name} found your program "{original_program_name}" helpful and created their own version!',
            
            # Program shared
            'notifications.program_shared.push_title': '📤 Program',
            'notifications.program_shared.push_body': '{sender_display_name} shared "{program_name}" with you',
            'notifications.program_shared.title': 'Program Shared',
            'notifications.program_shared.body': '{sender_display_name} shared a program with you',
            'notifications.program_shared.email_subject': '{sender_display_name} shared a program with you',
            'notifications.program_shared.email_body': '{sender_display_name} shared their program "{program_name}" with you. Check it out!',
            
            # Program liked
            'notifications.program_liked.push_title': '❤️ Program',
            'notifications.program_liked.push_body': '{sender_display_name} liked your program "{program_name}"',
            'notifications.program_liked.title': 'Program Liked',
            'notifications.program_liked.body': '{sender_display_name} liked your program "{program_name}"',
            'notifications.program_liked.email_subject': '{sender_display_name} liked your program',
            'notifications.program_liked.email_body': '{sender_display_name} liked your program "{program_name}". Keep creating great content!',
            
            # Program used
            'notifications.program_used.push_title': '🏋️ Program',
            'notifications.program_used.push_body': '{sender_display_name} used your program "{program_name}" for their workout',
            'notifications.program_used.title': 'Program Used',
            'notifications.program_used.body': '{sender_display_name} used your program "{program_name}" for their workout',
            'notifications.program_used.email_subject': '{sender_display_name} used your program',
            'notifications.program_used.email_body': '{sender_display_name} completed a workout using your program "{program_name}". Your program is making an impact!',
            
            # === WORKOUT MILESTONES ===
            # Workout milestone
            'notifications.workout_milestone.push_title': '🏆 Milestone',
            'notifications.workout_milestone.push_body': 'You\'ve completed {workout_count} workouts! Keep it up!',
            'notifications.workout_milestone.title': '🎉 Workout Milestone Reached!',
            'notifications.workout_milestone.body': 'Congratulations! You\'ve completed {workout_count} workouts. You\'re crushing your fitness goals!',
            'notifications.workout_milestone.email_subject': 'Milestone Achievement: {workout_count} Workouts!',
            'notifications.workout_milestone.email_body': 'Amazing work! You\'ve reached a major milestone by completing {workout_count} workouts. Keep up the fantastic progress!',
            
            # Streak milestone
            'notifications.streak_milestone.push_title': '🔥 Streak',
            'notifications.streak_milestone.push_body': '{streak_days} days workout streak! You\'re on fire!',
            'notifications.streak_milestone.title': 'Streak Achievement!',
            'notifications.streak_milestone.body': 'Incredible! You\'ve maintained a {streak_days}-day workout streak',
            'notifications.streak_milestone.email_subject': 'Streak Milestone: {streak_days} Days!',
            'notifications.streak_milestone.email_body': 'You\'re unstoppable! You\'ve maintained a {streak_days}-day workout streak. Consistency is key to success!',
            
            # Personal record
            'notifications.personal_record.push_title': '💪 PR',
            'notifications.personal_record.push_body': 'New personal record in {exercise_name}: {new_weight}{weight_unit}',
            'notifications.personal_record.title': 'Personal Record!',
            'notifications.personal_record.body': 'You set a new personal record in {exercise_name}: {new_weight}{weight_unit} (previous: {previous_weight}{weight_unit})',
            'notifications.personal_record.email_subject': 'New Personal Record in {exercise_name}!',
            'notifications.personal_record.email_body': 'Congratulations! You just set a new personal record in {exercise_name}: {new_weight}{weight_unit}. Previous best was {previous_weight}{weight_unit}. Keep pushing those limits!',
            
            # === GROUP WORKOUT INTERACTIONS ===
            # Workout invitation
            'notifications.workout_invitation.push_title': '🏋️‍♀️ Invitation',
            'notifications.workout_invitation.push_body': '{sender_display_name} invited you to "{workout_title}" on {scheduled_time}',
            'notifications.workout_invitation.title': 'Group Workout Invitation',
            'notifications.workout_invitation.body': '{sender_display_name} invited you to join "{workout_title}" on {scheduled_time}',
            'notifications.workout_invitation.email_subject': 'Workout invitation from {sender_display_name}',
            'notifications.workout_invitation.email_body': '{sender_display_name} invited you to join their group workout "{workout_title}" scheduled for {scheduled_time}. Join them for a great workout session!',
            
            # Someone joined workout
            'notifications.workout_join.push_title': '🎉 Workout',
            'notifications.workout_join.push_body': '{sender_display_name} joined your workout "{workout_title}"',
            'notifications.workout_join.title': 'New Participant',
            'notifications.workout_join.body': '{sender_display_name} joined your group workout "{workout_title}"',
            'notifications.workout_join.email_subject': '{sender_display_name} joined your workout',
            'notifications.workout_join.email_body': 'Great news! {sender_display_name} joined your group workout "{workout_title}". The more the merrier!',
            
            # Test notification
            'notifications.test.push_title': '🧪 Test',
            'notifications.test.push_body': 'This is a test push notification from your fitness app!',
            'notifications.test.title': 'Test Notification',
            'notifications.test.body': 'Test notification - everything is working correctly!',
            'notifications.test.email_subject': 'Test notification',
            'notifications.test.email_body': 'This is a test email notification to verify your notification settings are working correctly.',
        },
        'fr': {
            # === INTERACTIONS POSTS ===
            # Likes
            'notifications.like.push_title': '👍 J\'aime',
            'notifications.like.push_body': '{sender_display_name} a aimé votre post : "{post_content}"',
            'notifications.like.title': 'Quelqu\'un a aimé votre post !',
            'notifications.like.body': '{sender_display_name} a aimé votre post : "{post_content}"',
            'notifications.like.email_subject': '{sender_display_name} a aimé votre post',
            'notifications.like.email_body': 'Salut ! {sender_display_name} a aimé votre post : "{post_content}". Consultez l\'app !',
            
            # Commentaires
            'notifications.comment.push_title': '💬 Commentaire',
            'notifications.comment.push_body': '{sender_display_name} a commenté votre post : "{comment_content}"',
            'notifications.comment.title': 'Nouveau commentaire sur votre post',
            'notifications.comment.body': '{sender_display_name} a commenté : "{comment_content}"',
            'notifications.comment.email_subject': 'Nouveau commentaire de {sender_display_name}',
            'notifications.comment.email_body': '{sender_display_name} a commenté votre post : "{comment_content}"',
            
            # Réponses aux commentaires
            'notifications.comment_reply.push_title': '↪️ Réponse',
            'notifications.comment_reply.push_body': '{sender_display_name} a répondu à votre commentaire : "{reply_content}"',
            'notifications.comment_reply.title': 'Nouvelle réponse à votre commentaire',
            'notifications.comment_reply.body': '{sender_display_name} a répondu à votre commentaire : "{reply_content}"',
            'notifications.comment_reply.email_subject': '{sender_display_name} a répondu à votre commentaire',
            'notifications.comment_reply.email_body': '{sender_display_name} a répondu à votre commentaire : "{reply_content}"',
            
            # Mentions
            'notifications.mention.push_title': '📣 Mention',
            'notifications.mention.push_body': '{sender_display_name} vous a mentionné dans un commentaire : "{comment_content}"',
            'notifications.mention.title': 'Vous avez été mentionné !',
            'notifications.mention.body': '{sender_display_name} vous a mentionné dans un commentaire : "{comment_content}"',
            'notifications.mention.email_subject': '{sender_display_name} vous a mentionné',
            'notifications.mention.email_body': '{sender_display_name} vous a mentionné dans un commentaire : "{comment_content}"',
            
            # Réactions aux posts
            'notifications.post_reaction.push_title': '😍 Réaction',
            'notifications.post_reaction.push_body': '{sender_display_name} a réagi {reaction_emoji} à votre post : "{post_content}"',
            'notifications.post_reaction.title': 'Nouvelle réaction sur votre post',
            'notifications.post_reaction.body': '{sender_display_name} a réagi {reaction_emoji} à votre post',
            'notifications.post_reaction.email_subject': '{sender_display_name} a réagi à votre post',
            'notifications.post_reaction.email_body': '{sender_display_name} a réagi {reaction_emoji} à votre post : "{post_content}"',
            
            # Réactions aux commentaires
            'notifications.comment_reaction.push_title': '😊 Réaction',
            'notifications.comment_reaction.push_body': '{sender_display_name} a réagi {reaction_emoji} à votre commentaire : "{comment_content}"',
            'notifications.comment_reaction.title': 'Quelqu\'un a réagi à votre commentaire',
            'notifications.comment_reaction.body': '{sender_display_name} a réagi {reaction_emoji} à votre commentaire',
            'notifications.comment_reaction.email_subject': '{sender_display_name} a réagi à votre commentaire',
            'notifications.comment_reaction.email_body': '{sender_display_name} a réagi {reaction_emoji} à votre commentaire : "{comment_content}"',
            
            # Partages
            'notifications.share.push_title': '🔄 Partage',
            'notifications.share.push_body': '{sender_display_name} a partagé votre post : "{post_content}"',
            'notifications.share.title': 'Votre post a été partagé !',
            'notifications.share.body': '{sender_display_name} a partagé votre post avec ses abonnés',
            'notifications.share.email_subject': '{sender_display_name} a partagé votre post',
            'notifications.share.email_body': '{sender_display_name} a partagé votre post : "{post_content}". Cela aide à diffuser votre contenu !',
            
            # === INTERACTIONS SOCIALES ===
            # Demandes d'ami
            'notifications.friend_request.push_title': '👥 Demande d\'ami',
            'notifications.friend_request.push_body': '{sender_display_name} veut se connecter avec vous',
            'notifications.friend_request.title': 'Demande d\'ami',
            'notifications.friend_request.body': '{sender_display_name} vous a envoyé une demande d\'ami',
            'notifications.friend_request.email_subject': 'Demande d\'ami de {sender_display_name}',
            'notifications.friend_request.email_body': '{sender_display_name} veut être votre ami sur l\'app. Acceptez sa demande pour vous connecter !',
            
            # Demande d'ami acceptée
            'notifications.friend_accept.push_title': '🎉 Amis',
            'notifications.friend_accept.push_body': '{sender_display_name} a accepté votre demande d\'ami',
            'notifications.friend_accept.title': 'Vous êtes maintenant amis !',
            'notifications.friend_accept.body': '{sender_display_name} est maintenant votre ami',
            'notifications.friend_accept.email_subject': '{sender_display_name} a accepté votre demande d\'ami',
            'notifications.friend_accept.email_body': 'Excellente nouvelle ! {sender_display_name} a accepté votre demande d\'ami. Vous pouvez maintenant voir vos activités respectives.',
            
            # === INTERACTIONS PROGRAMMES ===
            # Programme bifurqué
            'notifications.program_fork.push_title': '🍴 Programme',
            'notifications.program_fork.push_body': '{sender_display_name} a bifurqué votre programme "{original_program_name}"',
            'notifications.program_fork.title': 'Programme bifurqué',
            'notifications.program_fork.body': '{sender_display_name} a bifurqué votre programme "{original_program_name}"',
            'notifications.program_fork.email_subject': '{sender_display_name} a bifurqué votre programme',
            'notifications.program_fork.email_body': '{sender_display_name} a trouvé votre programme "{original_program_name}" utile et a créé sa propre version !',
            
            # Programme partagé
            'notifications.program_shared.push_title': '📤 Programme',
            'notifications.program_shared.push_body': '{sender_display_name} a partagé "{program_name}" avec vous',
            'notifications.program_shared.title': 'Programme partagé',
            'notifications.program_shared.body': '{sender_display_name} a partagé un programme avec vous',
            'notifications.program_shared.email_subject': '{sender_display_name} a partagé un programme avec vous',
            'notifications.program_shared.email_body': '{sender_display_name} a partagé son programme "{program_name}" avec vous. Découvrez-le !',
            
            # Programme aimé
            'notifications.program_liked.push_title': '❤️ Programme',
            'notifications.program_liked.push_body': '{sender_display_name} a aimé votre programme "{program_name}"',
            'notifications.program_liked.title': 'Programme aimé',
            'notifications.program_liked.body': '{sender_display_name} a aimé votre programme "{program_name}"',
            'notifications.program_liked.email_subject': '{sender_display_name} a aimé votre programme',
            'notifications.program_liked.email_body': '{sender_display_name} a aimé votre programme "{program_name}". Continuez à créer du super contenu !',
            
            # Programme utilisé
            'notifications.program_used.push_title': '🏋️ Programme',
            'notifications.program_used.push_body': '{sender_display_name} a utilisé votre programme "{program_name}" pour son entraînement',
            'notifications.program_used.title': 'Programme utilisé',
            'notifications.program_used.body': '{sender_display_name} a utilisé votre programme "{program_name}" pour son entraînement',
            'notifications.program_used.email_subject': '{sender_display_name} a utilisé votre programme',
            'notifications.program_used.email_body': '{sender_display_name} a terminé un entraînement en utilisant votre programme "{program_name}". Votre programme fait la différence !',
            
            # === OBJECTIFS D'ENTRAÎNEMENT ===
            # Objectif d'entraînement
            'notifications.workout_milestone.push_title': '🏆 Objectif',
            'notifications.workout_milestone.push_body': 'Vous avez terminé {workout_count} entraînements ! Continuez !',
            'notifications.workout_milestone.title': '🎉 Objectif d\'entraînement atteint !',
            'notifications.workout_milestone.body': 'Félicitations ! Vous avez terminé {workout_count} entraînements. Vous écrasez vos objectifs fitness !',
            'notifications.workout_milestone.email_subject': 'Objectif atteint : {workout_count} entraînements !',
            'notifications.workout_milestone.email_body': 'Travail fantastique ! Vous avez atteint un objectif majeur en terminant {workout_count} entraînements. Continuez ces progrès formidables !',
            
            # Objectif de série
            'notifications.streak_milestone.push_title': '🔥 Série',
            'notifications.streak_milestone.push_body': '{streak_days} jours d\'entraînement consécutifs ! Vous êtes en feu !',
            'notifications.streak_milestone.title': 'Objectif de série atteint !',
            'notifications.streak_milestone.body': 'Incroyable ! Vous avez maintenu une série de {streak_days} jours d\'entraînement',
            'notifications.streak_milestone.email_subject': 'Objectif de série : {streak_days} jours !',
            'notifications.streak_milestone.email_body': 'Vous êtes inarrêtable ! Vous avez maintenu une série de {streak_days} jours d\'entraînement. La constance est la clé du succès !',
            
            # Record personnel
            'notifications.personal_record.push_title': '💪 Record',
            'notifications.personal_record.push_body': 'Nouveau record personnel en {exercise_name} : {new_weight}{weight_unit}',
            'notifications.personal_record.title': 'Record personnel !',
            'notifications.personal_record.body': 'Vous avez établi un nouveau record personnel en {exercise_name} : {new_weight}{weight_unit} (précédent : {previous_weight}{weight_unit})',
            'notifications.personal_record.email_subject': 'Nouveau record personnel en {exercise_name} !',
            'notifications.personal_record.email_body': 'Félicitations ! Vous venez d\'établir un nouveau record personnel en {exercise_name} : {new_weight}{weight_unit}. Le précédent était {previous_weight}{weight_unit}. Continuez à repousser vos limites !',
            
            # === INTERACTIONS ENTRAÎNEMENTS DE GROUPE ===
            # Invitation d'entraînement
            'notifications.workout_invitation.push_title': '🏋️‍♀️ Invitation',
            'notifications.workout_invitation.push_body': '{sender_display_name} vous a invité à "{workout_title}" le {scheduled_time}',
            'notifications.workout_invitation.title': 'Invitation d\'entraînement de groupe',
            'notifications.workout_invitation.body': '{sender_display_name} vous a invité à rejoindre "{workout_title}" le {scheduled_time}',
            'notifications.workout_invitation.email_subject': 'Invitation d\'entraînement de {sender_display_name}',
            'notifications.workout_invitation.email_body': '{sender_display_name} vous a invité à rejoindre son entraînement de groupe "{workout_title}" prévu pour {scheduled_time}. Rejoignez-les pour une super session !',
            
            # Quelqu'un a rejoint l'entraînement
            'notifications.workout_join.push_title': '🎉 Entraînement',
            'notifications.workout_join.push_body': '{sender_display_name} a rejoint votre entraînement "{workout_title}"',
            'notifications.workout_join.title': 'Nouveau participant',
            'notifications.workout_join.body': '{sender_display_name} a rejoint votre entraînement de groupe "{workout_title}"',
            'notifications.workout_join.email_subject': '{sender_display_name} a rejoint votre entraînement',
            'notifications.workout_join.email_body': 'Excellente nouvelle ! {sender_display_name} a rejoint votre entraînement de groupe "{workout_title}". Plus on est de fous, plus on rit !',
            
            # Demande de participation à l'entraînement
            'notifications.workout_join_request.push_title': '🙋‍♂️ Demande',
            'notifications.workout_join_request.push_body': '{sender_display_name} veut rejoindre "{workout_title}"',
            'notifications.workout_join_request.title': 'Demande de participation',
            'notifications.workout_join_request.body': '{sender_display_name} a demandé à rejoindre votre entraînement de groupe "{workout_title}"',
            'notifications.workout_join_request.email_subject': 'Demande de participation à votre entraînement',
            'notifications.workout_join_request.email_body': '{sender_display_name} a demandé à rejoindre votre entraînement de groupe "{workout_title}". Examinez sa demande dans l\'app.',
            
            # Demande d'entraînement approuvée
            'notifications.workout_request_approved.push_title': '✅ Accepté',
            'notifications.workout_request_approved.push_body': 'Vous pouvez maintenant rejoindre "{workout_title}"',
            'notifications.workout_request_approved.title': 'Demande de participation approuvée',
            'notifications.workout_request_approved.body': 'Votre demande pour rejoindre "{workout_title}" a été approuvée !',
            'notifications.workout_request_approved.email_subject': 'Demande d\'entraînement approuvée !',
            'notifications.workout_request_approved.email_body': 'Bonne nouvelle ! Votre demande pour rejoindre "{workout_title}" a été approuvée. À bientôt à l\'entraînement !',
            
            # Demande d'entraînement rejetée
            'notifications.workout_request_rejected.push_title': '❌ Refusé',
            'notifications.workout_request_rejected.push_body': 'Votre demande pour rejoindre "{workout_title}" a été refusée',
            'notifications.workout_request_rejected.title': 'Demande de participation refusée',
            'notifications.workout_request_rejected.body': 'Votre demande pour rejoindre "{workout_title}" a été refusée',
            'notifications.workout_request_rejected.email_subject': 'Demande d\'entraînement refusée',
            'notifications.workout_request_rejected.email_body': 'Malheureusement, votre demande pour rejoindre "{workout_title}" a été refusée. Ne vous inquiétez pas, il y a plein d\'autres opportunités d\'entraînement !',
            
            # Entraînement annulé
            'notifications.workout_cancelled.push_title': '⚠️ Annulé',
            'notifications.workout_cancelled.push_body': '"{workout_title}" a été annulé',
            'notifications.workout_cancelled.title': 'Entraînement annulé',
            'notifications.workout_cancelled.body': 'L\'entraînement de groupe "{workout_title}" a été annulé',
            'notifications.workout_cancelled.email_subject': 'Entraînement annulé : {workout_title}',
            'notifications.workout_cancelled.email_body': 'Malheureusement, l\'entraînement de groupe "{workout_title}" a été annulé. Consultez l\'app pour d\'autres opportunités d\'entraînement.',
            
            # Entraînement terminé
            'notifications.workout_completed.push_title': '🏁 Terminé',
            'notifications.workout_completed.push_body': '"{workout_title}" est maintenant terminé',
            'notifications.workout_completed.title': 'Entraînement de groupe terminé',
            'notifications.workout_completed.body': 'L\'entraînement de groupe "{workout_title}" a été marqué comme terminé',
            'notifications.workout_completed.email_subject': 'Entraînement terminé : {workout_title}',
            'notifications.workout_completed.email_body': 'Excellent travail ! L\'entraînement de groupe "{workout_title}" est terminé. Consultez votre journal d\'entraînement pour les détails.',
            
            # Rappel d'entraînement
            'notifications.workout_reminder.push_title': '⏰ Rappel',
            'notifications.workout_reminder.push_body': '"{workout_title}" commence dans 1 heure à {gym_name}',
            'notifications.workout_reminder.title': 'Rappel d\'entraînement',
            'notifications.workout_reminder.body': 'N\'oubliez pas ! "{workout_title}" commence dans 1 heure à {gym_name}',
            'notifications.workout_reminder.email_subject': 'Rappel d\'entraînement : {workout_title}',
            'notifications.workout_reminder.email_body': 'Petit rappel amical que "{workout_title}" commence dans 1 heure à {gym_name}. À bientôt !',
            
            # === MESSAGES D'ENTRAÎNEMENTS DE GROUPE ===
            'notifications.group_workout_message.push_title': '💬 Message',
            'notifications.group_workout_message.push_body': '{sender_display_name} a envoyé un message dans le chat "{workout_title}" : "{message_preview}"',
            'notifications.group_workout_message.title': 'Nouveau message d\'entraînement',
            'notifications.group_workout_message.body': '{sender_display_name} a envoyé un message dans le chat "{workout_title}"',
            'notifications.group_workout_message.email_subject': 'Nouveau message dans {workout_title}',
            'notifications.group_workout_message.email_body': '{sender_display_name} a envoyé un message dans le chat "{workout_title}" : "{message_preview}"',
            
            # === PROPOSITIONS ET VOTES D'ENTRAÎNEMENT ===
            'notifications.workout_proposal_submitted.push_title': '📝 Proposition',
            'notifications.workout_proposal_submitted.push_body': '{sender_display_name} a proposé "{template_name}" pour "{workout_title}"',
            'notifications.workout_proposal_submitted.title': 'Proposition d\'entraînement',
            'notifications.workout_proposal_submitted.body': '{sender_display_name} a proposé un modèle d\'entraînement pour "{workout_title}"',
            'notifications.workout_proposal_submitted.email_subject': 'Nouvelle proposition d\'entraînement pour {workout_title}',
            'notifications.workout_proposal_submitted.email_body': '{sender_display_name} a proposé le modèle d\'entraînement "{template_name}" pour votre entraînement de groupe "{workout_title}". Examinez et votez !',
            
            'notifications.workout_proposal_voted.push_title': '🗳️ Vote',
            'notifications.workout_proposal_voted.push_body': '{sender_display_name} a voté pour votre proposition "{template_name}"',
            'notifications.workout_proposal_voted.title': 'Vote sur votre proposition',
            'notifications.workout_proposal_voted.body': '{sender_display_name} a voté pour votre proposition d\'entraînement',
            'notifications.workout_proposal_voted.email_subject': 'Vote sur votre proposition d\'entraînement',
            'notifications.workout_proposal_voted.email_body': '{sender_display_name} a voté pour votre proposition d\'entraînement "{template_name}" pour "{workout_title}".',
            
            'notifications.workout_proposal_selected.push_title': '🏆 Sélectionné',
            'notifications.workout_proposal_selected.push_body': '"{template_name}" sera utilisé pour "{workout_title}"',
            'notifications.workout_proposal_selected.title': 'Proposition sélectionnée',
            'notifications.workout_proposal_selected.body': 'Votre proposition d\'entraînement "{template_name}" a été sélectionnée pour "{workout_title}"',
            'notifications.workout_proposal_selected.email_subject': 'Votre proposition d\'entraînement a été sélectionnée !',
            'notifications.workout_proposal_selected.email_body': 'Félicitations ! Votre proposition d\'entraînement "{template_name}" a été sélectionnée pour l\'entraînement de groupe "{workout_title}". Excellent choix !',
            
            # === PARTENAIRES D'ENTRAÎNEMENT ===
            'notifications.workout_partner_added.push_title': '🤝 Partenaire',
            'notifications.workout_partner_added.push_body': '{sender_display_name} vous a ajouté comme partenaire d\'entraînement pour "{workout_name}"',
            'notifications.workout_partner_added.title': 'Partenaire d\'entraînement',
            'notifications.workout_partner_added.body': '{sender_display_name} vous a ajouté comme partenaire d\'entraînement pour "{workout_name}"',
            'notifications.workout_partner_added.email_subject': 'Ajouté comme partenaire d\'entraînement',
            'notifications.workout_partner_added.email_body': '{sender_display_name} vous a ajouté comme partenaire d\'entraînement pour son entraînement "{workout_name}" le {workout_date}.',
            
            'notifications.workout_partner_request.push_title': '🤝 Demande',
            'notifications.workout_partner_request.push_body': '{sender_display_name} veut être votre partenaire d\'entraînement',
            'notifications.workout_partner_request.title': 'Demande de partenariat',
            'notifications.workout_partner_request.body': '{sender_display_name} vous a envoyé une demande de partenariat d\'entraînement',
            'notifications.workout_partner_request.email_subject': 'Demande de partenariat d\'entraînement de {sender_display_name}',
            'notifications.workout_partner_request.email_body': '{sender_display_name} veut être votre partenaire d\'entraînement. Avoir un partenaire peut être une excellente motivation !',
            
            # === INTERACTIONS MODÈLES ===
            'notifications.template_used.push_title': '📋 Modèle',
            'notifications.template_used.push_body': '{sender_display_name} a utilisé votre modèle "{template_name}" pour son entraînement "{workout_name}"',
            'notifications.template_used.title': 'Modèle utilisé',
            'notifications.template_used.body': '{sender_display_name} a utilisé votre modèle d\'entraînement pour son entraînement',
            'notifications.template_used.email_subject': '{sender_display_name} a utilisé votre modèle',
            'notifications.template_used.email_body': '{sender_display_name} a utilisé votre modèle d\'entraînement "{template_name}" pour son entraînement "{workout_name}". Votre modèle aide les autres !',
            
            'notifications.template_forked.push_title': '🍴 Modèle',
            'notifications.template_forked.push_body': '{sender_display_name} a bifurqué votre modèle "{template_name}"',
            'notifications.template_forked.title': 'Modèle bifurqué',
            'notifications.template_forked.body': '{sender_display_name} a bifurqué votre modèle d\'entraînement',
            'notifications.template_forked.email_subject': '{sender_display_name} a bifurqué votre modèle',
            'notifications.template_forked.email_body': '{sender_display_name} a trouvé votre modèle "{template_name}" si utile qu\'il a créé sa propre version !',
            
            # === OBJECTIFS ET RÉUSSITES ===
            'notifications.goal_achieved.push_title': '🎯 Objectif',
            'notifications.goal_achieved.push_body': 'Vous avez atteint votre objectif : {goal_name}',
            'notifications.goal_achieved.title': 'Objectif accompli !',
            'notifications.goal_achieved.body': 'Félicitations ! Vous avez atteint votre objectif : {goal_name}',
            'notifications.goal_achieved.email_subject': 'Objectif atteint : {goal_name}',
            'notifications.goal_achieved.email_body': 'Travail fantastique ! Vous avez réussi à atteindre votre objectif : {goal_name}. Il est temps de vous fixer un nouveau défi !',
            
            # === NOTIFICATIONS SYSTÈME ===
            'notifications.gym_announcement.push_title': '📢 Annonce',
            'notifications.gym_announcement.push_body': 'Nouvelle annonce de {gym_name} : {announcement_content}',
            'notifications.gym_announcement.title': 'Mise à jour de la salle',
            'notifications.gym_announcement.body': 'Nouvelle annonce de {gym_name} : {announcement_content}',
            'notifications.gym_announcement.email_subject': 'Annonce de {gym_name}',
            'notifications.gym_announcement.email_body': 'Votre salle {gym_name} a une nouvelle annonce : {announcement_content}',
            
            'notifications.system_update.push_title': '🔄 Mise à jour',
            'notifications.system_update.push_body': 'Nouvelles fonctionnalités disponibles : {update_description}',
            'notifications.system_update.title': 'Mise à jour système',
            'notifications.system_update.body': 'De nouvelles fonctionnalités de l\'app sont disponibles : {update_description}',
            'notifications.system_update.email_subject': 'Mise à jour de l\'app disponible',
            'notifications.system_update.email_body': 'Excellente nouvelle ! Une nouvelle mise à jour de l\'app est disponible avec des fonctionnalités passionnantes : {update_description}',
            
            # Test notification
            'notifications.test.push_title': '🧪 Test',
            'notifications.test.push_body': 'Ceci est une notification push de test de votre app fitness !',
            'notifications.test.title': 'Notification de test',
            'notifications.test.body': 'Notification de test - tout fonctionne correctement !',
            'notifications.test.email_subject': 'Notification de test',
            'notifications.test.email_body': 'Ceci est un email de test pour vérifier que vos paramètres de notification fonctionnent correctement.',
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