from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import aws, policies, custodian, auth
import os

app = FastAPI(
    title="Cloud Custodian UI",
    description="API for interacting with AWS resources and running Cloud Custodian policies",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost",
    # Add production URLs as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(aws.router, prefix="/api/aws", tags=["AWS"])
app.include_router(policies.router, prefix="/api/policies", tags=["Policies"])
app.include_router(custodian.router, prefix="/api/custodian", tags=["Custodian"])
app.include_router(auth.router, prefix="/api", tags=["Authentication"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "Cloud Custodian UI API is running"}

# Create output directory for custodian runs if it doesn't exist
os.makedirs(os.path.join(os.getcwd(), "outputs"), exist_ok=True)
