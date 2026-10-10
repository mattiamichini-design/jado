// Playbook UI strings that Fumadocs does not provide.
export const ui = {
  status: 'Status',
  lastReviewed: 'Last reviewed',
  stage: 'Stage',
  source: 'Source',
  workflows: {
    eyebrow: 'Operational map',
    title: 'Workflows',
    intro: 'From problem to delivery: choose a stage and open the workflow you need.',
    empty: 'Workflows will appear here as they become available in the playbook.',
  },
  labels: {
    discovery: 'Discovery',
    definition: 'Definition',
    experience: 'Experience',
    'design-system': 'Design system',
    engineering: 'Prototypes and tests',
    delivery: 'Delivery',
    operations: 'Operations',
    observed: 'Observed',
    proposed: 'Proposed',
    unresolved: 'Unresolved',
  },
} as const;
