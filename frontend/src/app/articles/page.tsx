import { Suspense } from 'react';
import { ArticleHomeContainer } from '@/page-components/article/home/ui/ArticleHomeContainer';

export default function ArticlesPage() {
  return (
    <Suspense fallback={null}>
      <ArticleHomeContainer />
    </Suspense>
  );
}
