import { source } from '@/lib/source';
import { ArrowRight, Workflow } from 'lucide-react';
import Link from 'next/link';
import { stageOrder } from '@/lib/metadata';
import { ui } from '@/lib/ui-strings';
import type { Metadata } from 'next';

export default function WorkflowsPage() {
  const workflows = source
    .getPages()
    .filter((page) => page.data.workflow)
    .sort(
      (a, b) =>
        stageOrder.indexOf(a.data.stage ?? 'operations') - stageOrder.indexOf(b.data.stage ?? 'operations') ||
        a.data.title.localeCompare(b.data.title, 'en'),
    );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-24">
      <div className="max-w-3xl">
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-fd-muted-foreground">
          <Workflow className="size-4" aria-hidden="true" />
          {ui.workflows.eyebrow}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{ui.workflows.title}</h1>
        <p className="mt-5 text-lg text-fd-muted-foreground">
          {ui.workflows.intro}
        </p>
      </div>

      {workflows.length > 0 ? (
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {workflows.map((page) => (
            <Link
              className="group rounded-xl border bg-fd-card p-6 transition-colors hover:bg-fd-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
              href={page.url}
              key={page.url}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{page.data.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-fd-muted-foreground">
                    {page.data.description}
                  </p>
                </div>
                <ArrowRight
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-1"
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-fd-muted-foreground">
                {page.data.stage && (
                  <span className="rounded-full border px-2.5 py-1">{ui.labels[page.data.stage]}</span>
                )}
                {page.data.status && (
                  <span className="rounded-full border px-2.5 py-1">{ui.labels[page.data.status]}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-xl border border-dashed p-8 text-sm text-fd-muted-foreground">
          {ui.workflows.empty}
        </div>
      )}
    </main>
  );
}

export const metadata: Metadata = {
  title: ui.workflows.title,
  description: ui.workflows.intro,
  alternates: { canonical: '/workflows' },
};
