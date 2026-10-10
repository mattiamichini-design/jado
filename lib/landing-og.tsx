import { generateOGImage } from 'fumadocs-ui/og';
import { appName } from './shared';

export const landingTitle = 'JADO · Just Another Design Orchestrator';
export const landingDescription =
  "JADO brings a design studio's order to your AI tools: a brief, a route, clear roles and a review before anything is called done.";

export const ogAlt = landingTitle;
export const ogSize = { width: 1200, height: 630 };

export function landingImage() {
  return generateOGImage({ title: landingTitle, description: landingDescription, site: appName });
}
