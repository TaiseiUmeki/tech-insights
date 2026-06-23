import { httpClient } from '@/shared/api';
import type { UserResponse } from '../model/types';

/**
 * ユーザーAPI
 */
export const userApi = {
  /**
   * ログイン中ユーザーの情報を取得
   */
  async getMe(): Promise<UserResponse> {
    const response = await httpClient.get<UserResponse>('/users/me');
    return response.data;
  },
};
