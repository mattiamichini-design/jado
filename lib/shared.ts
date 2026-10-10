export const appName = 'JADO';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';
export const workflowsRoute = '/workflows';

export const gitConfig = {
  user: 'mattiamichini-design',
  repo: 'jado',
  branch: 'HEAD',
};

export const repositoryUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export function getPageMarkdownUrl(page: { slugs: string[] }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: `${docsContentRoute}/${segments.join('/')}` };
}

export function getPageImageUrl(page: { slugs: string[] }) {
  const segments = [...page.slugs, 'image.png'];

  return { segments, url: `${docsImageRoute}/${segments.join('/')}` };
}
