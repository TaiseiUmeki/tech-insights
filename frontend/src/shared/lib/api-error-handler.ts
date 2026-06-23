import axios from 'axios';
import { toast } from 'sonner';

interface ApiError {
  response?: {
    status?: number;
    data?: {
      detail?: string | Array<{ msg?: string; [key: string]: unknown }>;
    };
  };
  message?: string;
}

function extractDetail(
  detail: string | Array<{ msg?: string; [key: string]: unknown }> | undefined,
): string | undefined {
  if (!detail) return undefined;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((e) => e.msg || '').filter(Boolean);
    return msgs.length > 0 ? msgs.join(' / ') : undefined;
  }
  return undefined;
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
}

/**
 * API エラーの汎用ハンドラー。
 * 403 エラーは HTTP クライアントインターセプターで処理済みのためスキップする。
 * @returns true: 403 エラー（処理済み）、false: それ以外
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string,
): boolean {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return true;

    toast.error(defaultMessage, {
      description: error.response?.data?.detail || error.message,
    });
    return false;
  }

  if (isApiError(error)) {
    if (error.response?.status === 403) return true;

    toast.error(defaultMessage, {
      description:
        extractDetail(error.response?.data?.detail) || error.message,
    });
    return false;
  }

  const message = error instanceof Error ? error.message : undefined;
  toast.error(defaultMessage, { description: message });
  return false;
}

/**
 * Mutation エラーのハンドラー（try/catch ブロック用）。
 * 403 エラーはスキップし、バリデーションエラー配列を結合して表示する。
 */
export function handleMutationError(err: unknown, label: string): void {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 403) return;

    const description =
      extractDetail(err.response?.data?.detail) ?? err.message;

    toast.error(`${label}に失敗しました`, { description });
    return;
  }

  toast.error(`${label}に失敗しました`, {
    description: '不明なエラーが発生しました',
  });
}
