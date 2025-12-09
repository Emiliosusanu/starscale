import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import ServicePackages from '@/components/ServicePackages';
import WhyStarscale from '@/components/WhyStarscale';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';

const HomePage = () => {
  return (
    <>
      <Helmet>
        <title>Starscale - Buy Authentic Reviews & Feedback</title>
        <meta name="description" content="Starscale is the #1 platform for agencies and product owners to purchase high-quality, authentic reviews for Google, Amazon, Trustpilot, and more. Boost your reputation instantly." />
        <meta property="og:title" content="Starscale - Buy Authentic Reviews & Feedback" />
        <meta property="og:description" content="Starscale is the #1 platform for agencies and product owners to purchase high-quality, authentic reviews for Google, Amazon, Trustpilot, and more. Boost your reputation instantly." />
      </Helmet>
      <Hero />
      <HowItWorks />
      <ServicePackages />
      <WhyStarscale />
      <Testimonials />
      <CTA />
    </>
  );
};

export default HomePage;