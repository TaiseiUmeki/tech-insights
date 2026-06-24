import { httpClient } from '@/shared/api/client/http-client';
import type {
  ArticleDetailResponse,
  ArticleListParams,
  ArticleListResponse,
  ArticleUpsertRequest,
  DeleteArticleResponse,
} from '../model/api-types';

const BASE_PATH = '/api/articles';

export async function listArticles(
  params: ArticleListParams,
): Promise<ArticleListResponse> {
  const response = await httpClient.get<ArticleListResponse>(BASE_PATH, {
    params,
  });
  return response.data;
}

export async function getArticle(
  articleId: number,
): Promise<ArticleDetailResponse> {
  const response = await httpClient.get<ArticleDetailResponse>(
    `${BASE_PATH}/${articleId}`,
  );
  return response.data;
}

export async function createArticle(
  data: ArticleUpsertRequest,
): Promise<ArticleDetailResponse> {
  const response = await httpClient.post<ArticleDetailResponse>(
    BASE_PATH,
    data,
  );
  return response.data;
}

export async function updateArticle(
  articleId: number,
  data: ArticleUpsertRequest,
): Promise<ArticleDetailResponse> {
  const response = await httpClient.put<ArticleDetailResponse>(
    `${BASE_PATH}/${articleId}`,
    data,
  );
  return response.data;
}

export async function deleteArticle(
  articleId: number,
): Promise<DeleteArticleResponse> {
  const response = await httpClient.delete<DeleteArticleResponse>(
    `${BASE_PATH}/${articleId}`,
  );
  return response.data;
}

export async function getRelatedArticles(
  articleId: number,
  limit = 3,
): Promise<ArticleListResponse> {
  const response = await httpClient.get<ArticleListResponse>(
    `${BASE_PATH}/${articleId}/related-articles`,
    { params: { limit } },
  );
  return response.data;
}
