import { useQuery } from '@tanstack/react-query';
import {
  getArticle,
  getRelatedArticles,
} from '@/entities/article/api/article-api';
import { articleQueryKey } from '@/entities/article/model/query-key';

export function useGetArticle(articleId: number | null) {
  return useQuery({
    queryKey: articleQueryKey.detail(articleId ?? 0),
    queryFn: () => getArticle(articleId as number),
    enabled: articleId !== null,
  });
}

export function useRelatedArticles(articleId: number | null, limit = 3) {
  return useQuery({
    queryKey: articleQueryKey.related(articleId ?? 0, limit),
    queryFn: () => getRelatedArticles(articleId as number, limit),
    enabled: articleId !== null,
  });
}
