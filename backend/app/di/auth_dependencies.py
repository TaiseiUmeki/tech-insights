"""認証関連の依存関数をDI層で提供"""

from app.infrastructure.security.security_service_impl import (
    User,
    get_current_user_from_cookie,
)

__all__ = ['User', 'get_current_user_from_cookie']
