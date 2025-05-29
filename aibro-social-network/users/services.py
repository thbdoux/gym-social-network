# users/services.py
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_verification_email(user):
    """Send verification email to user"""
    token = user.generate_verification_token()
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}&email={user.email}"
    
    context = {
        'username': user.username,
        'verification_url': verification_url,
    }
    
    html_message = render_to_string('email/verification_email.html', context)
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject="Verify Your Email Address for AiBro",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
    
    return True