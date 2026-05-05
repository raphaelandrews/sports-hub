from fastapi import APIRouter, Depends, HTTPException, status

from app.shared.core.deps import get_current_user
from app.domain.models.user import User, UserRole
from app.features.admin.seed_data import seed_all, seed_all_2

router = APIRouter(prefix="/leagues/{league_id}/admin", tags=["admin"])
superadmin_router = APIRouter(prefix="/admin", tags=["superadmin"])


def _require_admin_or_raphael(user: User = Depends(get_current_user)) -> User:
    if user.email == "raphael@andrews.sh":
        return user
    if user.role not in {UserRole.ADMIN, UserRole.SUPERADMIN}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
        )
    return user


@superadmin_router.post("/seed")
async def run_seed(_: User = Depends(_require_admin_or_raphael)) -> dict[str, str]:
    await seed_all()
    return {"message": "Seed 1 completed successfully"}


@superadmin_router.post("/seed/2")
async def run_seed_2(_: User = Depends(_require_admin_or_raphael)) -> dict[str, str]:
    await seed_all_2()
    return {"message": "Seed 2 completed successfully"}
