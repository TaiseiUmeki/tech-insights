class AuthenticationError(Exception):
    """認証失敗時の例外（401）"""

    pass


class AuthorizationError(Exception):
    """権限不足の例外（403）"""

    pass


class ResourceNotFoundError(Exception):
    """リソースが見つからない場合の例外（404）"""

    pass


class ResourceConflictError(Exception):
    """リソースの競合（重複など）の例外（409）"""

    pass


class BusinessValidationError(Exception):
    """ビジネスルールのバリデーション違反（422）"""

    pass


class BusinessLogicError(Exception):
    """汎用的なビジネスロジックエラー（400）"""

    pass
