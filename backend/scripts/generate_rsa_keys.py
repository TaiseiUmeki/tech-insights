"""
RSA鍵ペア生成スクリプト（JWT RS256専用）

JWT署名用のRSA-2048ビット鍵ペアを生成します。
HS256（32文字の対称鍵）からRS256（2048ビットRSA）への移行により、
セキュリティが大幅に向上します。

セキュリティの改善:
- HS256: 32文字（256ビット）の対称鍵 → ブルートフォース攻撃に脆弱
- RS256: 2048ビットRSA鍵 → 現代の計算能力でも解読不可能

使用方法:
    python backend/scripts/generate_rsa_keys.py
    または
    task generate-rsa-keys

生成されるファイル:
    - backend/jwt_private_key.pem: 秘密鍵（サーバーのみで使用、絶対に公開しない）
    - backend/jwt_public_key.pem: 公開鍵（トークン検証に使用、公開可能）
    - backend/.env.jwt-keys.local: .env に貼り付ける用の \\n エスケープ済み形式

注意:
    - 秘密鍵は絶対にGitにコミットしないでください（.gitignoreで除外済み）
    - 本番環境では別の方法で鍵を管理することを推奨します
"""

import os

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def _to_env_value(pem_bytes: bytes) -> str:
    """PEM の実際の改行を .env で扱える \\n リテラルに変換する。"""
    return pem_bytes.decode('utf-8').replace('\n', '\\n')


def generate_rsa_keys():
    """RSA-2048ビット鍵ペアを生成してPEM形式と .env 用エスケープ形式で保存"""

    # 秘密鍵を生成
    private_key = rsa.generate_private_key(
        public_exponent=65537, key_size=2048, backend=default_backend()
    )

    # 公開鍵を取得
    public_key = private_key.public_key()

    # 秘密鍵をPEM形式にシリアライズ
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # 公開鍵をPEM形式にシリアライズ
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # ファイルパスを設定（backendディレクトリ直下）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    private_key_path = os.path.join(backend_dir, 'jwt_private_key.pem')
    public_key_path = os.path.join(backend_dir, 'jwt_public_key.pem')
    env_keys_path = os.path.join(backend_dir, '.env.jwt-keys.local')

    # PEMファイルを保存
    with open(private_key_path, 'wb') as f:
        f.write(private_pem)
    with open(public_key_path, 'wb') as f:
        f.write(public_pem)

    # .env にそのまま貼り付けられる形式（改行を \n リテラルに変換）を保存
    env_keys_content = (
        f'JWT_PRIVATE_KEY={_to_env_value(private_pem)}\n'
        f'JWT_PUBLIC_KEY={_to_env_value(public_pem)}\n'
    )
    with open(env_keys_path, 'w', encoding='utf-8') as f:
        f.write(env_keys_content)
    # ファイル権限を 600 にしておく（秘密鍵相当の扱い）
    os.chmod(env_keys_path, 0o600)

    print('✓ RSA鍵ペアを生成しました')
    print(f'  秘密鍵 (PEM): {private_key_path}')
    print(f'  公開鍵 (PEM): {public_key_path}')
    print(f'  .env 用     : {env_keys_path}')
    print()
    print('【.env への取り込み】')
    print('  生成された .env.jwt-keys.local の2行を .env にコピー、または:')
    print(f'    cat {env_keys_path} >> {os.path.join(backend_dir, ".env")}')
    print()
    print('【重要】セキュリティ:')
    print('  - 秘密鍵 (.pem) と .env.jwt-keys.local は .gitignore で除外済み')
    print('  - 本番環境では別の鍵管理方法（Secrets Manager 等）を推奨')


if __name__ == '__main__':
    generate_rsa_keys()
