'use client';

import { SideNav } from './_components/SideNav';
import { DialogsShowcase } from './_components/shared/DialogsShowcase';
import { FeedbackShowcase } from './_components/shared/FeedbackShowcase';
import { FormFieldsShowcase } from './_components/shared/FormFieldsShowcase';
import { ShadcnShowcase } from './_components/shared/ShadcnShowcase';
import { ArticleWidgetsShowcase } from './_components/widgets/ArticleWidgetsShowcase';
import { NavigationShowcase } from './_components/widgets/NavigationShowcase';

const navSections = [
  {
    category: 'Dialogs',
    items: [{ id: 'delete-confirm-modal', label: 'DeleteConfirmModal' }],
  },
  {
    category: 'Feedback',
    items: [
      { id: 'no-data', label: 'NoData' },
      { id: 'skeleton', label: 'Skeleton' },
      { id: 'spinner', label: 'Spinner' },
      { id: 'toast', label: 'Toast' },
    ],
  },
  {
    category: 'Form Fields',
    items: [
      { id: 'text-field', label: 'TextField' },
      { id: 'password-field', label: 'PasswordField' },
      { id: 'email-field', label: 'EmailField' },
      { id: 'number-field', label: 'NumberField' },
      { id: 'phone-field', label: 'PhoneField' },
      { id: 'textarea-field', label: 'TextareaField' },
      { id: 'date-field', label: 'DateField' },
      { id: 'checkbox-field', label: 'CheckboxField' },
      { id: 'select-field', label: 'SelectField' },
    ],
  },
  {
    category: 'Navigation',
    items: [{ id: 'app-sidebar', label: 'AppSidebar' }],
  },
  {
    category: 'Article Widgets',
    items: [
      { id: 'article-card', label: 'ArticleCard' },
      { id: 'search-toolbar', label: 'SearchToolbar' },
      { id: 'article-empty-state', label: 'ArticleEmptyState' },
      { id: 'article-error-state', label: 'ArticleErrorState' },
      { id: 'article-form', label: 'ArticleForm' },
      { id: 'article-delete-dialog', label: 'ArticleDeleteDialog' },
      { id: 'article-detail-modal', label: 'ArticleDetailModal' },
    ],
  },
  {
    category: 'Shadcn',
    items: [{ id: 'shadcn', label: 'Shadcn UI (公式リンク)' }],
  },
];

export default function UIShowcasePage() {
  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-30 border-b bg-background/95 backdrop-blur'>
        <div className='mx-auto max-w-7xl px-6 py-4'>
          <h1 className='text-2xl font-bold'>UI Component Showcase</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            開発環境限定 — コンポーネント一覧と使用箇所
          </p>
        </div>
      </header>

      {/* Body */}
      <div className='mx-auto flex max-w-7xl gap-8 px-6 py-8'>
        {/* SideNav */}
        <aside className='hidden w-56 shrink-0 lg:block'>
          <SideNav sections={navSections} />
        </aside>

        {/* Main */}
        <main className='flex-1 space-y-6'>
          <DialogsShowcase />
          <FeedbackShowcase />
          <FormFieldsShowcase />
          <NavigationShowcase />
          <ArticleWidgetsShowcase />
          <ShadcnShowcase />
        </main>
      </div>
    </div>
  );
}
