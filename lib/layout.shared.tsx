import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { JadoLockup } from '@/components/brand/jado-lockup';
import { appName, docsRoute, repositoryUrl, workflowsRoute } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <JadoLockup className="h-5 w-auto" title={appName} />,
      url: docsRoute,
    },
    links: [
      { text: 'Playbook', url: docsRoute, active: 'nested-url' },
      { text: 'Workflows', url: workflowsRoute, active: 'nested-url' },
    ],
    githubUrl: repositoryUrl,
  };
}
