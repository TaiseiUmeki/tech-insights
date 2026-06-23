'use client';

import { useState, useEffect, type KeyboardEvent } from 'react';

/**
 * 検索バーでEnterキー確定の挙動を実現するフック。
 * 入力中はローカルstateのみ更新し、Enterキー押下時にonSearchを呼ぶ。
 */
export function useEnterSearch(
  externalValue: string,
  onSearch: (value: string) => void,
) {
  const [localValue, setLocalValue] = useState(externalValue);

  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(localValue);
    }
  };

  const clear = () => {
    setLocalValue('');
    onSearch('');
  };

  return { localValue, setLocalValue, handleKeyDown, clear };
}
