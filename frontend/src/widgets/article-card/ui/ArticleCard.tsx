import type { ArticleListItemResponse } from '@/entities/article/model/api-types';

const categoryClass: Record<string, string> = {
  Backend: 'bg-blue-100 text-blue-800',
  Frontend: 'bg-purple-100 text-purple-800',
  DevOps: 'bg-amber-100 text-amber-800',
  'AI/ML': 'bg-emerald-100 text-emerald-800',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function scoreLabel(score: number | null) {
  if (score === null) {
    return null;
  }
  return `${Math.round(score * 100)}%`;
}

export function ArticleCard({
  article,
  onClick,
}: {
  article: ArticleListItemResponse;
  onClick: () => void;
}) {
  const score = scoreLabel(article.score);

  return (
    <button
      type='button'
      onClick={onClick}
      className='flex min-h-[170px] w-full flex-col gap-2 rounded-lg border border-slate-200 bg-white p-[18px] text-left shadow-sm transition hover:border-blue-200 hover:shadow-md'
    >
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${categoryClass[article.category.name] ?? 'bg-slate-100 text-slate-700'}`}
          >
            {article.category.name}
          </span>
          {score && (
            <span className='rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700'>
              {score}
            </span>
          )}
        </div>
        <span className='shrink-0 text-[11px] text-slate-400'>
          {formatDate(article.publishedAt)}
        </span>
      </div>

      <div className='line-clamp-2 text-sm font-semibold leading-snug text-slate-900'>
        {article.title}
      </div>
      <div className='line-clamp-2 text-xs leading-relaxed text-slate-500'>
        {article.snippet}
      </div>

      <div className='mt-auto flex items-center gap-2 border-t border-slate-100 pt-2.5'>
        <div className='flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600'>
          {article.author.name.charAt(0)}
        </div>
        <span className='text-xs text-slate-600'>{article.author.name}</span>
      </div>
    </button>
  );
}
