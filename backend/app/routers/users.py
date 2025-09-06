from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def users_root():
    """Users router placeholder."""
    return {"message": "Users endpoints will be implemented here"}
