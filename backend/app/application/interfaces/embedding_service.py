from abc import ABC, abstractmethod


class IEmbeddingService(ABC):
    """embedding生成サービスのインターフェース"""

    @abstractmethod
    def embed_query(self, text: str) -> list[float]:
        pass

    @abstractmethod
    def embed_article(self, title: str, content: str) -> list[float]:
        pass

    @abstractmethod
    def embed_articles(self, articles: list[tuple[str, str]]) -> list[list[float]]:
        pass
