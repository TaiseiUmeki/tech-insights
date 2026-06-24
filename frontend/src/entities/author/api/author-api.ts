import { httpClient } from '@/shared/api/client/http-client';
import type { AuthorListResponse } from '../model/api-types';

export async function listAuthors(q?: string): Promise<AuthorListResponse> {
  const response = await httpClient.get<AuthorListResponse>('/api/authors', {
    params: { q },
  });
  return response.data;
}
