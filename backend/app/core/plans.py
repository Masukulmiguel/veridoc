from dataclasses import dataclass


@dataclass(frozen=True)
class PlanLimits:
    max_documents_monthly: int | None  # None = ilimitado
    max_users: int | None  # None = ilimitado
    has_pdf: bool
    has_qr_code: bool
    has_api_access: bool
    has_priority_support: bool


@dataclass(frozen=True)
class Plan:
    id: str
    name: str
    description: str
    price_monthly_kz: int
    price_annual_kz: int
    limits: PlanLimits


PLANS: dict[str, Plan] = {
    "starter": Plan(
        id="starter",
        name="Starter",
        description="Ideal para projectos pequenos e integração B.I.",
        price_monthly_kz=200,
        price_annual_kz=2_400,
        limits=PlanLimits(
            max_documents_monthly=100,
            max_users=1,
            has_pdf=False,
            has_qr_code=True,
            has_api_access=True,
            has_priority_support=False,
        ),
    ),
    "professional": Plan(
        id="professional",
        name="Profissional",
        description="Para instituições que emitem documentos regularmente.",
        price_monthly_kz=500,
        price_annual_kz=6_000,
        limits=PlanLimits(
            max_documents_monthly=500,
            max_users=5,
            has_pdf=True,
            has_qr_code=True,
            has_api_access=True,
            has_priority_support=False,
        ),
    ),
    "enterprise": Plan(
        id="enterprise",
        name="Enterprise",
        description="Para grandes organizações com necessidades avançadas.",
        price_monthly_kz=1_500,
        price_annual_kz=18_000,
        limits=PlanLimits(
            max_documents_monthly=None,
            max_users=None,
            has_pdf=True,
            has_qr_code=True,
            has_api_access=True,
            has_priority_support=True,
        ),
    ),
}


def get_plan(plan_id: str) -> Plan | None:
    return PLANS.get(plan_id)


def get_plan_limits(plan_id: str) -> PlanLimits:
    plan = PLANS.get(plan_id)
    if plan:
        return plan.limits
    return PLANS["starter"].limits


def list_plans() -> list[Plan]:
    return list(PLANS.values())
