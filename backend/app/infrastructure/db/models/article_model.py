from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.infrastructure.db.models.base import Base

try:
    from pgvector.sqlalchemy import Vector
except ImportError:  # pragma: no cover - dependency is installed in Docker image
    Vector = None


class CategoryModel(Base):
    """カテゴリテーブルモデル"""

    __tablename__ = 'categories'
    __table_args__ = {'extend_existing': True}

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False, unique=True)

    articles = relationship('ArticleModel', back_populates='category')


class AuthorModel(Base):
    """著者テーブルモデル"""

    __tablename__ = 'authors'
    __table_args__ = {'extend_existing': True}

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)

    articles = relationship('ArticleModel', back_populates='author')


class ArticleModel(Base):
    """記事テーブルモデル"""

    __tablename__ = 'articles'
    __table_args__ = {'extend_existing': True}

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    source_article_id = Column(Integer, unique=True)
    category_id = Column(
        BigInteger, ForeignKey('categories.id', ondelete='RESTRICT'), nullable=False
    )
    author_id = Column(
        BigInteger, ForeignKey('authors.id', ondelete='RESTRICT'), nullable=False
    )
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384) if Vector else Text)
    published_at = Column(DateTime(timezone=True), nullable=False)

    category = relationship('CategoryModel', back_populates='articles')
    author = relationship('AuthorModel', back_populates='articles')
