import { Search, X } from 'lucide-react';
import type { SearchMode } from '@/entities/article/model/api-types';
import type { AuthorResponse } from '@/entities/author/model/api-types';
import type { CategoryResponse } from '@/entities/category/model/api-types';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';

const modes: { value: SearchMode; label: string }[] = [
  { value: 'keyword', label: 'キーワード' },
  { value: 'semantic', label: 'セマンティック' },
  { value: 'hybrid', label: 'ハイブリッド' },
];

export function SearchToolbar({
  query,
  mode,
  categoryId,
  authorId,
  categories,
  authors,
  onQueryChange,
  onModeChange,
  onCategoryChange,
  onAuthorChange,
  onClear,
}: {
  query: string;
  mode: SearchMode;
  categoryId?: number;
  authorId?: number;
  categories: CategoryResponse[];
  authors: AuthorResponse[];
  onQueryChange: (value: string) => void;
  onModeChange: (value: SearchMode) => void;
  onCategoryChange: (value: number | undefined) => void;
  onAuthorChange: (value: number | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 shadow-sm focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100'>
        <Search className='h-4 w-4 text-blue-600' />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder='PostgreSQL、APIの応答が遅い原因を調べたい'
          className='h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0'
        />
        {query && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={onClear}
          >
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <div className='inline-flex rounded-lg bg-slate-100 p-1'>
          {modes.map((item) => (
            <button
              key={item.value}
              type='button'
              onClick={() => onModeChange(item.value)}
              className={`h-7 rounded-md px-3 text-xs font-medium ${
                mode === item.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select
          value={categoryId ?? ''}
          onChange={(event) =>
            onCategoryChange(
              event.target.value ? Number(event.target.value) : undefined,
            )
          }
          className='h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600'
        >
          <option value=''>すべてのカテゴリ</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={authorId ?? ''}
          onChange={(event) =>
            onAuthorChange(
              event.target.value ? Number(event.target.value) : undefined,
            )
          }
          className='h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600'
        >
          <option value=''>すべての著者</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
