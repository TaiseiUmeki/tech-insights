'use client';

import { useCallback, useState, useMemo } from 'react';

function shallowFormEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const valA = a[key];
    const valB = b[key];

    if (Array.isArray(valA) && Array.isArray(valB)) {
      if (valA.length !== valB.length || valA.some((v, i) => v !== valB[i])) {
        return false;
      }
    } else if (valA !== valB) {
      return false;
    }
  }
  return true;
}

export function useFormDirty(
  currentData: Record<string, unknown>,
  isActive: boolean,
) {
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(
    null,
  );

  const setInitialSnapshot = useCallback((data: Record<string, unknown>) => {
    setSnapshot({ ...data });
  }, []);

  const isDirty = useMemo(() => {
    if (!isActive || snapshot === null) return false;
    return !shallowFormEqual(currentData, snapshot);
  }, [currentData, isActive, snapshot]);

  return { isDirty, setInitialSnapshot };
}
