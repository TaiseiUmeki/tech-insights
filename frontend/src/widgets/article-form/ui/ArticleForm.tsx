import { useEffect, useState } from 'react';
import type { ArticleDetailResponse } from '@/entities/article/model/api-types';
import type { ArticleFormData } from '@/features/article/create/model/article-form-schema';
import { articleFormSchema } from '@/features/article/create/model/article-form-schema';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Textarea } from '@/shared/ui/shadcn/ui/textarea';

function toLocalInputValue(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 16);
  }
  return new Date(value).toISOString().slice(0, 16);
}

export function ArticleForm({
  initialArticle,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  initialArticle?: ArticleDetailResponse | null;
  isSubmitting: boolean;
  onSubmit: (data: ArticleFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    content: '',
    authorName: '',
    categoryName: '',
    publishedAt: toLocalInputValue(),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialArticle) {
      return;
    }
    setFormData({
      title: initialArticle.title,
      content: initialArticle.content,
      authorName: initialArticle.author.name,
      categoryName: initialArticle.category.name,
      publishedAt: toLocalInputValue(initialArticle.publishedAt),
    });
  }, [initialArticle]);

  const update = (key: keyof ArticleFormData, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className='space-y-4'
      onSubmit={(event) => {
        event.preventDefault();
        const result = articleFormSchema.safeParse(formData);
        if (!result.success) {
          setError(
            result.error.errors[0]?.message ?? '入力内容を確認してください',
          );
          return;
        }
        setError(null);
        onSubmit(result.data);
      }}
    >
      {error && (
        <div className='rounded-md bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </div>
      )}
      <div className='space-y-1.5'>
        <label className='text-xs font-medium text-slate-600'>タイトル</label>
        <Input
          value={formData.title}
          onChange={(event) => update('title', event.target.value)}
        />
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-slate-600'>カテゴリ</label>
          <Input
            value={formData.categoryName}
            onChange={(event) => update('categoryName', event.target.value)}
          />
        </div>
        <div className='space-y-1.5'>
          <label className='text-xs font-medium text-slate-600'>著者</label>
          <Input
            value={formData.authorName}
            onChange={(event) => update('authorName', event.target.value)}
          />
        </div>
      </div>
      <div className='space-y-1.5'>
        <label className='text-xs font-medium text-slate-600'>公開日時</label>
        <Input
          type='datetime-local'
          value={formData.publishedAt}
          onChange={(event) => update('publishedAt', event.target.value)}
        />
      </div>
      <div className='space-y-1.5'>
        <label className='text-xs font-medium text-slate-600'>本文</label>
        <Textarea
          value={formData.content}
          onChange={(event) => update('content', event.target.value)}
          className='min-h-[180px]'
        />
      </div>
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='outline' onClick={onCancel}>
          キャンセル
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          保存
        </Button>
      </div>
    </form>
  );
}
