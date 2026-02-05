import logging
import sys
from app.core.config import settings

def setup_logging():
    """
    Configure logging for Ilmora.
    - JSON formatting could be added here for Production.
    - Currently standard console output for Phase 0.
    """
    logger = logging.getLogger("ilmora")
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    
    # Prevent duplicate handlers
    if not logger.handlers:
        logger.addHandler(handler)
        
    return logger

logger = setup_logging()
