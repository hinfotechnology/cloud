import os
import yaml
import json
import uuid
import logging
from typing import List, Dict, Any, Optional
from app.schemas.policies import Policy

logger = logging.getLogger(__name__)

class PolicyService:
    """Service for managing Cloud Custodian policies"""
    
    def __init__(self):
        """Initialize the policy service"""
        self.policy_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "policies")
        
        # Ensure policy directory exists
        os.makedirs(self.policy_dir, exist_ok=True)
        
        # Create subdirectories for organizing policies by category
        categories = ["security", "cost", "compliance", "governance", "operational"]
        for category in categories:
            os.makedirs(os.path.join(self.policy_dir, category), exist_ok=True)
        
    async def get_all_policies(self) -> List[Policy]:
        """Get all available policies"""
        policies = []
        
        # Walk through all files in policy directory and subdirectories
        for root, _, files in os.walk(self.policy_dir):
            for file in files:
                if file.endswith('.yml') or file.endswith('.yaml'):
                    file_path = os.path.join(root, file)
                    category = os.path.basename(os.path.dirname(file_path))
                    
                    try:
                        with open(file_path, 'r') as f:
                            content = f.read()
                            yaml_content = yaml.safe_load(content)
                            
                            if not yaml_content or not yaml_content.get('policies'):
                                logger.warning(f"Invalid policy file format in {file}")
                                continue
                                
                            for policy_data in yaml_content.get('policies', []):
                                if not policy_data.get('name') or not policy_data.get('resource'):
                                    logger.warning(f"Invalid policy in {file}")
                                    continue
                                    
                                policy = Policy(
                                    id=f"{category}_{policy_data['name']}".replace(' ', '_').lower(),
                                    name=policy_data['name'],
                                    description=policy_data.get('description', 'No description provided'),
                                    resource_type=policy_data['resource'],
                                    content=yaml.dump({'policies': [policy_data]}),
                                    category=category
                                )
                                policies.append(policy)
                    except Exception as e:
                        logger.error(f"Error parsing policy file {file}: {str(e)}")
                        continue
                        
        return policies
        
    async def get_policy(self, policy_id: str) -> Optional[Policy]:
        """Get a specific policy by ID"""
        policies = await self.get_all_policies()
        for policy in policies:
            if policy.id == policy_id:
                return policy
        return None
        
    async def get_categories(self) -> List[str]:
        """Get all policy categories"""
        categories = set()
        
        for item in os.listdir(self.policy_dir):
            if os.path.isdir(os.path.join(self.policy_dir, item)) and not item.startswith('__'):
                categories.add(item)
                
        return list(categories)
        
    async def get_resource_types(self) -> List[str]:
        """Get all supported resource types"""
        # This is a non-exhaustive list of common resource types in Cloud Custodian
        # For a complete list, you would need to query Cloud Custodian's schema
        return [
            "aws.ec2",
            "aws.s3",
            "aws.rds",
            "aws.lambda",
            "aws.iam-user",
            "aws.iam-role",
            "aws.dynamodb-table",
            "aws.kms-key",
            "aws.ebs",
            "aws.asg",
            "aws.cloudtrail",
            "aws.log-group",
            "aws.redshift",
            "aws.emr",
            "aws.elasticsearch",
            "aws.sqs",
            "aws.sns",
            "aws.vpc",
            "aws.subnet",
            "aws.security-group"
        ]
