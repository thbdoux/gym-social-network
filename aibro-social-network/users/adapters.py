# users/adapters.py
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.utils import timezone

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        # Mark email as verified when coming from social login
        if sociallogin.user and not sociallogin.user.id:
            sociallogin.user.email_verified = True
            # Also set the verification timestamp
            sociallogin.user.verification_token_created = timezone.now()
            
            # Set avatar from social profile if available
            if sociallogin.account.provider == 'google':
                picture_url = sociallogin.account.extra_data.get('picture')
                if picture_url:
                    sociallogin.user.profile_picture_url = picture_url
            elif sociallogin.account.provider == 'instagram':
                # Instagram data structure may be different
                if 'profile_picture' in sociallogin.account.extra_data:
                    sociallogin.user.profile_picture_url = sociallogin.account.extra_data['profile_picture']
                    
        # Let allauth handle the rest
        super().pre_social_login(request, sociallogin)