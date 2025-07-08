from fastapi import APIRouter, Depends, HTTPException
from app.schemas.aws import AWSCredentials, ResourceSummary
from app.services.aws_service import AWSService
from app.services.session_service import get_aws_session
from app.middleware import requires_permission, requires_role
from typing import List, Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/validate-credentials")
async def validate_credentials(credentials: AWSCredentials):
    """Validate AWS credentials"""
    aws_service = AWSService(credentials)
    try:
        valid = await aws_service.validate_credentials()
        return {"valid": valid}
    except Exception as e:
        logger.error(f"Error validating credentials: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid AWS credentials: {str(e)}")

@router.post("/resources/summary", dependencies=[Depends(requires_permission("read"))])
async def get_resource_summary(credentials: AWSCredentials):
    """Get summary of AWS resources across services"""
    aws_service = AWSService(credentials)
    try:
        summary = await aws_service.get_resource_summary()
        return summary
    except Exception as e:
        logger.error(f"Error getting resource summary: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving AWS resources: {str(e)}")

@router.post("/resources/{service}", dependencies=[Depends(requires_permission("read"))])
async def get_resources(service: str, credentials: AWSCredentials):
    """Get resources for a specific AWS service"""
    aws_service = AWSService(credentials)
    try:
        resources = await aws_service.get_resources(service)
        return resources
    except Exception as e:
        logger.error(f"Error getting resources for {service}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving {service} resources: {str(e)}")

@router.post("/resources/{service}/tags", dependencies=[Depends(requires_permission("read"))])
async def get_resource_tags(service: str, credentials: AWSCredentials):
    """Get all tags used in a specific service"""
    aws_service = AWSService(credentials)
    try:
        tags = await aws_service.get_resource_tags(service)
        return tags
    except Exception as e:
        logger.error(f"Error getting tags for {service}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving {service} tags: {str(e)}")

@router.post("/cost/{service}")
async def get_service_cost(service: str, credentials: AWSCredentials, period: str = None):
    """Get cost data for a specific service (if Cost Explorer is enabled)
    
    Args:
        service: The AWS service name
        credentials: AWS credentials
        period: Optional time period ('1m', '3m', '6m', or None for all periods)
    """
    aws_service = AWSService(credentials)
    try:
        cost_data = await aws_service.get_service_cost(service, period)
        return cost_data
    except Exception as e:
        logger.error(f"Error getting cost data for {service}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving cost data: {str(e)}")
        
@router.post("/cost/{service}/{period}")
async def get_service_cost_for_period(service: str, period: str, credentials: AWSCredentials):
    """Get cost data for a specific service and time period
    
    Args:
        service: The AWS service name
        period: Time period ('1m', '3m', or '6m')
        credentials: AWS credentials
    """
    aws_service = AWSService(credentials)
    try:
        cost_data = await aws_service.get_service_cost(service, period)
        return cost_data
    except Exception as e:
        logger.error(f"Error getting cost data for {service} with period {period}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving cost data: {str(e)}")

@router.post("/resources/{service}/details", dependencies=[Depends(requires_permission("read"))])
async def get_resource_details(service: str, credentials: AWSCredentials):
    """Get detailed information for resources of a specific AWS service"""
    aws_service = AWSService(credentials)
    try:
        details = await aws_service.get_resource_details(service)
        return details
    except Exception as e:
        logger.error(f"Error getting detailed features for {service}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving {service} detailed features: {str(e)}")
