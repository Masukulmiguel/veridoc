from fastapi import APIRouter

from app.core.plans import get_plan, list_plans, Plan

router = APIRouter(prefix="/plans", tags=["plans"])


def _plan_to_dict(plan: Plan) -> dict:
    return {
        "id": plan.id,
        "name": plan.name,
        "description": plan.description,
        "price_monthly_kz": plan.price_monthly_kz,
        "price_annual_kz": plan.price_annual_kz,
        "limits": {
            "max_documents_monthly": plan.limits.max_documents_monthly,
            "max_users": plan.limits.max_users,
            "has_pdf": plan.limits.has_pdf,
            "has_qr_code": plan.limits.has_qr_code,
            "has_api_access": plan.limits.has_api_access,
            "has_priority_support": plan.limits.has_priority_support,
        },
    }


@router.get("", response_model=list[dict])
def list_available_plans() -> list[dict]:
    return [_plan_to_dict(p) for p in list_plans()]


@router.get("/{plan_id}", response_model=dict)
def get_plan_detail(plan_id: str) -> dict:
    plan = get_plan(plan_id)
    if not plan:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plano não encontrado.",
        )
    return _plan_to_dict(plan)
