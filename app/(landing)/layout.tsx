import { Geist, Geist_Mono } from 'next/font/google';
import s from '@/components/landing/landing.module.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

// Runs before first paint: flags JS-driven motion so hide-before-reveal never applies without JS,
// and releases everything if hydration has not marked the page ready within 3.5 s.
const MOTION_FLAG = `(function(){try{var r=document.currentScript.parentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;r.setAttribute('data-motion','on');setTimeout(function(){if(!r.hasAttribute('data-ready'))r.setAttribute('data-safe','')},3500)}catch(e){}})()`;

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} ${s.root}`} data-landing suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: MOTION_FLAG }} />
      <a className={s.skip} href="#main">
        Skip to content
      </a>
      {children}
    </div>
  );
}
