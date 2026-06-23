'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  useUnsavedChangesStore,
  selectHasUnsavedChanges,
} from '../model/unsaved-changes-store';

/**
 * 未保存変更警告ダイアログ
 * layout.tsxに1つだけ配置する
 */
export function UnsavedChangesDialog() {
  const router = useRouter();
  const hasUnsavedChanges = useUnsavedChangesStore(selectHasUnsavedChanges);
  const showDialog = useUnsavedChangesStore((s) => s.showDialog);
  const openDialog = useUnsavedChangesStore((s) => s.openDialog);
  const closeDialog = useUnsavedChangesStore((s) => s.closeDialog);
  const discardAndNavigate = useUnsavedChangesStore(
    (s) => s.discardAndNavigate,
  );

  const hasInjectedHistoryRef = useRef(false);
  const isProgrammaticNavigationRef = useRef(false);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      if (hasInjectedHistoryRef.current) {
        hasInjectedHistoryRef.current = false;
      }
      return;
    }

    // 1. beforeunload: ブラウザ終了・リロード時
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      Reflect.set(e, 'returnValue', '');
    };

    // 2. popstate: ブラウザの戻る/進む
    const handlePopState = () => {
      if (isProgrammaticNavigationRef.current) {
        isProgrammaticNavigationRef.current = false;
        return;
      }

      window.history.pushState(null, '', window.location.href);
      hasInjectedHistoryRef.current = true;

      openDialog(() => {
        isProgrammaticNavigationRef.current = true;
        window.history.back();
        hasInjectedHistoryRef.current = false;
        setTimeout(() => {
          isProgrammaticNavigationRef.current = true;
          window.history.back();
        }, 0);
      });
    };

    // 3. click: 内部リンクのクリック
    const handleClick = (e: MouseEvent) => {
      const element = e.target instanceof Element ? e.target : null;
      const anchor = element?.closest<HTMLAnchorElement>('a[href]');
      const href = anchor?.getAttribute('href');

      if (
        !anchor ||
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('//') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      e.preventDefault();

      const destination = new URL(href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (destination.href === currentUrl.href) {
        return;
      }

      const nextPath =
        destination.pathname + destination.search + destination.hash;

      openDialog(() => {
        router.push(nextPath);
      });
    };

    // 履歴にダミーエントリを挿入
    if (!hasInjectedHistoryRef.current) {
      window.history.pushState(null, '', window.location.href);
      hasInjectedHistoryRef.current = true;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges, openDialog, router]);

  return (
    <AlertDialog
      open={showDialog}
      onOpenChange={(open) => !open && closeDialog()}
    >
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-center'>
            未保存の変更があります
          </AlertDialogTitle>
          <AlertDialogDescription className='text-center'>
            変更を破棄してページを離れますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='mt-4 gap-2 sm:justify-center'>
          <AlertDialogCancel onClick={closeDialog}>戻る</AlertDialogCancel>
          <AlertDialogAction
            onClick={discardAndNavigate}
            className='bg-red-600 hover:bg-red-700'
          >
            変更を破棄
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
