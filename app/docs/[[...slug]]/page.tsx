import { source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getPageImageUrl, getPageMarkdownUrl, gitConfig } from '@/lib/shared';
import { ExternalLink } from 'lucide-react';
import { ui } from '@/lib/ui-strings';
import { openGraphBase, twitterBase } from '@/lib/root-layout';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const sourceUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`;
  const metadata = [
    page.data.status && [ui.status, ui.labels[page.data.status]],
    page.data.lastReviewed && [ui.lastReviewed, page.data.lastReviewed],
    page.data.stage && [ui.stage, ui.labels[page.data.stage]],
  ].filter((item): item is string[] => Boolean(item));

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="border-b pb-6">
        {metadata.length > 0 && (
          <dl className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fd-muted-foreground">
            {metadata.map(([label, value]) => (
              <div className="flex items-center gap-1.5" key={label}>
                <dt>{label}</dt>
                <dd className="font-medium text-fd-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="flex flex-row items-center gap-2">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={sourceUrl} />
          <a
            className="inline-flex items-center gap-1.5 text-xs text-fd-muted-foreground hover:text-fd-foreground"
            href={sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            {ui.source} <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        </div>
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const image = getPageImageUrl(page).url;
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: page.url },
    openGraph: {
      ...openGraphBase,
      type: 'article',
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      images: image,
    },
    twitter: {
      ...twitterBase,
      title: page.data.title,
      description: page.data.description,
      images: image,
    },
  };
}
