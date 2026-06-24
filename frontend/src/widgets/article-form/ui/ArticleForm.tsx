import { useEffect, useState } from 'react';
import type { ArticleDetailResponse } from '@/entities/article/model/api-types';
import type { AuthorResponse } from '@/entities/author/model/api-types';
import type { CategoryResponse } from '@/entities/category/model/api-types';
import type { ArticleFormData } from '@/features/article/create/model/article-form-schema';
import { articleFormSchema } from '@/features/article/create/model/article-form-schema';
import { SelectField } from '@/shared/ui/form-fields';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import { Textarea } from '@/shared/ui/shadcn/ui/textarea';

function toLocalInputValue(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 16);
  }
  return new Date(value).toISOString().slice(0, 16);
}

function withCurrentOption<T extends { id: number; name: string }>(
  options: T[],
  currentName: string,
) {
  if (!currentName || options.some((option) => option.name === currentName)) {
    return options;
  }
  return [{ id: 0, name: currentName } as T, ...options];
}

export function ArticleForm({
  initialArticle,
  authors = [],
  categories = [],
  useMasterSelects = false,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  initialArticle?: ArticleDetailResponse | null;
  authors?: AuthorResponse[];
  categories?: CategoryResponse[];
  useMasterSelects?: boolean;
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

  const categoryOptions = withCurrentOption(categories, formData.categoryName);
  const authorOptions = withCurrentOption(authors, formData.authorName);
  const categorySelectOptions = categoryOptions.map((category) => ({
    value: category.name,
    label: category.name,
  }));
  const authorSelectOptions = authorOptions.map((author) => ({
    value: author.name,
    label: author.name,
  }));

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
        {useMasterSelects ? (
          <SelectField
            id='article-category'
            label='カテゴリ'
            value={formData.categoryName}
            onChange={(value) => update('categoryName', value)}
            options={categorySelectOptions}
            placeholder='カテゴリを選択'
            className='space-y-1.5'
          />
        ) : (
          <div className='space-y-1.5'>
            <label className='text-xs font-medium text-slate-600'>
              カテゴリ
            </label>
            <Input
              value={formData.categoryName}
              onChange={(event) => update('categoryName', event.target.value)}
            />
          </div>
        )}
        {useMasterSelects ? (
          <SelectField
            id='article-author'
            label='著者'
            value={formData.authorName}
            onChange={(value) => update('authorName', value)}
            options={authorSelectOptions}
            placeholder='著者を選択'
            className='space-y-1.5'
          />
        ) : (
          <div className='space-y-1.5'>
            <label className='text-xs font-medium text-slate-600'>著者</label>
            <Input
              value={formData.authorName}
              onChange={(event) => update('authorName', event.target.value)}
            />
          </div>
        )}
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
