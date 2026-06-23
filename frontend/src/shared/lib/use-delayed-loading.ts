'use client';

import { useState, useEffect } from 'react';

/**
 * isFetching が指定時間以上続いた場合にスケルトンを表示するフック。
 * フィルター・ソート変更時のレスポンスが遅い場合のみスケルトンを挟む。
 *
 * @param isFetching - React Query の isFetching フラグ
 * @param delayMs - スケルトンを表示するまでの遅延時間（デフォルト 500ms）
 */
export function useDelayedLoading(isFetching: boolean, delayMs = 500): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!isFetching) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), delayMs);
    return () => clearTimeout(timer);
  }, [isFetching, delayMs]);

  return showSkeleton;
}
