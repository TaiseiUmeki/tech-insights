'use client';

import { useState } from 'react';
import { ShowcaseSection } from '../ShowcaseSection';
import type { SearchMode } from '@/entities/article/model/api-types';
import { ArticleCard } from '@/widgets/article-card/ui/ArticleCard';
import { ArticleDeleteDialog } from '@/widgets/article-delete-dialog/ui/ArticleDeleteDialog';
import { ArticleDetailModal } from '@/widgets/article-detail-modal/ui/ArticleDetailModal';
import { ArticleForm } from '@/widgets/article-form/ui/ArticleForm';
import {
  ArticleEmptyState,
  ArticleErrorState,
} from '@/widgets/empty-state/ui/ArticleEmptyState';
import { SearchToolbar } from '@/widgets/search-toolbar/ui/SearchToolbar';

const mockArticle = {
  id: 1,
  sourceArticleId: 101,
  title: 'Designing PostgreSQL indexes for semantic search',
  snippet:
    'Keyword search, vector search, and reciprocal rank fusion are combined to improve discovery quality.',
  category: { id: 1, name: 'Backend' },
  author: { id: 1, name: 'Sato' },
  publishedAt: '2025-09-27T06:00:00Z',
  score: 0.82,
};

const categories = [
  { id: 1, name: 'Backend' },
  { id: 2, name: 'Frontend' },
  { id: 3, name: 'AI/ML' },
];

const authors = [
  { id: 1, name: 'Sato' },
  { id: 2, name: 'Ito' },
];

export function ArticleWidgetsShowcase() {
  const [query, setQuery] = useState('PostgreSQL');
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [categoryId, setCategoryId] = useState<number | undefined>(1);
  const [authorId, setAuthorId] = useState<number | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <ShowcaseSection
        id='article-card'
        title='ArticleCard'
        filePath='src/widgets/article-card/ui/ArticleCard.tsx'
        usages={[
          'src/page-components/article/home/ui/ArticleHomeContainer.tsx',
        ]}
      >
        <div className='max-w-md'>
          <ArticleCard article={mockArticle} onClick={() => undefined} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='search-toolbar'
        title='SearchToolbar'
        filePath='src/widgets/search-toolbar/ui/SearchToolbar.tsx'
        usages={[
          'src/page-components/article/home/ui/ArticleHomeContainer.tsx',
        ]}
      >
        <SearchToolbar
          query={query}
          mode={mode}
          categoryId={categoryId}
          authorId={authorId}
          categories={categories}
          authors={authors}
          onQueryChange={setQuery}
          onModeChange={setMode}
          onCategoryChange={setCategoryId}
          onAuthorChange={setAuthorId}
          onClear={() => {
            setQuery('');
            setCategoryId(undefined);
            setAuthorId(undefined);
            setMode('keyword');
          }}
        />
      </ShowcaseSection>

      <ShowcaseSection
        id='article-empty-state'
        title='ArticleEmptyState'
        filePath='src/widgets/empty-state/ui/ArticleEmptyState.tsx'
        usages={[
          'src/page-components/article/home/ui/ArticleHomeContainer.tsx',
        ]}
      >
        <ArticleEmptyState query='PostgreSQL' onClear={() => undefined} />
      </ShowcaseSection>

      <ShowcaseSection
        id='article-error-state'
        title='ArticleErrorState'
        filePath='src/widgets/empty-state/ui/ArticleEmptyState.tsx'
        usages={[
          'src/page-components/article/home/ui/ArticleHomeContainer.tsx',
        ]}
      >
        <ArticleErrorState onRetry={() => undefined} />
      </ShowcaseSection>

      <ShowcaseSection
        id='article-form'
        title='ArticleForm'
        filePath='src/widgets/article-form/ui/ArticleForm.tsx'
        usages={[
          'src/page-components/article/home/ui/ArticleHomeContainer.tsx',
        ]}
      >
        <ArticleForm
          isSubmitting={false}
          onSubmit={() => undefined}
          onCancel={() => undefined}
        />
      </ShowcaseSection>

      <ShowcaseSection
        id='article-delete-dialog'
        title='ArticleDeleteDialog'
        filePath='src/widgets/article-delete-dialog/ui/ArticleDeleteDialog.tsx'
        usages={[
          'src/page-components/article/home/ui/ArticleHomeContainer.tsx',
        ]}
      >
        <button
          type='button'
          onClick={() => setDeleteOpen(true)}
          className='rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90'
        >
          記事削除ダイアログを開く
        </button>
        <ArticleDeleteDialog
          open={deleteOpen}
          isDeleting={false}
          onOpenChange={setDeleteOpen}
          onConfirm={() => setDeleteOpen(false)}
        />
      </ShowcaseSection>

      <ShowcaseSection
        id='article-detail-modal'
        title='ArticleDetailModal'
        filePath='src/widgets/article-detail-modal/ui/ArticleDetailModal.tsx'
        usages={[
          'src/page-components/article/home/ui/ArticleHomeContainer.tsx',
        ]}
      >
        <div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
          ArticleDetailModal
          は記事ID指定時にAPI取得するため、このshowcaseでは未表示状態で登録しています。
        </div>
        <ArticleDetailModal
          articleId={null}
          open={false}
          onOpenChange={() => undefined}
          onEdit={() => undefined}
          onDelete={() => undefined}
        />
      </ShowcaseSection>
    </>
  );
}
