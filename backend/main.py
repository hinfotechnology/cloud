"""
This script is used to run the FastAPI backend for the Cloud Custodian UI.
"""
import uvicorn
import logging
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

if __name__ == "__main__":
    # Get configuration from environment variables
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    reload = os.environ.get("RELOAD", "True").lower() == "true"
    
    # Create output directories if they don't exist
    os.makedirs(os.path.join(os.getcwd(), "outputs"), exist_ok=True)
    
    # Run the FastAPI application
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
