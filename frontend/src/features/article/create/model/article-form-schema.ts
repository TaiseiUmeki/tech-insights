import { z } from 'zod';

export const articleFormSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255),
  content: z.string().min(1, '本文は必須です'),
  authorName: z.string().min(1, '著者は必須です'),
  categoryName: z.string().min(1, 'カテゴリは必須です'),
  publishedAt: z.string().min(1, '公開日時は必須です'),
});

export type ArticleFormData = z.infer<typeof articleFormSchema>;
