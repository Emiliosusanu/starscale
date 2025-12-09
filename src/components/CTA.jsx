import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
          className="relative rounded-3xl p-12 lg:p-20 text-center overflow-hidden bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 border border-white/10 spotlight-effect"
        >
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-6">
              <span className="gradient-text">Ready to Boost</span>
              <br />
              <span className="text-white">Your Reputation?</span>
            </h2>
            <p className="text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Explore our store to find the perfect review packages and services to elevate your brand's presence.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-gray-200 px-10 py-8 rounded-2xl font-bold text-xl group pulse-glow shimmer-button relative overflow-hidden"
            >
              <Link to="/store">
                Buy Reviews Now
                <ShoppingBag className="ml-3 w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </Button>
            <p className="text-gray-400 mt-4 text-sm">Instant results. Trusted service.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;