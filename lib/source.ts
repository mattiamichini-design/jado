import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsRoute } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

const operationalPageSchema = pageSchema.extend({
  description: z.string(),
  status: z.enum(['observed', 'proposed', 'unresolved']).optional(),
  lastReviewed: z.string().date().optional(),
  stage: z
    .enum([
      'discovery',
      'definition',
      'experience',
      'design-system',
      'engineering',
      'delivery',
      'operations',
    ])
    .optional(),
  workflow: z.boolean().optional(),
  tools: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  agents: z.array(z.string()).optional(),
  inputs: z.array(z.string()).optional(),
  outputs: z.array(z.string()).optional(),
});

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: operationalPageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
