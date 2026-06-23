from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.use_cases.user_usecase import UserUsecase
from app.infrastructure.db.repositories.user_repository_impl import UserRepositoryImpl
from app.infrastructure.db.session import get_db
from app.infrastructure.security.security_service_impl import SecurityServiceImpl


def get_user_usecase(db: Session = Depends(get_db)) -> UserUsecase:
    user_repository = UserRepositoryImpl(db)
    security_service = SecurityServiceImpl()
    return UserUsecase(user_repository=user_repository, security_service=security_service)
