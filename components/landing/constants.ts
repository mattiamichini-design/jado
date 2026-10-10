export const REPO_URL = 'https://github.com/mattiamichini-design/jado';
export const INSTALL_URL = `${REPO_URL}#install`;
export const PLAYBOOK_URL = '/docs';
// Clone-first: the installer runs from a checkout of this repository and asks which tools to set up.
export const INSTALL_COMMAND = 'git clone https://github.com/mattiamichini-design/jado && cd jado && npm ci && npm run jado -- install --global';
export const AUTHOR_URL = 'https://mattiamichini.com';

export const NAV_LINKS = [
  { label: 'Workshop', href: '#workshop', section: 'workshop' },
  { label: 'Method', href: '#method', section: 'method' },
  { label: 'Routes', href: '#routes', section: 'routes' },
  { label: 'Playbook', href: PLAYBOOK_URL, external: true },
] as const;
