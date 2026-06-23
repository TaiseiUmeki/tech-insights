from app.domain.exceptions.business_exceptions import BusinessValidationError

MIN_PASSWORD_LENGTH = 8


class Password:
    """パスワードの値オブジェクト（平文パスワードのバリデーション用）"""

    def __init__(self, value: str):
        self._validate(value)
        self.value = value

    @staticmethod
    def _validate(value: str) -> None:
        if len(value) < MIN_PASSWORD_LENGTH:
            raise BusinessValidationError(
                f'パスワードは{MIN_PASSWORD_LENGTH}文字以上で入力してください'
            )
