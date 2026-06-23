interface ShowcaseSectionProps {
  id: string;
  title: string;
  filePath: string;
  children: React.ReactNode;
  usages?: string[];
}

export function ShowcaseSection({
  id,
  title,
  filePath,
  children,
  usages,
}: ShowcaseSectionProps) {
  return (
    <section id={id} className='scroll-mt-20 rounded-lg border bg-card p-6'>
      <div className='mb-4 space-y-1'>
        <h3 className='text-lg font-semibold'>{title}</h3>
        <p className='font-mono text-sm text-muted-foreground'>{filePath}</p>
      </div>

      <div className='mb-4 rounded-md border bg-background p-4'>{children}</div>

      {usages && usages.length > 0 && (
        <div>
          <p className='mb-2 text-sm font-medium text-muted-foreground'>
            使用箇所
          </p>
          <ul className='space-y-1'>
            {usages.map((usage) => (
              <li
                key={usage}
                className='font-mono text-sm text-muted-foreground'
              >
                {usage}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
