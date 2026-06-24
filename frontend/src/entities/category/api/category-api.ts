import { httpClient } from '@/shared/api/client/http-client';
import type { CategoryListResponse } from '../model/api-types';

export async function listCategories(
  q?: string,
): Promise<CategoryListResponse> {
  const response = await httpClient.get<CategoryListResponse>(
    '/api/categories',
    {
      params: { q },
    },
  );
  return response.data;
}
