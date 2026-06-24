import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';

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

// リクエストインターセプター
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
