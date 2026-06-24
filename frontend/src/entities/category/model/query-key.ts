export const categoryQueryKey = {
  all: ['categories'] as const,
  list: (q?: string) => [...categoryQueryKey.all, 'list', q ?? ''] as const,
};
