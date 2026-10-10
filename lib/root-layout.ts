import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

// Shared by every page (landing and playbook) so the document shell stays identical.
export const inter = Inter({ subsets: ['latin'] });

/**
 * Absolute origin for canonical URLs, Open Graph images, robots.txt and the sitemap.
 * Set PLAYBOOK_BASE_URL in production; on Vercel the production domain is used when it is unset.
 */
export const siteUrl = new URL(
  process.env.PLAYBOOK_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
);

export const siteDescription = 'Methods, workflows, skills and agents for design work with JADO.';

// Page metadata replaces these objects instead of merging them: spread them into page-level openGraph and twitter.
export const openGraphBase = { siteName: 'JADO', locale: 'en_US' } as const;
export const twitterBase = { card: 'summary_large_image' } as const;

export const rootMetadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: 'JADO',
    template: '%s · JADO',
  },
  description: siteDescription,
  applicationName: 'JADO',
  openGraph: { ...openGraphBase, type: 'website' },
  twitter: twitterBase,
};
