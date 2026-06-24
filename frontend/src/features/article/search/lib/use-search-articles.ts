import type {
  ArticleListParams,
  SearchMode,
} from '@/entities/article/model/api-types';
import { useListArticles } from '@/features/article/list/lib/use-list-articles';

export interface ArticleSearchState {
  page: number;
  limit: number;
  q: string;
  searchMode: SearchMode;
  categoryId?: number;
  authorId?: number;
}

export function toArticleListParams(
  state: ArticleSearchState,
): ArticleListParams {
  const query = state.q.trim();
  return {
    page: state.page,
    limit: state.limit,
    q: query || undefined,
    searchMode: state.searchMode,
    categoryId: state.categoryId,
    authorId: state.authorId,
    sort: query ? 'relevance' : 'publishedAt',
    order: 'desc',
  };
}

export function useSearchArticles(state: ArticleSearchState) {
  return useListArticles(toArticleListParams(state));
}
