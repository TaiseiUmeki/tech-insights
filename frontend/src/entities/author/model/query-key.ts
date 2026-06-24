export const authorQueryKey = {
  all: ['authors'] as const,
  list: (q?: string) => [...authorQueryKey.all, 'list', q ?? ''] as const,
};
