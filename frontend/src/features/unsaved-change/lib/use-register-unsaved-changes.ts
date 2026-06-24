'use client';

import { useEffect, useId } from 'react';
import { useUnsavedChangesStore } from '../model/unsaved-changes-store';

/**
 * 未保存の変更をグローバルに登録するフック
 *
 * ページ離脱時（リンククリック、ブラウザバック、リロード等）に
 * 未保存の変更がある場合、確認ダイアログを表示します。
 *
 * @param hasChanges - 未保存の変更があるかどうか
 * @param onDiscard - 変更破棄時に実行するコールバック（キャッシュクリアなど）
 *
 * @example
 * 基本的な使い方
 * ```tsx
 * function EditPage() {
 *   const { hasChanges } = useEditForm();
 *   useRegisterUnsavedChanges(hasChanges);
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example
 * 破棄時にキャッシュクリアなどの処理を行う場合
 * ```tsx
 * function TableSection() {
 *   const { hasChanges, clearCache } = useBatchUpdate();
 *   useRegisterUnsavedChanges(hasChanges, () => {
 *     clearCache();
 *   });
 *   return <div>...</div>;
 * }
 * ```
 *
 * @remarks
 * - ダイアログUIは利用画面側に配置する
 * - 複数コンポーネントで同時に使用可能（内部でIDで管理）
 * - コンポーネントのアンマウント時に自動で登録解除
 */
export function useRegisterUnsavedChanges(
  hasChanges: boolean,
  onDiscard?: () => void,
) {
  const id = useId();
  const register = useUnsavedChangesStore((s) => s.register);
  const unregister = useUnsavedChangesStore((s) => s.unregister);

  useEffect(() => {
    if (hasChanges) {
      register(id, onDiscard);
    } else {
      unregister(id);
    }

    return () => {
      unregister(id);
    };
  }, [hasChanges, id, onDiscard, register, unregister]);
}
