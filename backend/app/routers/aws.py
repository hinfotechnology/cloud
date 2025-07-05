from fastapi import APIRouter, Depends, HTTPException
from app.schemas.aws import AWSCredentials, ResourceSummary
from app.services.aws_service import AWSService
from app.services.session_service import get_aws_session
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

@router.post("/resources/summary")
async def get_resource_summary(credentials: AWSCredentials):
    """Get summary of AWS resources across services"""
    aws_service = AWSService(credentials)
    try:
        summary = await aws_service.get_resource_summary()
        return summary
    except Exception as e:
        logger.error(f"Error getting resource summary: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving AWS resources: {str(e)}")

@router.post("/resources/{service}")
async def get_resources(service: str, credentials: AWSCredentials):
    """Get resources for a specific AWS service"""
    aws_service = AWSService(credentials)
    try:
        resources = await aws_service.get_resources(service)
        return resources
    except Exception as e:
        logger.error(f"Error getting resources for {service}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving {service} resources: {str(e)}")

@router.post("/resources/{service}/tags")
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
async def get_service_cost(service: str, credentials: AWSCredentials):
    """Get cost data for a specific service (if Cost Explorer is enabled)"""
    aws_service = AWSService(credentials)
    try:
        cost_data = await aws_service.get_service_cost(service)
        return cost_data
    except Exception as e:
        logger.error(f"Error getting cost data for {service}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error retrieving cost data: {str(e)}")
