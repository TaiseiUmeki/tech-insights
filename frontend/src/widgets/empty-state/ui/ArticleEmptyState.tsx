import { AlertCircle, Search } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/ui/button';

export function ArticleEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className='flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-200 bg-white px-6 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-[14px] bg-slate-100'>
        <Search className='h-8 w-8 text-slate-400' />
      </div>
      <div className='text-sm font-semibold text-slate-900'>
        検索結果が見つかりませんでした
      </div>
      <div className='max-w-md text-sm leading-relaxed text-slate-500'>
        {query
          ? `「${query}」に一致する記事はありません。別のキーワードや検索モードをお試しください。`
          : '表示できる記事がありません。'}
      </div>
      <Button type='button' variant='outline' onClick={onClear}>
        検索条件をクリア
      </Button>
    </div>
  );
}

export function ArticleErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-slate-200 bg-white px-6 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-[14px] bg-red-50'>
        <AlertCircle className='h-8 w-8 text-red-500' />
      </div>
      <div className='text-sm font-semibold text-slate-900'>
        記事を取得できませんでした
      </div>
      <div className='max-w-md text-sm leading-relaxed text-slate-500'>
        APIとの通信でエラーが発生しました。バックエンドの起動状態やネットワーク接続を確認してください。
      </div>
      <Button type='button' variant='outline' onClick={onRetry}>
        再読み込み
      </Button>
    </div>
  );
}
