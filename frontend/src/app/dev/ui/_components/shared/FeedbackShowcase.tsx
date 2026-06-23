'use client';

import { toast } from 'sonner';
import { ShowcaseSection } from '../ShowcaseSection';
import { NoData } from '@/shared/ui/components/empty-design';
import { Skeleton } from '@/shared/ui/shadcn/ui/skeleton';
import { Spinner } from '@/shared/ui/shadcn/ui/spinner';
import { Button } from '@/shared/ui/shadcn/ui/button';

export function FeedbackShowcase() {
  return (
    <>
      <ShowcaseSection
        id='no-data'
        title='NoData'
        filePath='src/shared/ui/components/empty-design/NoData.tsx'
      >
        <NoData
          title='データが見つかりません'
          description='条件を変更して再度お試しください'
        />
      </ShowcaseSection>

      <ShowcaseSection
        id='skeleton'
        title='Skeleton'
        filePath='src/shared/ui/shadcn/ui/skeleton.tsx'
      >
        <div className='space-y-3'>
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
          <Skeleton className='h-32 w-full' />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='spinner'
        title='Spinner'
        filePath='src/shared/ui/shadcn/ui/spinner.tsx'
      >
        <div className='flex items-center gap-4'>
          <Spinner />
          <span className='text-sm text-muted-foreground'>読み込み中...</span>
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        id='toast'
        title='Toast (sonner)'
        filePath='src/shared/ui/shadcn/ui/sonner.tsx'
      >
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => toast.success('保存しました')}
          >
            Success
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() =>
              toast.error('エラーが発生しました', {
                description: '詳細なエラーメッセージ',
              })
            }
          >
            Error
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => toast.warning('注意が必要です')}
          >
            Warning
          </Button>
          <Button
            size='sm'
            variant='outline'
            onClick={() => toast.info('お知らせ')}
          >
            Info
          </Button>
        </div>
      </ShowcaseSection>
    </>
  );
}
