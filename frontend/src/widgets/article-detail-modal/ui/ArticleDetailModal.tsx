import { Edit, Trash2, X } from 'lucide-react';
import {
  useGetArticle,
  useRelatedArticles,
} from '@/features/article/get/lib/use-get-article';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/ui/dialog';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function ArticleDetailModal({
  articleId,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  articleId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (articleId: number) => void;
  onDelete: (articleId: number) => void;
}) {
  const articleQuery = useGetArticle(open ? articleId : null);
  const relatedQuery = useRelatedArticles(open ? articleId : null, 3);
  const article = articleQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[86vh] overflow-y-auto sm:max-w-[680px]'>
        <DialogHeader>
          <DialogTitle className='pr-8 text-lg leading-snug'>
            {article?.title ?? '記事詳細'}
          </DialogTitle>
        </DialogHeader>
        {!article && (
          <div className='py-10 text-center text-sm text-slate-500'>
            記事を読み込み中...
          </div>
        )}
        {article && (
          <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800'>
                {article.category.name}
              </span>
              <div className='flex items-center gap-1.5'>
                <div className='flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-600'>
                  {article.author.name.charAt(0)}
                </div>
                <span className='text-xs text-slate-600'>
                  {article.author.name}
                </span>
              </div>
              <span className='text-xs text-slate-400'>
                {formatDate(article.publishedAt)} 公開
              </span>
              {article.sourceArticleId && (
                <span className='rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-400'>
                  source_article_id: {article.sourceArticleId}
                </span>
              )}
            </div>
            <div className='border-t border-slate-200' />
            <div className='whitespace-pre-wrap text-sm leading-8 text-slate-600'>
              {article.content}
            </div>
            <div className='border-t border-slate-200' />
            <div>
              <div className='mb-2 text-sm font-semibold text-slate-900'>
                関連記事
              </div>
              <div className='grid gap-2 sm:grid-cols-3'>
                {relatedQuery.data?.items.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    className='rounded-md border border-slate-200 p-3 text-left hover:border-blue-200'
                  >
                    <span className='rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800'>
                      {item.category.name}
                    </span>
                    <div className='mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-slate-900'>
                      {item.title}
                    </div>
                    <div className='mt-1 text-[11px] text-slate-400'>
                      {item.author.name} · {formatDate(item.publishedAt)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className='border-t border-slate-200' />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => onEdit(article.id)}>
                <Edit className='mr-1.5 h-4 w-4' />
                編集
              </Button>
              <Button
                variant='destructive'
                onClick={() => onDelete(article.id)}
              >
                <Trash2 className='mr-1.5 h-4 w-4' />
                削除
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
