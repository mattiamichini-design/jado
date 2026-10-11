'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function Mermaid({ chart }: { chart: string }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'default';
  const renderKey = JSON.stringify([chart, theme]);
  const [result, setResult] = useState<{ key: string; svg?: string; failed?: true }>();
  const current = result?.key === renderKey ? result : undefined;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        if (cancelled) return;

        mermaid.initialize({
          flowchart: { useMaxWidth: true },
          // Mermaid 12 defaults to the ELK layout and the neo look; keep the playbook's dagre layout and classic look.
          layout: 'dagre',
          look: 'classic',
          startOnLoad: false,
          securityLevel: 'strict',
          theme,
        });
        const { svg } = await mermaid.render(`mermaid-${crypto.randomUUID()}`, chart);
        if (!cancelled) {
          setResult({ key: renderKey, svg });
        }
      } catch {
        if (!cancelled) setResult({ key: renderKey, failed: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, renderKey, theme]);

  return (
    <figure className="my-6 rounded-xl border bg-fd-card p-4 fullscreen:overflow-auto fullscreen:bg-fd-background">
      {current?.svg && <button type="button" className="mb-3 text-sm underline underline-offset-4" onClick={(event) => {
        const action = document.fullscreenElement ? document.exitFullscreen() : event.currentTarget.closest('figure')?.requestFullscreen();
        void action?.catch(() => {});
      }}>Toggle fullscreen</button>}
      {current?.svg ? (
        <div
          aria-label="Mermaid diagram"
          className="overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: current.svg }}
          role="img"
          tabIndex={0}
        />
      ) : current?.failed ? (
        <p role="alert" className="text-sm text-fd-muted-foreground">
          Unable to render the diagram. Its source remains available below.
        </p>
      ) : (
        <p className="text-sm text-fd-muted-foreground">Loading diagram…</p>
      )}
      <details className="mt-3 text-sm" open={current?.failed}>
        <summary className="cursor-pointer text-fd-muted-foreground">Mermaid source</summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-fd-muted p-3 text-xs">
          <code>{chart}</code>
        </pre>
      </details>
    </figure>
  );
}
