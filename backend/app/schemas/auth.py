from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    READONLY = "readonly"


class SSOProvider(BaseModel):
    name: str
    auth_url: str
    token_url: str
    jwks_url: str
    client_id: str
    client_secret: str
    scope: str
    redirect_uri: str
    tenant: Optional[str] = None  # For Azure AD
    domain: Optional[str] = None  # For Okta and AWS SSO


class SSOConfig(BaseModel):
    enabled: bool
    default_provider: str
    providers: Dict[str, SSOProvider]
    session_timeout: int  # in seconds
    jwt_secret: str
    use_legacy_auth: bool  # Allow both SSO and legacy auth


class TokenPayload(BaseModel):
    sub: str
    exp: int
    iat: int
    name: str
    email: str
    role: str
    provider: str


class User(BaseModel):
    email: str
    name: str
    role: UserRole
    provider: str


class SSOLoginRequest(BaseModel):
    provider: str = "azure"  # Default to Azure AD


class SSOTokenRequest(BaseModel):
    code: str
    provider: str


class SSOTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: User


class SSOProviderInfo(BaseModel):
    id: str
    name: str


class SSOConfigResponse(BaseModel):
    enabled: bool
    default_provider: str
    providers: List[SSOProviderInfo]
    use_legacy_auth: bool
