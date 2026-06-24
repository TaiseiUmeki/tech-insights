import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateArticle } from '@/entities/article/api/article-api';
import type { ArticleUpsertRequest } from '@/entities/article/model/api-types';
import { articleQueryKey } from '@/entities/article/model/query-key';

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      articleId,
      data,
    }: {
      articleId: number;
      data: ArticleUpsertRequest;
    }) => updateArticle(articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleQueryKey.all });
    },
  });
}
