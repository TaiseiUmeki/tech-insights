from functools import cached_property

from app.application.interfaces.embedding_service import IEmbeddingService
from app.config import get_settings


class LocalEmbeddingService(IEmbeddingService):
    """sentence-transformersを使うローカルembeddingサービス"""

    @cached_property
    def _model(self):
        from sentence_transformers import SentenceTransformer

        settings = get_settings()
        return SentenceTransformer(settings.embedding_model_name)

    def embed_query(self, text: str) -> list[float]:
        return self._encode([f'query: {text}'])[0]

    def embed_article(self, title: str, content: str) -> list[float]:
        return self.embed_articles([(title, content)])[0]

    def embed_articles(self, articles: list[tuple[str, str]]) -> list[list[float]]:
        passages = [f'passage: {title}\n{content}' for title, content in articles]
        return self._encode(passages)

    def _encode(self, texts: list[str]) -> list[list[float]]:
        vectors = self._model.encode(texts, normalize_embeddings=True)
        return [vector.astype(float).tolist() for vector in vectors]
