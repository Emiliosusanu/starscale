import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PlatformIcons from '@/components/PlatformIcons';

const Hero = () => {
  return (
    <section className="pt-40 pb-24 px-6 relative text-center overflow-hidden">
      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'circOut' }}
          className="inline-block px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full mb-6"
        >
          <span className="accent-gradient-text font-semibold">🚀 The #1 Feedback Marketplace</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'circOut' }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter mb-6"
        >
          <span className="gradient-text">Buy Authentic Reviews,</span>
          <br />
          <span className="text-white">Instantly.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'circOut' }}
          className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10"
        >
          For agencies and brands that need to scale. Purchase high-quality, verified feedback for Amazon, Google, Trustpilot, and more.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'circOut' }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button 
            asChild
            size="lg" 
            className="bg-white text-black hover:bg-gray-200 px-8 py-7 rounded-xl font-bold text-lg group shimmer-button relative overflow-hidden"
          >
            <Link to="/store">
              Buy Reviews Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-7 rounded-xl font-bold text-lg"
          >
            <Link to="/register">Become a Member</Link>
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'circOut' }}
          className="mt-16"
        >
          <p className="text-sm text-gray-500 mb-4">Trusted by industry leaders</p>
          <PlatformIcons />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;