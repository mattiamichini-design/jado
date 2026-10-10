import { landingImage, ogAlt, ogSize } from '@/lib/landing-og';

export const alt = ogAlt;
export const size = ogSize;
export const contentType = 'image/png';

export default function Image() {
  return landingImage();
}
