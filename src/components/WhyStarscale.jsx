import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Zap, Globe } from 'lucide-react';

const WhyStarscale = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Authentic & Verified',
      description: 'Our reviewers are real people with established account histories. We guarantee high-quality, authentic feedback that sticks.'
    },
    {
      icon: Users,
      title: 'Targeted Demographics',
      description: 'Need reviews from a specific country or demographic? Our network allows for precise targeting to match your customer base.'
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Reviews are delivered on a natural schedule to ensure authenticity, but we can expedite orders for rapid results when you need them.'
    },
    {
      icon: Globe,
      title: 'All Major Platforms',
      description: 'From e-commerce giants like Amazon to local hubs like Google Maps and professional services like Fiverr, we cover it all.'
    }
  ];

  return (
    <section id="why-starscale" className="py-24 px-6">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="gradient-text">Why Trust</span> <span className="text-white">Starscale?</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            We're not just a service; we're your partner in building an unbeatable online reputation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: 'circOut' }}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-cyan-400/10 rounded-xl flex items-center justify-center mb-6 mx-auto border border-cyan-400/20">
                <feature.icon className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyStarscale;