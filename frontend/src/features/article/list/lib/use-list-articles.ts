import { useQuery } from '@tanstack/react-query';
import { listArticles } from '@/entities/article/api/article-api';
import type { ArticleListParams } from '@/entities/article/model/api-types';
import { articleQueryKey } from '@/entities/article/model/query-key';

export function useListArticles(params: ArticleListParams) {
  return useQuery({
    queryKey: articleQueryKey.list(params),
    queryFn: () => listArticles(params),
    staleTime: 60 * 1000,
  });
}
