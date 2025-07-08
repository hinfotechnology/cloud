from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
import requests
import json
import logging
from app.schemas.auth import (
    SSOConfigResponse, 
    SSOLoginRequest, 
    SSOProviderInfo, 
    SSOTokenRequest, 
    SSOTokenResponse, 
    User, 
    UserRole
)
from app.services.auth_service import AuthService, SSO_CONFIG

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

@router.get("/config", response_model=SSOConfigResponse)
async def get_sso_config():
    """Get SSO configuration for the frontend"""
    sso_config = AuthService.get_sso_config()
    
    providers = []
    for provider_id, provider in sso_config.providers.items():
        providers.append(SSOProviderInfo(
            id=provider_id,
            name=provider.name
        ))
    
    return SSOConfigResponse(
        enabled=sso_config.enabled,
        default_provider=sso_config.default_provider,
        providers=providers,
        use_legacy_auth=sso_config.use_legacy_auth
    )

@router.post("/login", response_model=dict)
async def login_sso(request: SSOLoginRequest):
    """Generate SSO login URL"""
    if not SSO_CONFIG.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SSO is not enabled"
        )
    
    try:
        sso_url = AuthService.create_sso_url(request.provider)
        return {"login_url": sso_url}
    except Exception as e:
        logger.error(f"Error creating SSO URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create SSO login URL: {str(e)}"
        )

@router.post("/token", response_model=SSOTokenResponse)
async def exchange_token(request: SSOTokenRequest):
    """Exchange authorization code for token"""
    if not SSO_CONFIG.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SSO is not enabled"
        )
    
    provider = AuthService.get_provider(request.provider)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown SSO provider: {request.provider}"
        )
    
    # Prepare token exchange payload
    if request.provider == "azure":
        token_url = provider.token_url.format(tenant=provider.tenant)
    elif request.provider in ["okta", "aws"]:
        token_url = provider.token_url.format(domain=provider.domain)
    else:
        token_url = provider.token_url
    
    payload = {
        "grant_type": "authorization_code",
        "client_id": provider.client_id,
        "client_secret": provider.client_secret,
        "code": request.code,
        "redirect_uri": provider.redirect_uri,
        "scope": provider.scope
    }
    
    try:
        # Exchange code for token
        response = requests.post(token_url, data=payload)
        response.raise_for_status()
        token_data = response.json()
        
        # Get user info from ID token or user info endpoint
        user_info = {}
        
        if "id_token" in token_data:
            # Parse ID token without validation (just to extract claims)
            id_token = token_data["id_token"]
            # Get payload part (second part of the JWT)
            payload = id_token.split('.')[1]
            # Add padding if needed
            payload += '=' * (-len(payload) % 4)
            import base64
            user_info = json.loads(base64.b64decode(payload).decode('utf-8'))
        else:
            # Use access token to fetch user info
            access_token = token_data["access_token"]
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # User info endpoint varies by provider
            if request.provider == "azure":
                user_info_url = f"https://graph.microsoft.com/v1.0/me"
            elif request.provider == "okta":
                user_info_url = f"https://{provider.domain}/oauth2/v1/userinfo"
            elif request.provider == "aws":
                user_info_url = f"https://{provider.domain}/oauth2/userInfo"
            else:
                raise ValueError(f"Unknown provider: {request.provider}")
                
            user_resp = requests.get(user_info_url, headers=headers)
            user_resp.raise_for_status()
            user_info = user_resp.json()
        
        # Extract user information (field names vary by provider)
        email = user_info.get("email") or user_info.get("mail") or ""
        name = user_info.get("name") or user_info.get("displayName") or email
        
        # For demonstration - in production, you would look up roles from your database
        # Here we're defaulting to USER role
        role = UserRole.USER
        
        # Create user object
        user = User(
            email=email,
            name=name,
            role=role,
            provider=request.provider
        )
        
        # Generate JWT token for the user
        jwt_token = AuthService.create_jwt_token(user)
        
        return SSOTokenResponse(
            access_token=jwt_token,
            token_type="bearer",
            expires_in=SSO_CONFIG.session_timeout,
            user=user
        )
    
    except requests.RequestException as e:
        logger.error(f"Token exchange error: {str(e)}")
        if hasattr(e, "response") and e.response:
            try:
                error_detail = e.response.json()
                logger.error(f"Provider error response: {error_detail}")
            except:
                error_detail = e.response.text
        else:
            error_detail = str(e)
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SSO authentication failed: {error_detail}"
        )
    except Exception as e:
        logger.error(f"SSO error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SSO authentication error: {str(e)}"
        )

@router.get("/me", response_model=Optional[User])
async def get_current_user(user: Optional[User] = Depends(AuthService.get_current_user)):
    """Get the currently authenticated user"""
    if not user:
        return None
    return user
