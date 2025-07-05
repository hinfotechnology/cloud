import os
import json
import yaml
import uuid
import logging
import tempfile
import subprocess
import shutil
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.schemas.aws import AWSCredentials
from app.schemas.policies import PolicyResult, Policy
from app.services.policy_service import PolicyService

logger = logging.getLogger(__name__)

class CustodianService:
    """Service for executing Cloud Custodian policies"""
    
    def __init__(self):
        """Initialize the custodian service"""
        self.policy_service = PolicyService()
        self.output_dir = os.path.join(os.getcwd(), "outputs")
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
    async def run_policy(self, policy_id: str, credentials: AWSCredentials, dryrun: bool = False) -> PolicyResult:
        """Run a Cloud Custodian policy with given AWS credentials"""
        # Get the policy
        policy = await self.policy_service.get_policy(policy_id)
        if not policy:
            return PolicyResult(
                policy_id=policy_id,
                success=False,
                message=f"Policy with ID {policy_id} not found",
                resources_count=0,
                resources=[],
                errors=["Policy not found"]
            )
            
        # Generate a unique job ID
        job_id = f"{policy_id}_{uuid.uuid4().hex}"
        job_output_dir = os.path.join(self.output_dir, job_id)
        os.makedirs(job_output_dir, exist_ok=True)
        
        # Create a temporary policy file
        with tempfile.NamedTemporaryFile(suffix='.yml', delete=False) as temp_file:
            temp_file.write(policy.content.encode())
            policy_file = temp_file.name
            
        try:
            # Prepare the environment variables for AWS credentials
            env = os.environ.copy()
            env['AWS_ACCESS_KEY_ID'] = credentials.access_key
            env['AWS_SECRET_ACCESS_KEY'] = credentials.secret_key
            env['AWS_DEFAULT_REGION'] = credentials.region
            
            if credentials.session_token:
                env['AWS_SESSION_TOKEN'] = credentials.session_token
                
            # Build the command
            cmd = ['custodian', 'run']
            
            if dryrun:
                cmd.append('--dryrun')
                
            cmd.extend(['-s', job_output_dir, policy_file])
            
            # Execute the command
            logger.info(f"Running custodian command: {' '.join(cmd)}")
            result = subprocess.run(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False
            )
            
            # Check for errors
            if result.returncode != 0:
                logger.error(f"Error running custodian: {result.stderr}")
                return PolicyResult(
                    policy_id=policy_id,
                    success=False,
                    message=f"Error running policy: {result.stderr}",
                    resources_count=0,
                    resources=[],
                    errors=[result.stderr]
                )
                
            # Parse the output to get resources
            resources_file = None
            for root, _, files in os.walk(job_output_dir):
                for file in files:
                    if file.endswith('resources.json'):
                        resources_file = os.path.join(root, file)
                        break
                        
            resources = []
            resources_count = 0
            
            if resources_file and os.path.exists(resources_file):
                with open(resources_file, 'r') as f:
                    resources = json.load(f)
                    resources_count = len(resources)
            
            # Create a metadata file
            metadata = {
                'policy_id': policy_id,
                'policy_name': policy.name,
                'timestamp': datetime.now().isoformat(),
                'dryrun': dryrun,
                'resource_count': resources_count,
                'command_output': result.stdout,
                'command_error': result.stderr,
                'command': ' '.join(cmd)
            }
            
            with open(os.path.join(job_output_dir, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
                
            return PolicyResult(
                policy_id=policy_id,
                success=True,
                message=f"Policy executed successfully. Found {resources_count} resources.",
                resources_count=resources_count,
                resources=resources[:100],  # Limit to first 100 resources for API response
                errors=None
            )
            
        except Exception as e:
            logger.error(f"Error executing policy: {str(e)}")
            return PolicyResult(
                policy_id=policy_id,
                success=False,
                message=f"Error executing policy: {str(e)}",
                resources_count=0,
                resources=[],
                errors=[str(e)]
            )
            
        finally:
            # Clean up the temporary file
            if os.path.exists(policy_file):
                os.unlink(policy_file)
                
    async def get_output(self, job_id: str) -> Dict[str, Any]:
        """Get the output of a previously executed policy"""
        job_output_dir = os.path.join(self.output_dir, job_id)
        
        if not os.path.exists(job_output_dir):
            return {
                'error': f"No output found for job ID {job_id}"
            }
            
        # Get metadata
        metadata_file = os.path.join(job_output_dir, 'metadata.json')
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {}
            
        # Get resources
        resources_file = None
        for root, _, files in os.walk(job_output_dir):
            for file in files:
                if file.endswith('resources.json'):
                    resources_file = os.path.join(root, file)
                    break
                    
        resources = []
        if resources_file and os.path.exists(resources_file):
            with open(resources_file, 'r') as f:
                resources = json.load(f)
                
        return {
            'job_id': job_id,
            'metadata': metadata,
            'resources': resources
        }
