from app.application.schemas.article_schemas import AuthorDTO
from app.domain.repositories.article_repository import IAuthorRepository


class AuthorUsecase:
    """著者参照ユースケース"""

    def __init__(self, author_repository: IAuthorRepository):
        self.author_repository = author_repository

    def list_authors(self, q: str | None = None) -> list[AuthorDTO]:
        return [
            AuthorDTO(id=author.id, name=author.name)
            for author in self.author_repository.list_authors(q)
        ]
