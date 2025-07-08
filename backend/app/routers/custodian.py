from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.schemas.aws import AWSCredentials
from app.schemas.policies import PolicyResult
from app.services.custodian_service import CustodianService
from app.middleware import requires_permission, requires_role
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/run/{policy_id}", response_model=PolicyResult, dependencies=[Depends(requires_permission("run_policy"))])
async def run_policy(policy_id: str, credentials: AWSCredentials, background_tasks: BackgroundTasks):
    """Run a Cloud Custodian policy"""
    custodian_service = CustodianService()
    
    try:
        result = await custodian_service.run_policy(policy_id, credentials)
        return result
    except Exception as e:
        logger.error(f"Error running policy {policy_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error running policy: {str(e)}")
        
@router.post("/dryrun/{policy_id}", response_model=PolicyResult, dependencies=[Depends(requires_permission("run_policy"))])
async def dry_run_policy(policy_id: str, credentials: AWSCredentials):
    """Dry run a Cloud Custodian policy (no actions performed)"""
    custodian_service = CustodianService()
    
    try:
        result = await custodian_service.run_policy(policy_id, credentials, dryrun=True)
        return result
    except Exception as e:
        logger.error(f"Error running policy {policy_id} in dry run mode: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error running policy in dry run mode: {str(e)}")
        
@router.get("/outputs/{job_id}", dependencies=[Depends(requires_permission("read"))])
async def get_policy_output(job_id: str):
    """Get the output of a previously executed policy"""
    custodian_service = CustodianService()
    
    try:
        output = await custodian_service.get_output(job_id)
        return output
    except Exception as e:
        logger.error(f"Error retrieving output for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving policy output: {str(e)}")
