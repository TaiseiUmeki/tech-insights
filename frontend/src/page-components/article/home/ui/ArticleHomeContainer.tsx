'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { SearchMode } from '@/entities/article/model/api-types';
import { useCreateArticle } from '@/features/article/create/lib/use-create-article';
import type { ArticleFormData } from '@/features/article/create/model/article-form-schema';
import { useDeleteArticle } from '@/features/article/delete/lib/use-delete-article';
import { useGetArticle } from '@/features/article/get/lib/use-get-article';
import { useSearchArticles } from '@/features/article/search/lib/use-search-articles';
import { useUpdateArticle } from '@/features/article/update/lib/use-update-article';
import { useListAuthors } from '@/features/author/list/lib/use-list-authors';
import { useListCategories } from '@/features/category/list/lib/use-list-categories';
import { ArticleCard } from '@/widgets/article-card/ui/ArticleCard';
import { ArticleDeleteDialog } from '@/widgets/article-delete-dialog/ui/ArticleDeleteDialog';
import { ArticleDetailModal } from '@/widgets/article-detail-modal/ui/ArticleDetailModal';
import { ArticleForm } from '@/widgets/article-form/ui/ArticleForm';
import {
  ArticleEmptyState,
  ArticleErrorState,
} from '@/widgets/empty-state/ui/ArticleEmptyState';
import { SearchToolbar } from '@/widgets/search-toolbar/ui/SearchToolbar';
import { Button } from '@/shared/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/ui/dialog';

const PAGE_LIMIT = 12;

function toRequest(data: ArticleFormData) {
  return {
    title: data.title,
    content: data.content,
    authorName: data.authorName,
    categoryName: data.categoryName,
    publishedAt: new Date(data.publishedAt).toISOString(),
  };
}

export function ArticleHomeContainer() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('keyword');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [authorId, setAuthorId] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [detailArticleId, setDetailArticleId] = useState<number | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<number | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  const searchState = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      q: query,
      searchMode,
      categoryId,
      authorId,
    }),
    [authorId, categoryId, page, query, searchMode],
  );

  const articlesQuery = useSearchArticles(searchState);
  const categoriesQuery = useListCategories();
  const authorsQuery = useListAuthors();
  const editingArticleQuery = useGetArticle(editingArticleId);
  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();
  const deleteMutation = useDeleteArticle();

  const articles = articlesQuery.data?.items ?? [];
  const total = articlesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const hasCondition = Boolean(query || categoryId || authorId);

  const resetPage = () => setPage(1);
  const clearConditions = () => {
    setQuery('');
    setCategoryId(undefined);
    setAuthorId(undefined);
    setSearchMode('keyword');
    setPage(1);
  };

  return (
    <main className='min-h-screen bg-slate-50'>
      <div className='mx-auto flex max-w-[1180px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8'>
        <header className='flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-xl font-bold text-slate-900'>TechInsights</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className='mr-1.5 h-4 w-4' />
            新規作成
          </Button>
        </header>

        <SearchToolbar
          query={query}
          mode={searchMode}
          categoryId={categoryId}
          authorId={authorId}
          categories={categoriesQuery.data?.items ?? []}
          authors={authorsQuery.data?.items ?? []}
          onQueryChange={(value) => {
            setQuery(value);
            resetPage();
          }}
          onModeChange={(value) => {
            setSearchMode(value);
            resetPage();
          }}
          onCategoryChange={(value) => {
            setCategoryId(value);
            resetPage();
          }}
          onAuthorChange={(value) => {
            setAuthorId(value);
            resetPage();
          }}
          onClear={clearConditions}
        />

        {articlesQuery.isLoading && (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className='h-[170px] animate-pulse rounded-lg border border-slate-200 bg-white'
              />
            ))}
          </div>
        )}

        {articlesQuery.isError && (
          <ArticleErrorState onRetry={() => articlesQuery.refetch()} />
        )}

        {!articlesQuery.isLoading &&
          !articlesQuery.isError &&
          articles.length === 0 && (
            <ArticleEmptyState query={query} onClear={clearConditions} />
          )}

        {articles.length > 0 && (
          <>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => setDetailArticleId(article.id)}
                />
              ))}
            </div>

            <div className='flex items-center justify-between text-sm text-slate-500'>
              <span>
                {total}件中 {page} / {totalPages} ページ
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  前へ
                </Button>
                <Button
                  variant='outline'
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                >
                  次へ
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <ArticleDetailModal
        articleId={detailArticleId}
        open={detailArticleId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailArticleId(null);
        }}
        onEdit={(articleId) => {
          setDetailArticleId(null);
          setEditingArticleId(articleId);
        }}
        onDelete={(articleId) => {
          setDetailArticleId(null);
          setDeletingArticleId(articleId);
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='max-h-[86vh] overflow-y-auto sm:max-w-[680px]'>
          <DialogHeader>
            <DialogTitle>記事作成</DialogTitle>
          </DialogHeader>
          <ArticleForm
            isSubmitting={createMutation.isPending}
            onCancel={() => setCreateOpen(false)}
            onSubmit={(data) => {
              createMutation.mutate(toRequest(data), {
                onSuccess: () => setCreateOpen(false),
              });
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingArticleId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingArticleId(null);
        }}
      >
        <DialogContent className='max-h-[86vh] overflow-y-auto sm:max-w-[680px]'>
          <DialogHeader>
            <DialogTitle>記事編集</DialogTitle>
          </DialogHeader>
          <ArticleForm
            initialArticle={editingArticleQuery.data}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditingArticleId(null)}
            onSubmit={(data) => {
              if (!editingArticleId) return;
              updateMutation.mutate(
                { articleId: editingArticleId, data: toRequest(data) },
                { onSuccess: () => setEditingArticleId(null) },
              );
            }}
          />
        </DialogContent>
      </Dialog>

      <ArticleDeleteDialog
        open={deletingArticleId !== null}
        isDeleting={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeletingArticleId(null);
        }}
        onConfirm={() => {
          if (!deletingArticleId) return;
          deleteMutation.mutate(deletingArticleId, {
            onSuccess: () => setDeletingArticleId(null),
          });
        }}
      />
    </main>
  );
}
