'use client';

import { useState } from 'react';
import { ShowcaseSection } from '../ShowcaseSection';
import { SimpleDeleteConfirmModal } from '@/shared/ui/components/delete-confirm-modal';

export function DialogsShowcase() {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <ShowcaseSection
      id='delete-confirm-modal'
      title='SimpleDeleteConfirmModal'
      filePath='src/shared/ui/components/delete-confirm-modal/ui/SimpleDeleteConfirmModal.tsx'
    >
      <button
        onClick={() => setDeleteOpen(true)}
        className='rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90'
      >
        削除ダイアログを開く
      </button>
      <SimpleDeleteConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName='サンプルアイテム'
        onConfirm={() => setDeleteOpen(false)}
      />
    </ShowcaseSection>
  );
}
