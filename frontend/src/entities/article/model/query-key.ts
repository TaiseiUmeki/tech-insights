import type { ArticleListParams } from './api-types';

export const articleQueryKey = {
  all: ['articles'] as const,
  list: (params: ArticleListParams) =>
    [...articleQueryKey.all, 'list', params] as const,
  detail: (articleId: number) =>
    [...articleQueryKey.all, 'detail', articleId] as const,
  related: (articleId: number, limit: number) =>
    [...articleQueryKey.all, 'related', articleId, limit] as const,
};
