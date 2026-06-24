from app.application.schemas.article_schemas import CategoryDTO
from app.domain.repositories.article_repository import ICategoryRepository


class CategoryUsecase:
    """カテゴリ参照ユースケース"""

    def __init__(self, category_repository: ICategoryRepository):
        self.category_repository = category_repository

    def list_categories(self, q: str | None = None) -> list[CategoryDTO]:
        return [
            CategoryDTO(id=category.id, name=category.name)
            for category in self.category_repository.list_categories(q)
        ]
