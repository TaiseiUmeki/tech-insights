import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createArticle } from '@/entities/article/api/article-api';
import { articleQueryKey } from '@/entities/article/model/query-key';

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleQueryKey.all });
    },
  });
}
