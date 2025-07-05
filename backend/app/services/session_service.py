import boto3
from typing import Optional
from app.schemas.aws import AWSCredentials
from fastapi import Depends, HTTPException

def get_aws_session(credentials: AWSCredentials):
    """
    Create a boto3 session using provided credentials
    
    This is a FastAPI dependency that can be used in route functions
    to get a boto3 session from the credentials provided in the request.
    """
    try:
        session = boto3.Session(
            aws_access_key_id=credentials.access_key,
            aws_secret_access_key=credentials.secret_key,
            region_name=credentials.region,
            aws_session_token=credentials.session_token
        )
        
        # Validate session by making a test call
        sts = session.client('sts')
        sts.get_caller_identity()
        
        return session
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid AWS credentials: {str(e)}")
