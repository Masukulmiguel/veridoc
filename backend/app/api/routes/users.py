from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UserOut
from app.services import auth_service
from app.services.audit_service import record_audit
from app.utils.identifiers import generate_uuid

router = APIRouter(prefix="/users", tags=["users"])

ACTION_USER_CREATED = "USER_CREATED"
ACTION_USER_UPDATED = "USER_UPDATED"


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> list[User]:
    return (
        db.query(User)
        .filter(User.institution_id == admin.institution_id)
        .order_by(User.created_at)
        .all()
    )


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> User:
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um utilizador com este e-mail.",
        )
    user = User(
        id=generate_uuid(),
        institution_id=admin.institution_id,
        name=payload.name,
        email=email,
        password_hash=auth_service.hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    record_audit(
        db,
        actor=admin,
        action=ACTION_USER_CREATED,
        entity_type="user",
        entity_id=user.id,
        details={"role": user.role},
    )
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> User:
    user = db.get(User, user_id)
    if not user or user.institution_id != admin.institution_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador não encontrado.")

    if payload.role and payload.role != "ADMIN" and user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Não pode rebaixar o seu próprio perfil.",
        )

    if payload.name is not None:
        user.name = payload.name
    if payload.role is not None:
        user.role = payload.role
    if payload.status is not None:
        user.status = payload.status
    if payload.password:
        user.password_hash = auth_service.hash_password(payload.password)

    record_audit(
        db,
        actor=admin,
        action=ACTION_USER_UPDATED,
        entity_type="user",
        entity_id=user.id,
        details={"role": user.role, "status": user.status},
    )
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> None:
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Não pode eliminar a sua própria conta.",
        )
    user = db.get(User, user_id)
    if not user or user.institution_id != admin.institution_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador não encontrado.")
    if user.role == "ADMIN":
        admin_count = (
            db.query(User)
            .filter(User.institution_id == admin.institution_id, User.role == "ADMIN")
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A instituição precisa de pelo menos um administrador.",
            )

    db.delete(user)
    record_audit(
        db,
        actor=admin,
        action="USER_DELETED",
        entity_type="user",
        entity_id=user_id,
    )
    db.commit()
