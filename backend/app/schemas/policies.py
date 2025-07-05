from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class Policy(BaseModel):
    """Schema for Cloud Custodian policy"""
    id: str = Field(..., description="Unique identifier for the policy")
    name: str = Field(..., description="Name of the policy")
    description: str = Field(..., description="Description of what the policy does")
    resource_type: str = Field(..., description="AWS resource type (e.g., aws.ec2, aws.s3)")
    content: str = Field(..., description="YAML content of the policy")
    category: str = Field(..., description="Category of policy (security, cost, compliance, etc.)")
    
class PolicyList(BaseModel):
    """Schema for list of policies"""
    policies: List[Policy] = Field(..., description="List of available policies")
    
class PolicyResult(BaseModel):
    """Schema for policy execution result"""
    policy_id: str
    success: bool
    message: Optional[str] = None
    resources_count: Optional[int] = None
    resources: Optional[List[Dict[str, Any]]] = None
    errors: Optional[List[str]] = None
