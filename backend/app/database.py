from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine using centralized configuration URL
engine = create_engine(settings.database_url)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Import models to ensure they are registered on the Base metadata
from app.models import Base

# Create tables in database if they do not exist
Base.metadata.create_all(bind=engine)