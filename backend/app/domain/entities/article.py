from datetime import datetime

from pydantic import BaseModel, Field


class Category(BaseModel):
    """記事カテゴリエンティティ"""

    id: int = Field(..., description='カテゴリID')
    name: str = Field(..., description='カテゴリ名')

    class Config:
        from_attributes = True


class Author(BaseModel):
    """著者エンティティ"""

    id: int = Field(..., description='著者ID')
    name: str = Field(..., description='著者名')

    class Config:
        from_attributes = True


class Article(BaseModel):
    """記事エンティティ"""

    id: int | None = Field(None, description='記事ID')
    source_article_id: int | None = Field(None, description='CSV由来の記事ID')
    category_id: int = Field(..., description='カテゴリID')
    author_id: int = Field(..., description='著者ID')
    title: str = Field(..., description='記事タイトル')
    content: str = Field(..., description='記事本文')
    embedding: list[float] | None = Field(None, description='記事embedding')
    published_at: datetime = Field(..., description='公開日時')

    class Config:
        from_attributes = True
