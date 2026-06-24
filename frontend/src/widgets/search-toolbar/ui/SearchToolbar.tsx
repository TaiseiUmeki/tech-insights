import { Search, X } from 'lucide-react';
import type { SearchMode } from '@/entities/article/model/api-types';
import type { AuthorResponse } from '@/entities/author/model/api-types';
import type { CategoryResponse } from '@/entities/category/model/api-types';
import { Button } from '@/shared/ui/shadcn/ui/button';
import { Input } from '@/shared/ui/shadcn/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shared/ui/shadcn/ui/toggle-group';

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
        <ToggleGroup
          type='single'
          value={mode}
          onValueChange={(value) => {
            if (value) {
              onModeChange(value as SearchMode);
            }
          }}
          aria-label='検索モード'
          className='rounded-lg bg-slate-100 p-1'
        >
          {modes.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              aria-label={item.label}
              className='h-7 rounded-md border-0 px-3 text-xs font-medium text-slate-500 shadow-none data-[state=on]:bg-white data-[state=on]:text-slate-900 data-[state=on]:shadow-sm'
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Select
          value={categoryId ? String(categoryId) : 'all'}
          onValueChange={(value) =>
            onCategoryChange(value === 'all' ? undefined : Number(value))
          }
        >
          <SelectTrigger
            aria-label='カテゴリ'
            className='h-8 w-[160px] bg-white text-xs text-slate-600'
          >
            <SelectValue placeholder='すべてのカテゴリ' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>すべてのカテゴリ</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={authorId ? String(authorId) : 'all'}
          onValueChange={(value) =>
            onAuthorChange(value === 'all' ? undefined : Number(value))
          }
        >
          <SelectTrigger
            aria-label='著者'
            className='h-8 w-[140px] bg-white text-xs text-slate-600'
          >
            <SelectValue placeholder='すべての著者' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>すべての著者</SelectItem>
            {authors.map((author) => (
              <SelectItem key={author.id} value={String(author.id)}>
                {author.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
