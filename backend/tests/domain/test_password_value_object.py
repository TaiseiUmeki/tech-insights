"""Password値オブジェクトのテスト"""

import pytest

from app.domain.exceptions.business_exceptions import BusinessValidationError
from app.domain.value_objects.password import MIN_PASSWORD_LENGTH, Password


class TestPassword:
    """Passwordのテストクラス"""

    def test_valid_password(self):
        """8文字以上のパスワードが受け入れられる"""
        password = Password('password123')
        assert password.value == 'password123'

    def test_exact_minimum_length(self):
        """ちょうど8文字のパスワードが受け入れられる"""
        password = Password('12345678')
        assert password.value == '12345678'

    def test_short_password_raises_error(self):
        """8文字未満のパスワードはエラー"""
        with pytest.raises(BusinessValidationError) as exc_info:
            Password('short')
        assert str(MIN_PASSWORD_LENGTH) in str(exc_info.value)

    def test_empty_password_raises_error(self):
        """空文字のパスワードはエラー"""
        with pytest.raises(BusinessValidationError):
            Password('')

    def test_7_chars_raises_error(self):
        """7文字のパスワードはエラー"""
        with pytest.raises(BusinessValidationError):
            Password('1234567')

    def test_long_password(self):
        """長いパスワードも受け入れられる"""
        long_pw = 'a' * 100
        password = Password(long_pw)
        assert password.value == long_pw
