from datetime import datetime

from pydantic import BaseModel


class CategoryDTO(BaseModel):
    id: int
    name: str


class AuthorDTO(BaseModel):
    id: int
    name: str


class ArticleListItemDTO(BaseModel):
    id: int
    source_article_id: int | None
    title: str
    snippet: str
    category: CategoryDTO
    author: AuthorDTO
    published_at: datetime
    score: float | None = None


class ArticleDetailDTO(BaseModel):
    id: int
    source_article_id: int | None
    title: str
    content: str
    category: CategoryDTO
    author: AuthorDTO
    published_at: datetime


class ArticleListDTO(BaseModel):
    items: list[ArticleListItemDTO]
    page: int
    limit: int
    total: int


class ArticleInputDTO(BaseModel):
    title: str
    content: str
    author_name: str
    category_name: str
    published_at: datetime


class ReindexJobDTO(BaseModel):
    id: str
    status: str
    target_count: int
    processed_count: int
    failed_count: int
