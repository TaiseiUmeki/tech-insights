import type { Metadata } from 'next';

/**
 * 環境に応じたメタデータを生成
 */
export function generateMetadata(): Metadata {
  const environment = process.env.NODE_ENV;

  if (environment === 'development') {
    return {
      title: 'DEV - TechInsights',
      description: 'TechInsights development mode',
      robots: 'noindex, nofollow',
    };
  }

  if (environment === 'test') {
    return {
      title: 'TEST - TechInsights',
      description: 'TechInsights test environment',
      robots: 'noindex',
    };
  }

  return {
    title: 'TechInsights',
    description: 'AI-powered technical article knowledge base',
    robots: 'index, follow',
  };
}
