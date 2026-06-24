import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteArticle } from '@/entities/article/api/article-api';
import { articleQueryKey } from '@/entities/article/model/query-key';

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleQueryKey.all });
    },
  });
}
