"""ヘルスチェックAPIのテスト"""

from fastapi import status
from fastapi.testclient import TestClient


def test_health_check(test_client: TestClient):
    response = test_client.get('/health')

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {'status': 'healthy'}
