import React, { lazy, Suspense } from 'react';
import CateringHero from '../sections/catering/CateringHero';
import CateringContent from '../sections/catering/CateringContent';

const CateringPackages = lazy(() => import('../sections/catering/CateringPackages'));

export default function Catering() {
  return (
    <div className="pb-0">
      <CateringHero />
      <CateringContent />
      <Suspense fallback={null}>
        <CateringPackages />
      </Suspense>
    </div>
  );
}