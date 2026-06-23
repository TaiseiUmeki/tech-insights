import { ShowcaseSection } from '../ShowcaseSection';

export function ShadcnShowcase() {
  return (
    <ShowcaseSection
      id='shadcn'
      title='Shadcn UI'
      filePath='src/shared/ui/shadcn/'
    >
      <p className='text-sm text-muted-foreground'>
        Shadcn UI コンポーネントの詳細は公式ドキュメントを参照してください。
      </p>
      <a
        href='https://ui.shadcn.com/docs/components'
        target='_blank'
        rel='noopener noreferrer'
        className='mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80'
      >
        Shadcn UI - Components
      </a>
    </ShowcaseSection>
  );
}
