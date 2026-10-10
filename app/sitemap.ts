import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/root-layout';
import { workflowsRoute } from '@/lib/shared';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();
  return [
    { url: url('/'), changeFrequency: 'monthly', priority: 1 },
    { url: url(workflowsRoute), changeFrequency: 'monthly', priority: 0.8 },
    ...source.getPages().map((page) => ({
      url: url(page.url),
      ...(page.data.lastReviewed ? { lastModified: page.data.lastReviewed } : {}),
      changeFrequency: 'monthly' as const,
      priority: page.slugs.length === 0 ? 0.9 : 0.6,
    })),
  ];
}
