from fastapi import APIRouter, Depends, HTTPException
from app.schemas.policies import Policy, PolicyList
from app.services.policy_service import PolicyService
from app.middleware import requires_permission, requires_role
import os
import yaml
import logging
from typing import List

router = APIRouter()
logger = logging.getLogger(__name__)
policy_service = PolicyService()

@router.get("/", response_model=PolicyList, dependencies=[Depends(requires_permission("read"))])
async def get_policies():
    """Get all available policies"""
    try:
        policies = await policy_service.get_all_policies()
        return {"policies": policies}
    except Exception as e:
        logger.error(f"Error retrieving policies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving policies: {str(e)}")

@router.get("/{policy_id}", response_model=Policy, dependencies=[Depends(requires_permission("read"))])
async def get_policy(policy_id: str):
    """Get a specific policy by ID"""
    try:
        policy = await policy_service.get_policy(policy_id)
        if not policy:
            raise HTTPException(status_code=404, detail=f"Policy with ID {policy_id} not found")
        return policy
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving policy {policy_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving policy: {str(e)}")

@router.get("/categories", response_model=List[str], dependencies=[Depends(requires_permission("read"))])
async def get_policy_categories():
    """Get all policy categories"""
    try:
        categories = await policy_service.get_categories()
        return categories
    except Exception as e:
        logger.error(f"Error retrieving policy categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving policy categories: {str(e)}")

@router.get("/resources", response_model=List[str])
async def get_policy_resources():
    """Get all supported resource types"""
    try:
        resources = await policy_service.get_resource_types()
        return resources
    except Exception as e:
        logger.error(f"Error retrieving resource types: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving resource types: {str(e)}")

@router.get("/with-details", dependencies=[Depends(requires_permission("read"))])
async def get_policies_with_details():
    """Get all available policies with detailed information including compliance status"""
    try:
        policies = await policy_service.get_all_policies_with_details()
        return {"policies": policies}
    except Exception as e:
        logger.error(f"Error retrieving detailed policies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving detailed policies: {str(e)}")
