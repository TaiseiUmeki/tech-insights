export type SearchMode = 'keyword' | 'semantic' | 'hybrid';

export interface CategoryResponse {
  id: number;
  name: string;
}

export interface AuthorResponse {
  id: number;
  name: string;
}

export interface ArticleListItemResponse {
  id: number;
  sourceArticleId: number | null;
  title: string;
  snippet: string;
  category: CategoryResponse;
  author: AuthorResponse;
  publishedAt: string;
  score: number | null;
}

export interface ArticleListResponse {
  items: ArticleListItemResponse[];
  page: number;
  limit: number;
  total: number;
}

export interface ArticleDetailResponse {
  id: number;
  sourceArticleId: number | null;
  title: string;
  content: string;
  category: CategoryResponse;
  author: AuthorResponse;
  publishedAt: string;
}

export interface ArticleListParams {
  page?: number;
  limit?: number;
  q?: string;
  searchMode?: SearchMode;
  categoryId?: number;
  authorId?: number;
  sort?: 'publishedAt' | 'title' | 'relevance';
  order?: 'asc' | 'desc';
}

export interface ArticleUpsertRequest {
  title: string;
  content: string;
  authorName: string;
  categoryName: string;
  publishedAt: string;
}

export interface DeleteArticleResponse {
  id: number;
  deleted: boolean;
}
