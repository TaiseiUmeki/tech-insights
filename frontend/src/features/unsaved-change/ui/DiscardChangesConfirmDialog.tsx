'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/shadcn/ui/alert-dialog';

interface DiscardChangesConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DiscardChangesConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: DiscardChangesConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-center'>
            未保存の変更があります
          </AlertDialogTitle>
          <AlertDialogDescription className='text-center'>
            変更を破棄してモーダルを閉じますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='mt-4 gap-2 sm:justify-center'>
          <AlertDialogCancel onClick={onCancel}>戻る</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className='bg-red-600 hover:bg-red-700'
          >
            変更を破棄
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
