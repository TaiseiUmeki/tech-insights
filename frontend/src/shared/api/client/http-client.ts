import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';
import { ENABLE_AUTH } from '@/shared/config/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Axiosインスタンス作成
const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cookieを送信
});

// リクエストインターセプター（CSRF トークン付与や認証ヘッダー追加等の拡張ポイント）
httpClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// レスポンスインターセプター
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // 401エラー: 認証エラー時はログインページへリダイレクト（認証が有効な場合のみ）
      if (error.response.status === 401 && ENABLE_AUTH) {
        // /auth/status以外のエンドポイントで401エラーが発生した場合のみリダイレクト
        const isAuthStatusRequest = error.config?.url?.includes('/auth/status');
        if (!isAuthStatusRequest && typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      // 403エラー: アクセス権限がない場合はトースト通知
      if (error.response.status === 403) {
        if (typeof window !== 'undefined') {
          const detail = (error.response.data as { detail?: string })?.detail;
          toast.error('アクセス権限がありません', {
            description: detail || 'この操作を実行する権限がありません。',
          });
        }
      }
    }

    return Promise.reject(error);
  },
);

export { httpClient };
