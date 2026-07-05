from fastapi import APIRouter

router = APIRouter()

@router.get("/", tags=["Root"])
async def read_root() -> dict[str, str]:
    """
    Root endpoint that returns a welcome message.
    """
    return {"message": "Welcome to AI Fitness Companion API"}

@router.get("/about")
async def about():
    """
    Returns information about the AI Fitness Companion.
    """
    return {"message": "About AI Fitness Companion"}

@router.get("/project")
async def project():
    """
    Returns metadata about the project.
    """
    return {
        "name": "AI Fitness Companion",
        "version": "1.0.0",
        "developer": "Anoop Sankar",
        "ai_model": "Llama 3 via Groq"
    }

@router.get("/bmi")
async def calculate_bmi(height: float, weight: float):
    """
    Calculates Body Mass Index (BMI) based on weight (kg) and height (cm).
    """
    bmi = weight / ((height / 100) ** 2)
    return {
        "height": height,
        "weight": weight,
        "bmi": round(bmi, 2)
    }
