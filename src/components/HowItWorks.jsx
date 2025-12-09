import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Send, Star } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: ShoppingCart,
      title: 'Place Your Order',
      description: 'Choose your platform, select the number of reviews, and provide your product or service link. It takes less than 60 seconds.',
    },
    {
      icon: Send,
      title: 'We Distribute',
      description: 'Our system intelligently assigns your order to our network of verified, high-quality reviewers.',
    },
    {
      icon: Star,
      title: 'Watch Your Rating Soar',
      description: 'Authentic reviews start appearing on your target platform, boosting your credibility and sales.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-black/20">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'circOut' }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tighter mb-4">
            <span className="text-white">Get Reviews in</span> <span className="accent-gradient-text">3 Simple Steps.</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our process is designed for speed and simplicity, so you can focus on what matters most—your business.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: index * 0.15, duration: 0.6, ease: 'circOut' }}
              className="text-center relative z-10 p-6"
            >
              <div className="w-24 h-24 bg-cyan-400/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-cyan-400/30 glass-card">
                <step.icon className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-300 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;