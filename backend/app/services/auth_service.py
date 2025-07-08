import os
from typing import Dict, List, Optional, Union
import jwt
import time
import logging
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from app.schemas.auth import SSOConfig, SSOProvider, TokenPayload, User, UserRole

logger = logging.getLogger(__name__)

# OAuth2 token URL (will be used for token validation)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# SSO configuration for different providers
SSO_PROVIDERS = {
    "azure": SSOProvider(
        name="Azure AD",
        auth_url="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
        token_url="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        jwks_url="https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
        client_id=os.getenv("AZURE_CLIENT_ID", ""),
        client_secret=os.getenv("AZURE_CLIENT_SECRET", ""),
        tenant=os.getenv("AZURE_TENANT_ID", ""),
        scope="openid profile email",
        redirect_uri=os.getenv("SSO_REDIRECT_URI", "http://localhost:3000/auth/callback"),
    ),
    "okta": SSOProvider(
        name="Okta",
        auth_url="https://{domain}/oauth2/v1/authorize",
        token_url="https://{domain}/oauth2/v1/token",
        jwks_url="https://{domain}/oauth2/v1/keys",
        client_id=os.getenv("OKTA_CLIENT_ID", ""),
        client_secret=os.getenv("OKTA_CLIENT_SECRET", ""),
        domain=os.getenv("OKTA_DOMAIN", ""),
        scope="openid profile email",
        redirect_uri=os.getenv("SSO_REDIRECT_URI", "http://localhost:3000/auth/callback"),
    ),
    "aws": SSOProvider(
        name="AWS SSO",
        auth_url="https://{domain}/oauth2/authorize",
        token_url="https://{domain}/oauth2/token",
        jwks_url="https://{domain}/.well-known/jwks.json",
        client_id=os.getenv("AWS_SSO_CLIENT_ID", ""),
        client_secret=os.getenv("AWS_SSO_CLIENT_SECRET", ""),
        domain=os.getenv("AWS_SSO_DOMAIN", ""),
        scope="openid profile email",
        redirect_uri=os.getenv("SSO_REDIRECT_URI", "http://localhost:3000/auth/callback"),
    ),
}

# Environment-based SSO configuration
SSO_CONFIG = SSOConfig(
    enabled=os.getenv("SSO_ENABLED", "false").lower() == "true",
    default_provider=os.getenv("SSO_DEFAULT_PROVIDER", "azure"),
    providers=SSO_PROVIDERS,
    session_timeout=int(os.getenv("SSO_SESSION_TIMEOUT", "3600")),
    jwt_secret=os.getenv("JWT_SECRET", "your-secret-key-for-jwt"),  # Should be more secure in production
    use_legacy_auth=os.getenv("USE_LEGACY_AUTH", "true").lower() == "true",
)

# Map for role-based access control
ROLE_PERMISSIONS = {
    UserRole.ADMIN: ["read", "write", "delete", "run_policy"],
    UserRole.USER: ["read", "run_policy"],
    UserRole.READONLY: ["read"],
}

class AuthService:
    """Service for handling authentication and authorization"""

    @staticmethod
    def get_sso_config() -> SSOConfig:
        """Get the current SSO configuration"""
        return SSO_CONFIG
    
    @staticmethod
    def get_provider(provider_id: str) -> Optional[SSOProvider]:
        """Get a specific SSO provider configuration"""
        return SSO_PROVIDERS.get(provider_id)
    
    @staticmethod
    def create_sso_url(provider_id: str) -> str:
        """Create SSO authorization URL for the specified provider"""
        provider = SSO_PROVIDERS.get(provider_id)
        if not provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SSO provider {provider_id} not configured",
            )
            
        if provider_id == "azure":
            auth_url = provider.auth_url.format(tenant=provider.tenant)
        elif provider_id == "okta":
            auth_url = provider.auth_url.format(domain=provider.domain)
        elif provider_id == "aws":
            auth_url = provider.auth_url.format(domain=provider.domain)
        else:
            auth_url = provider.auth_url
            
        # Create authorization URL with required parameters
        sso_url = (
            f"{auth_url}"
            f"?client_id={provider.client_id}"
            f"&response_type=code"
            f"&redirect_uri={provider.redirect_uri}"
            f"&scope={provider.scope}"
            f"&state={provider_id}"  # Include provider ID in the state
        )
        
        return sso_url
    
    @staticmethod
    def create_jwt_token(user: User) -> str:
        """Create a JWT token for the authenticated user"""
        payload = {
            "sub": user.email,
            "exp": int(time.time()) + SSO_CONFIG.session_timeout,
            "iat": int(time.time()),
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "provider": user.provider,
        }
        
        return jwt.encode(payload, SSO_CONFIG.jwt_secret, algorithm="HS256")
    
    @staticmethod
    def validate_token(token: str = Depends(oauth2_scheme)) -> Optional[TokenPayload]:
        """Validate the JWT token and return the payload"""
        if not token:
            return None
            
        try:
            payload = jwt.decode(token, SSO_CONFIG.jwt_secret, algorithms=["HS256"])
            token_data = TokenPayload(**payload)
            
            # Check if token is expired
            if token_data.exp < time.time():
                return None
                
            return token_data
            
        except jwt.PyJWTError as e:
            logger.error(f"Token validation error: {str(e)}")
            return None
    
    @staticmethod
    def get_current_user(token_data: Optional[TokenPayload] = Depends(validate_token)) -> Optional[User]:
        """Get the current user from the token payload"""
        if not token_data:
            return None
            
        return User(
            email=token_data.email,
            name=token_data.name,
            role=UserRole(token_data.role),
            provider=token_data.provider,
        )
    
    @staticmethod
    def check_permission(user: User, required_permission: str) -> bool:
        """Check if the user has the required permission"""
        if not user:
            return False
            
        user_permissions = ROLE_PERMISSIONS.get(user.role, [])
        return required_permission in user_permissions
