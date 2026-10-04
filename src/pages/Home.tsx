import React, { lazy, Suspense } from 'react';

// Hero yüklənir dərhal (above-the-fold)
import HomeHero from '../sections/home/HomeHero';

// Qalan section-lar lazy — scroll-a qədər yüklənmir
const HomeVisionMissionCompact = lazy(() => import('../sections/home/HomeVisionMissionCompact'));
const HomeCapabilities = lazy(() => import('../sections/home/HomeCapabilities'));
const ServicesShowcase = lazy(() => import('../sections/services/ServicesShowcase'));
const HomeEventTypes = lazy(() => import('../sections/home/HomeEventTypes'));
const HomeMetrics = lazy(() => import('../sections/home/HomeMetrics'));
const HomeClients = lazy(() => import('../sections/home/HomeClients'));
const HomeFeaturedSetups = lazy(() => import('../sections/home/HomeFeaturedSetups'));
const HomeFinalCTA = lazy(() => import('../sections/home/HomeFinalCTA'));

function SectionFallback() {
  return <div />;
}

export default function Home() {
  return (
    <div className="bg-black">
      <section id="hero-section" aria-label="Hero">
        <HomeHero />
      </section>

      <Suspense fallback={<SectionFallback />}>
        <section id="vision-mission-section" aria-label="Vizyon & Missiya">
          <HomeVisionMissionCompact />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section id="capabilities-section" aria-label="Xidmətlər">
          <HomeCapabilities />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <ServicesShowcase />
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section id="event-types-section" aria-label="Tədbir Növləri">
          <HomeEventTypes />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section id="metrics-section" aria-label="Rəqəmlər">
          <HomeMetrics />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section id="clients-section" aria-label="Müştərilər">
          <HomeClients />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section id="portfolio-section" aria-label="Portfolio">
          <HomeFeaturedSetups />
        </section>
      </Suspense>

      <Suspense fallback={<SectionFallback />}>
        <section id="contact-section" aria-label="Əlaqə">
          <HomeFinalCTA />
        </section>
      </Suspense>
    </div>
  );
}