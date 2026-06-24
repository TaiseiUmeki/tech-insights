"""記事DBモデルのテスト"""

from app.infrastructure.db.models.article_model import ArticleModel, AuthorModel, CategoryModel
from app.infrastructure.db.models.base import Base


def test_article_models_are_registered_in_metadata():
    table_names = set(Base.metadata.tables.keys())

    assert ArticleModel.__tablename__ in table_names
    assert AuthorModel.__tablename__ in table_names
    assert CategoryModel.__tablename__ in table_names
