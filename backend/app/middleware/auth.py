from typing import List, Optional, Callable
from fastapi import Depends, HTTPException, Request, status
from app.services.auth_service import AuthService

def requires_permission(permission: str):
    """
    Dependency for enforcing permission checks on routes.
    
    Usage:
        @app.get("/protected", dependencies=[Depends(requires_permission("read"))])
        async def protected_route():
            return {"message": "You have access to this resource"}
    """
    def permission_dependency(request: Request, token_data: Optional[dict] = Depends(AuthService.validate_token)):
        # If no SSO config or token data, allow access (will be handled by AWS credential check)
        if not token_data:
            return
        
        # Get the user from the token data
        user = AuthService.get_current_user(token_data)
        
        # Check if the user has the required permission
        if not user or not AuthService.check_permission(user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this resource"
            )
    
    return permission_dependency


def requires_role(roles: List[str]):
    """
    Dependency for enforcing role checks on routes.
    
    Usage:
        @app.get("/admin", dependencies=[Depends(requires_role(["admin"]))])
        async def admin_route():
            return {"message": "Admin access granted"}
    """
    def role_dependency(request: Request, token_data: Optional[dict] = Depends(AuthService.validate_token)):
        # If no SSO config or token data, allow access (will be handled by AWS credential check)
        if not token_data:
            return
        
        # Get the user from the token data
        user = AuthService.get_current_user(token_data)
        
        # Check if the user has one of the required roles
        if not user or not user.role or user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This resource requires one of these roles: {', '.join(roles)}"
            )
    
    return role_dependency
