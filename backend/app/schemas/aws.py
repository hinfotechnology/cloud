from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class AWSCredentials(BaseModel):
    """Schema for AWS credentials"""
    access_key: str = Field(..., description="AWS Access Key ID")
    secret_key: str = Field(..., description="AWS Secret Access Key")
    region: str = Field(default="us-east-1", description="AWS Region")
    session_token: Optional[str] = Field(None, description="AWS Session Token (for temporary credentials)")

class ResourceSummary(BaseModel):
    """Schema for AWS resource summary"""
    service: str
    count: int
    resource_type: str
    details: Optional[Dict[str, Any]] = None
