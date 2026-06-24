import { useQuery } from '@tanstack/react-query';
import { listCategories } from '@/entities/category/api/category-api';
import { categoryQueryKey } from '@/entities/category/model/query-key';

export function useListCategories(q?: string) {
  return useQuery({
    queryKey: categoryQueryKey.list(q),
    queryFn: () => listCategories(q),
    staleTime: 5 * 60 * 1000,
  });
}
