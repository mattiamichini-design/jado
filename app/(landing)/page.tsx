import type { Metadata } from 'next';
import { landingDescription, landingTitle } from '@/lib/landing-og';
import { openGraphBase, twitterBase } from '@/lib/root-layout';
import { FinalCta, Footer } from '@/components/landing/closing';
import { FloatingNav } from '@/components/landing/floating-nav';
import { Hero } from '@/components/landing/hero';
import { Method } from '@/components/landing/method';
import { LandingMotion } from '@/components/landing/motion';
import { Roles } from '@/components/landing/roles';
import { Routes } from '@/components/landing/routes';
import { loadRoutesModel } from '@/components/landing/routes-source';
import { SiteNav } from '@/components/landing/site-nav';
import { Workshop } from '@/components/landing/workshop';

export const metadata: Metadata = {
  title: { absolute: landingTitle },
  description: landingDescription,
  alternates: { canonical: '/' },
  openGraph: { ...openGraphBase, type: 'website', url: '/', title: landingTitle, description: landingDescription },
  twitter: { ...twitterBase, title: landingTitle, description: landingDescription },
};

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <FloatingNav />
      <main id="main">
        <Hero />
        <Workshop />
        <Method />
        <Roles />
        <Routes model={loadRoutesModel()} />
        <FinalCta />
      </main>
      <Footer />
      <LandingMotion />
    </>
  );
}
