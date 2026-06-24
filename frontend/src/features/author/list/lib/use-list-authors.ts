import { useQuery } from '@tanstack/react-query';
import { listAuthors } from '@/entities/author/api/author-api';
import { authorQueryKey } from '@/entities/author/model/query-key';

export function useListAuthors(q?: string) {
  return useQuery({
    queryKey: authorQueryKey.list(q),
    queryFn: () => listAuthors(q),
    staleTime: 5 * 60 * 1000,
  });
}
