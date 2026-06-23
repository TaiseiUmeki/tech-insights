'use client';

import { useCallback, useState } from 'react';
import { useFormDirty } from './use-form-dirty';
import { useRegisterUnsavedChanges } from './use-register-unsaved-changes';
import { DiscardChangesConfirmDialog } from '../ui/DiscardChangesConfirmDialog';

export function useModalFormDirty(
  currentData: Record<string, unknown>,
  isActive: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const { isDirty, setInitialSnapshot } = useFormDirty(currentData, isActive);
  useRegisterUnsavedChanges(isDirty);

  const [showConfirm, setShowConfirm] = useState(false);

  const guardedOnOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        onOpenChange(true);
        return;
      }
      if (isDirty) {
        setShowConfirm(true);
      } else {
        onOpenChange(false);
      }
    },
    [isDirty, onOpenChange],
  );

  const discardConfirmDialog = (
    <DiscardChangesConfirmDialog
      open={showConfirm}
      onCancel={() => setShowConfirm(false)}
      onConfirm={() => {
        setShowConfirm(false);
        onOpenChange(false);
      }}
    />
  );

  return {
    isDirty,
    setInitialSnapshot,
    guardedOnOpenChange,
    /** 保存成功後など、dirty チェックなしでモーダルを閉じる */
    forceClose: () => onOpenChange(false),
    discardConfirmDialog,
  };
}
